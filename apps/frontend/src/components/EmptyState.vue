<script setup lang="ts">
/**
 * EmptyState — 空状态插画组件
 *
 * 根据当前筛选状态显示不同的友好提示。
 *
 * Props:
 *   filter — 当前筛选的状态键
 *
 * 设计参考: docs/ui-design.md §4.1 和 §9（视觉签名中的星星元素）
 */
const props = withDefaults(
  defineProps<{
    filter?: string;
  }>(),
  { filter: 'PENDING_COMPLETION' },
);

/** 根据筛选状态返回对应的空状态文案 */
type EmptyMessage = { emoji: string; text: string; subText: string };

const defaultMessage: EmptyMessage = {
  emoji: '✨',
  text: '今天没有待完成的任务',
  subText: '太棒了！享受轻松的家庭时光吧',
};

const messages = new Map<string, EmptyMessage>([
  ['PENDING_COMPLETION', defaultMessage],
  ['PENDING_VERIFICATION', { emoji: '🔍', text: '没有待验收的任务', subText: '所有完成的任务都已验收通过' }],
  ['REJECTED', { emoji: '📋', text: '没有被驳回的任务', subText: '大家的表现都很棒' }],
  ['COMPLETED', { emoji: '🎉', text: '还没有已完成的任务', subText: '完成一些任务来填满这个列表吧' }],
  ['CANCELLED', { emoji: '🗑️', text: '没有已取消的任务', subText: '一切井然有序' }],
]);

const currentMessage = messages.get(props.filter ?? '') ?? defaultMessage;
</script>

<template>
  <view class="empty-state">
    <text class="empty-state__emoji">{{ currentMessage.emoji }}</text>
    <text class="empty-state__text">{{ currentMessage.text }}</text>
    <text class="empty-state__sub-text">{{ currentMessage.subText }}</text>
  </view>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-lg);
  gap: var(--space-md);
  min-height: 200px;

  &__emoji {
    font-size: 48px;
    animation: empty-float 3s ease-in-out infinite;
  }

  &__text {
    font-size: var(--font-size-body);
    color: var(--color-text);
    font-weight: var(--font-weight-h2);
    text-align: center;
  }

  &__sub-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    text-align: center;
  }
}

@keyframes empty-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
