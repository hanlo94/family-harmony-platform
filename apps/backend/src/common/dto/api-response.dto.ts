import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一 API 响应包装 DTO
 *
 * 所有 API 成功响应均由此拦截器包装为：
 *   { code: 0, message: 'success', data: <原始返回> }
 *
 * 用于 Swagger 文档中描述响应结构。
 * 泛型 T 是 data 字段的具体类型。
 */
export class ApiResponseDto<T = unknown> {
  @ApiProperty({ description: '业务状态码，0 表示成功', example: 0 })
  code: number;

  @ApiProperty({ description: '状态描述信息', example: 'success' })
  message: string;

  @ApiProperty({ description: '响应数据' })
  data: T;
}

/**
 * 分页响应数据 DTO
 *
 * 用于 Swagger 文档中描述列表接口的响应结构。
 */
export class PaginatedDataDto<T = unknown> {
  @ApiProperty({ description: '数据列表', isArray: true })
  items: T[];

  @ApiProperty({ description: '总条数', example: 50 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页条数', example: 20 })
  pageSize: number;
}
