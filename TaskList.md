# 项目任务清单

> **项目**：家庭共享任务与"无唠叨"协作平台  
> **最后更新**：2026-06-11  
> **状态说明**：✅ 已完成 | 🔄 进行中 | ⬜ 待执行

---

## v1.1 设计文档同步（2026-06-11）

> requirements.md v1.1 更新后，同步更新所有设计文档。详见 [change-management.md](docs/change-management.md) 变更日志。

| 编号 | 任务 | 产出物 | 状态 |
|------|------|--------|------|
| S01 | 数据库设计同步 | `docs/database.md` v1.1 + `prisma/schema.prisma` v1.1 | ✅ |
| S02 | 接口设计同步 | `docs/api-design.md` v1.1 | ✅ |
| S03 | 架构设计同步 | `docs/architecture.md` v1.1 | ✅ |
| S04 | UI 设计同步 | `docs/ui-design.md` v1.1 | ✅ |
| S05 | 变更管理同步 | `docs/change-management.md` v1.1 | ✅ |
| S06 | OpenAPI 规范同步 | `specs/openapi.yaml` v1.1.0 | ✅ |
| S07 | TaskList 更新 | `TaskList.md`（本文件） | ✅ |

### v1.1 同步变更要点

| 变更维度 | 核心变更 |
|----------|----------|
| **角色** | 二角色(ORGANIZER/MEMBER) → 三角色(ORGANIZER/MEMBER/CHILD) |
| **任务状态** | 移除 PENDING_ASSIGNMENT，新增 REJECTED，新增计算状态(临近到期/已逾期) |
| **任务字段** | 新增 completion_note、repeat_rule、needs_verification、cancelled_reason |
| **assigned_to** | NULLABLE → NOT NULL（任务必须归属执行人） |
| **提醒** | family_members 新增 reminder_enabled 开关 |
| **模板** | 新增 task_templates 表 + GET /api/task-templates 接口 |
| **权限** | MEMBER 可创建任务、可取消自己创建的任务 |
| **接口新增** | 5 个新端点（模板、设置读写、家庭统计） |
| **接口总数** | 21 → 26 |
| **首页** | 新增逾期/临近到期专区展示 |

---

## 阶段一：设计阶段

| 编号 | 任务 | 产出物 | 状态 |
|------|------|--------|------|
| D01 | 需求解析 | `docs/requirements.md` v1.1 | ✅ |
| D02 | 架构设计 | `docs/architecture.md` v1.1 | ✅ |
| D03 | 数据库设计 | `docs/database.md` v1.1 + `prisma/schema.prisma` v1.1 | ✅ |
| D04 | 接口设计 | `docs/api-design.md` v1.1 + `specs/openapi.yaml` v1.1.0 | ✅ |
| D05 | UI 设计 | `docs/ui-design.md` v1.1 | ✅ |
| D10 | 变更管理 | `docs/change-management.md` v1.1 | ✅ |

---

## 阶段二：流水线构建

| 编号 | 任务 | 产出物 | 状态 |
|------|------|--------|------|
| C06 | 前后端契约 | 共享类型定义 + 前端 API 封装 + 后端 DTO | ✅ |
| C07 | 任务清单 | TaskList.md（本文件） | 🔄 |
| C08 | 测试案例 | `docs/test-plan.md` + 测试配置 | ✅ |
| C09 | 文档门禁 | GitHub Actions CI + pre-commit hook | ⬜ |

---

## 阶段三：手动独立执行

| 编号 | 任务 | 产出物 | 状态 |
|------|------|--------|------|
| C01 | 前端开发（Vue3 + uni-app） | `apps/frontend/` 完整项目 | ⬜ |
| C02 | 后端开发（NestJS） | `apps/backend/` 完整项目 | ⬜ |

---

## 阶段二详细任务

### ⬜ C06 — 前后端契约

