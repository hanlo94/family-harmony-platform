import { defineStore } from 'pinia';
import { ref } from 'vue';

// Family store - current family, members, stats
export const useFamilyStore = defineStore('family', () => {
  const currentFamily = ref<Record<string, unknown> | null>(null);
  const members = ref<Record<string, unknown>[]>([]);

  return { currentFamily, members };
});
