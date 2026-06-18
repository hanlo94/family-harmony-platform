<script setup lang="ts">
/**
 * 任务首页 — 家庭任务列表
 *
 * 页面结构（自上而下）：
 * 1. Header — 家庭名称 + 切换家庭按钮（sticky）
 * 2. OverdueBanner — 逾期/临近到期任务专区
 * 3. TaskFilter — 状态筛选 Tab 栏
 * 4. TaskCard 列表 — 页面级滚动
 * 5. EmptyState — 空状态插画
 * 6. LoadingMore — 加载更多指示器
 * 7. FAB — 创建任务浮动按钮（CHILD 角色隐藏）
 *
 * 生命周期：
 * - onMounted：加载逾期/临近到期 + 首屏任务列表
 * - onShow：返回页面时静默刷新数据
 * - onPullDownRefresh：下拉刷新全部数据
 * - onReachBottom：触底加载更多
 *
 * 设计参考: docs/ui-design.md §4.1、§5 组件树、§7 动效设计
 */
import { computed, watch, onMounted, ref } from 'vue';
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useFamilyStore } from '../../stores/family';
import { useTaskStore } from '../../stores/task';
import type { components } from '../../types/api';
import AuthGuard from '../../components/AuthGuard.vue';
import OverdueBanner from '../../components/OverdueBanner.vue';
import TaskFilter from '../../components/TaskFilter.vue';
import TaskCard from '../../components/TaskCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import FloatingActionButton from '../../components/FloatingActionButton.vue';
import StarBurst from '../../components/StarBurst.vue';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

type TaskListItem = components['schemas']['TaskListItem'];

// ========== Stores ==========

const familyStore = useFamilyStore();
const taskStore = useTaskStore();

// ========== State ==========

/** 任务完成星星动画 - 显示状态 */
const showStarAnimation = ref(false);

/** 是否正在首次加载 */
const isFirstLoad = ref(true);

// ========== Computed ==========

/** 当前家庭 ID */
const familyId = computed(() => familyStore.currentFamily?.id ?? null);

/** 当前家庭名称 */
const familyName = computed(() => familyStore.currentFamilyName);

/** 当前用户角色 */
const currentRole = computed(() => familyStore.currentRole);

/** 是否为 CHILD 角色（隐藏 FAB） */
const isChild = computed(() => currentRole.value === 'CHILD');

/** 是否显示 FAB */
const showFab = computed(() => !isChild.value && familyId.value !== null);

// ========== Data Loading ==========

/**
 * 首次加载：逾期/临近到期 + 主列表
 *
 * 仅在 familyId 改变或首次挂载时执行全量加载。
 */
async function initialLoad(): Promise<void> {
  if (!familyId.value) return;

  taskStore.checkFamilyChange(familyId.value);

  await Promise.all([
    taskStore.loadOverdueAndNearExpiry(familyId.value),
    taskStore.loadTasks(familyId.value),
  ]);
  isFirstLoad.value = false;
}

/** 静默刷新（不显示全局 loading，用于 onShow） */
async function silentRefresh(): Promise<void> {
  if (!familyId.value) return;
  await taskStore.refresh(familyId.value);
}

/** 下拉刷新 */
async function handlePullDownRefresh(): Promise<void> {
  if (!familyId.value) {
    uni.stopPullDownRefresh();
    return;
  }
  await taskStore.refresh(familyId.value);
  uni.stopPullDownRefresh();
}

/** 滚动到底部加载更多 */
async function handleReachBottom(): Promise<void> {
  if (!familyId.value || taskStore.isLoading || taskStore.isLoadingMore) return;
  if (!taskStore.hasMore) return;
  await taskStore.loadMore(familyId.value);
}

// ========== Event Handlers ==========

/** 点击任务卡片 → 跳转详情页 */
function handleTaskClick(task: TaskListItem): void {
  uni.navigateTo({
    url: `/pages/task/detail?id=${task.id}&familyId=${familyId.value}`,
  });
}

/** 标记任务完成 */
async function handleCompleteTask(task: TaskListItem): Promise<void> {
  if (!familyId.value || !task.id) return;

  const result = await taskStore.doCompleteTask(familyId.value, task.id);

  if (result.success) {
    showStarAnimation.value = true;
    setTimeout(() => {
      showStarAnimation.value = false;
    }, 1000);

    uni.showToast({
      title: '任务已完成 ✨',
      icon: 'success',
      duration: 2000,
    });
  } else {
    uni.showToast({
      title: result.error || '操作失败',
      icon: 'error',
      duration: 2000,
    });
  }
}

/** 点击 FAB → 跳转创建任务页 */
function handleFabClick(): void {
  uni.navigateTo({
    url: '/pages/task/create',
  });
}

/** 切换家庭 → 弹出选择列表 */
function handleSwitchFamily(): void {
  const items = familyStore.families.map((f) => f.name || '未命名家庭');
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const selected = familyStore.families[res.tapIndex];
      if (selected) {
        familyStore.selectFamily(selected);
      }
    },
  });
}

/** 切换筛选 Tab */
async function handleFilterChange(filter: string): Promise<void> {
  if (!familyId.value) return;
  await taskStore.switchFilter(familyId.value, filter);
}

// ========== Watchers ==========

