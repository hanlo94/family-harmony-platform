<script setup lang="ts">
/**
 * OverdueBanner — 逾期/临近到期任务横条专区
 *
 * 在筛选 Tab 上方以醒目样式展示紧急任务：
 * - 逾期任务：Rose 色背景 + "⚠ 已逾期 N 个任务" 标题
 * - 临近到期任务：Honey 色背景 + "⏰ 即将到期" 标题
 *
 * 每个区域内的任务使用 TaskCard 渲染，带对应的高亮样式。
 *
 * 设计参考: docs/ui-design.md §4.1
 */
import type { components } from '../types/api';
import TaskCard from './TaskCard.vue';

type TaskListItem = components['schemas']['TaskListItem'];

defineProps<{
  overdueTasks: TaskListItem[];
  nearExpiryTasks: TaskListItem[];
}>();

const emit = defineEmits<{
  /** 点击任务卡片 → 跳转详情页 */
  taskClick: [task: TaskListItem];
  /** 标记完成 */
  complete: [task: TaskListItem];
}>();
</script>

<template>
  <view v-if="overdueTasks.length > 0 || nearExpiryTasks.length > 0" class="overdue-banner">
    <!-- ========== 逾期专区 ========== -->
    <view v-if="overdueTasks.length > 0" class="overdue-banner__section">
      <view class="overdue-banner__section-header overdue-banner__section-header--overdue">
        <text class="overdue-banner__section-icon">⚠</text>
        <text class="overdue-banner__section-title">
          已逾期 {{ overdueTasks.length }} 个任务
        </text>
      </view>

      <view class="overdue-banner__list">
        <TaskCard
          v-for="task in overdueTasks"
          :key="task.id"
          :task="task"
          highlight-type="overdue"
          @click="emit('taskClick', task)"
          @complete="emit('complete', task)"
        />
      </view>
    </view>

    <!-- ========== 临近到期专区 ========== -->
    <view v-if="nearExpiryTasks.length > 0" class="overdue-banner__section">
      <view
        class="overdue-banner__section-header overdue-banner__section-header--near-expiry"
      >
        <text class="overdue-banner__section-icon">⏰</text>
        <text class="overdue-banner__section-title">即将到期</text>
      </view>

      <view class="overdue-banner__list">
        <TaskCard
          v-for="task in nearExpiryTasks"
          :key="task.id"
          :task="task"
          highlight-type="near-expiry"
          @click="emit('taskClick', task)"
          @complete="emit('complete', task)"
        />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.overdue-banner {
  margin: var(--space-md) var(--space-lg) 0;

  &__section {
    margin-bottom: var(--space-md);
  }

  /* ========== 分区标题 ========== */
  &__section-header {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    background: var(--color-overdue-bg);

    &--overdue {
      background: var(--color-overdue-bg);
    }

    &--near-expiry {
      background: var(--color-near-expiry-bg);
    }
  }

  &__section-icon {
    font-size: var(--font-size-body);
  }

  &__section-title {
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
  }

  /* ========== 卡片列表 ========== */
  &__list {
    display: flex;
    flex-direction: column;
  }
}
</style>
