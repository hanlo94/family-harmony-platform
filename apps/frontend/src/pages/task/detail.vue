<script setup lang="ts">
/**
 * 任务详情页 — 任务信息展示、驳回原因、操作按钮
 *
 * 页面结构（自上而下）：
 * 1. 任务信息卡片 — 标题、难度、重复规则、验收标记、描述、截止时间、执行人、创建人、状态
 * 2. 完成信息区 — 完成备注、完成照片（COMPLETED 状态显示）
 * 3. 驳回原因区 — 驳回原因 + 驳回时间（REJECTED 状态显示）
 * 4. 操作按钮区 — 依角色和状态动态变化
 *    - PENDING_COMPLETION + 当前用户是执行人：标记完成（展开备注+照片）
 *    - PENDING_VERIFICATION + ORGANIZER：验收通过 + 驳回
 *    - REJECTED + 当前用户是执行人：重新提交
 *    - ORGANIZER 或 (MEMBER + 是创建者)：编辑 + 取消
 *
 * 设计参考: docs/ui-design.md §4.2
 */
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useFamilyStore } from '../../stores/family';
import { useAuthStore } from '../../stores/auth';
import {
  getTaskDetail,
  completeTask,
  verifyTask,
  rejectTask,
  cancelTask,
} from '../../api/task';
import type { components } from '../../types/api';
import AuthGuard from '../../components/AuthGuard.vue';
import StarRating from '../../components/StarRating.vue';
import RepeatBadge from '../../components/RepeatBadge.vue';
import VerificationBadge from '../../components/VerificationBadge.vue';
import CompletionNoteInput from '../../components/CompletionNoteInput.vue';
import PhotoUploader from '../../components/PhotoUploader.vue';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import { formatDateTime, formatRelativeDate, isOverdue, isNearExpiry } from '../../utils/date';

type TaskDetail = components['schemas']['TaskDetail'];

// ========== Stores ==========

const familyStore = useFamilyStore();
const authStore = useAuthStore();

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

/** 是否展开"标记完成"表单 */
const showCompleteForm = ref(false);

/** 是否展开"驳回"表单 */
const showRejectForm = ref(false);

/** 是否展开"取消"弹窗 */
const showCancelConfirm = ref(false);

/** 完成备注 */
const completionNote = ref('');

/** 完成照片 URL（上传后获取） */
const completionPhoto = ref('');

/** 驳回原因 */
const rejectionInput = ref('');

/** 取消原因 */
const cancelReason = ref('');

/** 是否正在提交操作 */
const isActionLoading = ref(false);

// ========== 计算属性 ==========

/** 当前用户角色 */
const currentRole = computed(() => familyStore.currentRole);

/** 是否为 ORGANIZER */
const isOrganizer = computed(() => currentRole.value === 'ORGANIZER');

/** 是否为 MEMBER */
const isMember = computed(() => currentRole.value === 'MEMBER');

/** 当前用户 ID */
const currentUserId = computed(() => authStore.user?.id || '');

/** 当前用户是否为任务执行人 */
const isAssignee = computed(() => {
  if (!task.value?.assignedTo?.id || !currentUserId.value) return false;
  return task.value.assignedTo.id === currentUserId.value;
});

/** 当前用户是否为任务创建者 */
const isCreator = computed(() => {
  if (!task.value?.createdBy?.id || !currentUserId.value) return false;
  return task.value.createdBy.id === currentUserId.value;
});

/** 当前用户是否可取消任务（ORGANIZER 或 MEMBER 创建者） */
const canCancel = computed(() => {
  if (!task.value) return false;
  if (isOrganizer.value) return true;
  if (isMember.value && isCreator.value) return true;
  return false;
});

/** 当前用户是否可编辑（仅 ORGANIZER） */
const canEdit = computed(() => isOrganizer.value);

/** 当前用户是否可标记完成（执行人 + PENDING_COMPLETION） */
const canComplete = computed(
  () => isAssignee.value && task.value?.status === 'PENDING_COMPLETION',
);

/** 当前用户是否可重新提交（执行人 + REJECTED） */
const canResubmit = computed(
  () => isAssignee.value && task.value?.status === 'REJECTED',
);

/** 当前用户是否可验收（ORGANIZER + PENDING_VERIFICATION） */
const canVerify = computed(
  () => isOrganizer.value && task.value?.status === 'PENDING_VERIFICATION',
);