**输入依赖**：D04 接口设计 v1.1、D03 数据库设计 v1.1  
**产出物**：
1. `apps/backend/src/` 后端项目骨架初始化（NestJS 项目搭建）
2. `apps/frontend/src/types/api.ts` 共享类型定义（从 OpenAPI 提取，26 个接口）
3. `apps/frontend/src/api/` 前端 API 请求封装层（含模板、设置、统计接口）
4. `apps/backend/src/*/dto/` 后端 DTO 和 Validation（含 v1.1 新增字段）

**子任务**：
- [x] C06-1：初始化 NestJS 后端项目骨架（apps/backend）
- [x] C06-2：初始化 uni-app 前端项目骨架（apps/frontend）
- [x] C06-3：实现共享类型定义文件（API 请求/响应类型，含 v1.1 新增）
- [x] C06-4：实现前端 API 请求封装层（uni.request 拦截器）
- [x] C06-5：实现后端 DTO + class-validator 校验

---

### 🔄 C07 — 任务清单

**输入依赖**：D01-D05 全部设计文档 v1.1  
**产出物**：本文件（TaskList.md）  
**状态**：已更新（含 v1.1 同步记录）

---

### ⬜ C08 — 测试案例

**输入依赖**：D03 数据库设计、D04 接口设计、D01 需求  
**产出物**：
1. `docs/test-plan.md` 测试策略文档
2. 后端测试配置（Vitest + supertest）
3. 前端测试配置（Vitest + @vue/test-utils）
4. E2E 测试配置（Playwright）

**子任务**：
- [x] C08-1：编写测试策略文档（单元/集成/E2E 分层）
- [x] C08-2：配置后端测试框架 + 编写 Auth 模块测试骨架
- [x] C08-3：配置前端测试框架 + 编写核心组件测试骨架
- [x] C08-4：配置 E2E 测试 + 编写核心流程测试场景

---

### ⬜ C09 — 文档门禁

**输入依赖**：D10 变更管理  
**产出物**：
1. `.github/workflows/ci.yml` CI 流水线配置
2. `.husky/pre-commit` pre-commit hook
3. ESLint + Prettier 配置（后端 + 前端）

**子任务**：
- [ ] C09-1：编写 GitHub Actions CI 配置（lint → typecheck → test）
- [ ] C09-2：配置 ESLint + Prettier（后端 NestJS）
- [ ] C09-3：配置 ESLint + Prettier（前端 uni-app Vue3）
- [ ] C09-4：配置 Husky pre-commit hook

---

## 阶段三详细任务

### ⬜ C01 — 前端开发（Vue3 + uni-app）

**输入依赖**：D05 UI 设计 v1.1、C06 前后端契约  
**技术栈**：Vue3 + uni-app + Pinia + uview-plus + TypeScript

**开发模块**（按优先级排列，v1.1 更新）：

| # | 模块 | 内容 | 预估 |
|---|------|------|------|
| C01-1 | 项目骨架 | uni-app 初始化、pages.json（含 settings 页）、TabBar、全局样式、Design Token 注入 | 0.5天 |
| C01-2 | 认证模块 | 登录页、微信 OAuth 跳转、Token 管理、AuthGuard、Pinia auth store | 1天 |
| C01-3 | 家庭模块 | 家庭列表页、创建家庭、家庭成员列表（含CHILD角色标记）、轻量统计区、邀请码/邀请链接 | 1.5天 |
| C01-4 | 任务首页 | 任务列表、逾期/临近到期专区(OverdueBanner)、状态筛选Tab(含已驳回/已取消)、任务卡片(含重复规则/验收标记/逾期高亮)、下拉刷新、空状态 | 2.5天 |
| C01-5 | 任务创建 | 模板选择器(TemplateSelector)、任务表单(含重复规则选择器/验收开关)、星级选择器、成员选择器、表单校验 | 1.5天 |
| C01-6 | 任务详情 | 任务信息展示(含重复规则/验收标记)、驳回原因展示(RejectionInfo)、操作按钮(依角色和状态变化) | 1天 |
| C01-7 | 任务操作 | 标记完成+备注输入(CompletionNoteInput)+照片上传、验收/驳回(含驳回原因必填)、取消任务 | 1.5天 |
| C01-8 | 个人中心 | 个人资料展示、提醒设置页(ReminderToggle)、切换家庭、退出登录 | 1天 |
| C01-9 | 动效 + 打磨 | 任务完成星星动画、逾期横条展开动画、页面切换过渡、Toast、加载状态、CHILD角色FAB隐藏 | 1天 |

