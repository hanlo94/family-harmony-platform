<script setup lang="ts">
/**
 * 验收任务页 — 组织者专用
 *
 * 页面结构（自上而下）：
 * 1. 完成者信息 — "XXX 完成了「任务标题」"
 * 2. 完成照片 — 大图预览，点击可放大
 * 3. 完成备注 — 执行人填写的备注
 * 4. 完成时间
 * 5. 操作按钮 — 验收通过 + 驳回
 * 6. 驳回表单 — 驳回原因必填，点击驳回后展开
 *
 * 路由参数:
 *   id       — 任务 ID
 *   familyId — 家庭 ID
 *
 * 设计参考: docs/ui-design.md §4.4
 */
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useFamilyStore } from '../../stores/family';
import { getTaskDetail, verifyTask, rejectTask } from '../../api/task';
import type { components } from '../../types/api';
import AuthGuard from '../../components/AuthGuard.vue';
import { formatDateTime } from '../../utils/date';

type TaskDetail = components['schemas']['TaskDetail'];

// ========== Stores ==========

const familyStore = useFamilyStore();

// ========== 路由参数 ==========

const taskId = ref('');
const familyId = ref('');

// ========== State ==========

/** 任务详情数据 */
const task = ref<TaskDetail | null>(null);

/** 是否正在加载 */
const isLoading = ref(false);

/** 错误信息 */
const error = ref<string | null>(null);

/** 是否正在提交操作 */
const isActionLoading = ref(false);

/** 是否显示驳回表单 */
const showRejectForm = ref(false);

/** 驳回原因 */
const rejectionReason = ref('');

// ========== 计算属性 ==========

/** 完成者昵称 */
const completerName = computed(() => task.value?.assignedTo?.nickname || '成员');

/** 任务标题 */
const taskTitle = computed(() => task.value?.title || '');

/** 是否有完成照片 */
const hasPhoto = computed(() => !!task.value?.completionPhoto);

/** 是否有完成备注 */
const hasNote = computed(() => !!task.value?.completionNote?.trim());

/** 完成时间文本 */
const completedTimeText = computed(() => {
  if (!task.value?.completedAt) return '';
  return formatDateTime(task.value.completedAt);
});

/** 是否为可验收状态 */
const canVerify = computed(
  () => task.value?.status === 'PENDING_VERIFICATION',
);

// ========== 数据加载 ==========

/** 加载任务详情 */
async function loadTaskDetail(): Promise<void> {
  if (!familyId.value || !taskId.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const result = await getTaskDetail(familyId.value, taskId.value);
    if (result.data) {
      task.value = result.data as TaskDetail;
    } else if (result.error) {
      error.value = result.error.message || '加载失败';
    }
  } catch {
    error.value = '网络异常，请重试';
  } finally {
    isLoading.value = false;
  }
}

// ========== 操作方法 ==========

/** 预览完成照片（全屏） */
function handlePreviewPhoto(): void {
  if (task.value?.completionPhoto) {
    uni.previewImage({ urls: [task.value.completionPhoto] });
  }
}

/** 验收通过 */
async function handleVerify(): Promise<void> {
  if (!familyId.value || !taskId.value || isActionLoading.value) return;

  // 二次确认
  const confirmResult = await uni.showModal({
    title: '确认验收',
    content: `确认「${taskTitle.value}」已完成并通过验收？`,
    confirmText: '确认通过',
    cancelText: '再想想',
  });

  if (!confirmResult.confirm) return;

  isActionLoading.value = true;
  try {
    const result = await verifyTask(familyId.value, taskId.value);

    if (result.data) {
      uni.showToast({ title: '验收通过 ✅', icon: 'success' });
      // 延迟返回，让用户看到 Toast
      setTimeout(() => {
        uni.navigateBack();
      }, 800);
    } else {
      uni.showToast({
        title: result.error?.message || '操作失败',
        icon: 'none',
      });
    }
  } catch {
    uni.showToast({ title: '网络异常，请重试', icon: 'none' });
  } finally {
    isActionLoading.value = false;
  }
}

/** 驳回任务 */
async function handleReject(): Promise<void> {
  if (!rejectionReason.value.trim()) {
    uni.showToast({ title: '请填写驳回原因', icon: 'none' });
    return;
  }

  if (!familyId.value || !taskId.value || isActionLoading.value) return;

  isActionLoading.value = true;
  try {
    const result = await rejectTask(
      familyId.value,
      taskId.value,
      rejectionReason.value.trim(),
    );

    if (result.data) {
      uni.showToast({ title: '已驳回', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack();
      }, 800);
    } else {
      uni.showToast({
        title: result.error?.message || '操作失败',
        icon: 'none',
      });
    }
  } catch {
    uni.showToast({ title: '网络异常，请重试', icon: 'none' });
  } finally {
    isActionLoading.value = false;
  }
}

/** 返回上一页 */
function goBack(): void {
  uni.navigateBack();
}

