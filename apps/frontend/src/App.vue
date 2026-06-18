<script setup lang="ts">
/**
 * App.vue — 应用根组件
 *
 * 职责：
 * - 应用级生命周期管理（onLaunch / onShow / onHide）
 * - onLaunch 时从本地存储恢复登录态（initFromStorage）
 * - 未登录时自动跳转登录页（排除登录页本身）
 * - 挂载全局 CustomToast 组件
 */
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { ref, provide } from 'vue';
import { useAuthStore } from './stores/auth';
import CustomToast from './components/CustomToast.vue';

/** 全局 Toast 实例引用 */
const toastRef = ref<InstanceType<typeof CustomToast> | null>(null);

/** 提供给所有后代组件的 toast 方法 */
provide('toast', {
  show: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 2000) => {
    toastRef.value?.show(message, type, duration);
  },
});

onLaunch(async () => {
  console.log('[家庭和谐平台] App 启动');

  const authStore = useAuthStore();
  await authStore.initFromStorage();

  // 如果未登录且当前不在登录页，跳转到登录页
  if (!authStore.isLoggedIn) {
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    const route = currentPage?.route || '';

    if (route !== 'pages/login/index') {
      uni.reLaunch({
        url: '/pages/login/index',
      });
    }
  }
});

onShow(() => {
  console.log('[家庭和谐平台] App 显示');
});

onHide(() => {
  console.log('[家庭和谐平台] App 隐藏');
});
</script>

<template>
  <!-- uni-app 页面渲染入口 -->
  <router-view />
  <!-- 全局 Toast（固定在顶部，z-index 最高） -->
  <CustomToast ref="toastRef" />
</template>

<style lang="scss">
/* 应用级全局样式（非 scoped） */
/* 大部分全局样式已通过 main.ts 导入的 global.scss 覆盖 */
</style>
