<script setup lang="ts">
/**
 * 家庭管理页 — TabBar 第二个 Tab
 *
 * 功能：
 * - 展示当前家庭名称、邀请码
 * - 轻量统计区（本周家庭贡献）
 * - 家庭成员列表（含角色标签）
 * - 邀请新成员入口（仅组织者可见）
 * - 创建/切换/加入家庭
 *
 * 设计参考: docs/ui-design.md §4.5
 */
import { ref, onMounted } from 'vue';
import { useFamilyStore } from '../../stores/family';
import AuthGuard from '../../components/AuthGuard.vue';
import MemberStatsCard from '../../components/MemberStatsCard.vue';
import MemberList from '../../components/MemberList.vue';
import InviteAction from '../../components/InviteAction.vue';

const familyStore = useFamilyStore();

/** 是否显示创建家庭弹窗 */
const showCreateDialog = ref(false);

/** 是否显示加入家庭弹窗 */
const showJoinDialog = ref(false);

/** 创建/加入表单输入值 */
const newFamilyName = ref('');
const joinCode = ref('');

/** 操作 loading 状态 */
const actionLoading = ref(false);

// ========== 生命周期 ==========

onMounted(async () => {
  if (!familyStore.isInitialized && familyStore.families.length === 0) {
    await familyStore.loadFamilies();
  }
});

// ========== 创建家庭 ==========

/** 打开创建家庭弹窗 */
function openCreateDialog(): void {
  newFamilyName.value = '';
  showCreateDialog.value = true;
}

/** 关闭创建家庭弹窗 */
function closeCreateDialog(): void {
  showCreateDialog.value = false;
}

/** 确认创建家庭 */
async function confirmCreateFamily(): Promise<void> {
  const name = newFamilyName.value.trim();
  if (!name) {
    uni.showToast({ title: '请输入家庭名称', icon: 'none' });
    return;
  }
  if (name.length > 20) {
    uni.showToast({ title: '家庭名称不能超过20个字', icon: 'none' });
    return;
  }

  actionLoading.value = true;
  const result = await familyStore.doCreateFamily(name);
  actionLoading.value = false;

  if (result.success) {
    closeCreateDialog();
    uni.showToast({ title: '家庭创建成功', icon: 'success' });
  } else {
    uni.showToast({ title: result.error || '创建失败', icon: 'none' });
  }
}

// ========== 加入家庭 ==========

/** 打开加入家庭弹窗 */
function openJoinDialog(): void {
  joinCode.value = '';
  showJoinDialog.value = true;
}

/** 关闭加入家庭弹窗 */
function closeJoinDialog(): void {
  showJoinDialog.value = false;
}

/** 确认加入家庭 */
async function confirmJoinFamily(): Promise<void> {
  const code = joinCode.value.trim().toUpperCase();
  if (!code) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' });
    return;
  }

  actionLoading.value = true;
  const result = await familyStore.doJoinFamily(code);
  actionLoading.value = false;

  if (result.success) {
    closeJoinDialog();
    uni.showToast({ title: `已加入「${result.familyName || '家庭'}」`, icon: 'success' });
  } else {
    uni.showToast({ title: result.error || '加入失败', icon: 'none' });
  }
}

// ========== 切换家庭 ==========

/** 切换选中的家庭 */
async function switchFamily(family: typeof familyStore.families[number]): Promise<void> {
  if (family.id === familyStore.currentFamily?.id) return;
  await familyStore.selectFamily(family);
  uni.showToast({ title: `已切换到「${family.name}」`, icon: 'success' });
}

// ========== 移除成员 ==========

/** 处理移除成员事件 */
async function handleRemoveMember(memberId: string): Promise<void> {
  const result = await familyStore.doRemoveMember(memberId);
  if (result.success) {
    uni.showToast({ title: '成员已移除', icon: 'success' });
  } else {
    uni.showToast({ title: result.error || '移除失败', icon: 'none' });
  }
}

// ========== 跳转 ==========

/** 跳转到加入页 */
function goToJoin(): void {
  uni.navigateTo({ url: '/pages/family/join' });
}
</script>

