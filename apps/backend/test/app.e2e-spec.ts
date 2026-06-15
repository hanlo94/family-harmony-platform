import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * E2E 测试
 *
 * 注意：在测试数据库就绪前，@prisma/client 通过 jest-e2e.config.ts
 * 中的 moduleNameMapper 映射到 __mocks__/prisma-client.mock.ts。
 * C02-2（Prisma 模块 + Migration + Seed）完成后移除该映射，
 * 届时 E2E 测试将连接测试数据库。
 */
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // 注意：E2E 测试不调用 main.ts 中的 bootstrap()，
    // 因此需要手动注册全局前缀、管道、过滤器等。
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET) — 应返回统一响应格式', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('code', 0);
        expect(res.body).toHaveProperty('message', 'success');
        expect(res.body).toHaveProperty('data');
      });
  });
});
