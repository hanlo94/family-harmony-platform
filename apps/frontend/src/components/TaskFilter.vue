<script setup lang="ts">
/**
 * TaskFilter — 状态筛选 Tab 栏
 *
 * 横向滚动的 Tab 切换，包含任务计数徽章。
 * 当前选中的 Tab 以 Forest 色高亮，下方有指示横线。
 *
 * Props:
 *   modelValue — 当前选中的状态（v-model）
 *   tabCounts  — 各 Tab 的任务计数 { [status]: count }
 *
 * 设计参考: docs/ui-design.md §4.1
 */
import { STATUS_TABS } from '../stores/task';

withDefaults(
  defineProps<{
    modelValue: string;
    tabCounts?: Record<string, number>;
  }>(),
  { tabCounts: () => ({}) },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

</script>

<template>
  <view class="task-filter">
    <scroll-view scroll-x class="task-filter__scroll" :show-scrollbar="false">
      <view class="task-filter__tabs">
        <view
          v-for="tab in STATUS_TABS"
          :key="tab.key"
          class="task-filter__tab"
          :class="{ 'task-filter__tab--active': modelValue === tab.key }"
          @tap="emit('update:modelValue', tab.key)"
        >
          <view class="task-filter__tab-content">
            <text
              v-if="modelValue === tab.key"
              class="task-filter__tab-dot"
            >●</text>
            <text class="task-filter__tab-label">{{ tab.label }}</text>
          </view>
          <text
            v-if="tabCounts[tab.key] !== undefined"
            class="task-filter__tab-count"
            :class="{ 'task-filter__tab-count--active': modelValue === tab.key }"
          >
            ({{ tabCounts[tab.key] }})
          </text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.task-filter {
  margin: 0 var(--space-lg);
  border-bottom: 1px solid var(--color-border);

  &__scroll {
    width: 100%;
    white-space: nowrap;
  }

  &__tabs {
    display: flex;
    gap: 0;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: var(--space-md) var(--space-md);
    position: relative;
    flex-shrink: 0;

    &--active {
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: var(--space-md);
        right: var(--space-md);
        height: 2px;
        background: var(--color-primary);
        border-radius: 1px;
      }
    }
  }

  &__tab-content {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__tab-dot {
    font-size: 8px;
    color: var(--color-primary);
  }

  &__tab-label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    transition: color 0.2s ease;

    .task-filter__tab--active & {
      color: var(--color-primary);
      font-weight: var(--font-weight-h2);
    }
  }

  &__tab-count {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);

    &--active {
      color: var(--color-primary);
    }
  }
}
</style>
