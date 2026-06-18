<script setup lang="ts">
/**
 * 创建任务页 — 模板选择 → 表单填写 → 创建
 *
 * 页面结构：
 * 1. TemplateSelector — 模板选择器（横向滑动卡片）
 * 2. 表单区域 — 任务标题、描述、难度星级、截止时间、执行人、重复规则、验收开关
 * 3. 提交按钮 — "✓ 创建任务"
 *
 * 交互流程：
 * - 加载模板列表 → 用户选择模板（预填表单）或跳过
 * - 填写/修改表单 → 校验 → 调 API 创建 → Toast 提示 → 自动跳回首页
 *
 * 设计参考: docs/ui-design.md §4.3、§5 组件树
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useFamilyStore } from '../../stores/family';
import { getTaskTemplates } from '../../api/template';
import { createTask } from '../../api/task';
import type { components } from '../../types/api';
import AuthGuard from '../../components/AuthGuard.vue';
import TemplateSelector from '../../components/TemplateSelector.vue';
import StarInput from '../../components/StarInput.vue';
import MemberPicker from '../../components/MemberPicker.vue';
import DateTimePicker from '../../components/DateTimePicker.vue';
import RepeatRulePicker from '../../components/RepeatRulePicker.vue';
import VerificationToggle from '../../components/VerificationToggle.vue';

type TaskTemplateItem = components['schemas']['TaskTemplateItem'];

// ========== Stores ==========
const familyStore = useFamilyStore();

// ========== 模板相关 ==========

/** 模板列表 */
const templates = ref<TaskTemplateItem[]>([]);

/** 模板加载状态 */
const templatesLoading = ref(false);

/** 是否已选择模板（或跳过）—— 控制模板选择器显示 */
const hasConfirmedTemplateStep = ref(false);

/** 选中的模板（null = 用户跳过模板选择） */
const selectedTemplate = ref<TaskTemplateItem | null>(null);

// ========== 表单状态 ==========

/** 任务标题 */
const title = ref('');

/** 任务描述 */
const description = ref('');

/** 难度星级 (1-5) */
const difficulty = ref(1);

/** 截止时间 ISO 8601 */
const deadline = ref('');

/** 执行人 user ID */
const assignedTo = ref('');

/** 重复规则 */
const repeatRule = ref<'NONE' | 'DAILY' | 'WEEKLY'>('NONE');

/** 是否需要验收 */
const needsVerification = ref(false);

/** 提交按钮 loading */
const isSubmitting = ref(false);

// ========== 计算属性 ==========

/** 当前家庭 ID */
const familyId = computed(() => familyStore.currentFamily?.id || '');

/** 是否显示模板选择器 */
const showTemplates = computed(() => !hasConfirmedTemplateStep.value);

/** 默认截止时间（明天 20:00） */
function getDefaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

/** 表单是否可提交 */
const canSubmit = computed(
  () => title.value.trim().length > 0 && !!deadline.value && !!assignedTo.value && !isSubmitting.value,
);

/** 表单校验错误信息 */
const validationErrors = computed(() => {
  const errors: string[] = [];
  if (!title.value.trim()) errors.push('请输入任务标题');
  if (!deadline.value) errors.push('请选择截止时间');
  if (!assignedTo.value) errors.push('请选择执行人');
  return errors;
});

// ========== 方法 ==========

/** 加载模板列表 */
async function loadTemplates(): Promise<void> {
  templatesLoading.value = true;
  try {
    const result = await getTaskTemplates();
    if (result.data) {
      templates.value = result.data;
    }
  } catch {
    // 模板加载失败非关键路径，静默处理
  } finally {
    templatesLoading.value = false;
  }
}

/** 选中模板 → 预填表单 + 隐藏模板选择器 */
function handleTemplateSelect(template: TaskTemplateItem): void {
  selectedTemplate.value = template;
  hasConfirmedTemplateStep.value = true;

  // 预填表单字段
  title.value = template.title || '';
  description.value = template.description || '';
  difficulty.value = template.difficulty || 1;
  repeatRule.value = (template.suggestedRepeatRule as 'NONE' | 'DAILY' | 'WEEKLY') || 'NONE';
  needsVerification.value = template.needsVerification || false;

  // 如果还没有设置截止时间，使用默认值
  if (!deadline.value) {
    deadline.value = getDefaultDeadline();
  }
}

