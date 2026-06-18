import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryTemplateDto } from './dto/query-template.dto';

/**
 * Template 控制器
 *
 * 提供任务模板列表查询端点。
 * 路由前缀：/api/task-templates
 */
@ApiTags('Task Templates - 任务模板')
@Controller('task-templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  // ═══════════════════════════════════════════
  // 模板列表
  // ═══════════════════════════════════════════

  /**
   * 获取任务模板列表
   *
   * 所有登录用户可浏览。支持按分类筛选。
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取任务模板列表' })
  @ApiQuery({ name: 'category', required: false, description: '按分类筛选，如"厨房"、"清洁"、"洗衣"、"整理"、"宠物"、"其他"' })
  async getTemplates(@Query() query: QueryTemplateDto) {
    return this.templateService.getTemplates(query);
  }
}
