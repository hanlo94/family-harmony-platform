<script setup lang="ts">
/**
 * InviteAction — 邀请入口组件
 *
 * 展示当前家庭邀请码并提供"邀请新成员"按钮，仅组织者可见。
 *
 * Props:
 *   inviteCode  — 当前家庭的邀请码
 *   isOrganizer — 当前用户是否为组织者
 *
 * 设计参考: docs/ui-design.md §4.5
 */

defineProps<{
  inviteCode: string;
  isOrganizer: boolean;
}>();

/** 复制邀请码到剪贴板 */
function handleCopyCode(code: string): void {
  // #ifdef H5
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      uni.showToast({ title: '邀请码已复制', icon: 'success' });
    }).catch(() => {
      uni.showToast({ title: '复制失败，请手动复制', icon: 'none' });
    });
    return;
  }
  // #endif
  uni.setClipboardData({
    data: code,
    success: () => {
      uni.showToast({ title: '邀请码已复制', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '复制失败，请手动复制', icon: 'none' });
    },
  });
}

/** 跳转到邀请页面 */
function handleGoInvite(): void {
  uni.navigateTo({ url: '/pages/family/invite' });
}
</script>

<template>
  <view v-if="isOrganizer" class="invite-action">
    <!-- 邀请码展示 -->
    <view class="invite-action__code-section">
      <text class="invite-action__label">邀请码</text>
      <view class="invite-action__code-row">
        <text class="invite-action__code">{{ inviteCode || '暂无' }}</text>
        <button
          v-if="inviteCode"
          class="invite-action__copy-btn"
          @click="handleCopyCode(inviteCode)"
        >
          复制
        </button>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="invite-action__buttons">
      <button class="invite-action__invite-btn" @click="handleGoInvite">
        <text class="invite-action__invite-icon">📨</text>
        <text class="invite-action__invite-text">邀请新成员</text>
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.invite-action {
  margin: var(--space-md) var(--space-lg);
  padding: var(--space-lg);
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);

  /* ========== 邀请码展示 ========== */
  &__code-section {
    margin-bottom: var(--space-md);
  }

  &__label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs);
  }

  &__code-row {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-top: var(--space-xs);
  }

  &__code {
    font-family: var(--font-display);
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-primary);
    letter-spacing: 2px;
    background: var(--color-surface);
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius-sm);
  }

  &__copy-btn {
    padding: var(--space-sm) var(--space-md);
    background: var(--color-surface);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-caption);
    color: var(--color-primary);
    line-height: 1.4;

    &:active {
      opacity: 0.7;
    }
  }

  /* ========== 按钮 ========== */
  &__buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  &__invite-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    background: var(--color-primary);
    border-radius: var(--radius-lg);
    width: 100%;

    &:active {
      opacity: 0.9;
    }
  }

  &__invite-icon {
    font-size: 18px;
  }

  &__invite-text {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-white);
  }
}
</style>