---

### ⬜ C02 — 后端开发（NestJS）

**输入依赖**：D02 架构设计 v1.1、D03 数据库设计 v1.1、D04 接口设计 v1.1、C06 前后端契约  
**技术栈**：NestJS + Prisma + PostgreSQL + JWT + 微信 SDK

**开发模块**（按优先级排列，v1.1 更新）：

| # | 模块 | 内容 | 预估 |
|---|------|------|------|
| C02-1 | 项目骨架 | NestJS 初始化、Prisma 连接、环境变量、全局异常过滤器、日志拦截器 | 0.5天 |
| C02-2 | Prisma 模块 | Prisma Service 封装、数据库连接、migration 执行（含 v1.1 schema）、seed 数据（含模板） | 0.5天 |
| C02-3 | Auth 模块 | JWT Strategy、微信 OAuth（H5 + 小程序）、Token 签发/刷新、Guard（三角色权限） | 2天 |
| C02-4 | User 模块 | 用户信息 CRUD、微信资料同步、提醒设置读写 | 0.5天 |
| C02-5 | Family 模块 | 创建家庭、成员管理（三角色）、邀请码生成/验证、加入/移除成员、任务统计接口 | 1.5天 |
| C02-6 | Task 模块 | 任务 CRUD、状态机流转（v1.1: PENDING_COMPLETION↔PENDING_VERIFICATION↔REJECTED↔COMPLETED↔CANCELLED）、重复任务不存储计算状态、完成验收/驳回、取消（含权限：ORGANIZER+MEMBER创建者） | 3天 |
| C02-7 | Template 模块 | 模板列表查询、按分类筛选 🆕 | 0.5天 |
| C02-8 | Upload 模块 | 图片上传、压缩、本地存储 | 0.5天 |
| C02-9 | Notification 模块 | 微信模板消息、定时任务扫描到期任务（含reminder_enabled开关检查）、发送记录 | 1.5天 |
| C02-10 | Swagger 文档 | NestJS OpenAPI 配置、自动生成 26 个 API 文档 | 0.5天 |

---

## 执行顺序建议

```
v1.1 设计文档同步 (S01-S07) ✅ 已完成
    ↓
阶段二（流水线构建）
C06（前后端契约）→ C08（测试案例）→ C09（文档门禁）
                    ↓
              C07（任务清单）← 当前任务

阶段三（可并行）
┌─ C01-1 前端骨架 ──────────────────────┐
│  └→ C01-2 认证 → C01-3 家庭            │
│       └→ C01-4 任务首页 → C01-5/6/7    │  并行开发
│            └→ C01-8 个人中心           │
│                 └→ C01-9 动效打磨      │
└────────────────────────────────────────┘
┌─ C02-1 后端骨架 ──────────────────────┐
│  └→ C02-2 Prisma                      │
│       └→ C02-3 Auth → C02-4 User      │  并行开发
│            └→ C02-5 Family → C02-6 Task│
│                 └→ C02-7 Template     │
│                      └→ C02-8/9/10    │
└────────────────────────────────────────┘
```

---

## 当前状态总览

```
v1.1 设计同步   ████████████████████  7/7  100%
阶段一：设计阶段 ████████████████████  6/6  100%
阶段二：流水线构建 █████████████░░░░░░░  3/4   75%
阶段三：手动开发   ░░░░░░░░░░░░░░░░░░░░  0/2    0%
───────────────────────────────────────────────
总计：             ██████░░░░░░░░░░░░░░ 14/19  74%
```
