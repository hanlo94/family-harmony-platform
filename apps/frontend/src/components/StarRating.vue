<script setup lang="ts">
/**
 * StarRating — 难度星级显示
 *
 * 展示 1-5 颗星，实心星表示难度等级，空心星表示剩余。
 * 使用 Honey 色（#F4D35E）作为星级颜色。
 *
 * Props:
 *   difficulty — 1-5 的难度值
 *   max       — 最大星数（默认 5）
 *   size      — 星号字号（默认 16px）
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    difficulty: number;
    max?: number;
    size?: number;
  }>(),
  { max: 5, size: 16 },
);

const starArray = computed(() =>
  Array.from({ length: props.max }, (_, i) => i < props.difficulty),
);
</script>

<template>
  <view class="star-rating" :style="{ fontSize: `${size}px` }">
    <text
      v-for="(filled, idx) in starArray"
      :key="idx"
      class="star-rating__star"
      :class="{ 'star-rating__star--filled': filled }"
    >
      {{ filled ? '★' : '☆' }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;

  &__star {
    color: var(--color-border);
    line-height: 1;
    transition: color 0.2s ease;

    &--filled {
      color: var(--color-honey);
    }
  }
}
</style>
