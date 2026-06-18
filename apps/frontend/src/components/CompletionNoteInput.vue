<script setup lang="ts">
/**
 * CompletionNoteInput — 完成备注输入组件
 *
 * 可复用的备注文本输入框，用于：
 * - 标记完成表单中的备注输入
 * - 重新提交表单中的备注输入
 *
 * Props:
 *   modelValue    — 备注文本（v-model 双向绑定）
 *   label         — 标签文字，默认"填写备注（选填）"
 *   placeholder   — 占位文字
 *   maxlength     — 最大字符数，默认 300
 *   required      — 是否必填，默认 false
 *
 * 设计参考: docs/ui-design.md §4.2
 */
const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    maxlength?: number;
    required?: boolean;
  }>(),
  {
    label: '填写备注（选填）',
    placeholder: '例如：已用洗洁精认真洗了三遍...',
    maxlength: 300,
    required: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/** 当前字符数 */
const charCount = computed(() => props.modelValue.length);
</script>

<template>
  <view class="note-input">
    <view class="note-input__header">
      <text class="note-input__label">
        {{ label }}
        <text v-if="required" class="note-input__required">*</text>
      </text>
      <text
        v-if="charCount > 0"
        class="note-input__count"
        :class="{ 'note-input__count--limit': charCount >= maxlength }"
      >
        {{ charCount }}/{{ maxlength }}
      </text>
    </view>
    <textarea
      :value="modelValue"
      class="note-input__textarea"
      :placeholder="placeholder"
      :maxlength="maxlength"
      placeholder-class="note-input__placeholder"
      :auto-height="true"
      @input="(e: any) => emit('update:modelValue', e.detail?.value || '')"
    />
  </view>
</template>

<style lang="scss" scoped>
.note-input {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-sm);
  }

  &__label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  &__required {
    color: var(--color-rose);
  }

  &__count {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);

    &--limit {
      color: var(--color-rose);
    }
  }

  &__textarea {
    width: 100%;
    padding: var(--space-md);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    font-size: var(--font-size-body);
    color: var(--color-text);
    border: 2px solid transparent;
    min-height: 72px;
    box-sizing: border-box;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &__placeholder {
    color: var(--color-text-secondary);
    opacity: 0.5;
  }
}
</style>
