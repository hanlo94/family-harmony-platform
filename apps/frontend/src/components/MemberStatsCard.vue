<script setup lang="ts">
/**
 * MemberStatsCard — 轻量统计区
 *
 * 展示每个家庭成员的"当前待办数"和"本周完成数"，
 * 用进度条（比例尺为家庭总数）避免制造竞争感。
 *
 * Props:
 *   stats — FamilyStatsResponse | null
 *
 * 设计参考: docs/ui-design.md §4.5
 */
import { computed } from 'vue';
import type { components } from '../types/api';

type FamilyStatsResponse = components['schemas']['FamilyStatsResponse'];

const props = defineProps<{
  stats: FamilyStatsResponse | null;
}>();

/** 计算进度条的最大值：取所有成员中待办+完成的最大值，作为比例尺基准 */
const maxValue = computed(() => {
  if (!props.stats?.members?.length) return 1;
  let max = 0;
  for (const m of props.stats.members) {
    const total = (m.pendingCount || 0) + (m.weeklyCompletedCount || 0);
    if (total > max) max = total;
  }
  return max || 1;
});

/** 计算每个成员的进度条宽度百分比 */
function barWidth(member: NonNullable<FamilyStatsResponse['members']>[number]): string {
  const total = (member.pendingCount || 0) + (member.weeklyCompletedCount || 0);
  return `${Math.round((total / maxValue.value) * 100)}%`;
}

/** 计算已完成的百分比（绿色部分） */
function completedWidth(member: NonNullable<FamilyStatsResponse['members']>[number]): string {
  const total = (member.pendingCount || 0) + (member.weeklyCompletedCount || 0);
  if (total === 0) return '0%';
  return `${Math.round(((member.weeklyCompletedCount || 0) / total) * 100)}%`;
}

/** 默认头像：根据昵称首字生成 */
function avatarText(nickname?: string): string {
  return nickname?.charAt(0) || '👤';
}
</script>

<template>
  <view v-if="stats?.members?.length" class="stats-card">
    <!-- 标题栏 -->
    <view class="stats-card__header">
      <text class="stats-card__icon">📊</text>
      <text class="stats-card__title">本周家庭贡献</text>
    </view>

    <!-- 成员统计行 -->
    <view class="stats-card__list">
      <view
        v-for="member in stats.members"
        :key="member.userId"
        class="stats-card__item"
      >
        <!-- 成员信息行 -->
        <view class="stats-card__member-row">
          <view class="stats-card__avatar">
            <image
              v-if="member.avatarUrl"
              :src="member.avatarUrl"
              class="stats-card__avatar-img"
              mode="aspectFill"
            />
            <text v-else class="stats-card__avatar-text">
              {{ avatarText(member.nickname) }}
            </text>
          </view>
          <text class="stats-card__nickname">{{ member.nickname }}</text>
          <view class="stats-card__numbers">
            <text class="stats-card__pending">待办 {{ member.pendingCount || 0 }} 件</text>
            <text class="stats-card__completed">本周完成 {{ member.weeklyCompletedCount || 0 }} 件</text>
          </view>
        </view>

        <!-- 进度条 -->
        <view class="stats-card__bar-track">
          <view
            class="stats-card__bar-fill"
            :style="{ width: barWidth(member) }"
          >
            <view
              class="stats-card__bar-completed"
              :style="{ width: completedWidth(member) }"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <text class="stats-card__hint">不显示排名，只看贡献</text>
  </view>
</template>

<style lang="scss" scoped>
.stats-card {
  margin: var(--space-md) var(--space-lg);
  padding: var(--space-lg);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);

  /* ========== 标题栏 ========== */
  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  &__icon {
    font-size: 18px;
  }

  &__title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
  }

  /* ========== 成员列表 ========== */
  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  /* ========== 成员行 ========== */
  &__member-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &__avatar {
    width: 32px;
    height: 32px;
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
    font-size: var(--font-size-caption);
    color: var(--color-white);
    font-weight: var(--font-weight-small);
  }

  &__nickname {
    font-size: var(--font-size-caption);
    font-weight: 600;
    color: var(--color-text);
    flex-shrink: 0;
  }

  &__numbers {
    display: flex;
    gap: var(--space-md);
    margin-left: auto;
  }

  &__pending {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  &__completed {
    font-size: var(--font-size-small);
    color: var(--color-moss);
    font-weight: var(--font-weight-small);
  }

  /* ========== 进度条 ========== */
  &__bar-track {
    height: 6px;
    background: var(--color-border);
    border-radius: 3px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 3px;
    background: var(--color-accent);
    transition: width 0.5s ease;
    position: relative;
  }

  &__bar-completed {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--color-moss);
    border-radius: 3px 0 0 3px;
    transition: width 0.5s ease;
  }

  /* ========== 底部提示 ========== */
  &__hint {
    display: block;
    text-align: center;
    margin-top: var(--space-md);
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }
}
</style>
