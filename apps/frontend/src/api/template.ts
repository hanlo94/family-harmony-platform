/**
 * Template API module
 *
 * Endpoints:
 * - GET /task-templates — 获取任务模板列表（支持按分类筛选）
 */

import type { components } from '../types/api';
import { api } from './request';

type TaskTemplateItem = components['schemas']['TaskTemplateItem'];

export interface TemplateQuery {
  category?: string;
}

/** 获取任务模板列表 */
export async function getTaskTemplates(query?: TemplateQuery) {
  return api.get<TaskTemplateItem[]>(
    '/task-templates',
    query as unknown as Record<string, unknown>,
  );
}
