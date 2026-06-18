/**
 * 日期格式化工具
 *
 * 提供任务截止时间的显示格式化，包括：
 * - 时间格式化（HH:mm）
 * - 日期格式化（M月D日）
 * - 逾期时长计算（已逾期 Xh / X天）
 * - 剩余时间计算（还剩 X 分钟 / X 小时）
 */

/** 格式化 ISO 时间为 HH:mm 显示 */
export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** 格式化 ISO 时间为 "M月D日 HH:mm" */
export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日 ${formatTime(isoString)}`;
}

/** 格式化 ISO 时间为相对日期显示 */
export function formatRelativeDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `今天 ${formatTime(isoString)}`;
  if (diffDays === -1) return `昨天 ${formatTime(isoString)}`;
  if (diffDays === 1) return `明天 ${formatTime(isoString)}`;
  return formatDateTime(isoString);
}

/** 计算逾期时长文本（如 "已逾期 12h"、"已逾期 2天"） */
export function getOverdueText(deadline: string): string {
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `已逾期 ${diffMinutes}分钟`;
  if (diffHours < 24) return `已逾期 ${diffHours}h`;
  return `已逾期 ${diffDays}天`;
}

/** 计算剩余时间文本（如 "还剩 45 分钟"、"还剩 1 小时"） */
export function getRemainingText(deadline: string): string {
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return '';
  const diffMs = d.getTime() - Date.now();
  if (diffMs <= 0) return '已到期';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 60) return `还剩 ${diffMinutes} 分钟`;
  return `还剩 ${diffHours} 小时`;
}

/** 判断任务是否已逾期 */
export function isOverdue(deadline: string): boolean {
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  return Date.now() > d.getTime();
}

/** 判断任务是否临近到期（1小时内） */
export function isNearExpiry(deadline: string): boolean {
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  const diffMs = d.getTime() - Date.now();
  return diffMs > 0 && diffMs <= 60 * 60 * 1000;
}
