<script setup lang="ts">
/**
 * JoinForm — 加入家庭表单
 *
 * 输入邀请码加入家庭，支持 URL 参数预填邀请码。
 *
 * Props:
 *   loading — 是否正在提交
 *
 * Events:
 *   submit — 提交邀请码时触发，传递 code
 *
 * 设计参考: docs/ui-design.md §4.5 加入家庭页
 */
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [code: string];
}>();

/** 邀请码输入值 */
const code = ref('');

/** 输入框最大长度 */
const CODE_MAX_LENGTH = 6;

/** 从 URL 参数读取邀请码（如 /pages/family/join?code=ABC123） */
onMounted(() => {
  // 尝试从页面参数获取预填邀请码
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as { options?: Record<string, string> }).options;
  if (options?.code) {
    code.value = options.code.toUpperCase();
  }
});

onLoad((options) => {
  if (options?.code) {
    code.value = (options.code as string).toUpperCase();
  }
});

/** 提交 */
function handleSubmit(): void {
  const trimmed = code.value.trim().toUpperCase();
  if (!trimmed) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' });
    return;
  }
  if (trimmed.length < 4) {
    uni.showToast({ title: '邀请码格式不正确', icon: 'none' });
    return;
  }
  emit('submit', trimmed);
}

/** 限制输入长度并转大写（uni-app input 事件类型兼容处理） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onInput(e: any): void {
  code.value = (e.detail?.value || '').toUpperCase().slice(0, CODE_MAX_LENGTH);
}
</script>

<template>
  <view class="join-form">
    <!-- 图标 -->
    <view class="join-form__icon-area">
      <text class="join-form__icon">🏠</text>
    </view>

    <!-- 标题 -->
    <text class="join-form__title">加入家庭</text>
    <text class="join-form__desc">
      输入家人分享的邀请码，即可加入他们的家庭
    </text>

    <!-- 邀请码输入 -->
    <view class="join-form__input-group">
      <text class="join-form__label">邀请码</text>
      <input
        class="join-form__input"
        :value="code"
        :maxlength="CODE_MAX_LENGTH"
        placeholder="请输入6位邀请码"
        placeholder-class="join-form__placeholder"
        @input="onInput"
      />
    </view>

    <!-- 提交按钮 -->
    <button
      class="join-form__submit-btn"
      :disabled="loading || !code.trim()"
      @click="handleSubmit"
    >
      <text v-if="loading" class="join-form__submit-text">加入中...</text>
      <text v-else class="join-form__submit-text">加入家庭</text>
    </button>

    <!-- 提示 -->
    <text class="join-form__tip">
      没有邀请码？请联系已在家庭中的家人获取
    </text>
  </view>
</template>

<style lang="scss" scoped>
.join-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2xl) var(--space-lg);
  margin: var(--space-lg);
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);

  /* ========== 图标区 ========== */
  &__icon-area {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-full);
    background: var(--color-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-md);
  }

  &__icon {
    font-size: 36px;
  }

  /* ========== 标题 ========== */
  &__title {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-h1);
    color: var(--color-text);
    margin-bottom: var(--space-sm);
  }

  &__desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    text-align: center;
    margin-bottom: var(--space-xl);
    line-height: 1.5;
  }

  /* ========== 输入组 ========== */
  &__input-group {
    width: 100%;
    margin-bottom: var(--space-xl);
  }

  &__label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-sm);
  }

  &__input {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 4px;
    text-align: center;
    margin-top: var(--space-xs);
    border: 2px solid transparent;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &__placeholder {
    font-family: var(--font-body);
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-body);
    color: var(--color-border);
    letter-spacing: 0;
  }

  /* ========== 提交按钮 ========== */
  &__submit-btn {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: var(--color-primary);
    border-radius: var(--radius-lg);

    &:active {
      opacity: 0.9;
    }

    &[disabled] {
      opacity: 0.4;
    }
  }

  &__submit-text {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-white);
  }

  /* ========== 底部提示 ========== */
  &__tip {
    margin-top: var(--space-xl);
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    text-align: center;
  }
}
</style>
