<script setup lang="ts">
/**
 * VerificationBadge — 验收标记
 *
 * 当任务需要组织者验收时，显示 "🔍 验收" 徽章。
 *
 * Props:
 *   needsVerification — 是否需要验收
 */
defineProps<{
  needsVerification: boolean;
}>();
</script>

<template>
  <view v-if="needsVerification" class="verification-badge">
    <text class="verification-badge__text">🔍 验收</text>
  </view>
</template>

<style lang="scss" scoped>
.verification-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-sm);
  background: rgba(61, 107, 90, 0.1);
  border-radius: var(--radius-sm);
  flex-shrink: 0;

  &__text {
    font-size: var(--font-size-small);
    color: var(--color-primary);
    font-weight: var(--font-weight-small);
    white-space: nowrap;
  }
}
</style>
