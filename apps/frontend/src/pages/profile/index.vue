<script setup lang="ts">
/**
 * 个人中心 — TabBar 第三个 Tab
 *
 * 功能：
 * - 用户信息展示（头像 + 昵称）
 * - 提醒设置入口 → /pages/profile/settings
 * - 关于我们
 * - 退出登录
 *
 * 设计参考: docs/ui-design.md §4.6、§5 组件树
 */
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useFamilyStore } from '../../stores/family';
import AuthGuard from '../../components/AuthGuard.vue';

const authStore = useAuthStore();
const familyStore = useFamilyStore();

/** 关于我们弹窗 */
const showAboutDialog = ref(false);

/** 退出登录确认中 */
const isLoggingOut = ref(false);

// ========== 页面跳转 ==========

/** 跳转提醒设置页 */
function goToSettings(): void {
  uni.navigateTo({ url: '/pages/profile/settings' });
}

/** 显示关于我们 */
function openAbout(): void {
  showAboutDialog.value = true;
}

/** 关闭关于我们 */
function closeAbout(): void {
  showAboutDialog.value = false;
}

// ========== 退出登录 ==========

/** 退出登录 */
async function handleLogout(): Promise<void> {
  uni.showModal({
    title: '确认退出',
    content: '退出后需要重新登录，确认退出吗？',
    confirmText: '退出',
    cancelText: '取消',
    confirmColor: '#E8A4A0',
    success: async (res) => {
      if (res.confirm) {
        isLoggingOut.value = true;
        try {
          await authStore.doLogout();
          // 清除 family store 状态
          familyStore.$reset();
          // 清除本地存储的家庭 ID
          uni.removeStorageSync('currentFamilyId');
          // 重新启动到登录页，清除页面栈
          uni.reLaunch({ url: '/pages/login/index' });
        } catch {
          uni.showToast({ title: '退出失败，请重试', icon: 'none' });
        } finally {
          isLoggingOut.value = false;
        }
      }
    },
  });
}
</script>

<template>
  <AuthGuard>
    <view class="profile">
      <!-- ========== 头部：用户信息 ========== -->
      <view class="profile__header">
        <view class="profile__avatar">
          <image
            v-if="authStore.user?.avatarUrl"
            class="profile__avatar-img"
            :src="authStore.user.avatarUrl"
            mode="aspectFill"
          />
          <text v-else class="profile__avatar-placeholder">
            {{ (authStore.user?.nickname || '用')[0] }}
          </text>
        </view>
        <text class="profile__nickname">
          {{ authStore.user?.nickname || '用户' }}
        </text>
        <text
          v-if="familyStore.currentFamily"
          class="profile__current-family"
        >
          当前家庭：{{ familyStore.currentFamilyName }}
        </text>
      </view>

      <!-- ========== 设置列表 ========== -->
      <view class="profile__section">
        <text class="profile__section-title">设置</text>

        <view class="profile__menu">
          <!-- 提醒设置 -->
          <view class="profile__menu-item" @click="goToSettings">
            <view class="profile__menu-item-left">
              <text class="profile__menu-item-icon">🔔</text>
              <text class="profile__menu-item-label">提醒设置</text>
            </view>
            <text class="profile__menu-item-arrow">›</text>
          </view>

          <!-- 关于我们 -->
          <view class="profile__menu-item" @click="openAbout">
            <view class="profile__menu-item-left">
              <text class="profile__menu-item-icon">ℹ️</text>
              <text class="profile__menu-item-label">关于我们</text>
            </view>
            <text class="profile__menu-item-arrow">›</text>
          </view>

          <!-- 退出登录 -->
          <view
            class="profile__menu-item profile__menu-item--danger"
            @click="handleLogout"
          >
            <view class="profile__menu-item-left">
              <text class="profile__menu-item-icon">🚪</text>
              <text class="profile__menu-item-label profile__menu-item-label--danger">
                {{ isLoggingOut ? '退出中...' : '退出登录' }}
              </text>
            </view>
            <text class="profile__menu-item-arrow profile__menu-item-arrow--danger">›</text>
          </view>
        </view>
      </view>

      <!-- ========== 关于我们弹窗 ========== -->
      <view v-if="showAboutDialog" class="profile__overlay" @click="closeAbout">
        <view class="profile__about-dialog" @click.stop>
          <text class="profile__about-title">关于我们</text>
          <view class="profile__about-content">
            <text class="profile__about-icon">🏠</text>
            <text class="profile__about-name">家庭和谐平台</text>
            <text class="profile__about-version">v1.0.0</text>
            <text class="profile__about-desc">
              帮助家庭公平分配家务的游戏化协作平台。用温暖的提醒替代唠叨，让每个家庭成员都能感受到被看见和被感谢。
            </text>
          </view>
          <button class="profile__about-close" @click="closeAbout">
            我知道了
          </button>
        </view>
      </view>
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.profile {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: var(--space-2xl);

  /* ========== 头部 ========== */
  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-2xl) var(--space-lg) var(--space-xl);
    background: var(--color-primary);
    position: relative;
  }

  &__avatar {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-md);
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.3);
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
  }

  &__avatar-placeholder {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-h1);
    color: var(--color-white);
  }

  &__nickname {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-white);
    margin-bottom: var(--space-xs);
  }

  &__current-family {
    font-size: var(--font-size-caption);
    color: rgba(255, 255, 255, 0.7);
  }

  /* ========== 设置区 ========== */
  &__section {
    margin-top: var(--space-lg);
  }

  &__section-title {
    display: block;
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    padding: 0 var(--space-lg);
    margin-bottom: var(--space-sm);
  }

  &__menu {
    margin: 0 var(--space-lg);
    background: var(--color-white);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  &__menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background: var(--color-surface);
    }

    &--danger {
      &:active {
        background: var(--color-overdue-bg);
      }
    }
  }

  &__menu-item-left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  &__menu-item-icon {
    font-size: 20px;
    width: 28px;
    text-align: center;
  }

  &__menu-item-label {
    font-size: var(--font-size-body);
    color: var(--color-text);

    &--danger {
      color: var(--color-rose);
    }
  }

  &__menu-item-arrow {
    font-size: 22px;
    color: var(--color-text-secondary);
    font-weight: 300;

    &--danger {
      color: var(--color-rose);
    }
  }

  /* ========== 关于我们弹窗 ========== */
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  &__about-dialog {
    width: calc(100vw - var(--space-2xl) * 2);
    max-width: 300px;
    background: var(--color-white);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__about-title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-h2);
    color: var(--color-text);
    margin-bottom: var(--space-lg);
  }

  &__about-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-xl);
  }

  &__about-icon {
    font-size: 40px;
    margin-bottom: var(--space-sm);
  }

  &__about-name {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-primary);
  }

  &__about-version {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  &__about-desc {
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    text-align: center;
    line-height: 1.6;
    margin-top: var(--space-sm);
  }

  &__about-close {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: var(--color-primary);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-body);
    color: var(--color-white);
    line-height: 1.4;

    &:active {
      opacity: 0.9;
    }
  }
}
</style>
