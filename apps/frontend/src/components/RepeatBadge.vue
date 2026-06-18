<script setup lang="ts">
/**
 * RepeatBadge — 重复规则徽章
 *
 * 根据 repeatRule 显示对应的徽章文字：
 * - DAILY → "每天 🔁"
 * - WEEKLY → "每周 🔁"
 * - NONE → 不渲染
 *
 * Props:
 *   repeatRule — 'NONE' | 'DAILY' | 'WEEKLY'
 */
defineProps<{
  repeatRule: string;
}>();
</script>

<template>
  <view v-if="repeatRule !== 'NONE'" class="repeat-badge">
    <text class="repeat-badge__text">
      {{ repeatRule === 'DAILY' ? '每天' : repeatRule === 'WEEKLY' ? '每周' : '' }}
      🔁
    </text>
  </view>
</template>

<style lang="scss" scoped>
.repeat-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-sm);
  background: rgba(244, 211, 94, 0.18);
  border-radius: var(--radius-sm);
  flex-shrink: 0;

  &__text {
    font-size: var(--font-size-small);
    color: var(--color-accent);
    font-weight: var(--font-weight-small);
    white-space: nowrap;
  }
}
</style>
