<script setup lang="ts">
/**
 * DateTimePicker — 日期时间选择器
 *
 * 由于 uni-app 无原生 datetime 模式，拆分为日期选择 + 时间选择。
 * 内部维护 ISO 8601 格式的日期时间字符串。
 *
 * Props:
 *   modelValue — ISO 8601 日期时间字符串（如 2026-06-10T20:00:00Z）
 *
 * Emits:
 *   update:modelValue — 日期或时间变化时触发
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
  }>(),
  { modelValue: '' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/**
 * 将 ISO 字符串解析为日期部分 'YYYY-MM-DD' 和时间部分 'HH:mm'
 * 默认值：明天 20:00
 */
function getDefaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateStr(d);
}

function getDefaultTime(): string {
  return '20:00';
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 从 modelValue 提取日期部分 */
const dateValue = computed(() => {
  if (!props.modelValue) return getDefaultDate();
  try {
    const d = new Date(props.modelValue);
    if (isNaN(d.getTime())) return getDefaultDate();
    return formatDateStr(d);
  } catch {
    return getDefaultDate();
  }
});

/** 从 modelValue 提取时间部分 */
const timeValue = computed(() => {
  if (!props.modelValue) return getDefaultTime();
  try {
    const d = new Date(props.modelValue);
    if (isNaN(d.getTime())) return getDefaultTime();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return getDefaultTime();
  }
});

/** 日期部分显示文本 */
const dateDisplay = computed(() => {
  const [y, m, d] = dateValue.value.split('-');
  if (y && m && d) {
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
  }
  return dateValue.value;
});

/** 时间部分显示文本 */
const timeDisplay = computed(() => {
  const parts = timeValue.value.split(':');
  if (parts.length === 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeValue.value;
});

/** 完整显示文本 */
const fullDisplay = computed(() => `${dateDisplay.value} ${timeDisplay.value}`);

/** 日期选择变化 */
function handleDateChange(e: { detail: { value: string } }): void {
  emitUpdate(e.detail.value, timeValue.value);
}

/** 时间选择变化 */
function handleTimeChange(e: { detail: { value: string } }): void {
  emitUpdate(dateValue.value, e.detail.value);
}

/** 组合日期+时间，发出 ISO 字符串 */
function emitUpdate(dateStr: string, timeStr: string): void {
  const parts = timeStr.split(':');
  const h = parts[0] || '20';
  const m = parts[1] || '00';
  const d = new Date(`${dateStr}T${h}:${m}:00`);
  emit('update:modelValue', d.toISOString());
}
</script>

<template>
  <view class="date-time-picker">
    <!-- 日期选择 -->
    <picker
      class="date-time-picker__date"
      mode="date"
      :value="dateValue"
      :start="dateValue"
      @change="handleDateChange"
    >
      <view class="date-time-picker__trigger">
        <text class="date-time-picker__icon">📅</text>
        <text class="date-time-picker__value">{{ fullDisplay }}</text>
        <text class="date-time-picker__arrow">▼</text>
      </view>
    </picker>

    <!-- 时间选择（使用隐藏 picker + 日期时间并排显示） -->
    <picker
      class="date-time-picker__time"
      mode="time"
      :value="timeValue"
      @change="handleTimeChange"
    >
      <view class="date-time-picker__time-trigger">
        <text class="date-time-picker__time-icon">⏰</text>
        <text class="date-time-picker__time-value">{{ timeDisplay }}</text>
        <text class="date-time-picker__time-arrow">▼</text>
      </view>
    </picker>
  </view>
</template>

<style lang="scss" scoped>
.date-time-picker {
  display: flex;
  gap: var(--space-sm);

  &__date {
    flex: 1;
  }

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

  &__icon {
    font-size: 16px;
    line-height: 1;
  }

  &__value {
    flex: 1;
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--color-text);
  }

  &__arrow {
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  &__time {
    flex-shrink: 0;
  }

  &__time-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-md);
    background: var(--color-white);
    border-radius: var(--radius-md);
    border: 2px solid transparent;
    min-height: 44px;
    min-width: 100px;

    &:active {
      opacity: 0.8;
    }
  }

  &__time-icon {
    font-size: 14px;
    line-height: 1;
  }

  &__time-value {
    font-family: var(--font-display);
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--color-text);
  }

  &__time-arrow {
    font-size: 10px;
    color: var(--color-text-secondary);
  }
}
</style>