/** 任务是否已逾期 */
const taskIsOverdue = computed(() => {
  if (!task.value?.deadline) return false;
  return (
    (task.value.status === 'PENDING_COMPLETION' ||
      task.value.status === 'PENDING_VERIFICATION') &&
    isOverdue(task.value.deadline)
  );
});

/** 任务是否临近到期 */
const taskIsNearExpiry = computed(() => {
  if (!task.value?.deadline) return false;
  return (
    task.value.status === 'PENDING_COMPLETION' &&
    !taskIsOverdue.value &&
    isNearExpiry(task.value.deadline)
  );
});

/** 状态展示文本 */
const statusLabel = computed(() => {
  const map: Record<string, string> = {
    PENDING_COMPLETION: '待完成',
    PENDING_VERIFICATION: '待验收',
    REJECTED: '已驳回',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };
  return map[task.value?.status || ''] || task.value?.status || '';
});

/** 状态展示颜色 */
const statusColor = computed(() => {
  const map: Record<string, string> = {
    PENDING_COMPLETION: 'var(--color-accent)',
    PENDING_VERIFICATION: 'var(--color-honey)',
    REJECTED: 'var(--color-rose)',
    COMPLETED: 'var(--color-moss)',
    CANCELLED: 'var(--color-text-secondary)',
  };
  return map[task.value?.status || ''] || 'var(--color-text-secondary)';
});

/** 截止时间展示文本 */
const deadlineText = computed(() => {
  if (!task.value?.deadline) return '';
  if (taskIsOverdue.value) return `已逾期 · ${formatDateTime(task.value.deadline)}`;
  if (taskIsNearExpiry.value) return `即将到期 · ${formatDateTime(task.value.deadline)}`;
  return formatRelativeDate(task.value.deadline);
});

/** 截止时间展示颜色 */
const deadlineClass = computed(() => ({
  'detail-page__info-text': true,
  'detail-page__info-text--overdue': taskIsOverdue.value,
  'detail-page__info-text--near-expiry': taskIsNearExpiry.value,
}));

/** 完成备注是否为空 */
const hasCompletionNote = computed(
  () => !!task.value?.completionNote?.trim(),
);

/** 完成照片是否存在 */
const hasCompletionPhoto = computed(() => !!task.value?.completionPhoto);

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

