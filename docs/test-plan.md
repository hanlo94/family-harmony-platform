# 测试策略文档

> **项目**：家庭共享任务与"无唠叨"协作平台  
> **版本**：v1.1  
> **最后更新**：2026-06-12

---

## 1. 测试分层

| 层级 | 工具 | 范围 | 覆盖率目标 | 执行速度 | 运行频率 |
|------|------|------|-----------|----------|----------|
| **单元测试** | Vitest | 工具函数、composables、DTO 校验、状态机逻辑、Pinia stores | ≥80% | ms | 每次 commit |
| **集成测试** | Vitest + supertest | NestJS API 端点、Prisma 查询、Guard、Interceptor、微信 mock | ≥70% | ms-s | 每次 PR |
| **E2E 测试** | Playwright | 核心用户流程（端到端） | 覆盖 5 条主流程 | s-min | 每次 PR / 每日 |

### 分层原则

- **单元测试**：不涉及数据库、网络、文件系统；mock 所有外部依赖
- **集成测试**：使用真实 PostgreSQL（Docker）或测试数据库，mock 微信 API
- **E2E 测试**：完整环境（前端 + 后端 + PostgreSQL），模拟真实用户行为

---

## 2. 测试工具链

### 2.1 后端（NestJS）

| 工具 | 用途 | 备注 |
|------|------|------|
| Vitest | 测试运行器 | 替代 Jest（待迁移） |
| @nestjs/testing | NestJS 测试工具 | Test.createTestingModule() |
| supertest | HTTP 集成测试 | 请求模拟 |
| @vitest/coverage-v8 | 代码覆盖率 | Istanbul 引擎 |

### 2.2 前端（uni-app Vue3）

| 工具 | 用途 | 备注 |
|------|------|------|
| Vitest | 测试运行器 | 组件 + composable 测试 |
| @vue/test-utils | Vue 组件测试 | mount / shallowMount |
| happy-dom | DOM 模拟 | 轻量替代 jsdom |
| @vitest/coverage-v8 | 代码覆盖率 | Istanbul 引擎 |

### 2.3 E2E

| 工具 | 用途 | 备注 |
|------|------|------|
| Playwright | E2E 测试 | 跨浏览器 |
| @playwright/test | 测试框架 | fixtures, tracing |

---

## 3. 关键测试场景

### 3.1 任务状态机（最高优先级）

任务有 5 个存储状态 + 2 个计算状态，合法转换路径必须严格测试：

```
PENDING_COMPLETION → PENDING_VERIFICATION  (needsVerification=true)
PENDING_COMPLETION → COMPLETED             (needsVerification=false)
PENDING_VERIFICATION → COMPLETED           (organizer approves)
PENDING_VERIFICATION → REJECTED            (organizer rejects with reason)
任意状态 → CANCELLED                        (creator/organizer cancels)
REJECTED → PENDING_COMPLETION              (re-assign after rejection)
```

**测试点**：
- [ ] 5 种状态的合法转换路径
- [ ] 非法转换应被拒绝（如 COMPLETED → REJECTED）
- [ ] 完成时根据 `needsVerification` 自动选择下一状态
- [ ] 驳回时 `rejectionReason` 不能为空
- [ ] 取消时记录 `cancelledBy`、`cancelledAt`、`cancelledReason`
- [ ] 已逾期的任务可以被取消
- [ ] 已取消的任务不能再次操作
- [ ] `isOverdue` 计算正确（当前时间 > deadline 且 status 为未完成状态）
- [ ] `isNearExpiry` 计算正确（deadline - 当前时间 < 2h）

### 3.2 权限矩阵

三个角色（ORGANIZER / MEMBER / CHILD）的增删改查边界：

| 操作 | ORGANIZER | MEMBER | CHILD | 匿名 |
|------|-----------|--------|-------|------|
| 创建任务 | ✅ | ✅ | ❌ | ❌ |
| 查看家庭任务 | ✅ | ✅ (默认) / ❌ (可由 organizer 限制) | ✅ (只看自己的) | ❌ |
| 编辑他人任务 | ✅ | ❌ | ❌ | ❌ |
| 取消自己创建的任务 | ✅ | ✅ | ❌ | ❌ |
| 标记自己任务完成 | ✅ | ✅ | ✅ | ❌ |
| 验收任务 | ✅ | ❌ | ❌ | ❌ |
| 驳回任务 | ✅ | ❌ | ❌ | ❌ |
| 邀请成员 | ✅ | ❌ | ❌ | ❌ |
| 移除成员 | ✅ | ❌ | ❌ | ❌ |
| 创建家庭 | ✅ | ✅ | ❌ | ❌ |

