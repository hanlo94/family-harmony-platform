import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/constants/error-code';

/**
 * Upload 控制器
 *
 * 提供图片上传端点。
 * 路由前缀：/api/upload
 */
@ApiTags('Upload - 上传')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ═══════════════════════════════════════════
  // 图片上传
  // ═══════════════════════════════════════════

  /**
   * 上传图片
   *
   * 通用图片上传接口，可用于头像、任务照片等场景。
   * 需登录，支持 JPG/PNG/WebP 格式，最大 5MB。
   */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '图片文件（JPG / PNG / WebP，最大 5MB）',
        },
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BusinessException(
        ErrorCode.VALIDATION_ERROR,
        '请选择要上传的文件',
      );
    }
    return this.uploadService.saveImage(file);
  }
}
