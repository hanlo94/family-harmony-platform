import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService, type NotificationTask } from './notification.service';

/**
 * 通知定时任务调度器
 *
 * 每 10 分钟扫描一次即将到期的任务，通过微信模板消息发送提醒。
 *
 * ## 扫描逻辑
 * 1. 查询 status=PENDING_COMPLETION、has_notified=false、deadline 在 1 小时内的任务
 * 2. JOIN family_members 过滤 reminder_enabled=false 的用户
 * 3. 逐条发送微信模板消息
 * 4. 成功则标记 has_notified=true，失败则保留标记等待下次重试
 *
 * ## 防重复机制
 * has_notified 字段确保同一任务不会重复发送提醒。
 * 当任务截止时间被修改时，TaskService 会重置 has_notified=false。
 */
@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 定时扫描到期任务并发送提醒
   *
   * 每 10 分钟执行一次（第 7 分钟，避免整点峰值）。
   * 查询截止时间在 (now, now+1h] 区间内且未通知的待完成任务。
   */
  @Cron('7 */10 * * * *')
  async scanAndNotify(): Promise<void> {
    this.logger.debug('开始扫描到期任务...');

    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // ── 1. 查询待通知的任务 ──
      const tasks = await this.prisma.task.findMany({
        where: {
          status: 'PENDING_COMPLETION',
          hasNotified: false,
          deadline: {
            gte: now,
            lte: oneHourLater,
          },
        },
        include: {
          assignee: {
            select: {
              id: true,
              nickname: true,
              wechatOpenid: true,
            },
          },
          family: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { deadline: 'asc' },
      });

      if (tasks.length === 0) {
        this.logger.debug('无到期任务需要提醒');
        return;
      }

      this.logger.log(`扫描到 ${tasks.length} 个待提醒任务`);

      // ── 2. 批量查询提醒开关 ──
      const familyIds = [...new Set(tasks.map((t) => t.familyId))];
      const userIds = [...new Set(tasks.map((t) => t.assignee.id))];

      const enabledMembers = await this.prisma.familyMember.findMany({
        where: {
          familyId: { in: familyIds },
          userId: { in: userIds },
          reminderEnabled: true,
        },
        select: { familyId: true, userId: true },
      });

      const enabledSet = new Set(
        enabledMembers.map((m) => `${m.familyId}:${m.userId}`),
      );

      // 过滤掉已关闭提醒的用户
      const notificationTasks: NotificationTask[] = tasks
        .filter((t) => enabledSet.has(`${t.familyId}:${t.assignee.id}`))
        .map((t) => ({
          taskId: t.id,
          title: t.title,
          deadline: t.deadline,
          familyId: t.familyId,
          familyName: t.family.name,
          assignee: {
            id: t.assignee.id,
            nickname: t.assignee.nickname,
            wechatOpenid: t.assignee.wechatOpenid,
          },
        }));

      const skippedCount = tasks.length - notificationTasks.length;
      if (skippedCount > 0) {
        this.logger.log(
          `${skippedCount} 个任务因用户关闭提醒而跳过，` +
          `将对 ${notificationTasks.length} 个任务发送提醒`,
        );
        // 关闭提醒的任务也标记为已通知（无需再次扫描）
        for (const task of tasks) {
          if (!enabledSet.has(`${task.familyId}:${task.assignee.id}`)) {
            await this.notificationService.markNotified(task.id);
          }
        }
      }

      // ── 3. 逐条发送提醒 ──
      let successCount = 0;
      let failCount = 0;

      for (const task of notificationTasks) {
        const ok = await this.notificationService.sendTaskReminder(task);
        if (ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      this.logger.log(
        `扫描完成: 总计 ${tasks.length} 个, ` +
        `已发送 ${successCount} 个, ` +
        `失败 ${failCount} 个, ` +
        `跳过 ${skippedCount} 个`,
      );
    } catch (error) {
      this.logger.error(`扫描到期任务异常: ${(error as Error).message}`);
    }
  }
}
