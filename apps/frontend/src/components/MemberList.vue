<script setup lang="ts">
/**
 * MemberList — 家庭成员列表
 *
 * 展示成员头像、昵称、角色标签（ORGANIZER / MEMBER / CHILD），
 * 组织者可移除其他成员。
 *
 * Props:
 *   members    — MemberDetail[]
 *   isOrganizer — 当前用户是否为组织者
 *
 * Events:
 *   remove — 点击移除按钮时触发，传递 memberId
 *
 * 设计参考: docs/ui-design.md §4.5
 */
import { ref } from 'vue';
import type { components } from '../types/api';

type MemberDetail = components['schemas']['MemberDetail'];

defineProps<{
  members: MemberDetail[];
  isOrganizer: boolean;
}>();

const emit = defineEmits<{
  remove: [memberId: string];
}>();

/** 正在移除的成员 ID（用于 loading 态） */
const removingId = ref<string | null>(null);

/** 角色标签配置 */
const ROLE_CONFIG: Record<string, { label: string; class: string }> = {
  ORGANIZER: { label: '组织者', class: 'member-list__tag--organizer' },
  MEMBER: { label: '成员', class: 'member-list__tag--member' },
  CHILD: { label: '孩子', class: 'member-list__tag--child' },
};

/** 格式化加入时间 */
function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日加入`;
}

/** 确认移除成员 */
function handleRemove(memberId: string): void {
  uni.showModal({
    title: '移除成员',
    content: '确定要将该成员移除出家庭吗？此操作不可撤销。',
    confirmText: '移除',
    confirmColor: '#E8A4A0',
    success: (res) => {
      if (res.confirm) {
        removingId.value = memberId;
        emit('remove', memberId);
      }
    },
  });
}

/** 清除移除状态（由父组件在操作完成后调用） */
function clearRemoving(): void {
  removingId.value = null;
}

defineExpose({ clearRemoving });
</script>

<template>
  <view class="member-list">
    <!-- 标题 -->
    <view class="member-list__header">
      <text class="member-list__title">
        家庭成员（{{ members.length }}人）
      </text>
    </view>

    <!-- 空状态 -->
    <view v-if="!members.length" class="member-list__empty">
      <text class="member-list__empty-text">暂无成员</text>
    </view>

    <!-- 成员列表 -->
    <view v-else class="member-list__items">
      <view
        v-for="member in members"
        :key="member.id"
        class="member-list__item"
      >
        <!-- 头像 -->
        <view class="member-list__avatar">
          <image
            v-if="member.avatarUrl"
            :src="member.avatarUrl"
            class="member-list__avatar-img"
            mode="aspectFill"
          />
          <text v-else class="member-list__avatar-text">
            {{ member.nickname?.charAt(0) || '?' }}
          </text>
        </view>

        <!-- 信息 -->
        <view class="member-list__info">
          <view class="member-list__name-row">
            <text class="member-list__nickname">{{ member.nickname }}</text>
            <text
              :class="['member-list__tag', ROLE_CONFIG[member.role || 'MEMBER']?.class]"
            >
              {{ ROLE_CONFIG[member.role || 'MEMBER']?.label || member.role }}
            </text>
          </view>
          <text class="member-list__join-date">{{ formatJoinDate(member.joinedAt) }}</text>
        </view>

        <!-- 移除按钮（仅组织者可见，不可移除自己） -->
        <button
          v-if="isOrganizer && member.role !== 'ORGANIZER'"
          class="member-list__remove-btn"
          :disabled="removingId === member.id"
          @click="handleRemove(member.id!)"
        >
          <text v-if="removingId === member.id" class="member-list__remove-loading">...</text>
          <text v-else class="member-list__remove-text">移除</text>
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.member-list {
  margin: var(--space-md) var(--space-lg);

  /* ========== 标题 ========== */
  &__header {
    margin-bottom: var(--space-md);
  }

  &__title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
  }

  /* ========== 空状态 ========== */
  &__empty {
    padding: var(--space-2xl) 0;
    text-align: center;
  }

  &__empty-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  /* ========== 列表 ========== */
  &__items {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  &__item {
    display: flex;
    align-items: center;
    padding: var(--space-md);
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
  }

  /* ========== 头像 ========== */
  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    background: var(--color-surface);
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
    font-size: var(--font-size-body);
    color: var(--color-primary);
    font-weight: 600;
  }

  /* ========== 信息区 ========== */
  &__info {
    flex: 1;
    margin-left: var(--space-md);
    min-width: 0;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &__nickname {
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--color-text);
  }

  &__join-date {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  /* ========== 角色标签 ========== */
  &__tag {
    display: inline-block;
    padding: 2px var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-small);
    line-height: 1.4;

    &--organizer {
      background: #e8f0ec;
      color: var(--color-primary);
    }

    &--member {
      background: var(--color-surface);
      color: var(--color-text-secondary);
    }

    &--child {
      background: #fff8e8;
      color: var(--color-accent);
    }
  }

  /* ========== 移除按钮 ========== */
  &__remove-btn {
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-sm);
    background: transparent;
    border: 1px solid var(--color-rose);
    flex-shrink: 0;
    margin-left: var(--space-sm);
    line-height: 1.4;

    &:active {
      opacity: 0.7;
    }
  }

  &__remove-text {
    font-size: var(--font-size-small);
    color: var(--color-rose);
  }

  &__remove-loading {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }
}
</style>
