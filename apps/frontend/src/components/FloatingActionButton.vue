<script setup lang="ts">
/**
 * FloatingActionButton — 浮动操作按钮（FAB）
 *
 * 页面右下角固定的"+"创建任务按钮。
 * - CHILD 角色：隐藏
 * - MEMBER / ORGANIZER 角色：显示
 *
 * Props:
 *   visible — 控制可见性（默认 true）
 */
withDefaults(
  defineProps<{
    visible?: boolean;
  }>(),
  { visible: true },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <view
    v-if="visible"
    class="fab"
    @tap="emit('click')"
  >
    <text class="fab__icon">＋</text>
  </view>
</template>

<style lang="scss" scoped>
.fab {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  box-shadow: var(--shadow-fab);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;

  &:active {
    transform: scale(0.92);
  }

  &__icon {
    font-size: 28px;
    color: var(--color-white);
    font-weight: 300;
    line-height: 1;
    margin-top: -1px;
  }
}
</style>
