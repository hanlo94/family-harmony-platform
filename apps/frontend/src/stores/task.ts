import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Task store - task list, overdue/computed states
export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Record<string, unknown>[]>([]);
  const overdueTasks = computed(() => tasks.value.filter(() => false));
  const nearExpiryTasks = computed(() => tasks.value.filter(() => false));

  return { tasks, overdueTasks, nearExpiryTasks };
});
