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
    filePath,
    name: 'file',
    // Note: uni-app handles multipart form data automatically with filePath
  });
}