<template>
  <AuthGuard>
    <view class="family-page">
      <!-- ===== 无家庭状态 ===== -->
      <view v-if="!familyStore.currentFamily && familyStore.isInitialized" class="family-page__empty">
        <view class="family-page__empty-icon">🏠</view>
        <text class="family-page__empty-title">还没有家庭</text>
        <text class="family-page__empty-desc">
          创建一个新家庭或通过邀请码加入已有家庭
        </text>
        <view class="family-page__empty-actions">
          <button class="family-page__create-btn" @click="openCreateDialog">
            <text class="family-page__btn-text">创建家庭</text>
          </button>
          <button class="family-page__join-btn" @click="openJoinDialog">
            <text class="family-page__btn-text-secondary">加入家庭</text>
          </button>
        </view>
      </view>

      <!-- ===== 有家庭状态 ===== -->
      <template v-if="familyStore.currentFamily">
        <!-- 家庭头部 -->
        <view class="family-page__header">
          <text class="family-page__family-name">
            {{ familyStore.currentFamilyName }}
          </text>
          <text class="family-page__member-count">
            {{ familyStore.members.length }} 位成员
          </text>
        </view>

        <!-- 轻量统计区 -->
        <MemberStatsCard :stats="familyStore.stats" />

        <!-- 家庭成员列表 -->
        <MemberList
          :members="familyStore.members"
          :is-organizer="familyStore.isOrganizer"
          @remove="handleRemoveMember"
        />

        <!-- 邀请入口（仅组织者可见） -->
        <InviteAction
          :invite-code="familyStore.currentInviteCode"
          :is-organizer="familyStore.isOrganizer"
        />

        <!-- 非组织者：显示邀请码（只读） -->
        <view v-if="!familyStore.isOrganizer && familyStore.currentInviteCode" class="family-page__code-readonly">
          <text class="family-page__code-label">家庭邀请码</text>
          <text class="family-page__code-value">{{ familyStore.currentInviteCode }}</text>
        </view>

        <!-- 切换家庭 -->
        <view v-if="familyStore.families.length > 1" class="family-page__switch-section">
          <text class="family-page__switch-title">其他家庭</text>
          <view
            v-for="family in familyStore.families.filter(f => f.id !== familyStore.currentFamily?.id)"
            :key="family.id"
            class="family-page__switch-item"
            @click="switchFamily(family)"
          >
            <text class="family-page__switch-name">{{ family.name }}</text>
            <text class="family-page__switch-count">{{ family.memberCount || 0 }}人</text>
            <text class="family-page__switch-arrow">›</text>
          </view>
        </view>

        <!-- 底部操作 -->
        <view class="family-page__bottom-actions">
          <button class="family-page__join-other-btn" @click="goToJoin">
            <text class="family-page__join-other-text">加入其他家庭</text>
          </button>
        </view>
      </template>

      <!-- ===== 创建家庭弹窗 ===== -->
      <view v-if="showCreateDialog" class="family-page__overlay" @click="closeCreateDialog">
        <view class="family-page__dialog" @click.stop>
          <text class="family-page__dialog-title">创建新家庭</text>
          <view class="family-page__dialog-input-group">
            <text class="family-page__dialog-label">家庭名称</text>
            <input
              v-model="newFamilyName"
              class="family-page__dialog-input"
              placeholder="例如：幸福三口之家"
              :maxlength="20"
              @confirm="confirmCreateFamily"
            />
          </view>
          <view class="family-page__dialog-actions">
            <button class="family-page__dialog-cancel" @click="closeCreateDialog">
              取消
            </button>
            <button
              class="family-page__dialog-confirm"
              :disabled="actionLoading || !newFamilyName.trim()"
              @click="confirmCreateFamily"
            >
              {{ actionLoading ? '创建中...' : '创建' }}
            </button>
          </view>
        </view>
      </view>

      <!-- ===== 加入家庭弹窗 ===== -->
      <view v-if="showJoinDialog" class="family-page__overlay" @click="closeJoinDialog">
        <view class="family-page__dialog" @click.stop>
          <text class="family-page__dialog-title">加入家庭</text>
          <view class="family-page__dialog-input-group">
            <text class="family-page__dialog-label">邀请码</text>
            <input
              v-model="joinCode"
              class="family-page__dialog-input"
              placeholder="请输入邀请码"
              :maxlength="6"
              @confirm="confirmJoinFamily"
            />
          </view>
          <view class="family-page__dialog-actions">
            <button class="family-page__dialog-cancel" @click="closeJoinDialog">
              取消
            </button>
            <button
              class="family-page__dialog-confirm"
              :disabled="actionLoading || !joinCode.trim()"
              @click="confirmJoinFamily"
            >
              {{ actionLoading ? '加入中...' : '加入' }}
            </button>
          </view>
        </view>
      </view>

      <!-- ===== 加载中 ===== -->
      <view v-if="familyStore.isLoading && !familyStore.isInitialized" class="family-page__loading">
        <text class="family-page__loading-text">加载中...</text>
      </view>
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.family-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: var(--space-2xl);

  /* ========== 头部 ========== */
  &__header {
    padding: var(--space-2xl) var(--space-lg) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__family-name {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-h1);
    color: var(--color-text);
  }

  &__member-count {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  /* ========== 空状态 ========== */
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: var(--space-2xl) var(--space-lg);
  }

  &__empty-icon {
    font-size: 64px;
    margin-bottom: var(--space-lg);
  }

  &__empty-title {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-h1);
    color: var(--color-text);
    margin-bottom: var(--space-sm);
  }

  &__empty-desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    text-align: center;
    line-height: 1.5;
    margin-bottom: var(--space-2xl);
  }

  &__empty-actions {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  &__create-btn {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: var(--color-primary);
    border-radius: var(--radius-lg);

    &:active {
      opacity: 0.9;
    }
  }

  &__btn-text {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-white);
  }

  &__join-btn {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: transparent;
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-lg);

    &:active {
      background: var(--color-surface);
    }
  }

  &__btn-text-secondary {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-primary);
  }

  /* ========== 只读邀请码 ========== */
  &__code-readonly {
    margin: var(--space-md) var(--space-lg);
    padding: var(--space-lg);
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
  }

  &__code-label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  &__code-value {
    font-family: var(--font-display);
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-primary);
    letter-spacing: 2px;
    margin-top: var(--space-xs);
  }

  /* ========== 切换家庭 ========== */
  &__switch-section {
    margin: var(--space-md) var(--space-lg);
  }

  &__switch-title {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-sm);
  }

  &__switch-item {
    display: flex;
    align-items: center;
    padding: var(--space-md);
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    margin-bottom: var(--space-sm);
    gap: var(--space-md);

    &:active {
      opacity: 0.7;
    }
  }

  &__switch-name {
    flex: 1;
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--color-text);
  }

  &__switch-count {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  &__switch-arrow {
    font-size: 20px;
    color: var(--color-text-secondary);
    font-weight: 300;
  }

  /* ========== 底部操作 ========== */
  &__bottom-actions {
    margin: var(--space-lg);
  }

  &__join-other-btn {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);

    &:active {
      background: var(--color-surface);
    }
  }

  &__join-other-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  /* ========== 弹窗/遮罩 ========== */
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  &__dialog {
    width: calc(100vw - var(--space-2xl) * 2);
    max-width: 320px;
    background: var(--color-white);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
  }

  &__dialog-title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
    margin-bottom: var(--space-lg);
    display: block;
  }

  &__dialog-input-group {
    margin-bottom: var(--space-lg);
  }

  &__dialog-label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-sm);
  }

  &__dialog-input {
    width: 100%;
    padding: var(--space-md);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    font-size: var(--font-size-body);
    color: var(--color-text);
    margin-top: var(--space-xs);
    border: 2px solid transparent;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &__dialog-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: flex-end;
  }

  &__dialog-cancel {
    padding: var(--space-sm) var(--space-lg);
    background: transparent;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    line-height: 1.4;

    &:active {
      opacity: 0.7;
    }
  }

  &__dialog-confirm {
    padding: var(--space-sm) var(--space-lg);
    background: var(--color-primary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-body);
    color: var(--color-white);
    line-height: 1.4;

    &:active {
      opacity: 0.9;
    }

    &[disabled] {
      opacity: 0.4;
    }
  }

  /* ========== 加载中 ========== */
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  &__loading-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }
}
</style>
