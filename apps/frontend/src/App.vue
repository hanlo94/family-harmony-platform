<script setup lang="ts">
/**
 * App.vue — 应用根组件
 *
 * 职责：
 * - 应用级生命周期管理（onLaunch / onShow / onHide）
 * - 非 scoped 全局样式通过 main.ts 导入
 */

import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('[家庭和谐平台] App 启动');
});

onShow(() => {
  console.log('[家庭和谐平台] App 显示');
});

onHide(() => {
  console.log('[家庭和谐平台] App 隐藏');
});
</script>

<style lang="scss">
/* 此处在 App.vue 中可定义应用级全局样式（非 scoped） */
/* 大部分全局样式已通过 main.ts 导入的 global.scss 覆盖 */
</style>
