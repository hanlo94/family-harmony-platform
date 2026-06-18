import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';

/**
 * Notification 模块
 *
 * 提供：
 * - 微信模板消息发送（含 Access Token 缓存、reminder_enabled 检查）
 * - 定时扫描到期任务（@Cron 每 10 分钟）
 *
 * 依赖：
 * - @nestjs/schedule ScheduleModule（定时任务）
 * - PrismaService（全局模块，查询任务和家庭成员）
 * - ConfigService（全局模块，读取微信 AppID/Secret/TemplateID）
 *
 * 注意：此模块不暴露外部 API 端点，仅为后台定时任务。
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [NotificationService, NotificationScheduler],
  exports: [NotificationService],
})
export class NotificationModule {}
