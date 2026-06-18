import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { components } from '../types/api';
import {
  getMyFamilies,
  getFamilyMembers,
  getFamilyTaskStats,
  createFamily,
  joinFamily,
  createInvitation,
  removeMember,
} from '../api/family';

type FamilyWithRole = components['schemas']['FamilyWithRole'];
type MemberDetail = components['schemas']['MemberDetail'];
type FamilyStatsResponse = components['schemas']['FamilyStatsResponse'];
type InvitationResponse = components['schemas']['InvitationResponse'];

/**
 * Family Store — 家庭状态、成员、统计
 *
 * 管理当前用户的所有家庭、当前选中家庭、成员列表和任务统计。
 * 使用 Setup Store（组合式）语法，符合前端规范 ③。
 */
export const useFamilyStore = defineStore('family', () => {
  // ========== State ==========

  /** 用户的所有家庭列表 */
  const families = ref<FamilyWithRole[]>([]);

  /** 当前选中的家庭（含完整详情） */
  const currentFamily = ref<FamilyWithRole | null>(null);

  /** 当前家庭的成员列表 */
  const members = ref<MemberDetail[]>([]);

  /** 当前家庭的任务统计 */
  const stats = ref<FamilyStatsResponse | null>(null);

  /** 是否正在加载 */
  const isLoading = ref(false);

  /** 是否已初始化 */
  const isInitialized = ref(false);

  // ========== Getters ==========

  /** 当前家庭名称 */
  const currentFamilyName = computed(() => currentFamily.value?.name || '');

  /** 当前家庭邀请码 */
  const currentInviteCode = computed(() => currentFamily.value?.inviteCode || '');

  /** 当前用户在当前家庭的成员信息 */
  const currentMember = computed(() => {
    if (!currentFamily.value) return null;
    return members.value.find(
      (m) => m.role === currentFamily.value!.role && m.nickname === currentFamily.value!.name,
    );
  });

  /** 当前用户在当前家庭中的角色 */
  const currentRole = computed(() => currentFamily.value?.role || null);

  /** 是否为组织者 */
  const isOrganizer = computed(() => currentRole.value === 'ORGANIZER');

  // ========== Actions ==========

  /**
   * 加载用户的家庭列表，并自动选中第一个
   *
   * 如果已有家庭，从本地存储恢复上次选中的家庭 ID。
   */
  async function loadFamilies(): Promise<void> {
    isLoading.value = true;
    try {
      const result = await getMyFamilies();
      if (result.data) {
        families.value = result.data;

        // 恢复上次选中的家庭，或默认选第一个
        const savedFamilyId = uni.getStorageSync('currentFamilyId');
        const target =
          (savedFamilyId && families.value.find((f) => f.id === savedFamilyId)) ||
          families.value[0] ||
          null;

        if (target) {
          await selectFamily(target);
        }
      }
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  /**
   * 选中一个家庭并加载其详情、成员、统计
   */
  async function selectFamily(family: FamilyWithRole): Promise<void> {
    currentFamily.value = family;
    uni.setStorageSync('currentFamilyId', family.id || '');

    // 并行加载成员和统计
    const familyId = family.id!;
    await Promise.all([loadMembers(familyId), loadStats(familyId)]);
  }

  /**
   * 加载当前家庭的成员列表
   */
  async function loadMembers(familyId?: string): Promise<void> {
    const fid = familyId || currentFamily.value?.id;
    if (!fid) return;

    const result = await getFamilyMembers(fid);
    if (result.data) {
      members.value = result.data;
    }
  }

  /**
   * 加载当前家庭的任务统计
   */
  async function loadStats(familyId?: string): Promise<void> {
    const fid = familyId || currentFamily.value?.id;
    if (!fid) return;

    const result = await getFamilyTaskStats(fid);
    if (result.data) {
      stats.value = result.data;
    }
  }

  /**
   * 创建新家庭并自动选中
   */
  async function doCreateFamily(name: string): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true;
    try {
      const result = await createFamily({ name });
      if (result.data) {
        // 创建成功后重新加载家庭列表
        await loadFamilies();
        return { success: true };
      }
      return { success: false, error: result.error?.message || '创建失败' };
    } catch {
      return { success: false, error: '网络异常，请重试' };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 通过邀请码加入家庭
   */
  async function doJoinFamily(
    code: string,
  ): Promise<{ success: boolean; error?: string; familyName?: string }> {
    isLoading.value = true;
    try {
      const result = await joinFamily(code);
      if (result.data) {
        // 加入成功后重新加载家庭列表
        await loadFamilies();
        return { success: true, familyName: result.data.familyName };
      }
      return { success: false, error: result.error?.message || '加入失败' };
    } catch {
      return { success: false, error: '网络异常，请重试' };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 生成新的邀请码
   */
  async function doCreateInvitation(): Promise<InvitationResponse | null> {
    const familyId = currentFamily.value?.id;
    if (!familyId) return null;

    const result = await createInvitation(familyId);
    if (result.data) {
      // 更新当前家庭的邀请码
      if (currentFamily.value) {
        currentFamily.value.inviteCode = result.data.code;
      }
      return result.data;
    }
    return null;
  }

  /**
   * 移除成员
   */
  async function doRemoveMember(
    memberId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const familyId = currentFamily.value?.id;
    if (!familyId) return { success: false, error: '未选择家庭' };

    const result = await removeMember(familyId, memberId);
    if (result.error) {
      return { success: false, error: result.error.message || '移除失败' };
    }
    // 从本地列表中移除
    members.value = members.value.filter((m) => m.id !== memberId);
    // 重新加载统计
    await loadStats();
    return { success: true };
  }

  return {
    // State
    families,
    currentFamily,
    members,
    stats,
    isLoading,
    isInitialized,
    // Getters
    currentFamilyName,
    currentInviteCode,
    currentMember,
    currentRole,
    isOrganizer,
    // Actions
    loadFamilies,
    selectFamily,
    loadMembers,
    loadStats,
    doCreateFamily,
    doJoinFamily,
    doCreateInvitation,
    doRemoveMember,
  };
});
