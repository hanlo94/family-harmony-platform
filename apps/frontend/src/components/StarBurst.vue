<script setup lang="ts">
/**
 * StarBurst — 任务完成星星动画组件
 *
 * 在任务标记完成后播放一段"星星爆发"动画：
 * - 1 颗大星 ⭐ 居中旋转缩放
 * - 4 颗小星星 ✨ 向四周散开
 * - 动画持续 1 秒后自动消失
 *
 * 用法：
 *   <StarBurst v-model:visible="showAnimation" />
 *
 * 设计参考: docs/ui-design.md §7 动效设计 — 任务完成星星动画（视觉签名）
 */
import { watch, ref } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

/** 小星星位置配置（4 颗，分别向四个角散开） */
const particles = [
  { id: 1, x: -50, y: -40, delay: 0, size: 24 },
  { id: 2, x: 50, y: -35, delay: 0.05, size: 20 },
  { id: 3, x: -45, y: 40, delay: 0.1, size: 22 },
  { id: 4, x: 45, y: 35, delay: 0.08, size: 18 },
];

/** 内部动画状态 */
const animating = ref(false);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      animating.value = true;
      setTimeout(() => {
        animating.value = false;
        emit('update:visible', false);
      }, 1000);
    }
  },
);
</script>

<template>
  <view v-if="animating" class="star-burst">
    <!-- 主星 -->
    <text class="star-burst__main">⭐</text>
    <!-- 小星星粒子 -->
    <text
      v-for="p in particles"
      :key="p.id"
      class="star-burst__particle"
      :style="{
        '--particle-x': `${p.x}px`,
        '--particle-y': `${p.y}px`,
        '--particle-delay': `${p.delay}s`,
        '--particle-size': `${p.size}px`,
      }"
    >✨</text>
  </view>
</template>

<style lang="scss" scoped>
.star-burst {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 200;
  pointer-events: none;
}

/* ========== 主星 ⭐ ========== */
.star-burst__main {
  font-size: 60px;
  display: block;
  position: absolute;
  top: -30px;
  left: -30px;
  animation: star-burst-main 1s ease-out forwards;
}

@keyframes star-burst-main {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(0deg);
  }
  30% {
    opacity: 1;
    transform: scale(1.3) rotate(120deg);
  }
  60% {
    transform: scale(1) rotate(240deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) rotate(360deg) translateY(-40px);
  }
}

/* ========== 小星星粒子 ✨ ========== */
.star-burst__particle {
  position: absolute;
  top: 0;
  left: 0;
  font-size: var(--particle-size);
  opacity: 0;
  animation: star-burst-particle 1s ease-out forwards;
  animation-delay: var(--particle-delay);
}

@keyframes star-burst-particle {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--particle-x), var(--particle-y)) scale(1.2);
  }
}
</style>
