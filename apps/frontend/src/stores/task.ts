import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { components } from '../types/api';
import {
  getTaskList,
  completeTask as completeTaskApi,
  type TaskListQuery,
} from '../api/task';

type TaskListItem = components['schemas']['TaskListItem'];

/** 状态筛选 Tab 配置 */
export const STATUS_TABS = [
  { key: 'PENDING_COMPLETION', label: '待完成' },
  { key: 'PENDING_VERIFICATION', label: '待验收' },
  { key: 'REJECTED', label: '已驳回' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
] as const;

/**
 * Task Store — 任务列表、逾期/临近到期专区、状态筛选、分页
 *
 * 使用 Setup Store（组合式）语法，符合前端规范。
 *
 * 数据流：
 * - overdueTasks / nearExpiryTasks → OverdueBanner 组件
 * - tasks + pagination → 主列表（配合 TaskFilter + TaskCard）
 * - completeTask → 调后端 API，成功后本地移除/更新
 */
export const useTaskStore = defineStore('task', () => {
  // ========== State ==========

  /** 当前筛选状态下的任务列表 */
  const tasks = ref<TaskListItem[]>([]);

  /** 逾期任务（用于 OverdueBanner 逾期专区） */
  const overdueTasks = ref<TaskListItem[]>([]);

  /** 临近到期任务（用于 OverdueBanner 临近到期专区） */
  const nearExpiryTasks = ref<TaskListItem[]>([]);

  /** 当前选中的状态筛选 */
  const currentFilter = ref<string>('PENDING_COMPLETION');

  /** 分页状态 */
  const pagination = ref({ page: 1, pageSize: 20, total: 0 });

  /** 各 Tab 的任务计数（键为 status，值为总数） */
  const tabCounts = ref<Record<string, number>>({});

  /** 是否正在加载主列表 */
  const isLoading = ref(false);

  /** 是否正在加载逾期/临近到期 */
  const isLoadingBanner = ref(false);

  /** 是否正在加载更多 */
  const isLoadingMore = ref(false);

  /** 错误信息 */
  const error = ref<string | null>(null);

  /** 上次加载的家庭 ID（用于检测家庭切换） */
  const lastFamilyId = ref<string | null>(null);

  // ========== Getters ==========

  /** 是否有更多任务可加载 */
  const hasMore = computed(() => pagination.value.total > tasks.value.length);

  /** 逾期任务数量 */
  const overdueCount = computed(() => overdueTasks.value.length);

  /** 临近到期任务数量 */
  const nearExpiryCount = computed(() => nearExpiryTasks.value.length);

  /** 是否有需要展示的 banner（逾期或临近到期） */
  const hasBannerTasks = computed(
    () => overdueTasks.value.length > 0 || nearExpiryTasks.value.length > 0,
  );

  /** 当前列表是否为空 */
  const isEmpty = computed(() => !isLoading.value && tasks.value.length === 0);

  // ========== Actions ==========

  /**
   * 加载逾期和临近到期任务（用于首页 Banner 专区）
   *
   * 并行请求两个接口，互不影响。
   */
  async function loadOverdueAndNearExpiry(familyId: string): Promise<void> {
    isLoadingBanner.value = true;
    try {
      const [overdueResult, nearExpiryResult] = await Promise.all([
        getTaskList(familyId, { overdue: true, pageSize: 10 }),
        getTaskList(familyId, { nearExpiry: true, pageSize: 10 }),
      ]);

      if (overdueResult.data) {
        overdueTasks.value = (overdueResult.data.items || []) as TaskListItem[];
      }
      if (nearExpiryResult.data) {
        nearExpiryTasks.value = (nearExpiryResult.data.items || []) as TaskListItem[];
      }
    } catch {
      // 静默处理，banner 区域非关键路径
    } finally {
      isLoadingBanner.value = false;
    }
  }

  /**
   * 按筛选条件加载任务列表（首页列表）
   *
   * @param familyId - 当前家庭 ID
   * @param filter - 状态筛选（默认使用 currentFilter）
   * @param append - 是否追加到现有列表（加载更多），默认 false 替换
   */
  async function loadTasks(
    familyId: string,
    filter?: string,
    append = false,
  ): Promise<void> {
    const statusFilter = filter ?? currentFilter.value;

    if (append) {
      isLoadingMore.value = true;
    } else {
      isLoading.value = true;
      error.value = null;
    }

    const page = append ? pagination.value.page + 1 : 1;

    try {
      const query: TaskListQuery = {
        status: statusFilter,
        page,
        pageSize: pagination.value.pageSize,
      };

      const result = await getTaskList(familyId, query);

      if (result.data) {
        const items = (result.data.items || []) as TaskListItem[];
        if (append) {
          tasks.value = [...tasks.value, ...items];
        } else {
          tasks.value = items;
        }
        pagination.value = {
          page,
          pageSize: pagination.value.pageSize,
          total: result.data.total || 0,
        };

        // 更新当前 Tab 计数
        tabCounts.value = {
          ...tabCounts.value,
          [statusFilter]: result.data.total || 0,
        };
      } else if (result.error) {
        error.value = result.error.message || '加载失败';
      }
    } catch {
      error.value = '网络异常，请重试';
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  }

  /**
   * 切换状态筛选 Tab
   *
   * 更新 currentFilter 并重新加载任务列表。
   */
  async function switchFilter(familyId: string, filter: string): Promise<void> {
    if (currentFilter.value === filter) return;
    currentFilter.value = filter;
    await loadTasks(familyId, filter);
  }

  /**
   * 加载更多任务（滚动到底部）
   */
  async function loadMore(familyId: string): Promise<void> {
    if (!hasMore.value || isLoadingMore.value) return;
    await loadTasks(familyId, currentFilter.value, true);
  }

  /**
   * 下拉刷新：重新加载 banner + 当前列表
   */
  async function refresh(familyId: string): Promise<void> {
    await Promise.all([
      loadOverdueAndNearExpiry(familyId),
      loadTasks(familyId, currentFilter.value),
    ]);
  }

  /**
   * 标记任务完成
   *
   * 调用后端 API，成功后从本地列表中移除该任务，
   * 同时更新 Tab 计数和 banner 区域。
   */
  async function doCompleteTask(
    familyId: string,
    taskId: string,
    completionNote?: string,
    completionPhoto?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await completeTaskApi(familyId, taskId, {
        completionNote: completionNote ?? null,
        completionPhoto: completionPhoto ?? null,
      });

      if (result.data) {
        // 从主列表中移除
        tasks.value = tasks.value.filter((t) => t.id !== taskId);
        // 从逾期列表中移除
        overdueTasks.value = overdueTasks.value.filter((t) => t.id !== taskId);
        // 从临近到期列表中移除
        nearExpiryTasks.value = nearExpiryTasks.value.filter((t) => t.id !== taskId);
        // 更新计数
        const oldCount = tabCounts.value[currentFilter.value] || 0;
        if (oldCount > 0) {
          tabCounts.value = {
            ...tabCounts.value,
            [currentFilter.value]: oldCount - 1,
          };
        }
        return { success: true };
      }
      return { success: false, error: result.error?.message || '操作失败' };
    } catch {
      return { success: false, error: '网络异常，请重试' };
    }
  }

  /**
   * 检查是否需要重新加载（家庭切换时调用）
   *
   * 如果 familyId 与上次不同，则重置状态并返回 true。
   */
  function checkFamilyChange(familyId: string): boolean {
    if (lastFamilyId.value !== familyId) {
      lastFamilyId.value = familyId;
      reset();
      return true;
    }
    return false;
  }

  /** 重置所有状态 */
  function reset(): void {
    tasks.value = [];
    overdueTasks.value = [];
    nearExpiryTasks.value = [];
    currentFilter.value = 'PENDING_COMPLETION';
    pagination.value = { page: 1, pageSize: 20, total: 0 };
    tabCounts.value = {};
    error.value = null;
  }

  return {
    // State
    tasks,
    overdueTasks,
    nearExpiryTasks,
    currentFilter,
    pagination,
    tabCounts,
    isLoading,
    isLoadingBanner,
    isLoadingMore,
    error,
    // Getters
    hasMore,
    overdueCount,
    nearExpiryCount,
    hasBannerTasks,
    isEmpty,
    // Actions
    loadOverdueAndNearExpiry,
    loadTasks,
    switchFilter,
    loadMore,
    refresh,
    doCompleteTask,
    checkFamilyChange,
    reset,
  };
});
