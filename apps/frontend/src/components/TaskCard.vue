<script setup lang="ts">
/**
 * TaskCard — 任务卡片组件
 *
 * 根据 highlightType 呈现不同的视觉样式：
 * - 'overdue'：Rose 背景、左侧红色竖线、红色截止时间、右下逾期时长
 * - 'near-expiry'：Honey 背景、左侧黄色竖线、显示剩余时间
 * - 'normal'：默认样式，浅色背景
 *
 * 卡片内容：
 * - 左侧：彩色状态竖线（逾期红 / 临近到期黄 / 无）
 * - 标题 + 难度星级
 * - 徽章行：RepeatBadge + VerificationBadge
 * - 底部：执行人头像昵称 + CTA 按钮"标记完成 →"
 *
 * Props:
 *   task          — 任务数据
 *   highlightType — 高亮类型
 *
 * 设计参考: docs/ui-design.md §4.1
 */
import { computed } from 'vue';
import type { components } from '../types/api';
import StarRating from './StarRating.vue';
import RepeatBadge from './RepeatBadge.vue';
import VerificationBadge from './VerificationBadge.vue';
import {
  formatRelativeDate,
  getOverdueText,
  getRemainingText,
} from '../utils/date';

type TaskListItem = components['schemas']['TaskListItem'];

const props = withDefaults(
  defineProps<{
    task: TaskListItem;
    highlightType?: 'overdue' | 'near-expiry' | 'normal';
  }>(),
  { highlightType: 'normal' },
);

const emit = defineEmits<{
  click: [task: TaskListItem];
  complete: [task: TaskListItem];
}>();

/** 截止时间显示文本 */
const deadlineText = computed(() => {
  if (!props.task.deadline) return '';
  if (props.highlightType === 'overdue') {
    return getOverdueText(props.task.deadline);
  }
  if (props.highlightType === 'near-expiry') {
    return getRemainingText(props.task.deadline);
  }
  return formatRelativeDate(props.task.deadline);
});

/** 执行人昵称 */
const assigneeName = computed(() => props.task.assignedTo?.nickname || '未分配');

/** 执行人头像首字 */
const avatarLetter = computed(() => assigneeName.value.charAt(0));
</script>

<template>
  <view
    class="task-card"
    :class="{
      'task-card--overdue': highlightType === 'overdue',
      'task-card--near-expiry': highlightType === 'near-expiry',
    }"
    @tap="emit('click', task)"
  >
    <!-- 左侧状态竖线 -->
    <view
      v-if="highlightType !== 'normal'"
      class="task-card__indicator"
      :class="{
        'task-card__indicator--overdue': highlightType === 'overdue',
        'task-card__indicator--near-expiry': highlightType === 'near-expiry',
      }"
    />

    <!-- 主体内容 -->
    <view class="task-card__body">
      <!-- 上排：标题 + 星级 -->
      <view class="task-card__top">
        <text class="task-card__title">{{ task.title }}</text>
        <StarRating
          v-if="task.difficulty"
          :difficulty="task.difficulty"
          :size="14"
        />
      </view>

      <!-- 中排：徽章 + 截止时间 -->
      <view class="task-card__meta">
        <RepeatBadge :repeat-rule="task.repeatRule || 'NONE'" />
        <VerificationBadge :needs-verification="task.needsVerification || false" />
        <text
          class="task-card__deadline"
          :class="{
            'task-card__deadline--overdue': highlightType === 'overdue',
            'task-card__deadline--near-expiry': highlightType === 'near-expiry',
          }"
        >
          ⏰ {{ deadlineText }}
        </text>
      </view>

      <!-- 下排：执行人 + CTA -->
      <view class="task-card__bottom">
        <view class="task-card__assignee">
          <view class="task-card__avatar">
            <image
              v-if="task.assignedTo?.avatarUrl"
              :src="task.assignedTo.avatarUrl"
              class="task-card__avatar-img"
              mode="aspectFill"
            />
            <text v-else class="task-card__avatar-text">{{ avatarLetter }}</text>
          </view>
          <text class="task-card__assignee-name">{{ assigneeName }}</text>
        </view>

        <!-- CTA 按钮："标记完成 →"（仅待完成状态显示） -->
        <view
          v-if="task.status === 'PENDING_COMPLETION'"
          class="task-card__cta"
          @tap.stop="emit('complete', task)"
        >
          <text class="task-card__cta-text">标记完成</text>
          <text class="task-card__cta-arrow">→</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.task-card {
  display: flex;
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: transform 0.2s ease;

  &--overdue {
    background: var(--color-overdue-bg);
    border-radius: 0;
    box-shadow: none;
    border-bottom: 1px solid var(--color-border);
  }

  &--near-expiry {
    background: var(--color-near-expiry-bg);
    border-radius: 0;
    box-shadow: none;
    border-bottom: 1px solid var(--color-border);
  }

  /* ========== 左侧状态竖线 ========== */
  &__indicator {
    width: 4px;
    flex-shrink: 0;

    &--overdue {
      background: var(--color-rose);
    }

    &--near-expiry {
      background: var(--color-honey);
    }
  }

  /* ========== 主体 ========== */
  &__body {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  /* ========== 上排：标题 + 星级 ========== */
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  &__title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ========== 中排：徽章 + 截止时间 ========== */
  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  &__deadline {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);

    &--overdue {
      color: var(--color-rose);
      font-weight: var(--font-weight-small);
    }

    &--near-expiry {
      color: var(--color-accent);
      font-weight: var(--font-weight-small);
    }
  }

  /* ========== 下排：执行人 + CTA ========== */
  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__assignee {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__avatar {
    width: 22px;
    height: 22px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
  }

  &__avatar-text {
    font-size: 10px;
    color: var(--color-white);
  }

  &__assignee-name {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  /* ========== CTA 按钮 ========== */
  &__cta {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-md);
    background: var(--color-accent);
    border-radius: var(--radius-lg);
    flex-shrink: 0;
  }

  &__cta-text {
    font-size: var(--font-size-caption);
    color: var(--color-white);
    font-weight: var(--font-weight-small);
  }

  &__cta-arrow {
    font-size: var(--font-size-caption);
    color: var(--color-white);
  }
}
</style>
