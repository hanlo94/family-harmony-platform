import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

/**
 * Upload 模块
 *
 * 提供：
 * - 图片上传（POST /api/upload/image）
 *
 * 依赖：
 * - Auth 模块提供的 JwtAuthGuard（登录即可上传）
 * - 无数据库依赖（文件直接写入本地文件系统）
 */
@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
