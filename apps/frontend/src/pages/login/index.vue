<script setup lang="ts">
/**
 * 登录页 — 微信 OAuth 一键登录 / 开发模式登录
 *
 * 支持双平台登录流程：
 * - H5（微信浏览器内）：跳转微信 OAuth 授权页 → 回调后提取 code → POST /api/auth/wechat/h5/login
 * - H5（非微信浏览器）：开发模式 — 点击测试用户按钮 → POST /api/auth/wechat/h5/login（code = test_xxx）
 * - 小程序：调用 uni.login 获取 code → POST /api/auth/wechat/mp/login
 *
 * 登录成功后：switchTab 到首页（任务列表）
 *
 * ## 开发模式
 * 在非微信浏览器中，直接使用 test_ 前缀的 code 登录，后端会将其作为 openid 使用。
 * 预置的测试用户（由后端 seed 创建）：
 *   - test_openid_user1 → 爸爸（ORGANIZER 角色）
 *   - test_openid_user2 → 妈妈（MEMBER 角色）
 *   - test_openid_user3 → 小明（CHILD 角色）
 */
import { ref, onMounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAuthStore } from '../../stores/auth';
import { isWechatBrowser } from '../../utils/wechat';
import WechatLoginButton from '../../components/WechatLoginButton.vue';

const authStore = useAuthStore();
const loading = ref(false);
const loginError = ref('');

/** WeChat 公众号 AppID（从环境变量注入） */
const WECHAT_H5_APP_ID = import.meta.env.VITE_WECHAT_H5_APP_ID || '';

const inWechat = computed(() => isWechatBrowser());

/** 测试用户列表（开发模式使用） */
const testUsers = [
  { label: '爸爸（组织者）', code: 'test_openid_user1', icon: '👨' },
  { label: '妈妈（成员）', code: 'test_openid_user2', icon: '👩' },
  { label: '小明（孩子）', code: 'test_openid_user3', icon: '🧒' },
];

// ========== 生命周期 ==========

onMounted(async () => {
  // 如果已经登录 → 直接跳到首页
  if (!authStore.isInitialized) {
    await authStore.initFromStorage();
  }
  if (authStore.isLoggedIn) {
    uni.switchTab({ url: '/pages/index/index' });
    return;
  }

  // H5 环境：检查 URL 是否包含微信回调 code（仅微信浏览器内）
  // #ifdef H5
  if (isWechatBrowser()) {
    handleH5Callback();
  }
  // #endif
});

onLoad(() => {
  // 页面加载时的额外初始化（uni-app 页面生命周期）
});

// ========== 登录处理 ==========

/** 处理微信登录按钮点击 */
async function handleWechatLogin(): Promise<void> {
  loginError.value = '';
  loading.value = true;

  try {
    // #ifdef MP-WEIXIN
    await handleMpLogin();
    // #endif

    // #ifdef H5
    await handleH5Login();
    // #endif
  } catch {
    loginError.value = '登录失败，请重试';
  } finally {
    loading.value = false;
  }
}

/** 开发模式登录：使用测试 code 直接调用后端 */
async function handleDevLogin(code: string): Promise<void> {
  loginError.value = '';
  loading.value = true;

  try {
    const result = await authStore.doLoginByWechatH5(code);
    if (result.success) {
      uni.switchTab({ url: '/pages/index/index' });
    } else {
      loginError.value = result.error || '登录失败，请重试';
      uni.showToast({ title: loginError.value, icon: 'none' });
    }
  } catch {
    loginError.value = '网络异常，请重试';
  } finally {
    loading.value = false;
  }
}

/** H5 登录：跳转微信 OAuth 授权页 */
async function handleH5Login(): Promise<void> {
  if (!WECHAT_H5_APP_ID) {
    // 开发环境无微信 AppID 时，直接提示或降级
    uni.showToast({ title: '请在环境变量中配置 VITE_WECHAT_H5_APP_ID', icon: 'none', duration: 3000 });
    return;
  }

  // 当前页作为回调地址
  const redirectUri = encodeURIComponent(window.location.href.split('?')[0]!);
  const state = Date.now().toString(36);
  const oauthUrl =
    `https://open.weixin.qq.com/connect/oauth2/authorize` +
    `?appid=${WECHAT_H5_APP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=snsapi_userinfo` +
    `&state=${state}` +
    `#wechat_redirect`;

  window.location.href = oauthUrl;
}

