/**
 * 业务错误码枚举
 *
 * 所有 API 响应统一使用此枚举作为 code 字段。
 * 错误码范围定义见 docs/api-design.md §1.4。
 */
export enum ErrorCode {
  // ── 成功 ──
  SUCCESS = 0,

  // ── 参数校验失败 (40001-40099) ──
  VALIDATION_ERROR = 40001,

  // ── 认证相关 (40100-40199) ──
  UNAUTHORIZED = 40100,
  TOKEN_EXPIRED = 40101,
  INVALID_TOKEN = 40102,

  // ── 权限相关 (40300-40399) ──
  PERMISSION_DENIED = 40300,
  NOT_FAMILY_MEMBER = 40301,
  CHILD_NOT_ALLOWED = 40302,

  // ── 上传相关 (40002-40009) ──
  FILE_TYPE_INVALID = 40002,
  FILE_SIZE_EXCEEDED = 40003,

  // ── 资源不存在 (40400-40499) ──
  NOT_FOUND = 40400,
  USER_NOT_FOUND = 40401,
  FAMILY_NOT_FOUND = 40402,
  TASK_NOT_FOUND = 40403,
  TEMPLATE_NOT_FOUND = 40404,

  // ── 业务冲突 (40900-40999) ──
  CONFLICT = 40900,
  ALREADY_FAMILY_MEMBER = 40901,
  INVITE_CODE_INVALID = 40902,
  INVITE_CODE_EXPIRED = 40903,
  TASK_STATUS_INVALID = 40904,
  TASK_ALREADY_COMPLETED = 40905,

  // ── 服务端错误 (50000-50099) ──
  INTERNAL_ERROR = 50000,
  DATABASE_ERROR = 50001,
  WECHAT_API_ERROR = 50002,
}

/**
 * 错误码对应的中文消息
 */
export const ErrorCodeMessage: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: '操作成功',

  [ErrorCode.VALIDATION_ERROR]: '参数校验失败',
  [ErrorCode.FILE_TYPE_INVALID]: '仅支持 JPG、PNG、WebP 格式',
  [ErrorCode.FILE_SIZE_EXCEEDED]: '文件大小不能超过 5MB',

  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期',
  [ErrorCode.TOKEN_EXPIRED]: 'Token 已过期',
  [ErrorCode.INVALID_TOKEN]: '无效的 Token',

  [ErrorCode.PERMISSION_DENIED]: '权限不足',
  [ErrorCode.NOT_FAMILY_MEMBER]: '不是家庭成员',
  [ErrorCode.CHILD_NOT_ALLOWED]: '孩子角色无权执行此操作',

  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.FAMILY_NOT_FOUND]: '家庭不存在',
  [ErrorCode.TASK_NOT_FOUND]: '任务不存在',
  [ErrorCode.TEMPLATE_NOT_FOUND]: '模板不存在',

  [ErrorCode.CONFLICT]: '业务冲突',
  [ErrorCode.ALREADY_FAMILY_MEMBER]: '已经是家庭成员',
  [ErrorCode.INVITE_CODE_INVALID]: '邀请码无效',
  [ErrorCode.INVITE_CODE_EXPIRED]: '邀请码已过期',
  [ErrorCode.TASK_STATUS_INVALID]: '任务状态不允许此操作',
  [ErrorCode.TASK_ALREADY_COMPLETED]: '任务已完成',

  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.DATABASE_ERROR]: '数据库异常',
  [ErrorCode.WECHAT_API_ERROR]: '微信 API 调用失败',
};

/**
 * 根据错误码推断对应的 HTTP 状态码
 */
export function getHttpStatus(errorCode: ErrorCode): number {
  const category = Math.floor(errorCode / 100);
  switch (category) {
    case 400:
      return 400;
    case 401:
      return 401;
    case 403:
      return 403;
    case 404:
      return 404;
    case 409:
      return 409;
    case 500:
      return 500;
    default:
      return 500;
  }
}