/** 标记完成 */
async function handleComplete(): Promise<void> {
  if (!familyId.value || !taskId.value || isActionLoading.value) return;

  isActionLoading.value = true;
  try {
    const result = await completeTask(familyId.value, taskId.value, {
      completionNote: completionNote.value.trim() || null,
      completionPhoto: completionPhoto.value || null,
    });

    if (result.data) {
      uni.showToast({ title: '任务已完成 ✨', icon: 'success' });
      showCompleteForm.value = false;
      // 重新加载任务数据
      await loadTaskDetail();
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

/** 验收通过 */
async function handleVerify(): Promise<void> {
  if (!familyId.value || !taskId.value || isActionLoading.value) return;

  // 二次确认
  const confirmResult = await uni.showModal({
    title: '确认验收',
    content: '确认该任务已完成并通过验收？',
    confirmText: '确认通过',
    cancelText: '再想想',
  });

  if (!confirmResult.confirm) return;

  isActionLoading.value = true;
  try {
    const result = await verifyTask(familyId.value, taskId.value);

    if (result.data) {
      uni.showToast({ title: '验收通过 ✅', icon: 'success' });
      await loadTaskDetail();
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
  if (!rejectionInput.value.trim()) {
    uni.showToast({ title: '请填写驳回原因', icon: 'none' });
    return;
  }

  if (!familyId.value || !taskId.value || isActionLoading.value) return;

  isActionLoading.value = true;
  try {
    const result = await rejectTask(
      familyId.value,
      taskId.value,
      rejectionInput.value.trim(),
    );

    if (result.data) {
      uni.showToast({ title: '已驳回', icon: 'success' });
      showRejectForm.value = false;
      rejectionInput.value = '';
      await loadTaskDetail();
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

/** 取消任务 */
async function handleCancel(): Promise<void> {
  if (!familyId.value || !taskId.value || isActionLoading.value) return;

  isActionLoading.value = true;
  try {
    const result = await cancelTask(
      familyId.value,
      taskId.value,
      cancelReason.value.trim() || undefined,
    );

    if (result.data) {
      uni.showToast({ title: '任务已取消', icon: 'success' });
      showCancelConfirm.value = false;
      cancelReason.value = '';
      await loadTaskDetail();
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

/** 跳转编辑页（复用创建页 + query 参数） */
function handleEdit(): void {
  if (!task.value) return;
  uni.navigateTo({
    url: `/pages/task/create?editMode=true&taskId=${taskId.value}&familyId=${familyId.value}`,
  });
}

/** 切换"标记完成"表单展开 */
function toggleCompleteForm(): void {
  showCompleteForm.value = !showCompleteForm.value;
  if (!showCompleteForm.value) {
    completionNote.value = '';
    completionPhoto.value = '';
  }
}

/** 预览完成照片 */
function handlePreviewPhoto(url: string): void {
  uni.previewImage({ urls: [url] });
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
    <view class="detail-page">
      <!-- ========== 加载中 ========== -->
      <LoadingSpinner
        v-if="isLoading"
        text="加载中..."
      />

      <!-- ========== 错误状态 ========== -->
      <view v-else-if="error" class="detail-page__center">
        <text class="detail-page__center-icon">😵</text>
        <text class="detail-page__center-text">{{ error }}</text>
        <view class="detail-page__retry-btn" @tap="loadTaskDetail">
          <text class="detail-page__retry-text">点击重试</text>
        </view>
      </view>

      <!-- ========== 任务详情内容 ========== -->
      <template v-else-if="task">
        <!-- ===== 任务信息卡片 ===== -->
        <view class="detail-page__card">
          <!-- 标题行 + 难度 -->
          <view class="detail-page__header-row">
            <text class="detail-page__title">{{ task.title }}</text>
            <StarRating
              v-if="task.difficulty"
              :difficulty="task.difficulty"
              :size="18"
            />
          </view>

          <!-- 徽章行 -->
          <view class="detail-page__badge-row">
            <RepeatBadge :repeat-rule="task.repeatRule || 'NONE'" />
            <VerificationBadge :needs-verification="task.needsVerification || false" />
            <!-- 逾期标签 -->
            <view v-if="taskIsOverdue" class="detail-page__overdue-tag">
              <text class="detail-page__overdue-tag-text">已逾期</text>
            </view>
            <!-- 临近到期标签 -->
            <view v-else-if="taskIsNearExpiry" class="detail-page__near-expiry-tag">
              <text class="detail-page__near-expiry-tag-text">即将到期</text>
            </view>
          </view>

          <!-- 状态标签 -->
          <view class="detail-page__status-row">
            <view
              class="detail-page__status-badge"
              :style="{ background: statusColor }"
            >
              <text class="detail-page__status-text">{{ statusLabel }}</text>
            </view>
            <text
              v-if="taskIsOverdue"
              class="detail-page__overdue-hint"
            >
              ⚠️ 已超时
            </text>
          </view>

          <!-- 任务描述 -->
          <view v-if="task.description" class="detail-page__section">
            <text class="detail-page__label">📝 任务描述</text>
            <text class="detail-page__info-text detail-page__description">
              {{ task.description }}
            </text>
          </view>

          <!-- 截止时间 -->
          <view class="detail-page__section">
            <text class="detail-page__label">⏰ 截止时间</text>
            <text :class="deadlineClass">
              {{ deadlineText }}
            </text>
          </view>

          <!-- 执行人 -->
          <view class="detail-page__section">
            <text class="detail-page__label">👤 执行人</text>
            <view class="detail-page__user-row">
              <view class="detail-page__avatar">
                <image
                  v-if="task.assignedTo?.avatarUrl"
                  :src="task.assignedTo.avatarUrl"
                  class="detail-page__avatar-img"
                  mode="aspectFill"
                />
                <text v-else class="detail-page__avatar-text">
                  {{ task.assignedTo?.nickname?.charAt(0) || '?' }}
                </text>
              </view>
              <text class="detail-page__info-text">
                {{ task.assignedTo?.nickname || '未知' }}
              </text>
            </view>
          </view>

          <!-- 创建人 -->
          <view class="detail-page__section">
            <text class="detail-page__label">📌 创建人</text>
            <view class="detail-page__user-row">
              <view class="detail-page__avatar detail-page__avatar--small">
                <image
                  v-if="task.createdBy?.avatarUrl"
                  :src="task.createdBy.avatarUrl"
                  class="detail-page__avatar-img"
                  mode="aspectFill"
                />
                <text v-else class="detail-page__avatar-text">
                  {{ task.createdBy?.nickname?.charAt(0) || '?' }}
                </text>
              </view>
              <text class="detail-page__info-text">
                {{ task.createdBy?.nickname || '未知' }}
              </text>
            </view>
          </view>

          <!-- 创建时间 -->
          <view class="detail-page__section">
            <text class="detail-page__label">📅 创建时间</text>
            <text class="detail-page__info-text">
              {{ task.createdAt ? formatDateTime(task.createdAt) : '' }}
            </text>
          </view>

          <!-- 完成信息（仅 COMPLETED 状态） -->
          <view v-if="task.status === 'COMPLETED'" class="detail-page__completed-info">
            <view class="detail-page__divider" />

            <text class="detail-page__label">✅ 完成时间</text>
            <text class="detail-page__info-text">
              {{ task.completedAt ? formatDateTime(task.completedAt) : '' }}
            </text>

            <!-- 完成备注 -->
            <view v-if="hasCompletionNote" class="detail-page__section">
              <text class="detail-page__label">📝 完成备注</text>
              <text class="detail-page__info-text detail-page__completion-note">
                {{ task.completionNote }}
              </text>
            </view>

            <!-- 完成照片 -->
            <view v-if="hasCompletionPhoto" class="detail-page__section">
              <text class="detail-page__label">🖼️ 完成照片</text>
              <image
                :src="task.completionPhoto!"
                class="detail-page__completion-photo"
                mode="widthFix"
                @tap="handlePreviewPhoto(task.completionPhoto!)"
              />
            </view>

            <!-- 验收信息 -->
            <view v-if="task.verifiedBy" class="detail-page__section">
              <text class="detail-page__label">✔️ 验收人</text>
              <view class="detail-page__user-row">
                <view class="detail-page__avatar detail-page__avatar--small">
                  <image
                    v-if="task.verifiedBy.avatarUrl"
                    :src="task.verifiedBy.avatarUrl"
                    class="detail-page__avatar-img"
                    mode="aspectFill"
                  />
                  <text v-else class="detail-page__avatar-text">
                    {{ task.verifiedBy.nickname?.charAt(0) || '?' }}
                  </text>
                </view>
                <text class="detail-page__info-text">
                  {{ task.verifiedBy.nickname || '未知' }}
                </text>
              </view>
              <text
                v-if="task.verifiedAt"
                class="detail-page__info-text detail-page__info-text--secondary"
              >
                {{ formatDateTime(task.verifiedAt) }}
              </text>
            </view>
          </view>

          <!-- 取消信息（仅 CANCELLED 状态） -->
          <view v-if="task.status === 'CANCELLED' && task.cancelledAt" class="detail-page__completed-info">
            <view class="detail-page__divider" />

            <text class="detail-page__label">🚫 取消时间</text>
            <text class="detail-page__info-text">
              {{ formatDateTime(task.cancelledAt) }}
            </text>
            <view v-if="task.cancelledBy" class="detail-page__section">
              <text class="detail-page__label">取消人</text>
              <text class="detail-page__info-text">
                {{ task.cancelledBy.nickname || '未知' }}
              </text>
            </view>
            <view v-if="task.cancelledReason" class="detail-page__section">
              <text class="detail-page__label">取消原因</text>
              <text class="detail-page__info-text">
                {{ task.cancelledReason }}
              </text>
            </view>
          </view>
        </view>

        <!-- ===== 驳回原因区域（仅 REJECTED 状态） ===== -->
        <view v-if="task.status === 'REJECTED'" class="detail-page__rejection-card">
          <view class="detail-page__rejection-header">
            <text class="detail-page__rejection-icon">❌</text>
            <text class="detail-page__rejection-title">驳回原因</text>
          </view>
          <text class="detail-page__rejection-reason">
            {{ task.rejectionReason || '未提供原因' }}
          </text>
          <!-- 驳回时间（如果有 completedAt 说明驳回发生在此时间附近） -->
          <text
            v-if="task.completedAt"
            class="detail-page__rejection-time"
          >
            提交时间：{{ formatDateTime(task.completedAt) }}
          </text>
        </view>

        <!-- ===== 操作按钮区域 ===== -->
        <view class="detail-page__actions">
          <!-- 标记完成按钮（PENDING_COMPLETION + 执行人） -->
          <view v-if="canComplete && !showCompleteForm" class="detail-page__action-row">
            <button
              class="detail-page__btn detail-page__btn--complete"
              @tap="toggleCompleteForm"
            >
              <text class="detail-page__btn-text">✓ 标记完成</text>
            </button>
          </view>

          <!-- 标记完成内联表单 -->
          <view v-if="canComplete && showCompleteForm" class="detail-page__complete-form">
            <text class="detail-page__form-title">标记完成</text>

            <!-- 备注输入 -->
            <view class="detail-page__form-field">
              <CompletionNoteInput v-model="completionNote" />
            </view>

            <!-- 照片上传 -->
            <view class="detail-page__form-field">
              <PhotoUploader v-model="completionPhoto" />
            </view>

            <!-- 表单操作按钮 -->
            <view class="detail-page__form-actions">
              <button
                class="detail-page__btn detail-page__btn--secondary"
                @tap="toggleCompleteForm"
              >
                <text class="detail-page__btn-text--secondary">取消</text>
              </button>
              <button
                class="detail-page__btn detail-page__btn--submit"
                :disabled="isActionLoading"
                @tap="handleComplete"
              >
                <text class="detail-page__btn-text">
                  {{ isActionLoading ? '提交中...' : '确认完成 ✨' }}
                </text>
              </button>
            </view>
          </view>

          <!-- 验收/驳回按钮（PENDING_VERIFICATION + ORGANIZER） -->
          <template v-if="canVerify && !showRejectForm">
            <view class="detail-page__action-row">
              <button
                class="detail-page__btn detail-page__btn--verify"
                :disabled="isActionLoading"
                @tap="handleVerify"
              >
                <text class="detail-page__btn-text">✅ 验收通过</text>
              </button>
            </view>
            <view class="detail-page__action-row">
              <button
                class="detail-page__btn detail-page__btn--reject-outline"
                @tap="showRejectForm = true"
              >
                <text class="detail-page__btn-text--reject">❌ 驳回</text>
              </button>
            </view>
          </template>

          <!-- 驳回表单 -->
          <view v-if="canVerify && showRejectForm" class="detail-page__complete-form">
            <text class="detail-page__form-title">驳回任务</text>

            <view class="detail-page__form-field">
              <text class="detail-page__form-label">
                驳回原因 <text class="detail-page__required">*</text>
              </text>
              <textarea
                v-model="rejectionInput"
                class="detail-page__textarea"
                placeholder="请填写驳回原因，以便执行人了解需要如何改进..."
                :maxlength="300"
                placeholder-class="detail-page__placeholder"
                :auto-height="true"
              />
            </view>

            <view class="detail-page__form-actions">
              <button
                class="detail-page__btn detail-page__btn--secondary"
                @tap="showRejectForm = false; rejectionInput = ''"
              >
                <text class="detail-page__btn-text--secondary">取消</text>
              </button>
              <button
                class="detail-page__btn detail-page__btn--reject"
                :disabled="isActionLoading || !rejectionInput.trim()"
                @tap="handleReject"
              >
                <text class="detail-page__btn-text">
                  {{ isActionLoading ? '提交中...' : '确认驳回' }}
                </text>
              </button>
            </view>
          </view>

          <!-- 重新提交按钮（REJECTED + 执行人） -->
          <view v-if="canResubmit && !showCompleteForm" class="detail-page__action-row">
            <button
              class="detail-page__btn detail-page__btn--complete"
              @tap="toggleCompleteForm"
            >
              <text class="detail-page__btn-text">🔄 重新提交</text>
            </button>
          </view>

          <!-- 重新提交表单（复用 complete 表单） -->
          <view v-if="canResubmit && showCompleteForm" class="detail-page__complete-form">
            <text class="detail-page__form-title">重新提交</text>

            <view class="detail-page__form-field">
              <CompletionNoteInput
                v-model="completionNote"
                placeholder="说明本次改进..."
              />
            </view>

            <view class="detail-page__form-field">
              <PhotoUploader v-model="completionPhoto" />
            </view>

            <view class="detail-page__form-actions">
              <button
                class="detail-page__btn detail-page__btn--secondary"
                @tap="toggleCompleteForm"
              >
                <text class="detail-page__btn-text--secondary">取消</text>
              </button>
              <button
                class="detail-page__btn detail-page__btn--submit"
                :disabled="isActionLoading"
                @tap="handleComplete"
              >
                <text class="detail-page__btn-text">
                  {{ isActionLoading ? '提交中...' : '确认提交 ✨' }}
                </text>
              </button>
            </view>
          </view>

          <!-- 编辑按钮 -->
          <view v-if="canEdit && !showCompleteForm && !showRejectForm" class="detail-page__action-row">
            <button
              class="detail-page__btn detail-page__btn--edit"
              @tap="handleEdit"
            >
              <text class="detail-page__btn-text--secondary">✎ 编辑任务</text>
            </button>
          </view>

          <!-- 取消任务按钮 -->
          <view
            v-if="canCancel && !showCompleteForm && !showRejectForm"
            class="detail-page__action-row"
          >
            <button
              class="detail-page__btn detail-page__btn--cancel-outline"
              @tap="showCancelConfirm = true"
            >
              <text class="detail-page__btn-text--cancel">🚫 取消任务</text>
            </button>
          </view>
        </view>

        <!-- ===== 取消确认弹窗 ===== -->
        <view v-if="showCancelConfirm" class="detail-page__modal-mask" @tap="showCancelConfirm = false">
          <view class="detail-page__modal" @tap.stop>
            <text class="detail-page__modal-title">确认取消任务</text>
            <text class="detail-page__modal-desc">
              取消后其他人将无法继续执行此任务。
            </text>

            <view class="detail-page__form-field">
              <text class="detail-page__form-label">取消原因（选填）</text>
              <textarea
                v-model="cancelReason"
                class="detail-page__textarea"
                placeholder="填写取消原因..."
                :maxlength="200"
                placeholder-class="detail-page__placeholder"
                :auto-height="true"
              />
            </view>

            <view class="detail-page__form-actions">
              <button
                class="detail-page__btn detail-page__btn--secondary"
                @tap="showCancelConfirm = false; cancelReason = ''"
              >
                <text class="detail-page__btn-text--secondary">再想想</text>
              </button>
              <button
                class="detail-page__btn detail-page__btn--reject"
                :disabled="isActionLoading"
                @tap="handleCancel"
              >
                <text class="detail-page__btn-text">
                  {{ isActionLoading ? '取消中...' : '确认取消' }}
                </text>
              </button>
            </view>
          </view>
        </view>

        <!-- ===== 已完成/已取消 只读提示 ===== -->
        <view
          v-if="task.status === 'COMPLETED' || task.status === 'CANCELLED'"
          class="detail-page__terminal-hint"
        >
          <text class="detail-page__terminal-text">
            {{ task.status === 'COMPLETED' ? '✨ 此任务已完成' : '此任务已取消' }}
          </text>
        </view>
      </template>
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.detail-page {
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

  /* ========== 信息卡片 ========== */
  &__card {
    background: var(--color-white);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    box-shadow: var(--shadow-card);
  }

  &__header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  &__title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
    flex: 1;
  }

  &__badge-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
    flex-wrap: wrap;
  }

  /* 逾期/临近到期标签 */
  &__overdue-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--space-sm);
    background: rgba(232, 164, 160, 0.15);
    border-radius: var(--radius-sm);
  }

  &__overdue-tag-text {
    font-size: var(--font-size-small);
    color: var(--color-rose);
    font-weight: var(--font-weight-small);
  }

  &__near-expiry-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--space-sm);
    background: rgba(244, 211, 94, 0.18);
    border-radius: var(--radius-sm);
  }

  &__near-expiry-tag-text {
    font-size: var(--font-size-small);
    color: var(--color-accent);
    font-weight: var(--font-weight-small);
  }

  /* 状态行 */
  &__status-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  &__status-badge {
    padding: 2px var(--space-sm);
    border-radius: var(--radius-sm);
  }

  &__status-text {
    font-size: var(--font-size-small);
    color: var(--color-white);
    font-weight: var(--font-weight-small);
  }

  &__overdue-hint {
    font-size: var(--font-size-small);
    color: var(--color-rose);
    font-weight: var(--font-weight-small);
  }

  /* 区块 */
  &__section {
    margin-top: var(--space-md);
  }

  &__label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: var(--space-xs);
  }

  &__info-text {
    font-size: var(--font-size-body);
    color: var(--color-text);
    line-height: 1.5;

    &--secondary {
      font-size: var(--font-size-caption);
      color: var(--color-text-secondary);
      display: block;
      margin-top: var(--space-xs);
    }

    &--overdue {
      color: var(--color-rose);
      font-weight: var(--font-weight-small);
    }

    &--near-expiry {
      color: var(--color-accent);
      font-weight: var(--font-weight-small);
    }
  }

  &__description {
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  &__completion-note {
    background: rgba(140, 184, 159, 0.08);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    color: var(--color-text);
  }

  /* 用户行 */
  &__user-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &__avatar {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    &--small {
      width: 22px;
      height: 22px;
    }
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
  }

  &__avatar-text {
    font-size: 11px;
    color: var(--color-white);
  }

  /* 完成照片 */
  &__completion-photo {
    width: 100%;
    max-width: 280px;
    border-radius: var(--radius-md);
    margin-top: var(--space-xs);
  }

  &__divider {
    height: 1px;
    background: var(--color-border);
    margin: var(--space-md) 0;
  }

  &__completed-info {
    /* 容器 */
  }

  /* ========== 驳回原因卡片 ========== */
  &__rejection-card {
    margin-top: var(--space-md);
    background: rgba(232, 164, 160, 0.08);
    border: 1px solid rgba(232, 164, 160, 0.25);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
  }

  &__rejection-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  &__rejection-icon {
    font-size: 16px;
    line-height: 1;
  }

  &__rejection-title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-rose);
  }

  &__rejection-reason {
    font-size: var(--font-size-body);
    color: var(--color-text);
    line-height: 1.6;
  }

  &__rejection-time {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    margin-top: var(--space-sm);
    display: block;
  }

  /* ========== 操作按钮区域 ========== */
  &__actions {
    margin-top: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  &__action-row {
    width: 100%;
  }

  /* 按钮基础 */
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

    /* 标记完成 / 重新提交 */
    &--complete {
      background: var(--color-primary);
    }

    /* 验收通过 */
    &--verify {
      background: var(--color-moss);
    }

    /* 确认提交 */
    &--submit {
      background: var(--color-primary);
      flex: 1;
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

    /* 编辑 */
    &--edit {
      background: var(--color-white);
      border: 2px solid var(--color-border);
    }

    /* 取消轮廓按钮 */
    &--cancel-outline {
      background: var(--color-white);
      border: 2px solid var(--color-border);
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

  &__btn-text--secondary {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  &__btn-text--reject {
    font-size: var(--font-size-body);
    color: var(--color-rose);
    font-weight: 600;
  }

  &__btn-text--cancel {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  /* ========== 完成/驳回表单 ========== */
  &__complete-form {
    background: var(--color-white);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    box-shadow: var(--shadow-card);
  }

  &__form-title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
    display: block;
    margin-bottom: var(--space-md);
  }

  &__form-field {
    margin-bottom: var(--space-md);
  }

  &__form-label {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: var(--space-sm);
  }

  &__required {
    color: var(--color-rose);
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

  /* 表单内操作按钮 */
  &__form-actions {
    display: flex;
    gap: var(--space-md);
    margin-top: var(--space-md);
  }

  /* ========== 取消确认弹窗 ========== */
  &__modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl);
  }

  &__modal {
    background: var(--color-white);
    border-radius: var(--radius-md);
    padding: var(--space-xl);
    width: 100%;
    max-width: 320px;
  }

  &__modal-title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
    display: block;
    margin-bottom: var(--space-sm);
  }

  &__modal-desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    line-height: 1.5;
    display: block;
    margin-bottom: var(--space-lg);
  }

  /* ========== 终态提示 ========== */
  &__terminal-hint {
    margin-top: var(--space-xl);
    text-align: center;
    padding: var(--space-md) 0;
  }

  &__terminal-text {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }
}
</style>
