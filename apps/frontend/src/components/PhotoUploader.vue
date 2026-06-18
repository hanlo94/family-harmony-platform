<script setup lang="ts">
/**
 * PhotoUploader — 照片上传组件
 *
 * 可复用的照片选择与上传组件，用于：
 * - 标记完成表单中的照片上传
 * - 重新提交表单中的照片上传
 *
 * 流程：选择照片 → 上传到服务器 → 返回 URL
 *
 * Props:
 *   modelValue  — 照片 URL（v-model 双向绑定），空字符串表示未上传
 *   label       — 标签文字
 *   maxCount    — 最多上传张数，默认 1
 *   disabled    — 是否禁用
 *
 * 设计参考: docs/ui-design.md §4.2
 */
import { ref } from 'vue';
import { uploadImage } from '../api/upload';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    maxCount?: number;
    disabled?: boolean;
  }>(),
  {
    label: '📎 上传照片（选填，最多1张）',
    maxCount: 1,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/** 是否正在上传 */
const isUploading = ref(false);

/** 是否有照片 */
const hasPhoto = ref(!!props.modelValue);

/** 选择并上传照片 */
async function handleChoosePhoto(): Promise<void> {
  if (props.disabled || isUploading.value) return;

  try {
    const res = await uni.chooseImage({
      count: props.maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    });

    if (res.tempFilePaths && res.tempFilePaths.length > 0) {
      isUploading.value = true;
      uni.showLoading({ title: '上传中...' });

      const uploadResult = await uploadImage(res.tempFilePaths[0]!);
      uni.hideLoading();

      if (uploadResult.data?.url) {
        emit('update:modelValue', uploadResult.data.url);
        hasPhoto.value = true;
      } else {
        uni.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    }
  } catch {
    // 用户取消选择，静默处理
  } finally {
    isUploading.value = false;
  }
}

/** 移除照片 */
function handleRemove(): void {
  emit('update:modelValue', '');
  hasPhoto.value = false;
}

/** 预览照片 */
function handlePreview(): void {
  if (props.modelValue) {
    uni.previewImage({ urls: [props.modelValue] });
  }
}
</script>

<template>
  <view class="photo-uploader">
    <text class="photo-uploader__label">{{ label }}</text>

    <!-- 未选择照片：上传按钮 -->
    <view
      v-if="!modelValue"
      class="photo-uploader__btn"
      :class="{ 'photo-uploader__btn--disabled': disabled || isUploading }"
      @tap="handleChoosePhoto"
    >
      <text class="photo-uploader__icon">
        {{ isUploading ? '⏳' : '+' }}
      </text>
      <text class="photo-uploader__text">
        {{ isUploading ? '上传中...' : '选择照片' }}
      </text>
    </view>

    <!-- 已选择照片：预览 -->
    <view v-else class="photo-uploader__preview">
      <image
        :src="modelValue"
        class="photo-uploader__img"
        mode="aspectFill"
        @tap="handlePreview"
      />
      <view
        v-if="!disabled"
        class="photo-uploader__remove"
        @tap="handleRemove"
      >
        <text class="photo-uploader__remove-text">✕</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.photo-uploader {
  &__label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: var(--space-sm);
  }

  &__btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    width: 100px;
    height: 100px;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);

    &--disabled {
      opacity: 0.5;
    }
  }

  &__icon {
    font-size: 28px;
    color: var(--color-text-secondary);
    line-height: 1;
  }

  &__text {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  &__preview {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  &__img {
    width: 100%;
    height: 100%;
  }

  &__remove {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 22px;
    height: 22px;
    border-radius: var(--radius-full);
    background: var(--color-rose);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__remove-text {
    font-size: 12px;
    color: var(--color-white);
    line-height: 1;
  }
}
</style>
