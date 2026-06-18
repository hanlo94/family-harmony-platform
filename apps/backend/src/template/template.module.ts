import { Module } from '@nestjs/common';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

/**
 * Template 模块
 *
 * 提供：
 * - 任务模板列表查询（GET /api/task-templates）
 *
 * 依赖：
 * - Auth 模块提供的 JwtAuthGuard（登录即可浏览，无需家庭成员身份）
 * - PrismaService 通过全局 PrismaModule 注入
 */
@Module({
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
