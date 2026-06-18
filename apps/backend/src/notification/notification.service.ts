import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 待通知的任务信息（含执行人和家庭数据）
 */
export interface NotificationTask {
  taskId: string;
  title: string;
  deadline: Date;
  familyId: string;
  familyName: string;
  assignee: {
    id: string;
    nickname: string;
    wechatOpenid: string;
  };
}

/**
 * Notification 服务
 *
 * 负责：
 * - 微信 Access Token 获取与缓存
 * - 微信模板消息发送（含提醒开关检查）
 * - 通知发送记录（通过 Prisma has_notified 字段 + 日志）
 *
 * ## 开发模式
 * 当未配置 WECHAT_TEMPLATE_ID 时，仅将通知内容写入日志，不调用微信 API。
 * 这便于本地开发和测试。
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /** 微信 Access Token 内存缓存 */
  private accessTokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ═══════════════════════════════════════════
  // 1. 发送任务到期提醒
  // ═══════════════════════════════════════════

  /**
   * 为单个任务发送微信模板消息提醒
   *
   * 流程：
   * 1. 检查提醒开关（reminder_enabled）
   * 2. 获取微信 Access Token
   * 3. 调用微信模板消息接口
   * 4. 标记 has_notified = true（防止重复发送）
   *
   * @returns true 表示发送成功或已记录，false 表示发送失败（触发重试）
   */
  async sendTaskReminder(task: NotificationTask): Promise<boolean> {
    // ── 检查提醒开关 ──
    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: task.familyId,
          userId: task.assignee.id,
        },
      },
      select: { reminderEnabled: true },
    });

    if (!member || !member.reminderEnabled) {
      this.logger.debug(
        `跳过提醒（reminder_enabled=false）: 用户 ${task.assignee.nickname} (${task.assignee.id}), 任务 "${task.title}"`,
      );
      // 标记为已通知，避免每次都查询
      await this.markNotified(task.taskId);
      return true;
    }

    // ── 发送微信模板消息 ──
    const templateId = this.configService.get<string>('WECHAT_TEMPLATE_ID');

    if (!templateId) {
      // 开发模式：无模板 ID，仅记录日志
      this.logger.warn(
        `[开发模式] 模拟发送提醒: 用户 ${task.assignee.nickname}, ` +
        `任务 "${task.title}", 截止时间 ${task.deadline.toISOString()}, ` +
        `家庭 "${task.familyName}"`,
      );
      await this.markNotified(task.taskId);
      return true;
    }

    try {
      const accessToken = await this.getAccessToken();
      await this.callTemplateMessageApi(accessToken, templateId, task);
      this.logger.log(
        `提醒已发送: 用户 ${task.assignee.nickname} (${task.assignee.id}), ` +
        `任务 "${task.title}", 截止时间 ${task.deadline.toISOString()}`,
      );
      await this.markNotified(task.taskId);
      return true;
    } catch (error) {
      this.logger.error(
        `提醒发送失败: 用户 ${task.assignee.nickname}, 任务 "${task.title}": ` +
        `${(error as Error).message}`,
      );
      // 不标记 has_notified，下次 cron 执行时可重试
      return false;
    }
  }

  // ═══════════════════════════════════════════
  // 2. 标记任务已通知
  // ═══════════════════════════════════════════

  /**
   * 将任务标记为已通知（has_notified = true）
   *
   * 防止重复发送提醒。下次任务编辑（修改截止时间）时会重置此标记。
   */
  async markNotified(taskId: string): Promise<void> {
    await this.prisma.task.update({
      where: { id: taskId },
      data: { hasNotified: true },
    });
  }

  /**
   * 重置任务的通知标记（has_notified = false）
   *
   * 当任务截止时间被修改时调用，允许新的 deadline 再次触发提醒。
   */
  async resetNotification(taskId: string): Promise<void> {
    await this.prisma.task.update({
      where: { id: taskId },
      data: { hasNotified: false },
    });
  }

  // ═══════════════════════════════════════════
  // 3. 微信 Access Token 管理
  // ═══════════════════════════════════════════

  /**
   * 获取微信 Access Token（带内存缓存）
   *
   * Token 有效期 7200 秒，提前 5 分钟刷新以避免边界过期。
   * 详见：https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html
   */
  private async getAccessToken(): Promise<string> {
    // 命中缓存（提前 5 分钟刷新）
    if (
      this.accessTokenCache &&
      Date.now() < this.accessTokenCache.expiresAt - 5 * 60 * 1000
    ) {
      return this.accessTokenCache.token;
    }

    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      throw new Error('微信 AppID 或 AppSecret 未配置，无法获取 Access Token');
    }

    try {
      const response = await axios.get(
        'https://api.weixin.qq.com/cgi-bin/token',
        {
          params: {
            grant_type: 'client_credential',
            appid: appId,
            secret: appSecret,
          },
        },
      );

      if (response.data.errcode) {
        throw new Error(
          `微信返回错误: ${response.data.errcode} - ${response.data.errmsg}`,
        );
      }

      const token = response.data.access_token as string;
      const expiresIn = (response.data.expires_in as number) ?? 7200;

      this.accessTokenCache = {
        token,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      this.logger.log(`微信 Access Token 已刷新，有效期 ${expiresIn}s`);
      return token;
    } catch (error) {
      throw new Error(
        `获取微信 Access Token 失败: ${(error as Error).message}`,
      );
    }
  }

  // ═══════════════════════════════════════════
  // 4. 微信模板消息 API 调用
  // ═══════════════════════════════════════════

  /**
   * 调用微信模板消息发送接口
   *
   * 文档：https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Template_Message_Interface.html
   */
  private async callTemplateMessageApi(
    accessToken: string,
    templateId: string,
    task: NotificationTask,
  ): Promise<void> {
    const deadlineStr = task.deadline.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });

    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
      {
        touser: task.assignee.wechatOpenid,
        template_id: templateId,
        data: {
          first: {
            value: '您有一个任务即将到期，请及时处理',
          },
          keyword1: {
            value: task.title,
          },
          keyword2: {
            value: deadlineStr,
          },
          keyword3: {
            value: task.familyName,
          },
          remark: {
            value: '请在截止时间前完成任务哦~',
          },
        },
      },
      { timeout: 10000 },
    );

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(
        `微信模板消息发送失败: ${response.data.errcode} - ${response.data.errmsg}`,
      );
    }
  }
}
