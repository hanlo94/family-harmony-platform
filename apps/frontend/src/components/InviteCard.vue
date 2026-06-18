<script setup lang="ts">
/**
 * InviteCard — 邀请码展示与分享
 *
 * 在邀请成员页展示邀请码、邀请链接，并提供复制/刷新功能。
 *
 * Props:
 *   inviteCode — 邀请码
 *   inviteUrl  — 邀请链接（后端生成）
 *   loading    — 是否正在生成邀请码
 *
 * Events:
 *   refresh — 点击"生成新邀请码"时触发
 *
 * 设计参考: docs/ui-design.md §4.5 邀请成员页
 */
defineProps<{
  inviteCode: string;
  inviteUrl: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

/** 复制邀请码 */
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

/** 复制邀请链接 */
function handleCopyLink(url: string): void {
  // #ifdef H5
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      uni.showToast({ title: '链接已复制', icon: 'success' });
    }).catch(() => {
      uni.showToast({ title: '复制失败，请手动复制', icon: 'none' });
    });
    return;
  }
  // #endif
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '复制失败，请手动复制', icon: 'none' });
    },
  });
}

/** 分享邀请（H5 使用 Web Share API，小程序使用分享面板） */
function handleShare(url: string, code: string): void {
  // #ifdef MP-WEIXIN
  // 小程序通过 button open-type="share" 触发，此处做降级处理
  uni.showToast({ title: '请点击右上角分享', icon: 'none' });
  // #endif

  // #ifdef H5
  const shareData = {
    title: '加入我的家庭',
    text: `邀请你加入我的家庭！邀请码：${code}`,
    url: url,
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {
      // 用户取消分享，不提示
    });
  } else {
    handleCopyLink(url);
  }
  // #endif
}
</script>

<template>
  <view class="invite-card">
    <!-- 图标 -->
    <view class="invite-card__icon-area">
      <text class="invite-card__icon">📨</text>
    </view>

    <!-- 标题 -->
    <text class="invite-card__title">邀请家人加入</text>
    <text class="invite-card__desc">
      将邀请码或链接发送给家人，他们即可加入你的家庭
    </text>

    <!-- 邀请码展示 -->
    <view class="invite-card__code-box">
      <text class="invite-card__code-label">邀请码</text>
      <view class="invite-card__code-row">
        <text class="invite-card__code">{{ inviteCode || '---' }}</text>
        <button
          v-if="inviteCode"
          class="invite-card__copy-btn"
          @click="handleCopyCode(inviteCode)"
        >
          复制
        </button>
      </view>
    </view>

    <!-- 邀请链接 -->
    <view v-if="inviteUrl" class="invite-card__link-box">
      <text class="invite-card__link-label">邀请链接</text>
      <view class="invite-card__link-row">
        <text class="invite-card__link">{{ inviteUrl }}</text>
        <button class="invite-card__copy-btn" @click="handleCopyLink(inviteUrl)">
          复制
        </button>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="invite-card__actions">
      <button
        class="invite-card__share-btn"
        @click="handleShare(inviteUrl, inviteCode)"
      >
        <text class="invite-card__share-icon">📤</text>
        <text class="invite-card__share-text">分享给微信好友</text>
      </button>

      <button
        class="invite-card__refresh-btn"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <text>{{ loading ? '生成中...' : '生成新邀请码' }}</text>
      </button>
    </view>

    <!-- 提示 -->
    <text class="invite-card__tip">
      邀请码有效期 7 天，过期后可重新生成
    </text>
  </view>
</template>

<style lang="scss" scoped>
.invite-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2xl) var(--space-lg);
  margin: var(--space-lg);
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);

  /* ========== 图标区 ========== */
  &__icon-area {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-full);
    background: var(--color-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-md);
  }

  &__icon {
    font-size: 36px;
  }

  /* ========== 标题 ========== */
  &__title {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-h1);
    color: var(--color-text);
    margin-bottom: var(--space-sm);
  }

  &__desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    text-align: center;
    margin-bottom: var(--space-xl);
    line-height: 1.5;
  }

  /* ========== 邀请码 ========== */
  &__code-box {
    width: 100%;
    padding: var(--space-lg);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
  }

  &__code-label {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-sm);
  }

  &__code-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-xs);
  }

  &__code {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 4px;
  }

  &__copy-btn {
    padding: var(--space-sm) var(--space-lg);
    background: var(--color-primary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-caption);
    color: var(--color-white);
    line-height: 1.4;

    &:active {
      opacity: 0.9;
    }
  }

  /* ========== 邀请链接 ========== */
  &__link-box {
    width: 100%;
    padding: var(--space-lg);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-xl);
  }

  &__link-label {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  &__link-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-xs);
    gap: var(--space-sm);
  }

  &__link {
    flex: 1;
    font-size: var(--font-size-small);
    color: var(--color-primary);
    word-break: break-all;
    min-width: 0;
  }

  /* ========== 操作按钮 ========== */
  &__actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  &__share-btn {
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

  &__share-icon {
    font-size: 18px;
  }

  &__share-text {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-white);
  }

  &__refresh-btn {
    padding: var(--space-md) var(--space-lg);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    width: 100%;

    &:active {
      background: var(--color-surface);
    }

    &[disabled] {
      opacity: 0.5;
    }
  }

  /* ========== 底部提示 ========== */
  &__tip {
    margin-top: var(--space-xl);
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    text-align: center;
  }
}
</style>
