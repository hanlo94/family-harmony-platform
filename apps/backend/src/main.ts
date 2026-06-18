import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── 全局路径前缀 ──
  app.setGlobalPrefix('api');

  // ── 静态文件服务：上传的图片可通过 /uploads/... 访问 ──
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // ── CORS ──
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ── Swagger ──
  const config = new DocumentBuilder()
    .setTitle('家庭共享任务协作平台 API')
    .setDescription(`家庭 Harmony Platform — RESTful API 文档

## 通用约定

- **Base URL**：\`http://localhost:3000/api\`
- **认证方式**：JWT Bearer Token（除登录外所有接口需在 Header 中携带 \`Authorization: Bearer <token>\`）
- **响应格式**：所有接口统一返回 \`{ code: number, message: string, data: T }\`
  - \`code = 0\`：成功
  - \`code >= 40000\`：失败，具体错误码见 [docs/api-design.md](docs/api-design.md)
- **分页参数**：列表接口支持 \`page\`（默认 1）和 \`pageSize\`（默认 20，最大 100）
- **角色**：ORGANIZER（组织者）| MEMBER（成员）| CHILD（孩子），权限依次递减

## 接口概览

| 模块 | 接口数 | 说明 |
|------|--------|------|
| Auth | 4 | 微信 H5/小程序登录、Token 刷新、当前用户 |
| Users | 4 | 用户资料、提醒设置 |
| Families | 8 | 家庭 CRUD、成员管理、邀请码、统计 |
| Tasks | 8 | 任务 CRUD、状态机流转（完成/验收/驳回/取消） |
| Task Templates | 1 | 模板列表查询 |
| Upload | 1 | 图片上传 |
| **总计** | **26** | |

> 自动生成于 OpenAPI 3.0.3 规范，详见 [specs/openapi.yaml](specs/openapi.yaml)`)
    .setVersion('1.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT Access Token',
        in: 'header',
      },
      'JWT', // 安全方案名称，与 @ApiBearerAuth() 一致
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 刷新页面后保留认证信息
      docExpansion: 'list',       // 默认折叠，按 Tag 分组展示
      filter: true,               // 启用搜索过滤
      showRequestDuration: true,  // 显示请求耗时
    },
  });

  // ── 启动服务 ──
  // 注意：全局 ValidationPipe、HttpExceptionFilter、TransformInterceptor、
  // LoggingInterceptor 已通过 AppModule 的 APP_* 令牌注册，
  // 此处无需重复调用 app.useGlobal*()
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📖 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
