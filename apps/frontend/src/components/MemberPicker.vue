<script setup lang="ts">
/**
 * MemberPicker — 家庭成员下拉选择器
 *
 * 使用 uni-app 原生 picker 组件展示家庭成员列表。
 * 选中项显示头像（emoji 占位）+ 昵称 + 角色标签。
 *
 * Props:
 *   members    — 家庭成员列表（MemberDetail[]）
 *   modelValue — 当前选中的成员 user ID
 *
 * Emits:
 *   update:modelValue — 选中成员变化时触发
 */
import { computed } from 'vue';
import type { components } from '../types/api';

type MemberDetail = components['schemas']['MemberDetail'];

const props = withDefaults(
  defineProps<{
    members: MemberDetail[];
    modelValue?: string;
  }>(),
  { modelValue: '' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/** picker 选项：只显示昵称+角色简称 */
const pickerRange = computed(() =>
  props.members.map((m) => `${m.nickname}  [${ROLE_LABEL[m.role || 'MEMBER']}]`),
);

/** 当前选中的成员信息 */
const selectedMember = computed(() =>
  props.members.find((m) => m.userId === props.modelValue),
);

/** 角色中文标签 */
const ROLE_LABEL: Record<string, string> = {
  ORGANIZER: '组织者',
  MEMBER: '成员',
  CHILD: '孩子',
};

/** picker 值变化 */
function handleChange(e: { detail: { value: number } }): void {
  const index = e.detail.value;
  const member = props.members[index];
  if (member?.userId) {
    emit('update:modelValue', member.userId);
  }
}
</script>

<template>
  <picker
    class="member-picker"
    mode="selector"
    :range="pickerRange"
    :value="members.findIndex((m) => m.userId === modelValue)"
    @change="handleChange"
  >
    <view class="member-picker__trigger">
      <template v-if="selectedMember">
        <text class="member-picker__avatar">👤</text>
        <text class="member-picker__name">{{ selectedMember.nickname }}</text>
        <text
          class="member-picker__role"
          :class="{
            'member-picker__role--organizer': selectedMember.role === 'ORGANIZER',
            'member-picker__role--child': selectedMember.role === 'CHILD',
          }"
        >
          {{ ROLE_LABEL[selectedMember.role || 'MEMBER'] }}
        </text>
      </template>
      <template v-else>
        <text class="member-picker__placeholder">选择家庭成员</text>
      </template>
      <text class="member-picker__arrow">▼</text>
    </view>
  </picker>
</template>

<style lang="scss" scoped>
.member-picker {
  &__trigger {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: var(--color-white);
    border-radius: var(--radius-md);
    border: 2px solid transparent;
    min-height: 44px;

    &:active {
      opacity: 0.8;
    }
  }

  &__avatar {
    font-size: 18px;
    line-height: 1;
  }

  &__name {
    flex: 1;
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--color-text);
  }

  &__role {
    font-size: var(--font-size-small);
    padding: 2px var(--space-sm);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-weight: 500;

    &--organizer {
      background: rgba(61, 107, 90, 0.1);
      color: var(--color-primary);
    }

    &--child {
      background: rgba(244, 211, 94, 0.15);
      color: #b8941e;
    }
  }

  &__placeholder {
    flex: 1;
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
  }

  &__arrow {
    font-size: 11px;
    color: var(--color-text-secondary);
  }
}
</style>
