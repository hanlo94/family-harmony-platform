import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── 全局路径前缀 ──
  app.setGlobalPrefix('api');

  // ── CORS ──
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ── Swagger ──
  const config = new DocumentBuilder()
    .setTitle('家庭共享任务协作平台 API')
    .setDescription('家庭 Harmony Platform — RESTful API 文档')
    .setVersion('1.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

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
