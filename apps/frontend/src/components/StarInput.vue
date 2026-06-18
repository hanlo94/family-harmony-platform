<script setup lang="ts">
/**
 * StarInput — 可交互星级选择器
 *
 * 点击星星来选择难度等级（1-5）。
 * 与 StarRating（纯展示）不同，本组件支持点击交互。
 *
 * Props:
 *   modelValue — 当前选中的星级（1-5，默认 1）
 *   max       — 最大星数（默认 5）
 *   size      — 星号字号（默认 28px，比展示用更大以便触摸）
 *
 * Emits:
 *   update:modelValue — 选中星级变化时触发
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    max?: number;
    size?: number;
  }>(),
  { modelValue: 1, max: 5, size: 28 },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

/** 生成星级数组 */
const starArray = computed(() =>
  Array.from({ length: props.max }, (_, i) => i < props.modelValue),
);

/** 点击星星选择难度 */
function handleTap(index: number): void {
  const newValue = index + 1;
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue);
  }
}
</script>

<template>
  <view class="star-input" :style="{ fontSize: `${size}px` }">
    <text
      v-for="(filled, idx) in starArray"
      :key="idx"
      class="star-input__star"
      :class="{ 'star-input__star--filled': filled }"
      @tap="handleTap(idx)"
    >
      {{ filled ? '★' : '☆' }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.star-input {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &__star {
    color: var(--color-border);
    line-height: 1;
    transition: color 0.15s ease, transform 0.15s ease;

    &:active {
      transform: scale(1.2);
    }

    &--filled {
      color: var(--color-honey);
    }
  }
}
</style>
