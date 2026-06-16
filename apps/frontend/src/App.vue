<script setup lang="ts">
/**
 * App.vue — 应用根组件
 *
 * 职责：
 * - 应用级生命周期管理（onLaunch / onShow / onHide）
 * - onLaunch 时从本地存储恢复登录态（initFromStorage）
 * - 未登录时自动跳转登录页（排除登录页本身）
 */
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useAuthStore } from './stores/auth';

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

<style lang="scss">
/* 应用级全局样式（非 scoped） */
/* 大部分全局样式已通过 main.ts 导入的 global.scss 覆盖 */
</style>
