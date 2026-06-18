<script setup lang="ts">
/**
 * LoadingSpinner — 统一加载动画组件
 *
 * 提供一致的加载中指示器，避免每个页面重复定义 spinner 样式。
 *
 * Props:
 *   size  — 'small' (20px) | 'medium' (32px) | 'large' (48px)，默认 medium
 *   text  — 可选加载文字，不传则只显示旋转动画
 *
 * 用法：
 *   <LoadingSpinner text="加载中..." />
 *   <LoadingSpinner size="small" />
 */
withDefaults(
  defineProps<{
    size?: 'small' | 'medium' | 'large';
    text?: string;
  }>(),
  {
    size: 'medium',
    text: '',
  },
);
</script>

<template>
  <view class="loading-spinner" :class="`loading-spinner--${size}`">
    <view class="loading-spinner__ring" />
    <text v-if="text" class="loading-spinner__text">{{ text }}</text>
  </view>
</template>

<style lang="scss" scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);

  /* ========== 尺寸 ========== */
  &--small {
    padding: var(--space-sm) 0;

    .loading-spinner__ring {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }

    .loading-spinner__text {
      font-size: var(--font-size-small);
    }
  }

  &--medium {
    padding: var(--space-xl) 0;

    .loading-spinner__ring {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }

    .loading-spinner__text {
      font-size: var(--font-size-caption);
    }
  }

  &--large {
    padding: var(--space-2xl) 0;

    .loading-spinner__ring {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }

    .loading-spinner__text {
      font-size: var(--font-size-body);
    }
  }
}

/* ========== 旋转环 ========== */
.loading-spinner__ring {
  border-style: solid;
  border-color: var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: loading-spinner-spin 0.8s linear infinite;
}

@keyframes loading-spinner-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 加载文字 ========== */
.loading-spinner__text {
  color: var(--color-text-secondary);
}
</style>
