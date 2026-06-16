import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// 全局样式（Design Token CSS 变量 + 全局 SCSS）
import './styles/variables.css';
import './styles/global.scss';

/**
 * 应用入口
 *
 * uni-app 要求导出 createApp() 函数，返回 { app } 对象
 * Pinia 在此注册，所有页面/组件均可通过 useXxxStore() 使用
 */
export function createApp() {
  const app = createSSRApp(App);

  // 注册 Pinia 状态管理
  const pinia = createPinia();
  app.use(pinia);

  return {
    app,
    pinia,
  };
}