/** H5 回调处理：从 URL 提取 code 并换取 JWT */
async function handleH5Callback(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (!code) return; // 无 code 参数，用户尚未完成 OAuth

  loading.value = true;
  const result = await authStore.doLoginByWechatH5(code);

  if (result.success) {
    // 清除 URL 中的 code 参数，避免刷新时重复使用
    window.history.replaceState({}, '', window.location.pathname);
    uni.switchTab({ url: '/pages/index/index' });
  } else {
    loginError.value = result.error || '微信登录失败，请重试';
    uni.showToast({ title: loginError.value, icon: 'none' });
  }
  loading.value = false;
}

/** 小程序登录：uni.login → code → 后端换取 JWT */
async function handleMpLogin(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loginResult: any = await new Promise((resolve, reject) => {
    uni.login({
      success: resolve,
      fail: reject,
    });
  });

  if (!loginResult.code) {
    loginError.value = '获取微信登录凭证失败';
    uni.showToast({ title: loginError.value, icon: 'none' });
    return;
  }

  const result = await authStore.doLoginByWechatMp(loginResult.code);
  if (result.success) {
    uni.switchTab({ url: '/pages/index/index' });
  } else {
    loginError.value = result.error || '登录失败，请重试';
    uni.showToast({ title: loginError.value, icon: 'none' });
  }
}
</script>

<template>
  <view class="login-page">
    <!-- Logo / 品牌区 -->
    <view class="login-page__brand">
      <view class="login-page__logo">🏠</view>
      <text class="login-page__app-name">家庭和谐平台</text>
      <text class="login-page__tagline">公平分配家务，告别互相催促</text>
    </view>

    <!-- 登录按钮区 -->
    <view class="login-page__actions">
      <!-- H5 微信浏览器环境 → 微信一键登录 -->
      <template v-if="inWechat">
        <WechatLoginButton :loading="loading" @login="handleWechatLogin" />

        <!-- 错误提示 -->
        <text v-if="loginError" class="login-page__error">{{ loginError }}</text>
      </template>

      <!-- H5 非微信环境（开发模式）→ 测试用户快捷登录 -->
      <!-- #ifdef H5 -->
      <template v-else>
        <text class="login-page__dev-title">选择测试用户登录</text>
        <view class="login-page__test-users">
          <button
            v-for="user in testUsers"
            :key="user.code"
            class="login-page__test-user-btn"
            :disabled="loading"
            @click="handleDevLogin(user.code)"
          >
            <text class="login-page__test-user-icon">{{ user.icon }}</text>
            <text class="login-page__test-user-label">{{ user.label }}</text>
          </button>
        </view>

        <!-- 错误提示 -->
        <text v-if="loginError" class="login-page__error">{{ loginError }}</text>

        <!-- 开发模式提示 -->
        <text class="login-page__dev-hint">
          非微信环境使用测试账号登录。正式环境请在微信客户端中打开。
        </text>
      </template>
      <!-- #endif -->
    </view>

    <!-- 底部说明 -->
    <view class="login-page__footer">
      <text class="login-page__footer-text">
        登录即表示同意《用户协议》和《隐私政策》
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-2xl) var(--space-lg);
  background: var(--color-bg);
  gap: var(--space-2xl);

  /* ========== 品牌区 ========== */
  &__brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }

  &__logo {
    font-size: 64px;
    line-height: 1;
  }

  &__app-name {
    font-family: var(--font-body);
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-h1);
    color: var(--color-text);
  }

  &__tagline {
    font-family: var(--font-body);
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);
    margin-top: var(--space-xs);
  }

  /* ========== 登录按钮区 ========== */
  &__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }

  &__error {
    font-size: var(--font-size-caption);
    color: var(--color-rose);
    text-align: center;
    max-width: 280px;
  }

  /* ========== 底部说明 ========== */
  &__footer {
    position: absolute;
    bottom: var(--space-2xl);
  }

  &__footer-text {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  /* ========== 开发模式 ========== */
  &__dev-title {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-sm);
  }

  &__test-users {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 260px;
  }

  &__test-user-btn {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
    height: 52px;
    padding: 0 var(--space-lg);
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-body);
    color: var(--color-text);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:active {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(61, 107, 90, 0.15);
    }

    &:disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &__test-user-icon {
    font-size: 24px;
  }

  &__test-user-label {
    font-size: var(--font-size-body);
    color: var(--color-text);
  }

  &__dev-hint {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    text-align: center;
    max-width: 260px;
    margin-top: var(--space-md);
    line-height: 1.5;
  }
}
</style>
