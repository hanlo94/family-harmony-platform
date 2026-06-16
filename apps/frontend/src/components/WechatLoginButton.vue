<script setup lang="ts">
/**
 * WechatLoginButton — 微信一键登录按钮
 *
 * 职责：
 * - 渲染绿色微信风格登录按钮
 * - 点击触发登录流程（emit login 事件）
 * - loading 状态：显示旋转动画 + 禁用点击
 *
 * 使用方式：
 *   <WechatLoginButton :loading="loading" @login="handleLogin" />
 */
defineProps<{
  /** 是否正在登录中 */
  loading?: boolean;
  /** 按钮文字 */
  label?: string;
}>();

defineEmits<{
  login: [];
}>();
</script>

<template>
  <button
    class="wechat-login-btn"
    :class="{ 'wechat-login-btn--loading': loading }"
    :disabled="loading"
    @click="$emit('login')"
  >
    <!-- 加载动画 -->
    <view v-if="loading" class="wechat-login-btn__spinner" />

    <!-- 微信图标（未加载时显示） -->
    <text v-else class="wechat-login-btn__icon">💬</text>

    <text class="wechat-login-btn__text">
      {{ loading ? '登录中...' : (label || '微信一键登录') }}
    </text>
  </button>
</template>

<style lang="scss" scoped>
.wechat-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 280px;
  height: 50px;
  background: #07c160;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }

  &--loading {
    opacity: 0.8;
    cursor: not-allowed;
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: var(--radius-full);
    animation: wechat-btn-spin 0.7s linear infinite;
  }

  &__icon {
    font-size: 20px;
  }

  &__text {
    font-size: var(--font-size-body);
  }
}

@keyframes wechat-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
