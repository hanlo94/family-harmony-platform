/**
 * 微信环境检测工具
 *
 * 用于判断当前运行环境是否为微信客户端浏览器，
 * 以及是否为微信小程序环境。
 */

/**
 * 检测当前是否在微信环境中
 *
 * - H5：检查 User-Agent 是否包含 "MicroMessenger"（微信内置浏览器）
 * - 微信小程序：始终返回 true
 * - 其他平台：返回 false
 */
export function isWechatBrowser(): boolean {
  // #ifdef H5
  return /micromessenger/i.test(navigator.userAgent);
  // #endif
  // #ifdef MP-WEIXIN
  return true;
  // #endif
  return false;
}

/**
 * 检测当前是否在微信小程序中
 */
export function isWechatMiniProgram(): boolean {
  // #ifdef MP-WEIXIN
  return true;
  // #endif
  return false;
}
