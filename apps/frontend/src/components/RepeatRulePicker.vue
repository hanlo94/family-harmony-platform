<script setup lang="ts">
/**
 * RepeatRulePicker — 重复规则三段式切换
 *
 * 三种模式：不重复 / 每天 / 每周
 * 使用 Segmented Control 风格，选中项高亮为主色。
 *
 * Props:
 *   modelValue — 当前选中值：'NONE' | 'DAILY' | 'WEEKLY'
 *
 * Emits:
 *   update:modelValue — 选中值变化时触发
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
  }>(),
  { modelValue: 'NONE' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/** 选项配置 */
const OPTIONS = [
  { value: 'NONE', label: '不重复' },
  { value: 'DAILY', label: '每天' },
  { value: 'WEEKLY', label: '每周' },
] as const;

/** 当前选中的索引（用于滑块定位） */
const selectedIndex = computed(() => OPTIONS.findIndex((o) => o.value === props.modelValue));

/** 滑块偏移比例 */
const sliderOffset = computed(() => {
  const idx = selectedIndex.value >= 0 ? selectedIndex.value : 0;
  return `${(idx / OPTIONS.length) * 100}%`;
});

function handleSelect(value: string): void {
  if (value !== props.modelValue) {
    emit('update:modelValue', value);
  }
}
</script>

<template>
  <view class="repeat-rule-picker">
    <view class="repeat-rule-picker__track">
      <!-- 选中滑块背景 -->
      <view
        class="repeat-rule-picker__slider"
        :style="{ left: sliderOffset, width: `${100 / OPTIONS.length}%` }"
      />
      <!-- 选项按钮 -->
      <view
        v-for="option in OPTIONS"
        :key="option.value"
        class="repeat-rule-picker__option"
        :class="{ 'repeat-rule-picker__option--active': modelValue === option.value }"
        @tap="handleSelect(option.value)"
      >
        <text class="repeat-rule-picker__label">{{ option.label }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.repeat-rule-picker {
  &__track {
    position: relative;
    display: flex;
    background: var(--color-surface);
    border-radius: var(--radius-md);
    padding: 3px;
    height: 40px;
  }

  &__slider {
    position: absolute;
    top: 3px;
    bottom: 3px;
    background: var(--color-primary);
    border-radius: 8px;
    transition: left 0.25s ease, width 0.25s ease;
  }

  &__option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    border-radius: 8px;
    transition: color 0.2s ease;
  }

  &__label {
    font-size: var(--font-size-caption);
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: color 0.2s ease;
  }

  &__option--active &__label {
    color: var(--color-white);
    font-weight: 600;
  }
}
</style>