/** 切换驳回表单 */
function toggleRejectForm(): void {
  showRejectForm.value = !showRejectForm.value;
  if (!showRejectForm.value) {
    rejectionReason.value = '';
  }
}

// ========== 生命周期 ==========

onLoad((options?: Record<string, string>) => {
  if (options) {
    taskId.value = options.id || '';
    familyId.value = options.familyId || '';
  }
});

onMounted(async () => {
  // 确保 family store 已初始化
  if (!familyStore.isInitialized) {
    await familyStore.loadFamilies();
  }

  if (familyId.value) {
    // 加载成员信息（用于角色判断）
    if (familyStore.members.length === 0) {
      await familyStore.loadMembers(familyId.value);
    }
    await loadTaskDetail();
  }
});
</script>

<template>
  <AuthGuard>
    <view class="verify-page">
      <!-- ========== 加载中 ========== -->
      <view v-if="isLoading" class="verify-page__center">
        <view class="verify-page__spinner" />
        <text class="verify-page__center-text">加载中...</text>
      </view>

      <!-- ========== 错误状态 ========== -->
      <view v-else-if="error" class="verify-page__center">
        <text class="verify-page__center-icon">😵</text>
        <text class="verify-page__center-text">{{ error }}</text>
        <view class="verify-page__retry-btn" @tap="loadTaskDetail">
          <text class="verify-page__retry-text">点击重试</text>
        </view>
      </view>

      <!-- ========== 非待验收状态提示 ========== -->
      <view v-else-if="!canVerify && task" class="verify-page__center">
        <text class="verify-page__center-icon">
          {{ task.status === 'COMPLETED' ? '✅' : '📋' }}
        </text>
        <text class="verify-page__center-text">
          {{ task.status === 'COMPLETED' ? '该任务已验收通过' : '该任务当前状态不可验收' }}
        </text>
        <view class="verify-page__retry-btn" @tap="goBack">
          <text class="verify-page__retry-text">返回</text>
        </view>
      </view>

      <!-- ========== 验收内容 ========== -->
      <template v-else-if="task">
        <!-- 完成者信息 -->
        <view class="verify-page__header">
          <view class="verify-page__completer-avatar">
            <image
              v-if="task.assignedTo?.avatarUrl"
              :src="task.assignedTo.avatarUrl"
              class="verify-page__completer-avatar-img"
              mode="aspectFill"
            />
            <text v-else class="verify-page__completer-avatar-text">
              {{ completerName.charAt(0) }}
            </text>
          </view>
          <text class="verify-page__header-text">
            <text class="verify-page__header-name">{{ completerName }}</text>
            完成了
          </text>
          <text class="verify-page__header-task">「{{ taskTitle }}」</text>
        </view>

        <!-- 完成照片（核心展示区） -->
        <view class="verify-page__card">
          <text class="verify-page__section-title">🖼️ 完成照片</text>

          <view v-if="hasPhoto" class="verify-page__photo-area">
            <image
              :src="task.completionPhoto!"
              class="verify-page__photo"
              mode="widthFix"
              @tap="handlePreviewPhoto"
            />
            <view class="verify-page__photo-hint">
              <text class="verify-page__photo-hint-text">点击图片可放大查看</text>
            </view>
          </view>

          <!-- 无照片 -->
          <view v-else class="verify-page__no-photo">
            <text class="verify-page__no-photo-icon">📷</text>
            <text class="verify-page__no-photo-text">未上传完成照片</text>
          </view>
        </view>

        <!-- 完成备注 -->
        <view v-if="hasNote" class="verify-page__card">
          <text class="verify-page__section-title">📝 完成备注</text>
          <view class="verify-page__note-box">
            <text class="verify-page__note-text">{{ task.completionNote }}</text>
          </view>
        </view>

        <!-- 完成时间 -->
        <view class="verify-page__card">
          <text class="verify-page__section-title">⏰ 完成时间</text>
          <text class="verify-page__info-text">{{ completedTimeText }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="verify-page__actions">
          <!-- 验收通过按钮 -->
          <button
            class="verify-page__btn verify-page__btn--pass"
            :disabled="isActionLoading || showRejectForm"
            @tap="handleVerify"
          >
            <text class="verify-page__btn-text">✓ 验收通过</text>
          </button>

          <!-- 驳回按钮 -->
          <button
            v-if="!showRejectForm"
            class="verify-page__btn verify-page__btn--reject-outline"
            :disabled="isActionLoading"
            @tap="toggleRejectForm"
          >
            <text class="verify-page__btn-text--reject">✗ 驳回</text>
          </button>
        </view>

        <!-- 驳回表单 -->
        <view v-if="showRejectForm" class="verify-page__card verify-page__reject-form">
          <text class="verify-page__reject-title">驳回任务</text>
          <text class="verify-page__reject-desc">
            请填写驳回原因，帮助执行人了解需要如何改进
          </text>

          <textarea
            v-model="rejectionReason"
            class="verify-page__textarea"
            placeholder="例如：碗没洗干净，请重新洗..."
            :maxlength="300"
            placeholder-class="verify-page__placeholder"
            :auto-height="true"
          />

          <view class="verify-page__reject-actions">
            <button
              class="verify-page__btn verify-page__btn--secondary"
              @tap="toggleRejectForm"
            >
              <text class="verify-page__btn-text--secondary">取消</text>
            </button>
            <button
              class="verify-page__btn verify-page__btn--reject"
              :disabled="isActionLoading || !rejectionReason.trim()"
              @tap="handleReject"
            >
              <text class="verify-page__btn-text">
                {{ isActionLoading ? '提交中...' : '确认驳回' }}
              </text>
            </button>
          </view>
        </view>
      </template>
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.verify-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-lg);
  padding-bottom: calc(env(safe-area-inset-bottom) + var(--space-2xl));

  /* ========== 居中状态（加载/错误） ========== */
  &__center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: var(--space-md);
    text-align: center;
  }

  &__center-icon {
    font-size: 48px;
  }

  &__center-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: var(--radius-full);
    animation: verify-spin 0.8s linear infinite;
  }

  &__retry-btn {
    padding: var(--space-sm) var(--space-xl);
    background: var(--color-primary);
    border-radius: var(--radius-lg);
  }

  &__retry-text {
    font-size: var(--font-size-caption);
    color: var(--color-white);
    font-weight: var(--font-weight-small);
  }

  /* ========== 头部：完成者信息 ========== */
  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-xl) 0;
    gap: var(--space-sm);
  }

  &__completer-avatar {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: var(--space-xs);
  }

  &__completer-avatar-img {
    width: 100%;
    height: 100%;
  }

  &__completer-avatar-text {
    font-size: 22px;
    color: var(--color-white);
    font-weight: 600;
  }

  &__header-text {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
  }

  &__header-name {
    font-weight: 600;
    color: var(--color-text);
  }

  &__header-task {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
    text-align: center;
  }

  /* ========== 卡片通用 ========== */
  &__card {
    background: var(--color-white);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    box-shadow: var(--shadow-card);
    margin-bottom: var(--space-md);
  }

  &__section-title {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: var(--space-md);
  }

  &__info-text {
    font-size: var(--font-size-body);
    color: var(--color-text);
  }

  /* ========== 照片展示区 ========== */
  &__photo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__photo {
    width: 100%;
    max-width: 320px;
    border-radius: var(--radius-md);
  }

  &__photo-hint {
    margin-top: var(--space-sm);
  }

  &__photo-hint-text {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  &__no-photo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xl) 0;
    background: var(--color-bg);
    border-radius: var(--radius-md);
  }

  &__no-photo-icon {
    font-size: 32px;
  }

  &__no-photo-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  /* ========== 完成备注 ========== */
  &__note-box {
    background: rgba(140, 184, 159, 0.08);
    padding: var(--space-md);
    border-radius: var(--radius-sm);
  }

  &__note-text {
    font-size: var(--font-size-body);
    color: var(--color-text);
    line-height: 1.6;
  }

  /* ========== 操作按钮区域 ========== */
  &__actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-top: var(--space-xl);
  }

  &__btn {
    width: 100%;
    min-height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;

    &:active {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.4;
    }

    /* 验收通过 */
    &--pass {
      background: var(--color-moss);
    }

    /* 驳回确认 */
    &--reject {
      background: var(--color-rose);
      flex: 1;
    }

    /* 驳回轮廓按钮 */
    &--reject-outline {
      background: var(--color-white);
      border: 2px solid var(--color-rose);
    }

    /* 次要按钮 */
    &--secondary {
      background: var(--color-bg);
      border: 2px solid var(--color-border);
      flex: 1;
    }
  }

  &__btn-text {
    font-size: var(--font-size-body);
    color: var(--color-white);
    font-weight: 600;
  }

  &__btn-text--reject {
    font-size: var(--font-size-body);
    color: var(--color-rose);
    font-weight: 600;
  }

  &__btn-text--secondary {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  /* ========== 驳回表单 ========== */
  &__reject-form {
    border: 1px solid rgba(232, 164, 160, 0.25);
  }

  &__reject-title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-rose);
    display: block;
    margin-bottom: var(--space-xs);
  }

  &__reject-desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: var(--space-md);
    line-height: 1.5;
  }

  &__textarea {
    width: 100%;
    padding: var(--space-md);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    font-size: var(--font-size-body);
    color: var(--color-text);
    border: 2px solid transparent;
    min-height: 80px;
    box-sizing: border-box;
    margin-bottom: var(--space-md);

    &:focus {
      border-color: var(--color-rose);
    }
  }

  &__placeholder {
    color: var(--color-text-secondary);
    opacity: 0.5;
  }

  &__reject-actions {
    display: flex;
    gap: var(--space-md);
  }
}

@keyframes verify-spin {
  to { transform: rotate(360deg); }
}
</style>
