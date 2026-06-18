<script setup lang="ts">
/**
 * TemplateSelector — 任务模板选择器（横向滑动）
 *
 * 展示常用模板卡片，横向滑动浏览。
 * 点击模板卡片后自动预填表单字段。
 * 用户可跳过模板选择直接手动创建。
 *
 * Props:
 *   templates — 模板列表（TaskTemplateItem[]）
 *   loading   — 是否正在加载模板
 *
 * Emits:
 *   select    — 选中模板时触发，传递模板对象
 *   skip      — 用户点击"跳过模板"时触发
 */
import type { components } from '../types/api';

type TaskTemplateItem = components['schemas']['TaskTemplateItem'];

defineProps<{
  templates: TaskTemplateItem[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [template: TaskTemplateItem];
  skip: [];
}>();

/** 分类 emoji 映射 */
const CATEGORY_ICONS: Record<string, string> = {
  '厨房': '🍽️',
  '清洁': '🧹',
  '洗衣': '👔',
  '其他': '📋',
};

function getCategoryIcon(category?: string): string {
  return CATEGORY_ICONS[category || ''] || '📋';
}

/** 重复规则简写 */
const REPEAT_LABELS: Record<string, string> = {
  NONE: '不重复',
  DAILY: '每天',
  WEEKLY: '每周',
};

function getRepeatLabel(rule?: string): string {
  return REPEAT_LABELS[rule || ''] || '不重复';
}
</script>

<template>
  <view class="template-selector">
    <!-- 标题行 -->
    <view class="template-selector__header">
      <text class="template-selector__title">从模板选择</text>
      <text class="template-selector__skip" @tap="emit('skip')">跳过 ›</text>
    </view>

    <!-- 模板卡片横向滚动 -->
    <scroll-view
      class="template-selector__scroll"
      scroll-x
      :show-scrollbar="false"
      :enhanced="true"
    >
      <view class="template-selector__list">
        <!-- 加载中 -->
        <view v-if="loading" class="template-selector__loading">
          <text class="template-selector__loading-text">加载模板...</text>
        </view>

        <!-- 模板卡片 -->
        <view
          v-for="template in templates"
          :key="template.id"
          class="template-selector__card"
          @tap="emit('select', template)"
        >
          <text class="template-selector__card-icon">
            {{ getCategoryIcon(template.category) }}
          </text>
          <text class="template-selector__card-title">{{ template.title }}</text>
          <view class="template-selector__card-meta">
            <text class="template-selector__card-difficulty">
              {{ '⭐'.repeat(template.difficulty || 1) }}
            </text>
            <text class="template-selector__card-repeat">
              {{ getRepeatLabel(template.suggestedRepeatRule) }}
            </text>
          </view>
          <text
            v-if="template.needsVerification"
            class="template-selector__card-verify"
          >
            🔍 需验收
          </text>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && templates.length === 0" class="template-selector__empty">
          <text class="template-selector__empty-text">暂无可用模板</text>
        </view>
      </view>
    </scroll-view>

    <!-- 手动创建提示 -->
    <view class="template-selector__or">
      <text class="template-selector__or-line"></text>
      <text class="template-selector__or-text">或</text>
      <text class="template-selector__or-line"></text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.template-selector {
  margin-bottom: var(--space-lg);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--space-xs) var(--space-sm);
  }

  &__title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
  }

  &__skip {
    font-size: var(--font-size-caption);
    color: var(--color-primary);
    font-weight: 500;

    &:active {
      opacity: 0.6;
    }
  }

  &__scroll {
    white-space: nowrap;
  }

  &__list {
    display: flex;
    gap: var(--space-md);
    padding: var(--space-xs) var(--space-xs) var(--space-sm);
  }

  &__loading {
    padding: var(--space-xl) var(--space-lg);
  }

  &__loading-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-md);
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    min-width: 100px;
    white-space: normal;
    text-align: center;

    &:active {
      opacity: 0.8;
      transform: scale(0.96);
      transition: transform 0.15s ease;
    }
  }

  &__card-icon {
    font-size: 28px;
    line-height: 1;
  }

  &__card-title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
  }

  &__card-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  &__card-difficulty {
    font-size: 10px;
    letter-spacing: 1px;
  }

  &__card-repeat {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    background: var(--color-surface);
    padding: 1px var(--space-sm);
    border-radius: var(--radius-sm);
  }

  &__card-verify {
    font-size: 10px;
    color: var(--color-primary);
    background: rgba(61, 107, 90, 0.08);
    padding: 1px var(--space-sm);
    border-radius: var(--radius-sm);
  }

  &__empty {
    padding: var(--space-lg);
  }

  &__empty-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  /* ===== "或" 分割线 ===== */
  &__or {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) 0;
  }

  &__or-line {
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  &__or-text {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }
}
</style>
