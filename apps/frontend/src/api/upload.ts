/**
 * Upload API module
 *
 * Endpoints:
 * - POST /upload/image — 上传图片
 */

import type { components } from '../types/api';
import { apiRequest } from './request';

type UploadResponse = components['schemas']['UploadResponse'];

/** 上传图片（jpg/png/webp，最大 5MB） */
export async function uploadImage(filePath: string) {
  return apiRequest<UploadResponse>('/upload/image', {
    method: 'POST',
    // uni-app 通过 filePath + name 自动处理 multipart form data
    // 类型断言：uni.request 运行时支持 filePath 参数
    ...{ filePath, name: 'file' },
  } as unknown as UniApp.RequestOptions);
}
