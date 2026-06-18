<script setup lang="ts">
/**
 * VerificationToggle — 验收开关 Toggle
 *
 * 控制任务是否需要组织者验收。
 * 开启后显示提示文字："开启后需组织者确认完成"
 *
 * Props:
 *   modelValue — 当前开关状态
 *
 * Emits:
 *   update:modelValue — 开关状态变化时触发
 */
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  { modelValue: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

/** uni-app switch 组件的 color 属性需要直接的色值 */
const SWITCH_COLOR = '#3D6B5A';

function handleToggle(): void {
  emit('update:modelValue', !props.modelValue);
}
</script>

<template>
  <view class="verification-toggle" @tap="handleToggle">
    <view class="verification-toggle__content">
      <text class="verification-toggle__icon">🔍</text>
      <view class="verification-toggle__text">
        <text class="verification-toggle__label">需要验收</text>
        <text class="verification-toggle__hint">开启后需组织者确认完成</text>
      </view>
    </view>
    <switch
      class="verification-toggle__switch"
      :checked="modelValue"
      :color="SWITCH_COLOR"
      @change="handleToggle"
    />
  </view>
</template>

<style lang="scss" scoped>
.verification-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-white);
  border-radius: var(--radius-md);

  &__content {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  &__icon {
    font-size: 20px;
    line-height: 1;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--color-text);
  }

  &__hint {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  &__switch {
    flex-shrink: 0;
    transform: scale(0.9);
  }
}
</style>
