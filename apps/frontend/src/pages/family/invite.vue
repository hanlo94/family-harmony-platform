<script setup lang="ts">
/**
 * 邀请成员页 — 展示邀请码与分享
 *
 * 仅组织者可访问，展示当前家庭邀请码和链接，支持复制和分享。
 *
 * 设计参考: docs/ui-design.md §4.5
 */
import { ref, onMounted } from 'vue';
import { useFamilyStore } from '../../stores/family';
import AuthGuard from '../../components/AuthGuard.vue';
import InviteCard from '../../components/InviteCard.vue';

const familyStore = useFamilyStore();

/** 当前邀请信息 */
const inviteCode = ref('');
const inviteUrl = ref('');
const loading = ref(false);

onMounted(async () => {
  // 确保家庭数据已加载
  if (!familyStore.isInitialized) {
    await familyStore.loadFamilies();
  }

  // 检查权限
  if (!familyStore.isOrganizer) {
    uni.showToast({ title: '仅组织者可邀请成员', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return;
  }

  // 加载邀请码
  await loadOrCreateInvitation();
});

/** 加载或创建邀请码 */
async function loadOrCreateInvitation(): Promise<void> {
  // 已有邀请码则直接用
  if (familyStore.currentInviteCode) {
    inviteCode.value = familyStore.currentInviteCode;
    inviteUrl.value = `${window.location.origin}/#/pages/family/join?code=${inviteCode.value}`;
    return;
  }

  // 否则生成新的
  await refreshInvitation();
}

/** 生成新的邀请码 */
async function refreshInvitation(): Promise<void> {
  loading.value = true;
  const result = await familyStore.doCreateInvitation();
  loading.value = false;

  if (result) {
    inviteCode.value = result.code || '';
    inviteUrl.value = result.inviteUrl || '';
    uni.showToast({ title: '邀请码已生成', icon: 'success' });
  } else {
    uni.showToast({ title: '生成邀请码失败，请重试', icon: 'none' });
  }
}
</script>

<template>
  <AuthGuard>
    <view class="invite-page">
      <InviteCard
        :invite-code="inviteCode"
        :invite-url="inviteUrl"
        :loading="loading"
        @refresh="refreshInvitation"
      />
    </view>
  </AuthGuard>
</template>

<style lang="scss" scoped>
.invite-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
