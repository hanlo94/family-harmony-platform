<script setup lang="ts">
/**
 * 提醒设置页 — 按家庭维度管理微信提醒开关
 *
 * 功能：
 * - 展示各家庭的提醒开关状态
 * - Toggle 切换即时调用 API 更新
 * - 底部说明文字
 *
 * 设计参考: docs/ui-design.md §4.7
 */
import { ref, onMounted } from 'vue';
import { userApi } from '../../api';
import type { components } from '../../types/api';
import AuthGuard from '../../components/AuthGuard.vue';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

type SettingItem = NonNullable<components['schemas']['UserSettings']['settings']>[number];

// ========== State ==========

/** 各家庭提醒设置列表 */
const settings = ref<SettingItem[]>([]);

/** 是否正在加载 */
const isLoading = ref(false);

/** 加载错误信息 */
const loadError = ref('');

/** 正在切换中的家庭 ID 集合（用于 loading 状态） */
const togglingIds = ref<Set<string>>(new Set());

// ========== Data Loading ==========

/** 加载提醒设置 */
async function loadSettings(): Promise<void> {
  isLoading.value = true;
  loadError.value = '';

  try {
    const result = await userApi.getUserSettings();
    if (result.data?.settings) {
      settings.value = result.data.settings;
    } else if (result.error) {
      loadError.value = result.error.message || '加载失败';
    }
  } catch {
    loadError.value = '网络异常，请重试';
  } finally {
    isLoading.value = false;
  }
}

// ========== Toggle ==========

/** 切换提醒开关 */
async function handleToggle(setting: SettingItem): Promise<void> {
  const familyId = setting.familyId;
  if (!familyId) return;

  const newValue = !setting.reminderEnabled;

  // 标记为切换中
  togglingIds.value.add(familyId);

  try {
    const result = await userApi.updateUserSettings({
      familyId,
      reminderEnabled: newValue,
    });

    if (result.error) {
      uni.showToast({
        title: result.error.message || '设置失败',
        icon: 'none',
      });
    } else {
      // 本地更新状态（乐观更新已成功）
      setting.reminderEnabled = newValue;
      uni.showToast({
        title: newValue ? '已开启提醒' : '已关闭提醒',
        icon: 'success',
        duration: 1500,
      });
    }
  } catch {
    uni.showToast({ title: '网络异常，请重试', icon: 'none' });
  } finally {
    togglingIds.value.delete(familyId);
  }
}

// ========== Lifecycle ==========

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <AuthGuard>
    <view class="settings">
      <!-- ========== 加载中 ========== -->
      <LoadingSpinner
        v-if="isLoading"
        text="加载中..."
      />

      <!-- ========== 错误状态 ========== -->
      <view v-else-if="loadError" class="settings__error">
        <text class="settings__error-icon">😵</text>
        <text class="settings__error-text">{{ loadError }}</text>
        <view class="settings__retry-btn" @click="loadSettings">
          <text class="settings__retry-text">点击重试</text>
        </view>
      </view>

      <!-- ========== 空状态（无家庭） ========== -->
      <view v-else-if="settings.length === 0" class="settings__empty">
        <text class="settings__empty-icon">🔔</text>
        <text class="settings__empty-title">暂无提醒设置</text>
        <text class="settings__empty-desc">加入家庭后，可在此管理提醒开关</text>
      </view>

      <!-- ========== 设置列表 ========== -->
      <template v-else>
        <view class="settings__header">
          <text class="settings__header-title">任务到期提醒</text>
          <text class="settings__header-desc">
            开启后，将在任务到期前 1 小时通过微信发送提醒
          </text>
        </view>

        <view class="settings__list">
          <view
            v-for="setting in settings"
            :key="setting.familyId"
            class="settings__card"
          >
            <view class="settings__card-info">
              <text class="settings__card-icon">🏠</text>
              <view class="settings__card-text">
                <text class="settings__card-name">{{ setting.familyName }}</text>
                <text class="settings__card-hint">
                  {{ setting.reminderEnabled
                    ? '到期前 1 小时发送微信提醒'
                    : '关闭后不再收到该家庭提醒'
                  }}
                </text>
              </view>
            </view>

            <switch
              class="settings__card-switch"
              :checked="setting.reminderEnabled"
              :disabled="togglingIds.has(setting.familyId || '')"
              color="#3D6B5A"
              @change="handleToggle(setting)"
            />
          </view>
        </view>

        <!-- ========== 说明 ========== -->
        <view class="settings__notes">
          <text class="settings__notes-title">说明</text>
          <view class="settings__notes-list">
            <text class="settings__notes-item">• 微信提醒可能因网络或微信限制未送达</text>
            <text class="settings__notes-item">• 即使关闭提醒，首页仍会显示任务状态</text>
            <text class="settings__notes-item">• 每个家庭的提醒设置独立管理</text>
          </view>
        </view>
      </template>
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.settings {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: var(--space-2xl);

  /* ========== 头部说明 ========== */
  &__header {
    padding: var(--space-xl) var(--space-lg) var(--space-md);
  }

  &__header-title {
    display: block;
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
    margin-bottom: var(--space-xs);
  }

  &__header-desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  /* ========== 错误状态 ========== */
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 60vh;
    justify-content: center;
    gap: var(--space-md);
  }

  &__error-icon {
    font-size: 40px;
  }

  &__error-text {
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

  /* ========== 空状态 ========== */
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 60vh;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-lg);
  }

  &__empty-icon {
    font-size: 48px;
    margin-bottom: var(--space-sm);
  }

  &__empty-title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
  }

  &__empty-desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    text-align: center;
  }

  /* ========== 设置卡片列表 ========== */
  &__list {
    padding: 0 var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  &__card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
  }

  &__card-info {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex: 1;
    min-width: 0;
  }

  &__card-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  &__card-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__card-name {
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--color-text);
  }

  &__card-hint {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ========== Switch ========== */
  &__card-switch {
    flex-shrink: 0;
    margin-left: var(--space-md);
    transform: scale(1.1);
    transform-origin: right center;
  }

  /* ========== 说明 ========== */
  &__notes {
    margin: var(--space-2xl) var(--space-lg);
    padding: var(--space-lg);
    background: var(--color-surface);
    border-radius: var(--radius-md);
  }

  &__notes-title {
    display: block;
    font-size: var(--font-size-caption);
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: var(--space-sm);
  }

  &__notes-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__notes-item {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}
</style>
