import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryTemplateDto } from './dto/query-template.dto';

/**
 * 模板响应格式
 */
export interface TemplateResponse {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  suggestedRepeatRule: string;
  needsVerification: boolean;
  category: string;
  sortOrder: number;
}

/**
 * Template 服务
 *
 * 提供任务模板列表查询（按分类筛选）。
 * 模板仅供登录用户浏览，用于快速创建任务时参考。
 */
@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════
  // 1. 模板列表
  // ═══════════════════════════════════════════

  /**
   * 获取任务模板列表
   *
   * 返回所有启用的模板（isActive = true），
   * 支持按分类筛选，按 sortOrder 升序排列。
   */
  async getTemplates(query: QueryTemplateDto): Promise<{ templates: TemplateResponse[] }> {
    const where: Record<string, any> = { isActive: true };

    if (query.category) {
      where.category = query.category;
    }

    const templates = await this.prisma.taskTemplate.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return {
      templates: templates.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        suggestedRepeatRule: t.suggestedRepeatRule,
        needsVerification: t.needsVerification,
        category: t.category,
        sortOrder: t.sortOrder,
      })),
    };
  }
}
