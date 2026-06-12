/**
 * Task API module
 *
 * Endpoints:
 * - POST  /families/{familyId}/tasks — 创建任务
 * - GET   /families/{familyId}/tasks — 获取任务列表（含计算状态）
 * - GET   /families/{familyId}/tasks/{taskId} — 获取任务详情
 * - PATCH /families/{familyId}/tasks/{taskId} — 更新任务
 * - POST  /families/{familyId}/tasks/{taskId}/complete — 标记完成
 * - POST  /families/{familyId}/tasks/{taskId}/verify — 验收通过
 * - POST  /families/{familyId}/tasks/{taskId}/reject — 驳回任务
 * - POST  /families/{familyId}/tasks/{taskId}/cancel — 取消任务
 */

import type { components } from '../types/api';
import { api } from './request';

type TaskDetail = components['schemas']['TaskDetail'];
type TaskListItem = components['schemas']['TaskListItem'];
type PaginatedData = components['schemas']['PaginatedData'];
type CreateTaskRequest = components['schemas']['CreateTaskRequest'];
type UpdateTaskRequest = components['schemas']['UpdateTaskRequest'];
type CompleteTaskRequest = components['schemas']['CompleteTaskRequest'];
type RejectTaskRequest = components['schemas']['RejectTaskRequest'];
type CancelTaskRequest = components['schemas']['CancelTaskRequest'];

/** 任务列表查询参数 */
export interface TaskListQuery {
  status?: string;
  page?: number;
  pageSize?: number;
  assignedTo?: string;
}

/** 创建任务 */
export async function createTask(familyId: string, data: CreateTaskRequest) {
  return api.post<TaskDetail>(
    `/families/${familyId}/tasks`,
    data as unknown as Record<string, unknown>,
  );
}

/** 获取任务列表（含逾期/临近到期计算状态） */
export async function getTaskList(familyId: string, query?: TaskListQuery) {
  return api.get<PaginatedData & { items?: TaskListItem[] }>(
    `/families/${familyId}/tasks`,
    query as unknown as Record<string, unknown>,
  );
}

/** 获取任务详情 */
export async function getTaskDetail(familyId: string, taskId: string) {
  return api.get<TaskDetail>(`/families/${familyId}/tasks/${taskId}`);
}

/** 更新任务 */
export async function updateTask(familyId: string, taskId: string, data: UpdateTaskRequest) {
  return api.patch<TaskDetail>(
    `/families/${familyId}/tasks/${taskId}`,
    data as unknown as Record<string, unknown>,
  );
}

/** 标记任务完成（提交验收或直接完成） */
export async function completeTask(familyId: string, taskId: string, data: CompleteTaskRequest) {
  return api.post<TaskDetail>(
    `/families/${familyId}/tasks/${taskId}/complete`,
    data as unknown as Record<string, unknown>,
  );
}

/** 验收通过（仅 ORGANIZER） */
export async function verifyTask(familyId: string, taskId: string) {
  return api.post<TaskDetail>(`/families/${familyId}/tasks/${taskId}/verify`, {});
}

/** 驳回任务（仅 ORGANIZER，需填写原因） */
export async function rejectTask(familyId: string, taskId: string, reason: string) {
  return api.post<TaskDetail>(`/families/${familyId}/tasks/${taskId}/reject`, {
    reason,
  } as RejectTaskRequest as unknown as Record<string, unknown>);
}

/** 取消任务 */
export async function cancelTask(familyId: string, taskId: string, reason?: string) {
  return api.post(`/families/${familyId}/tasks/${taskId}/cancel`, {
    reason: reason ?? null,
  } as CancelTaskRequest as unknown as Record<string, unknown>);
}
