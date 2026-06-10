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

## 目录结构

```
test1/
├── apps/
│   ├── frontend/          # uni-app (Vue3) 前端应用
│   └── backend/           # NestJS 后端
├── docs/                  # 设计文档
├── specs/                 # API 规范文件
├── prisma/                # 数据库 schema
└── .github/               # CI/CD 配置
```

## 命名约定

- **文件名**：kebab-case（如 `task-service.ts`）
- **组件名**：PascalCase（如 `TaskCard.tsx`）
- **函数/变量**：camelCase（如 `getUserTasks`）
- **类型/接口**：PascalCase（如 `Task`, `UserProfile`）
- **数据库表**：snake_case 复数（如 `family_tasks`）
- **API 路由**：RESTful（如 `/api/families/:familyId/tasks`）
- **Git 分支**：`feature/功能描述`、`fix/问题描述`
- **Commit**：Conventional Commits（`feat:`, `fix:`, `docs:`, `refactor:`）

## 项目阶段

项目按三阶段推进：设计 → 流水线构建 → 手动开发。详见 `/项目阶段` 文件。