**测试点**：
- [ ] 每个角色执行越权操作时返回 403
- [ ] CHILD 角色看不到其他人的任务
- [ ] MEMBER 不能取消别人创建的任务
- [ ] 匿名用户执行任何需要登录的操作返回 401

### 3.3 微信 OAuth 登录

**测试点**：
- [ ] H5 登录：有效 code → JWT
- [ ] 小程序登录：有效 code → JWT
- [ ] 无效 code → 40001
- [ ] Token 过期 → 401，刷新后重新请求
- [ ] Refresh token 过期 → 401，需要重新登录
- [ ] 新用户首次登录 → 自动注册
- [ ] 已注册用户登录 → 返回已有信息

### 3.4 家庭管理

**测试点**：
- [ ] 创建家庭 → 自动成为 ORGANIZER
- [ ] 生成邀请码 → 6-8 位唯一码
- [ ] 邀请码过期 → 无法加入
- [ ] 通过邀请码加入 → 自动成为 MEMBER
- [ ] 同一个家庭不能重复加入
- [ ] ORGANIZER 可以移除成员
- [ ] 不能移除家庭最后一个成员
- [ ] 家庭成员列表按角色展示

### 3.5 任务 CRUD

**测试点**：
- [ ] 创建任务：必填字段校验（title, deadline, assignedTo）
- [ ] `difficulty` 范围 1-5
- [ ] `repeatRule` 值为 NONE/DAILY/WEEKLY
- [ ] `needsVerification` 默认 false
- [ ] 编辑任务：只能编辑 PENDING_COMPLETION 和 REJECTED 状态的任务
- [ ] 查询任务列表：按状态筛选、分页
- [ ] 查询任务详情：包含完整的创建者、执行者、验收者信息

### 3.6 重复任务

**测试点**：
- [ ] DAILY 任务完成后自动生成次日任务
- [ ] WEEKLY 任务完成后自动生成下周任务
- [ ] 生成的任务继承原任务的属性（title, description, difficulty, assignedTo, needsVerification, repeatRule）
- [ ] 生成的任务的 deadline = 原 deadline + 一个周期
- [ ] 被取消的重复任务不生成下一期

### 3.7 到期提醒

**测试点**：
- [ ] 定时扫描：找出 deadline 在 2h 内、未完成、未通知的任务
- [ ] `hasNotified` 标记防止重复通知
- [ ] `reminderEnabled = false` 的家庭成员不接收提醒
- [ ] 发送微信模板消息后 `hasNotified = true`
- [ ] 首页展示逾期和临近到期任务（从表查询 + 计算状态）

### 3.8 任务模板

**测试点**：
- [ ] 返回所有激活的模板，按 sortOrder 排序
- [ ] 支持按 category 筛选
- [ ] 停用的模板（isActive=false）不返回

### 3.9 图片上传

**测试点**：
- [ ] 仅允许 jpg/png/webp 格式
- [ ] 最大 5MB 限制
- [ ] 上传成功返回访问 URL
- [ ] 文件持久化到本地文件系统

### 3.10 家庭统计

**测试点**：
- [ ] 统计每个成员的任务总数
- [ ] 统计每个成员本周完成数
- [ ] 统计每个成员待完成数
- [ ] CHILD 成员不参与排名

---

## 4. 测试文件组织

### 4.1 后端测试目录

```
apps/backend/
├── vitest.config.ts
└── src/
    ├── test/
    │   └── setup.ts                    # 全局测试设置
    ├── auth/
    │   ├── auth.service.spec.ts        # 单元测试
    │   └── auth.controller.spec.ts     # 集成测试
    ├── user/
    │   ├── user.service.spec.ts
    │   └── user.controller.spec.ts
    ├── family/
    │   ├── family.service.spec.ts
    │   └── family.controller.spec.ts
    ├── task/
    │   ├── task.service.spec.ts        # 核心：状态机逻辑
    │   ├── task-state-machine.spec.ts  # 独立测试状态转换
    │   └── task.controller.spec.ts
    ├── template/
    │   └── template.controller.spec.ts
    ├── notification/
    │   └── notification.service.spec.ts
    └── prisma/
        └── prisma-test.service.ts      # 测试数据库服务
```

