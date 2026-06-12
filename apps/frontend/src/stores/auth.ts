import { defineStore } from 'pinia';
import { ref } from 'vue';

// Auth store - user info, token management, login/logout
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const user = ref<Record<string, unknown> | null>(null);

  const isLoggedIn = () => !!token.value;

  return { token, refreshToken, user, isLoggedIn };
});
