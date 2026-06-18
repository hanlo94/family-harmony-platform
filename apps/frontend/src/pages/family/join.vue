<script setup lang="ts">
/**
 * 加入家庭页 — 输入邀请码加入
 *
 * 支持从 URL 参数预填邀请码（如 /pages/family/join?code=ABC123）。
 * 加入成功后跳转到家庭页。
 *
 * 设计参考: docs/ui-design.md §4.5
 */
import { ref } from 'vue';
import { useFamilyStore } from '../../stores/family';
import AuthGuard from '../../components/AuthGuard.vue';
import JoinForm from '../../components/JoinForm.vue';

const familyStore = useFamilyStore();
const loading = ref(false);

/** 提交邀请码 */
async function handleSubmit(code: string): Promise<void> {
  loading.value = true;
  const result = await familyStore.doJoinFamily(code);
  loading.value = false;

  if (result.success) {
    uni.showToast({
      title: `已加入「${result.familyName || '家庭'}」`,
      icon: 'success',
      duration: 2000,
    });
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      uni.switchTab({ url: '/pages/family/index' });
    }, 1500);
  } else {
    uni.showToast({ title: result.error || '加入失败，请检查邀请码', icon: 'none' });
  }
}
</script>

<template>
  <AuthGuard>
    <view class="join-page">
      <JoinForm
        :loading="loading"
        @submit="handleSubmit"
      />
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.join-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
