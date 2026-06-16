<script setup lang="ts">
/**
 * AuthGuard — 登录状态检查组件
 *
 * 职责：
 * - onMounted 时检查是否已登录（调用 authStore.initFromStorage）
 * - 未登录 → 显示加载动画 + 重定向到登录页
 * - 已登录 → 渲染默认插槽内容
 *
 * 使用方式：
 *   <AuthGuard>
 *     <view>需要登录才能看到的内容</view>
 *   </AuthGuard>
 *
 * 接入方式：每个需要登录的页面用此组件包裹模板根节点。
 * 或者：在 App.vue onLaunch 中初始化，此处做二次防御。
 */
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const ready = ref(false);

onMounted(async () => {
  // 如果尚未初始化，从本地存储恢复
  if (!authStore.isInitialized) {
    await authStore.initFromStorage();
  }

  if (!authStore.isLoggedIn) {
    // 未登录 → 跳转到登录页
    uni.reLaunch({
      url: '/pages/login/index',
    });
    return;
  }

  ready.value = true;
});
</script>

<template>
  <!-- 已登录：渲染页面内容 -->
  <template v-if="ready">
    <slot />
  </template>

  <!-- 未登录 / 初始化中：显示加载状态 -->
  <view v-else class="auth-guard-loading">
    <view class="auth-guard-loading__spinner" />
    <text class="auth-guard-loading__text">加载中...</text>
  </view>
</template>

<style lang="scss" scoped>
.auth-guard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
  gap: var(--space-md);

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: var(--radius-full);
    animation: auth-guard-spin 0.8s linear infinite;
  }

  &__text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }
}

@keyframes auth-guard-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
