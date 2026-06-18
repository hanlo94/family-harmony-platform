<script setup lang="ts">
/**
 * CustomToast — 全局自定义 Toast 组件
 *
 * 提供与设计系统统一风格的 Toast 提示，替代 uni.showToast()。
 *
 * 类型：
 *   - success: 绿色（moss），✓ 图标
 *   - error:   红色（rose），✕ 图标
 *   - warning: 黄色（honey），⚠ 图标
 *   - info:    主色（primary），ℹ 图标
 *
 * 全局用法（通过 provide/inject）：
 *   1. App.vue 中挂载 <CustomToast ref="toastRef" />
 *   2. 任何组件中：const toast = inject('toast'); toast.show('操作成功', 'success');
 *
 * 设计参考: docs/ui-design.md §2 Design Token
 */
import { ref } from 'vue';

/** Toast 类型 */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Toast 实例 */
interface ToastInstance {
  id: number;
  message: string;
  type: ToastType;
}

/** 类型 → 图标映射 */
const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

let nextId = 0;

/** 当前显示的 toast 列表 */
const toasts = ref<ToastInstance[]>([]);

/**
 * 显示一个 Toast
 *
 * @param message - 提示文字
 * @param type - 类型，默认 'success'
 * @param duration - 显示时长（毫秒），默认 2000
 */
function show(message: string, type: ToastType = 'success', duration = 2000): void {
  const id = nextId++;
  toasts.value.push({ id, message, type });

  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, duration);
}

/** 暴露给父组件（供 provide 使用） */
defineExpose({ show });
</script>

<template>
  <view class="custom-toast-container">
    <view
      v-for="toast in toasts"
      :key="toast.id"
      class="custom-toast"
      :class="`custom-toast--${toast.type}`"
    >
      <text class="custom-toast__icon">{{ iconMap[toast.type] }}</text>
      <text class="custom-toast__message">{{ toast.message }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* ========== 容器（固定在顶部） ========== */
.custom-toast-container {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding-top: calc(var(--status-bar-height, 0px) + var(--space-lg));
  pointer-events: none;
}

/* ========== 单条 Toast ========== */
.custom-toast {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-md);
  background: var(--color-white);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  animation: toast-slide-in 0.35s ease-out forwards;
  min-width: 200px;
  max-width: 320px;

  /* ========== 类型配色 ========== */
  &--success {
    border-left: 4px solid var(--color-moss);

    .custom-toast__icon {
      color: var(--color-moss);
    }
  }

  &--error {
    border-left: 4px solid var(--color-rose);

    .custom-toast__icon {
      color: var(--color-rose);
    }
  }

  &--warning {
    border-left: 4px solid var(--color-honey);

    .custom-toast__icon {
      color: var(--color-honey);
    }
  }

  &--info {
    border-left: 4px solid var(--color-primary);

    .custom-toast__icon {
      color: var(--color-primary);
    }
  }
}

.custom-toast__icon {
  font-size: var(--font-size-body);
  font-weight: 700;
  flex-shrink: 0;
}

.custom-toast__message {
  font-size: var(--font-size-caption);
  color: var(--color-text);
  line-height: 1.4;
}

/* ========== 滑入动画 ========== */
@keyframes toast-slide-in {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