### 4.2 前端测试目录

```
apps/frontend/
├── vitest.config.ts
└── src/
    ├── test/
    │   ├── setup.ts                    # 全局 mock（uni.*, wx.*）
    │   └── mocks/
    │       └── uni.ts                  # uni API mock
    ├── components/
    │   └── __tests__/
    │       ├── TaskCard.test.ts
    │       ├── OverdueBanner.test.ts
    │       └── TemplateSelector.test.ts
    ├── stores/
    │   └── __tests__/
    │       ├── auth.test.ts
    │       ├── family.test.ts
    │       └── task.test.ts
    └── composables/
        └── __tests__/
            └── useTaskList.test.ts
```

### 4.3 E2E 测试目录

```
e2e/
├── playwright.config.ts
├── fixtures/
│   ├── users.ts            # 测试用户工厂
│   ├── families.ts         # 测试家庭工厂
│   └── tasks.ts            # 测试任务工厂
└── specs/
    ├── 01-auth.spec.ts     # 登录流程
    ├── 02-family.spec.ts   # 创建家庭、邀请成员
    ├── 03-task-lifecycle.spec.ts  # 任务完整生命周期
    ├── 04-verification.spec.ts    # 验收流程（含驳回）
    └── 05-recurring.spec.ts       # 重复任务
```

---

## 5. Mock 策略

### 5.1 微信 API Mock

后端测试中 mock 微信 API：
- `GET https://api.weixin.qq.com/sns/oauth2/access_token` → 返回 mock token
- `GET https://api.weixin.qq.com/sns/userinfo` → 返回 mock 用户信息
- 微信模板消息发送 → mock 成功

前端测试中 mock 微信 JSSDK：
- `uni.login()` → 返回 mock code
- `uni.getUserProfile()` → 返回 mock 用户信息

### 5.2 数据库 Mock

- **单元测试**：mock PrismaService，不连接数据库
- **集成测试**：使用独立测试数据库（`family_harmony_test`）或 Docker PostgreSQL
- 每个测试文件运行前执行 migrations，运行后清理数据

### 5.3 存储 Mock

- 图片上传：mock 文件系统读写
- 本地文件路径映射到测试目录

---

## 6. 测试数据工厂

使用工厂函数创建测试数据，确保测试独立性：

```typescript
// 示例：用户工厂
export function createTestUser(overrides?: Partial<User>) {
  return {
    id: randomUUID(),
    nickname: '测试用户',
    avatarUrl: null,
    wechatOpenid: `openid_${randomUUID()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

---

## 7. CI 中运行测试

```bash
# 单元测试（无需数据库）
pnpm test

# 集成测试（需要 PostgreSQL）
# 在 CI 环境中通过 GitHub Actions service container 提供
DATABASE_URL=postgresql://test:test@localhost:5432/test pnpm test:integration

# E2E 测试（需要完整环境）
# 通过 Docker Compose 启动全栈
docker compose up -d
pnpm test:e2e
```

---

## 8. 覆盖率目标

| 模块 | 单元测试 | 集成测试 |
|------|----------|----------|
| Task 状态机 | ≥95% | ≥80% |
| Auth 模块 | ≥85% | ≥80% |
| Family 模块 | ≥80% | ≥70% |
| User 模块 | ≥80% | ≥70% |
| Notification 模块 | ≥80% | ≥60% |
| Template 模块 | ≥80% | ≥70% |
| 前端组件 | ≥70% | - |
| Pinia stores | ≥85% | - |
| E2E 主流程 | - | 5/5 通过 |

---

## 9. 测试命名规范

```
describe('模块名', () => {
  describe('方法名/场景', () => {
    it('should 期望行为 when 条件', () => {
      // ...
    });
  });
});
```

示例：
```typescript
describe('TaskService', () => {
  describe('completeTask', () => {
    it('should transition to PENDING_VERIFICATION when needsVerification is true', () => {});
    it('should transition to COMPLETED when needsVerification is false', () => {});
    it('should throw ForbiddenException when task is already COMPLETED', () => {});
  });
});
```
