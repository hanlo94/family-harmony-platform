/**
 * Family API module
 *
 * Endpoints:
 * - POST   /families — 创建家庭
 * - GET    /families — 获取我的家庭列表
 * - POST   /families/join — 加入家庭（通过邀请码）
 * - GET    /families/{familyId} — 获取家庭详情
 * - GET    /families/{familyId}/members — 获取家庭成员列表
 * - GET    /families/{familyId}/tasks/stats — 获取家庭任务统计
 * - POST   /families/{familyId}/invitations — 生成邀请码
 * - DELETE /families/{familyId}/members/{memberId} — 移除成员
 */

import type { components } from '../types/api';
import { api } from './request';

type FamilyDetail = components['schemas']['FamilyDetail'];
type FamilyWithRole = components['schemas']['FamilyWithRole'];
type MemberDetail = components['schemas']['MemberDetail'];
type InvitationResponse = components['schemas']['InvitationResponse'];
type JoinFamilyResponse = components['schemas']['JoinFamilyResponse'];
type FamilyStatsResponse = components['schemas']['FamilyStatsResponse'];
type CreateFamilyRequest = components['schemas']['CreateFamilyRequest'];

/** 创建家庭 */
export async function createFamily(data: CreateFamilyRequest) {
  return api.post<FamilyDetail>('/families', data as unknown as Record<string, unknown>);
}

/** 获取我的家庭列表 */
export async function getMyFamilies() {
  return api.get<FamilyWithRole[]>('/families');
}

/** 通过邀请码加入家庭 */
export async function joinFamily(code: string) {
  return api.post<JoinFamilyResponse>('/families/join', { code });
}

/** 获取家庭详情 */
export async function getFamilyDetail(familyId: string) {
  return api.get<FamilyDetail>(`/families/${familyId}`);
}

/** 获取家庭成员列表 */
export async function getFamilyMembers(familyId: string) {
  return api.get<MemberDetail[]>(`/families/${familyId}/members`);
}

/** 获取家庭任务统计 */
export async function getFamilyTaskStats(familyId: string) {
  return api.get<FamilyStatsResponse>(`/families/${familyId}/tasks/stats`);
}

/** 生成邀请码 */
export async function createInvitation(familyId: string) {
  return api.post<InvitationResponse>(`/families/${familyId}/invitations`, {});
}

/** 移除成员 */
export async function removeMember(familyId: string, memberId: string) {
  return api.delete(`/families/${familyId}/members/${memberId}`);
}