/** 跳过模板选择 → 使用默认值进入表单 */
function handleSkipTemplate(): void {
  selectedTemplate.value = null;
  hasConfirmedTemplateStep.value = true;

  // 设置默认截止时间
  if (!deadline.value) {
    deadline.value = getDefaultDeadline();
  }
}

/** 提交表单 */
async function handleSubmit(): Promise<void> {
  // 校验
  if (validationErrors.value.length > 0) {
    uni.showToast({ title: validationErrors.value[0]!, icon: 'none' });
    return;
  }

  if (!familyId.value) {
    uni.showToast({ title: '请先选择家庭', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    const result = await createTask(familyId.value, {
      title: title.value.trim(),
      description: description.value.trim() || null,
      difficulty: difficulty.value,
      deadline: deadline.value,
      assignedTo: assignedTo.value,
      repeatRule: repeatRule.value,
      needsVerification: needsVerification.value,
    });

    if (result.data) {
      uni.showToast({ title: '任务创建成功', icon: 'success' });
      // 延迟返回，让用户看到 Toast
      setTimeout(() => {
        uni.navigateBack();
      }, 800);
    } else {
      uni.showToast({
        title: result.error?.message || '创建失败，请重试',
        icon: 'none',
      });
    }
  } catch {
    uni.showToast({ title: '网络异常，请重试', icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
}

// ========== 生命周期 ==========

onMounted(() => {
  loadTemplates();

  // 若家庭成员未加载，尝试加载
  if (familyStore.currentFamily && familyStore.members.length === 0) {
    familyStore.loadMembers();
  }
});

// 如果 initial deadline 为空，watch family store 设置默认值
watch(
  () => familyStore.currentFamily,
  (family) => {
    if (family && !deadline.value && hasConfirmedTemplateStep.value) {
      deadline.value = getDefaultDeadline();
    }
  },
);
</script>

<template>
  <AuthGuard>
    <view class="create-page">
      <!-- ===== 页面标题 ===== -->
      <view class="create-page__header">
        <text class="create-page__title">创建任务</text>
        <text class="create-page__subtitle">
          {{ familyStore.currentFamilyName || '选择家庭' }}
        </text>
      </view>

      <!-- ===== 步骤 1: 模板选择 ===== -->
      <view v-if="showTemplates" class="create-page__section">
        <TemplateSelector
          :templates="templates"
          :loading="templatesLoading"
          @select="handleTemplateSelect"
          @skip="handleSkipTemplate"
        />
      </view>

      <!-- ===== 步骤 2: 任务表单 ===== -->
      <view v-if="!showTemplates" class="create-page__form">
        <!-- 选中模板标签 -->
        <view v-if="selectedTemplate" class="create-page__template-tag">
          <text class="create-page__template-tag-icon">📋</text>
          <text class="create-page__template-tag-text">
            基于模板「{{ selectedTemplate.title }}」
          </text>
          <text class="create-page__template-tag-reset" @tap="hasConfirmedTemplateStep = false">
            重新选择
          </text>
        </view>

        <!-- 任务标题 -->
        <view class="create-page__field">
          <text class="create-page__label">
            任务标题 <text class="create-page__required">*</text>
          </text>
          <input
            v-model="title"
            class="create-page__input"
            placeholder="例如：今天洗碗"
            :maxlength="128"
            placeholder-class="create-page__placeholder"
          />
        </view>

        <!-- 任务描述 -->
        <view class="create-page__field">
          <text class="create-page__label">任务描述</text>
          <textarea
            v-model="description"
            class="create-page__textarea"
            placeholder="选填，补充说明要求..."
            :maxlength="500"
            placeholder-class="create-page__placeholder"
            :auto-height="true"
          />
        </view>

        <!-- 难度星级 -->
        <view class="create-page__field">
          <text class="create-page__label">难度</text>
          <view class="create-page__star-row">
            <StarInput v-model="difficulty" :size="28" />
            <text class="create-page__star-hint">
              {{ difficulty === 1 ? '轻松' : difficulty === 2 ? '简单' : difficulty === 3 ? '适中' : difficulty === 4 ? '较难' : '困难' }}
            </text>
          </view>
        </view>

        <!-- 截止时间 -->
        <view class="create-page__field">
          <text class="create-page__label">
            截止时间 <text class="create-page__required">*</text>
          </text>
          <DateTimePicker v-model="deadline" />
        </view>

        <!-- 分配给 -->
        <view class="create-page__field">
          <text class="create-page__label">
            分配给 <text class="create-page__required">*</text>
          </text>
          <MemberPicker
            v-model="assignedTo"
            :members="familyStore.members"
          />
        </view>

        <!-- 重复规则 -->
        <view class="create-page__field">
          <text class="create-page__label">
            重复规则 <text class="create-page__required">*</text>
          </text>
          <RepeatRulePicker v-model="repeatRule" />
        </view>

        <!-- 验收开关 -->
        <view class="create-page__field">
          <VerificationToggle v-model="needsVerification" />
        </view>

        <!-- ===== 提交按钮 ===== -->
        <view class="create-page__submit-area">
          <button
            class="create-page__submit-btn"
            :class="{ 'create-page__submit-btn--disabled': !canSubmit }"
            :disabled="!canSubmit"
            @tap="handleSubmit"
          >
            <text class="create-page__submit-text">
              {{ isSubmitting ? '创建中...' : '✓ 创建任务' }}
            </text>
          </button>

          <!-- 校验提示 -->
          <view v-if="validationErrors.length > 0 && !isSubmitting" class="create-page__errors">
            <text
              v-for="err in validationErrors"
              :key="err"
              class="create-page__error-item"
            >
              {{ err }}
            </text>
          </view>
        </view>
      </view>

      <!-- ===== 无家庭提示 ===== -->
      <view v-if="!familyStore.currentFamily && familyStore.isInitialized" class="create-page__no-family">
        <text class="create-page__no-family-icon">🏠</text>
        <text class="create-page__no-family-text">请先创建或加入一个家庭</text>
      </view>
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: var(--space-2xl);

  /* ========== 页面头部 ========== */
  &__header {
    padding: var(--space-xl) var(--space-lg) var(--space-md);
  }

  &__title {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-h1);
    color: var(--color-text);
    display: block;
  }

  &__subtitle {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    margin-top: var(--space-xs);
  }

  /* ========== 区块 ========== */
  &__section {
    padding: 0 var(--space-lg);
  }

  /* ========== 表单 ========== */
  &__form {
    padding: 0 var(--space-lg);
  }

  /* ========== 模板标签 ========== */
  &__template-tag {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: rgba(61, 107, 90, 0.06);
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-lg);
  }

  &__template-tag-icon {
    font-size: 14px;
    line-height: 1;
  }

  &__template-tag-text {
    flex: 1;
    font-size: var(--font-size-caption);
    color: var(--color-primary);
    font-weight: 500;
  }

  &__template-tag-reset {
    font-size: var(--font-size-caption);
    color: var(--color-primary);
    text-decoration: underline;

    &:active {
      opacity: 0.6;
    }
  }

  /* ========== 表单字段 ========== */
  &__field {
    margin-bottom: var(--space-lg);
  }

  &__label {
    font-size: var(--font-size-caption);
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: var(--space-sm);
    display: block;
  }

  &__required {
    color: var(--color-rose);
  }

  &__input {
    width: 100%;
    padding: var(--space-md);
    background: var(--color-white);
    border-radius: var(--radius-md);
    font-size: var(--font-size-body);
    color: var(--color-text);
    border: 2px solid transparent;
    min-height: 44px;
    box-sizing: border-box;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &__textarea {
    width: 100%;
    padding: var(--space-md);
    background: var(--color-white);
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

  /* ========== 星级行 ========== */
  &__star-row {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) 0;
  }

  &__star-hint {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
  }

  /* ========== 提交区域 ========== */
  &__submit-area {
    margin-top: var(--space-xl);
  }

  &__submit-btn {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: var(--color-primary);
    border-radius: var(--radius-lg);
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:active {
      opacity: 0.9;
    }

    &--disabled {
      opacity: 0.4;
    }
  }

  &__submit-text {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-white);
    line-height: 1.4;
  }

  /* ========== 校验错误 ========== */
  &__errors {
    margin-top: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__error-item {
    font-size: var(--font-size-caption);
    color: var(--color-rose);
    text-align: center;
  }

  /* ========== 无家庭提示 ========== */
  &__no-family {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: var(--space-2xl) var(--space-lg);
    text-align: center;
  }

  &__no-family-icon {
    font-size: 48px;
    margin-bottom: var(--space-lg);
  }

  &__no-family-text {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
  }
}
</style>
