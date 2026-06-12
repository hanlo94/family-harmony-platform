/**
 * User API module
 *
 * Endpoints:
 * - PATCH /users/me — 更新用户信息
 * - GET   /users/me/settings — 获取用户设置
 * - PATCH /users/me/settings — 更新用户设置
 */

import type { components } from '../types/api';
import { api } from './request';

type UserSettings = components['schemas']['UserSettings'];
type UpdateUserSettingsRequest = components['schemas']['UpdateUserSettingsRequest'];

/** 更新当前用户资料 */
export async function updateUserProfile(data: { nickname?: string; avatarUrl?: string }) {
  return api.patch('/users/me', data);
}

/** 获取用户提醒设置 */
export async function getUserSettings() {
  return api.get<UserSettings>('/users/me/settings');
}

/** 更新用户提醒设置（按家庭） */
export async function updateUserSettings(data: UpdateUserSettingsRequest) {
  return api.patch('/users/me/settings', data as unknown as Record<string, unknown>);
}
