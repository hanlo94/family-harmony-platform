import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/constants/error-code';

/**
 * 上传响应格式
 */
export interface UploadResponse {
  url: string;
  originalName: string;
  size: number;
}

/**
 * Upload 服务
 *
 * 提供图片上传、类型校验、大小校验、本地文件存储。
 * MVC 简化方案：使用本地文件系统存储，按日期分目录，随机 UUID 命名。
 * 后续可迁移至 OSS。
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /** 允许的 MIME 类型 */
  private readonly ALLOWED_MIME_TYPES: Set<string> = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  /** 允许的文件扩展名 */
  private readonly ALLOWED_EXTENSIONS: Set<string> = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
  ]);

  /** 最大文件大小：5MB */
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  /**
   * 保存上传的图片文件
   *
   * 流程：校验 MIME 类型 → 校验文件大小 → 按日期生成目录 → UUID 重命名 → 写入磁盘
   *
   * @param file - multer 解析的文件对象（memoryStorage）
   * @returns 上传结果（URL、原始文件名、文件大小）
   * @throws {BusinessException} 文件类型不支持或文件大小超限
   */
  async saveImage(file: Express.Multer.File): Promise<UploadResponse> {
    // ── 1. 校验文件类型 ──
    if (!this.ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BusinessException(
        ErrorCode.FILE_TYPE_INVALID,
        `不支持的文件类型: ${file.mimetype}，仅支持 JPG、PNG、WebP`,
      );
    }

    // ── 2. 校验文件大小 ──
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BusinessException(
        ErrorCode.FILE_SIZE_EXCEEDED,
        `文件大小 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过 5MB 限制`,
      );
    }

    if (file.size === 0) {
      throw new BusinessException(ErrorCode.VALIDATION_ERROR, '文件内容为空');
    }

    // ── 3. 生成存储路径：uploads/YYYY/MM/DD/ ──
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateDir = path.join('uploads', year, month, day);

    // 确保目录存在
    const absoluteDir = path.join(process.cwd(), dateDir);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    // ── 4. 生成随机文件名 ──
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = this.ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
    const filename = `${randomUUID()}${safeExt}`;
    const relativePath = path.join(dateDir, filename);
    const absolutePath = path.join(process.cwd(), relativePath);

    // ── 5. 写入磁盘 ──
    fs.writeFileSync(absolutePath, file.buffer);

    // 统一使用正斜杠作为 URL 分隔符
    const url = `/${relativePath.replace(/\\/g, '/')}`;

    this.logger.log(`图片已保存: ${url} (${(file.size / 1024).toFixed(1)}KB)`);

    return {
      url,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