/** 监听家庭切换 → 重新加载全部数据 */
watch(familyId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    initialLoad();
  }
});

// ========== Lifecycle ==========

onMounted(async () => {
  // 确保 family store 已初始化
  if (!familyStore.isInitialized) {
    await familyStore.loadFamilies();
  }

  if (familyId.value) {
    await initialLoad();
  }
});

// onShow 时静默刷新（从详情/创建页返回时同步最新数据）
let hasShown = false;
onShow(() => {
  if (!hasShown) {
    hasShown = true;
    return;
  }
  if (familyId.value) {
    silentRefresh();
  }
});

onPullDownRefresh(() => {
  handlePullDownRefresh();
});

onReachBottom(() => {
  handleReachBottom();
});
</script>

<template>
  <AuthGuard>
    <view class="task-home">
      <!-- ========== 自定义 Header ========== -->
      <view class="task-home__header">
        <text class="task-home__header-title">{{ familyName || '家庭任务' }}</text>
        <view
          v-if="familyStore.families.length > 1"
          class="task-home__header-switch"
          @tap="handleSwitchFamily"
        >
          <text class="task-home__header-switch-text">切换家庭</text>
          <text class="task-home__header-switch-arrow">▾</text>
        </view>
      </view>

      <!-- ========== 逾期/临近到期 Banner ========== -->
      <OverdueBanner
        :overdue-tasks="(taskStore.overdueTasks as TaskListItem[])"
        :near-expiry-tasks="(taskStore.nearExpiryTasks as TaskListItem[])"
        @task-click="handleTaskClick"
        @complete="handleCompleteTask"
      />

      <!-- ========== 状态筛选 Tab ========== -->
      <TaskFilter
        :model-value="taskStore.currentFilter"
        :tab-counts="taskStore.tabCounts"
        @update:model-value="handleFilterChange"
      />

      <!-- ========== 加载中 ========== -->
      <LoadingSpinner
        v-if="taskStore.isLoading && isFirstLoad"
        text="加载中..."
      />

      <!-- ========== 错误提示 ========== -->
      <view v-else-if="taskStore.error && taskStore.tasks.length === 0" class="task-home__error">
        <text class="task-home__error-icon">😵</text>
        <text class="task-home__error-text">{{ taskStore.error }}</text>
        <view class="task-home__error-retry" @tap="handlePullDownRefresh">
          <text class="task-home__error-retry-text">点击重试</text>
        </view>
      </view>

      <!-- ========== 空状态 ========== -->
      <EmptyState
        v-else-if="taskStore.isEmpty"
        :filter="taskStore.currentFilter"
      />

      <!-- ========== 任务卡片列表 ========== -->
      <template v-else>
        <view class="task-home__card-list">
          <TaskCard
            v-for="task in (taskStore.tasks as TaskListItem[])"
            :key="task.id"
            :task="task"
            highlight-type="normal"
            @click="handleTaskClick"
            @complete="handleCompleteTask"
          />
        </view>

        <!-- 加载更多中 -->
        <view v-if="taskStore.isLoadingMore" class="task-home__loading-more">
          <text class="task-home__loading-more-text">加载更多...</text>
        </view>

        <!-- 没有更多 -->
        <view
          v-if="!taskStore.hasMore && taskStore.tasks.length > 0"
          class="task-home__no-more"
        >
          <text class="task-home__no-more-text">— 已加载全部 —</text>
        </view>
      </template>

      <!-- ========== 浮动创建按钮（CHILD 角色隐藏）========== -->
      <FloatingActionButton
        :visible="showFab"
        @click="handleFabClick"
      />

      <!-- ========== 任务完成星星动画 ========== -->
      <StarBurst v-model:visible="showStarAnimation" />
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.task-home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  position: relative;
  padding-bottom: calc(env(safe-area-inset-bottom) + 80px);
}

/* ========== Header ========== */
.task-home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-lg);
  padding-top: calc(var(--status-bar-height, 0px) + var(--space-lg));
  background: var(--color-primary);
  position: sticky;
  top: 0;
  z-index: 10;
}

.task-home__header-title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-h1);
  color: var(--color-white);
}

.task-home__header-switch {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
}

.task-home__header-switch-text {
  font-size: var(--font-size-caption);
  color: var(--color-white);
}

.task-home__header-switch-arrow {
  font-size: var(--font-size-caption);
  color: var(--color-white);
}

/* ========== 错误状态 ========== */
.task-home__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2xl) 0;
  gap: var(--space-md);
}

.task-home__error-icon {
  font-size: 40px;
}

.task-home__error-text {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.task-home__error-retry {
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-primary);
  border-radius: var(--radius-lg);
}

.task-home__error-retry-text {
  font-size: var(--font-size-caption);
  color: var(--color-white);
  font-weight: var(--font-weight-small);
}

/* ========== 卡片列表 ========== */
.task-home__card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
}

/* ========== 加载更多 ========== */
.task-home__loading-more {
  display: flex;
  justify-content: center;
  padding: var(--space-md) 0;
}

.task-home__loading-more-text {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

/* ========== 已加载全部 ========== */
.task-home__no-more {
  display: flex;
  justify-content: center;
  padding: var(--space-lg) 0 var(--space-2xl);
}

.task-home__no-more-text {
  font-size: var(--font-size-small);
  color: var(--color-border);
}
</style>
