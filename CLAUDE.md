# 家庭共享任务与"无唠叨"协作平台

## 项目概述

一个帮助家庭公平分配家务的游戏化协作平台。核心解决家庭中家务分配不均、互相推诿的痛点。

**核心功能**：
- 智能任务分配：根据时间、能力和偏好自动分配家务
- 游戏化激励：完成任务获得积分，可兑换家庭福利
- "无唠叨"提醒：系统自动发送提醒，避免家人互相催促
- 贡献可视化：图表展示每个人的家务贡献
- 家庭共享日历和购物清单

## 技术栈

- **语言**：TypeScript（全栈）
- **前端**：Vue3 + uni-app（跨端编译 H5 + 微信小程序）
- **后端**：NestJS
- **数据库**：PostgreSQL
- **ORM**：Prisma
- **包管理**：pnpm（monorepo workspaces）
- **测试**：Vitest（前端/后端）+ Playwright（E2E）
- **CI/CD**：GitHub Actions
- **样式**：SCSS + uview-plus 组件库

## 命名约定

- **文件名**：kebab-case（如 `task-service.ts`）
- **组件名**：PascalCase（如 `TaskCard.tsx`）
- **函数/变量**：camelCase（如 `getUserTasks`）
- **类型/接口**：PascalCase（如 `Task`, `UserProfile`）
- **数据库表**：snake_case 复数（如 `family_tasks`）
- **API 路由**：RESTful（如 `/api/families/:familyId/tasks`）
- **Git 分支**：`feature/功能描述`、`fix/问题描述`
- **Commit**：Conventional Commits（`feat:`, `fix:`, `docs:`, `refactor:`）

## 当前项目状态

项目目前处于 **阶段二：流水线构建**。

| 阶段 | 状态 | 进度 |
|------|------|------|
| 阶段一：设计阶段 | ✅ 已完成 | 6/6 (100%) |
| 阶段二：流水线构建 | 🔄 进行中 | 1/4 (25%) |
| 阶段三：手动开发 | ⬜ 待开始 | 0/2 (0%) |

## 设计文档索引

所有设计文档位于 `docs/` 目录，v1.1 版本：

| 文档 | 路径 | 内容 |
|------|------|------|
| 需求文档 (PRD) | [docs/requirements.md](docs/requirements.md) | 产品需求、角色权限、任务状态机、MVP 范围 |
| 架构设计 | [docs/architecture.md](docs/architecture.md) | 系统架构、15 项 ADR、模块拆分、关键流程 |
| 数据库设计 | [docs/database.md](docs/database.md) | 6 张表、ER 图、索引策略、关键 SQL |
| API 设计 | [docs/api-design.md](docs/api-design.md) | 26 个端点、权限矩阵、错误码 |
| UI 设计 | [docs/ui-design.md](docs/ui-design.md) | 10 个页面、30+ 组件、设计 Token、动效 |
| 变更管理 | [docs/change-management.md](docs/change-management.md) | 变更流程、分支策略、版本路线图 |
| OpenAPI 规范 | [specs/openapi.yaml](specs/openapi.yaml) | OpenAPI 3.0.3，前后端契约的唯一真相来源 |
| Prisma Schema | [prisma/schema.prisma](prisma/schema.prisma) | 数据库表结构的代码表达 |
| 任务清单 | [TaskList.md](TaskList.md) | 全部任务的详细拆分和进度跟踪 |
| 项目阶段 | [项目阶段](项目阶段) | 三阶段概览 |

## 开发工作流

### 断点续传（重要！）

会话开始时，请执行：

1. 阅读 [TaskList.md](TaskList.md)，找到"阶段二：流水线构建"段落
2. 找到第一个 `- [ ]` 未勾选的子任务，从那里继续
3. **不要重复已完成的任务**（已勾选 `[x]` 的跳过）
4. 每完成一个子任务：
   a. 在 TaskList.md 中勾选：`- [ ]` → `- [x]`
   b. `git add -A && git commit -m "chore: complete <编号> — <描述>"`
5. 如果上下文不足，读取上方"设计文档索引"中的相关文档

### 提交规范

- 阶段二的提交统一使用 `chore:` 前缀
- 格式：`chore: complete <编号> — <子任务描述>`
- 示例：`chore: complete C06-1 — init NestJS backend skeleton`
- 每个子任务完成后立即提交，**不要积攒多个子任务一起提交**

### 验证命令

阶段二所有产出物应能通过以下验证：

```bash
pnpm install          # 依赖安装
pnpm typecheck        # TypeScript 编译检查
pnpm lint             # ESLint 检查
pnpm test             # 测试运行（0 个测试也能通过 = 框架搭好）
pnpm test:e2e         # E2E 测试
pnpm dev:backend      # 后端启动 → http://localhost:3000
pnpm dev:frontend     # 前端启动 → http://localhost:5173
```

## 关键架构决策

从 [docs/architecture.md](docs/architecture.md) 提取的核心 ADR：

1. Vue3 + uni-app（跨端编译 H5 + 微信小程序，非 Next.js）
2. 前后端分离（非 uni-app 云函数）
3. uview-plus 组件库（非 uni-ui）
4. Pinia 状态管理（非 Vuex）
5. RESTful API（非 tRPC，因 uni-app 不兼容）
6. uni.request 发起请求（非 axios，因跨端兼容）
7. 本地文件系统存储图片（非 OSS，MVP 简化）
8. Docker Compose 部署（非 K8s，MVP 规模）
9. H5 优先，小程序后适配
10. 任务状态机：5 个存储状态 + 2 个计算状态（临近到期/已逾期）
11. 每个任务独立控制是否需要验收（非全局开关）
12. 重复任务在完成后即时生成下一期（非定时预生成）
13. reminder_enabled 放在 family_members 表（非独立表）
14. 逾期/临近到期是计算字段（非数据库存储 + 定时更新）
15. REJECTED 是独立状态（不复用 PENDING_COMPLETION）
16. 三角色权限：ORGANIZER / MEMBER / CHILD

## 目录结构

```
family-harmony-platform/
├── apps/
│   ├── frontend/          # uni-app (Vue3) 前端应用
│   └── backend/           # NestJS 后端应用
├── docs/                  # 设计文档
├── specs/                 # API 规范（OpenAPI 3.0）
├── prisma/                # 数据库 schema + 迁移
├── .github/               # CI/CD 配置
├── TaskList.md            # 任务清单与进度跟踪
├── 项目阶段                # 三阶段概览
└── CLAUDE.md              # 本文件
```
