# 系统架构设计文档

**版本**：v1.1  
**日期**：2026-06-11  
**依赖**：[requirements.md](./requirements.md)  
**变更**：v1.1 - 前端方案从 Next.js 切换为 Vue3 + uni-app；同步 requirements.md v1.1 新增模板模块、重复任务生成、提醒开关、首页兜底机制；更新任务生命周期状态机

---

## 1. 架构概览

```
┌──────────────────────────────────────────────────────────────┐
│              用户入口 (微信公众号 H5 / 微信小程序)              │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       Nginx (反向代理)                        │
│      静态资源 H5 /dist/build/h5    /api/* → 后端路由           │
└────────────┬─────────────────────────────┬───────────────────┘
             │                             │
     uni-app H5 构建产物              API 请求 /api/*
             │                             │
             ▼                             ▼
┌────────────────────┐         ┌───────────────────────────────┐
│  uni-app (Vue3) 前端 │         │        NestJS 后端             │
│  (apps/frontend)    │         │      (apps/backend)            │
│                     │         │                               │
│ • Vue3 Composition  │         │ • RESTful API                 │
│ • uni-app 跨端编译   │         │ • JWT 鉴权                    │
│ • 一套代码 → H5 +   │         │ • 微信 OAuth + JSSDK           │
│   微信小程序         │         │ • 微信模板消息                  │
│ • Pinia 状态管理     │         │ • 文件上传 (图片)              │
│ • uview-plus /      │         │ • Prisma ORM                  │
│   uni-ui 组件       │         │ • 定时任务 (提醒+重复任务生成)  │
│ • SCSS + CSS vars   │         │                               │
└────────────────────┘         └───────────────┬───────────────┘
                                               │
                             ┌─────────────────┼───────────────┐
                             │                 │               │
                             ▼                 ▼               ▼
                     ┌──────────┐    ┌──────────────┐  ┌──────────┐
                     │PostgreSQL│    │  本地文件存储  │  │ 微信 API │
                     │  (数据)   │    │  (任务照片)    │  │  (外部)  │
                     └──────────┘    └──────────────┘  └──────────┘
```

---

## 2. 技术选型

### 2.1 前端 (apps/frontend) — Vue3 + uni-app

| 层级 | 技术 | 原因 |
|------|------|------|
| **框架** | uni-app 3 (Vue3 版) | 一套代码编译 H5 + 微信小程序，跨端复用率 > 90% |
| **语言** | TypeScript | 类型安全，与后端共享接口类型 |
| **UI 组件** | uview-plus 3.x | 专为 uni-app Vue3 设计，组件丰富，移动端体验好 |
| **样式方案** | SCSS + CSS 自定义属性 | uni-app 原生支持 SCSS，CSS vars 做主题切换 |
| **状态管理** | Pinia | Vue3 官方推荐，TypeScript 友好，比 Vuex 更简洁 |
| **HTTP 客户端** | uni.request（统一封装） | uni-app 自带跨端请求 API，自动适配 H5/小程序 |
| **路由** | uni-app pages.json | 约定式路由配置，统一管理页面和 TabBar |
| **表单校验** | async-validator（uni-forms） | uni-app 官方表单组件内置校验 |
| **文件上传** | uni.chooseImage + uni.uploadFile | 跨端统一的图片选择和上传 API |
| **微信能力** | uni-app 内置 API + JWeixin | uni.login / uni.getUserInfo / JSSDK 签名 |

**为什么不选 React/Next.js**：
- 后期要转微信小程序，Next.js 无法编译到小程序
- uni-app 一套代码 → H5 + 小程序，零重复开发
- Vue3 学习曲线比 React 平缓，团队协作成本低

### 2.2 uni-app 跨端策略

| 阶段 | 编译目标 | 说明 |
|------|----------|------|
| **MVP** | H5（微信公众号内打开） | 无需审核，快速上线，微信 JSSDK 可用 |
| **v1.5** | 微信小程序 | 条件编译差异化处理（登录、支付、定位等），核心业务代码不变 |
| **v2.0** | App (可选) | 需要时可用 uni-app 打包 iOS/Android |

```
                    ┌──────────────────────┐
                    │  uni-app 源码 (一套)   │
                    │  apps/frontend/src/   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         uni build        uni build        uni build
         --platform       --platform       --platform
            h5              mp-weixin         app
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐   ┌────────────┐   ┌──────────┐
        │  H5 网页  │   │ 微信小程序   │   │ 原生 App  │
        └──────────┘   └────────────┘   └──────────┘
```

**条件编译示例**（登录方式差异）：
```vue
<!-- #ifdef H5 -->
<!-- H5 使用微信网页授权 OAuth 2.0 -->
<!-- #endif -->

<!-- #ifdef MP-WEIXIN -->
<!-- 小程序使用 wx.login 获取 code -->
<!-- #endif -->
```

### 2.3 后端 (apps/backend)

| 层级 | 技术 | 原因 |
|------|------|------|
| **框架** | NestJS | 模块化架构、依赖注入、开箱即用的 TypeScript |
| **语言** | TypeScript | 全栈类型一致 |
| **数据库 ORM** | Prisma | 类型安全、migration 管理、直观的 schema |
| **数据库** | PostgreSQL 16 | 成熟稳定、JSON 支持好、适合复杂查询 |
| **认证** | 微信 OAuth 2.0 (H5) / wx.login (小程序) + JWT | 兼容两种微信登录方式，统一签发 JWT |
| **文件存储** | 本地文件系统（后期迁 OSS） | MVP 简单优先，照片量不大 |
| **API 文档** | Swagger (NestJS OpenAPI) | 自动生成，前后端共享 |
| **验证** | class-validator + class-transformer | NestJS 原生方案 |
| **定时任务** | @nestjs/schedule | 任务到期提醒 + 重复任务生成 |

### 2.4 共享基础设施

| 类型 | 技术 |
|------|------|
| **包管理** | pnpm (workspace monorepo) |
| **代码规范** | ESLint + Prettier |
| **测试** | Vitest (前端/后端单元测试) + Playwright (E2E) |
| **CI/CD** | GitHub Actions |
| **容器化** | Docker + docker-compose |

---

## 3. 模块划分

### 3.1 后端模块 (NestJS Modules)

```
apps/backend/src/
├── main.ts                  # 入口，全局配置
├── app.module.ts            # 根模块
├── common/                  # 通用模块
│   ├── guards/              # JWT Guard, Roles Guard
│   ├── decorators/          # @CurrentUser, @Roles
│   ├── filters/             # 全局异常过滤器
│   ├── interceptors/        # 日志、响应格式化
│   └── dto/                 # 通用 DTO
├── auth/                    # 认证模块
│   ├── auth.module.ts
│   ├── auth.controller.ts   # 微信登录（H5 OAuth + 小程序 code）、Token 刷新
│   ├── auth.service.ts      # OAuth 流程、wx.login、JWT 签发
│   ├── strategies/          # JWT Strategy
│   └── dto/
├── user/                    # 用户模块
│   ├── user.module.ts
│   ├── user.controller.ts   # 用户信息 CRUD、提醒设置读写
│   └── user.service.ts
├── family/                  # 家庭模块
│   ├── family.module.ts
│   ├── family.controller.ts # 创建家庭、成员管理、邀请、任务统计
│   ├── family.service.ts
│   └── dto/
├── task/                    # 任务模块（核心）
│   ├── task.module.ts
│   ├── task.controller.ts   # 任务 CRUD、分配、验收、驳回、完成
│   ├── task.service.ts      # 状态机流转、重复任务生成逻辑
│   └── dto/
├── template/                # 模板模块 🆕
│   ├── template.module.ts
│   ├── template.controller.ts # 获取内置任务模板列表
│   └── template.service.ts
├── notification/            # 通知模块
│   ├── notification.module.ts
│   ├── notification.service.ts     # 微信模板消息（含提醒开关检查）
│   └── notification.scheduler.ts   # 定时检查到期任务
├── upload/                  # 文件上传模块
│   ├── upload.module.ts
│   ├── upload.controller.ts
│   └── upload.service.ts    # 图片压缩、存储
└── prisma/                  # Prisma 服务
    ├── prisma.module.ts
    └── prisma.service.ts
```

### 3.2 前端模块 (uni-app Vue3)

```
apps/frontend/
├── src/
│   ├── App.vue                    # 根组件，全局生命周期
│   ├── main.ts                    # 入口：注册 Pinia、全局组件
│   ├── manifest.json              # uni-app 配置（App 信息、权限）
│   ├── pages.json                 # 路由 + TabBar + 页面配置
│   ├── uni.scss                   # 全局 SCSS 变量
│   │
│   ├── pages/                     # 页面（按功能分组）
│   │   ├── index/                 # 首页 — 任务列表（含逾期/临近到期专区）
│   │   │   └── index.vue
│   │   ├── task/                  # 任务相关页面
│   │   │   ├── detail.vue         # 任务详情（含驳回原因展示）
│   │   │   ├── create.vue         # 创建任务（模板选择 → 表单）
│   │   │   └── verify.vue         # 验收任务
│   │   ├── family/                # 家庭相关页面
│   │   │   ├── index.vue          # 家庭管理页（含轻量统计）
│   │   │   ├── invite.vue         # 邀请成员
│   │   │   └── join.vue           # 加入家庭
│   │   ├── profile/               # 个人中心
│   │   │   ├── index.vue          # 个人资料
│   │   │   └── settings.vue       # 提醒设置 🆕
│   │   └── login/                 # 登录页
│   │       └── index.vue
│   │
│   ├── components/                # 公共组件
│   │   ├── task/
│   │   │   ├── TaskCard.vue       # 任务卡片（含逾期/临近到期标记）
│   │   │   ├── TaskList.vue       # 任务列表
│   │   │   ├── TaskForm.vue       # 任务表单（含重复规则+验收开关）
│   │   │   ├── TaskFilter.vue     # 任务筛选项
│   │   │   ├── TemplateSelector.vue # 模板选择器 🆕
│   │   │   ├── RepeatRulePicker.vue # 重复规则选择器 🆕
│   │   │   └── VerificationToggle.vue # 验收开关组件 🆕
│   │   ├── family/
│   │   │   ├── MemberList.vue     # 成员列表
│   │   │   ├── MemberStatsCard.vue  # 成员统计卡片 🆕
│   │   │   └── InviteCard.vue     # 邀请卡片
│   │   └── common/
│   │       ├── AuthGuard.vue      # 登录守卫
│   │       ├── EmptyState.vue     # 空状态
│   │       ├── LoadingMore.vue    # 加载更多
│   │       └── OverdueBanner.vue  # 逾期/临近到期横条 🆕
│   │
│   ├── composables/               # Composition API (替代 React Hooks)
│   │   ├── useAuth.ts             # 认证逻辑
│   │   ├── useTask.ts             # 任务操作
│   │   ├── useFamily.ts           # 家庭操作
│   │   └── useUpload.ts           # 图片上传
│   │
│   ├── stores/                    # Pinia 状态管理
│   │   ├── user.ts                # 用户信息、Token、提醒设置
│   │   ├── family.ts              # 当前家庭、成员列表
│   │   └── task.ts                # 任务列表缓存
│   │
│   ├── api/                       # 接口请求层
│   │   ├── request.ts             # uni.request 统一封装（拦截器、Token 注入）
│   │   ├── auth.ts                # 认证接口
│   │   ├── task.ts                # 任务接口
│   │   ├── family.ts              # 家庭接口
│   │   ├── template.ts            # 模板接口 🆕
│   │   └── upload.ts              # 上传接口
│   │
│   ├── utils/                     # 工具函数
│   │   ├── wechat.ts              # 微信工具（JSSDK 签名、分享等）
│   │   └── date.ts                # 日期处理
│   │
│   └── types/                     # 类型定义
│       ├── api.d.ts               # API 请求/响应类型
│       └── global.d.ts            # 全局类型声明
│
├── static/                        # 静态资源（TabBar 图标等）
└── package.json
```

---

## 4. 页面路由设计 (pages.json)

```json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "家庭任务" } },
    { "path": "pages/task/detail", "style": { "navigationBarTitleText": "任务详情" } },
    { "path": "pages/task/create", "style": { "navigationBarTitleText": "创建任务" } },
    { "path": "pages/task/verify", "style": { "navigationBarTitleText": "验收任务" } },
    { "path": "pages/family/index", "style": { "navigationBarTitleText": "我的家庭" } },
    { "path": "pages/family/invite", "style": { "navigationBarTitleText": "邀请成员" } },
    { "path": "pages/family/join", "style": { "navigationBarTitleText": "加入家庭" } },
    { "path": "pages/profile/index", "style": { "navigationBarTitleText": "我的" } },
    { "path": "pages/profile/settings", "style": { "navigationBarTitleText": "提醒设置" } },
    { "path": "pages/login/index", "style": { "navigationBarTitleText": "登录" } }
  ],
  "globalStyle": { "navigationBarBackgroundColor": "#4CAF50", "navigationBarTextStyle": "white" },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "任务", "iconPath": "...", "selectedIconPath": "..." },
      { "pagePath": "pages/family/index", "text": "家庭", "iconPath": "...", "selectedIconPath": "..." },
      { "pagePath": "pages/profile/index", "text": "我的", "iconPath": "...", "selectedIconPath": "..." }
    ]
  }
}
```

**页面关系图**：
```
pages/login/index  ←── 未登录时的入口
        │
        ▼ (登录成功)
pages/index/index  ←── TabBar 首页 (任务列表 + 逾期/临近到期专区)
   │        │
   │        ├──→ pages/task/detail    (点任务卡片，含驳回原因展示)
   │        │       └──→ pages/task/verify  (组织者验收)
   │        └──→ pages/task/create    (创建任务: 模板选择→表单)
   │
pages/family/index  ←── TabBar (家庭管理 + 轻量统计)
   │
   ├──→ pages/family/invite   (邀请成员)
   └──→ pages/family/join     (被邀请者加入)
   │
pages/profile/index  ←── TabBar (个人中心)
   │
   └──→ pages/profile/settings  (提醒设置) 🆕
```

---

## 5. 关键流程设计

### 5.1 微信登录流程（兼容 H5 + 小程序）

```
用户打开应用
    │
    ▼
检查本地 Token (uni.getStorageSync)
    │
    ├── 有且未过期 ──→ 直接进入应用
    │
    └── 无或已过期
        │
        ▼
    ┌── 平台判断 ──┐
    │              │
    ▼ H5           ▼ 微信小程序
 uni.getProvider   wx.login (uni.login)
    │              │
    ▼              ▼
 跳转微信 OAuth   获取 code
 授权页           （静默，无需用户确认）
    │              │
    ▼              ▼
 后端 /api/auth/wechat/h5/callback?code=xxx
 后端 /api/auth/wechat/mp/login  { code }
    │              │
    └──────┬───────┘
           ▼
     后端用 code 换 openid
     查找/创建用户 → 签发 JWT
           │
           ▼
     前端存储 Token → 进入应用
```

### 5.2 任务生命周期（v1.1 更新）

```
┌──────────┐   创建+分配  ┌──────────┐   成员完成    ┌──────────┐
│ 待完成    │ ──────────→ │ 待完成    │ ────────────→│ 待验收    │
│ (初始)    │             │ (执行中)  │              │ (需验收)  │
└──────────┘             └─────┬────┘              └────┬─────┘
                               │                        │
                               │                        │
                    ┌──────────┼──────────┐    ┌────────┼────────┐
                    │          │          │    │        │        │
                    ▼          ▼          ▼    ▼        ▼        ▼
               ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
               │ 已完成  │ │临近到期│ │已逾期 │ │已完成 │ │已驳回 │ │已取消 │
               │(无需验收)│ │(计算) │ │(计算) │ │(验收通过)│      │ │      │
               └────────┘ └──────┘ └──────┘ └──────┘ └──┬───┘ └──────┘
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │ 执行人    │
                                                  │ 重新提交  │
                                                  └──────────┘
```

状态说明：
- **待完成（PENDING_COMPLETION）**：任务已创建并分配执行人，执行人需要处理
- **临近到期**：系统计算状态（deadline 在未来 1 小时内），用于首页提醒兜底，不独立存储
- **已逾期**：系统计算状态（deadline 已过且未完成），用于首页提醒兜底，不独立存储
- **待验收（PENDING_VERIFICATION）**：执行人已标记完成且任务需要验收，等待组织者确认
- **已完成（COMPLETED）**：终态。无需验收的任务直接进入；需要验收的任务经组织者通过后进入
- **已驳回（REJECTED）**：组织者驳回任务，包含驳回原因；执行人需要重新处理，重新提交后回到待验收
- **已取消（CANCELLED）**：终态。组织者或（任务创建者本人）取消

状态流转规则：
```
PENDING_COMPLETION → COMPLETED（needs_verification=false，成员完成）
PENDING_COMPLETION → PENDING_VERIFICATION（needs_verification=true，成员完成）
PENDING_COMPLETION → CANCELLED（取消）
PENDING_VERIFICATION → COMPLETED（验收通过）
PENDING_VERIFICATION → REJECTED（驳回，必填原因）
PENDING_VERIFICATION → CANCELLED（取消）
REJECTED → PENDING_COMPLETION（执行人重新提交后进入待验收）
REJECTED → CANCELLED（取消）
```

### 5.3 微信提醒流程（v1.1 更新）

```
后端定时任务 (@Cron, 每10分钟)
    │
    ▼
查询到期待办任务 (deadline 在未来1小时内, 未提醒过的)
    │
    ▼
按用户分组去重
    │
    ▼
JOIN family_members 检查 reminder_enabled 字段
    │
    ├── reminder_enabled = false ──→ 跳过该用户
    │
    └── reminder_enabled = true
        │
        ▼
    调用微信模板消息 API 发送
    POST https://api.weixin.qq.com/cgi-bin/message/template/send
        │
        ▼
    标记任务 has_notified = true
```

### 5.4 首页提醒兜底机制 🆕

当微信提醒不可用或用户未收到时，首页通过以下方式作为提醒兜底：

```
用户打开首页 (GET /api/families/:familyId/tasks)
    │
    ├── 查询 assigned_to = 当前用户
    │     AND status = 'PENDING_COMPLETION'
    │
    ▼
后端计算两个派生状态
    │
    ├── deadline BETWEEN NOW() AND NOW()+1h  → isNearExpiry = true (临近到期)
    └── deadline < NOW()                     → isOverdue = true (已逾期)
    │
    ▼
前端根据计算状态渲染
    │
    ├── 已逾期任务 → 置顶展示，红色标记 / Rose 色背景，突出"已逾期 X 小时"
    └── 临近到期 → 紧随其后，橙色标记 / Honey 色背景，显示"即将到期"
```

### 5.5 重复任务生成流程 🆕

```
后端定时任务 (@Cron, 每小时)
    │
    ▼
查询已完成的重复任务
  SELECT * FROM tasks
  WHERE status = 'COMPLETED'
    AND repeat_rule != 'NONE'
    AND NOT EXISTS (已生成的下一期任务)
    │
    ▼
按 repeat_rule 计算下一次 deadline
    │
    ├── DAILY  → deadline + 1 day
    └── WEEKLY → deadline + 7 days
    │
    ▼
生成新任务（继承原任务属性）
    │
    ├── title, description, difficulty（继承）
    ├── assigned_to（继承原执行人）
    ├── needs_verification（继承）
    ├── repeat_rule（继承）
    ├── status = PENDING_COMPLETION
    ├── has_notified = FALSE
    └── created_by = 原任务创建者
```

MVP 只支持三种重复规则：
- **NONE**：不重复
- **DAILY**：每天（deadline + 1 天）
- **WEEKLY**：每周（deadline + 7 天）

---

## 6. 数据流

```
┌──────────────────────────────────────────────────────┐
│                 前端 (uni-app Vue3)                    │
│                                                      │
│  pages/*.vue ← Pinia Store ← api/request.ts         │
│       │                       │                      │
│       │  uni.request          │ Token 注入            │
│       └───────────────────────┘                      │
└──────────────────────────────────────────────────────┘
                           │
                           │ JSON over HTTPS
                           ▼
┌──────────────────────────────────────────────────────┐
│                  后端 (NestJS)                        │
│                                                      │
│  Controller → Validation Pipe → Guard                │
│                                   │                  │
│                                   ▼                  │
│                              Service                 │
│                              │    │                 │
│                         Prisma    upload/notification│
│                         /template                    │
└──────────────────────────────────────────────────────┘
```

---

## 7. 部署架构

### 7.1 服务器规划（阿里云/腾讯云 单机方案）

```
┌──────────────────────────────────────┐
│           云服务器 (2C4G)              │
│                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ Nginx  │  │uni-app │  │ NestJS │ │
│  │  :80   │→ │ H5 静态│  │ :3001  │ │
│  │  :443  │  │ 文件   │  │        │ │
│  └────────┘  └────────┘  └────────┘ │
│                                      │
│  ┌──────────┐  ┌──────────────────┐  │
│  │PostgreSQL│  │  文件存储 /uploads│  │
│  │  :5432   │  │                  │  │
│  └──────────┘  └──────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        Docker Compose         │    │
│  │  编排以上所有服务              │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### 7.2 CI/CD 流程

```
Git Push (main)
    │
    ▼
GitHub Actions
    │ lint → typecheck → test
    │
    ▼ (全部通过)
    构建 uni-app H5 (pnpm build:h5) + 构建后端 Docker 镜像
    │
    ▼
    rsync H5 静态文件 + docker-compose up -d 后端
```

---

## 8. 安全设计

| 方面 | 方案 |
|------|------|
| **传输安全** | HTTPS 全站加密 |
| **认证** | 微信 OAuth 2.0 (H5) / wx.login (小程序)，服务端不暴露 secret |
| **API 鉴权** | JWT (Access Token 2h + Refresh Token 7d) |
| **API 限流** | NestJS ThrottlerModule，单 IP 100 次/分钟 |
| **文件上传** | 限制 5MB、仅允许图片类型、文件名随机化 |
| **SQL 注入** | Prisma 参数化查询，天然防护 |
| **XSS** | Vue3 默认转义（v-text/v-bind）+ CSP Header |
| **CSRF** | SameSite Cookie + JWT 仅存在内存/localStorage（不做 Cookie 传递） |
| **多家庭隔离** | 所有家庭、任务、成员接口必须校验用户是否属于对应家庭 |
| **邀请安全** | 邀请链接/二维码包含有效期，过期后不能加入 |
| **照片安全** | 仅家庭成员可见，限制图片类型、大小和数量，文件名随机化 |

---

## 9. 技术决策记录 (ADR)

| # | 决策 | 选择了 | 而非 | 原因 |
|---|------|--------|------|------|
| 1 | **前端框架** | **Vue3 + uni-app** | Next.js / React | 需要一套代码编译 H5 + 微信小程序，uni-app 跨端复用率 > 90%，Next.js 无法编译到小程序 |
| 2 | 前后端关系 | 分离 (uni-app + NestJS) | uni-app 云函数 | 后端业务逻辑复杂，需要定时任务、微信 API 调用等，独立后端能力更强 |
| 3 | UI 组件库 | uview-plus | uni-ui / 自定义 | 社区活跃、组件最多、Vue3 支持好、文档完善 |
| 4 | 状态管理 | Pinia | Vuex | Vue3 官方推荐，TypeScript 原生支持，API 更简洁 |
| 5 | API 风格 | RESTful | tRPC | uni-app 客户端无法直接使用 tRPC，REST 更通用 |
| 6 | HTTP 客户端 | uni.request（封装） | axios / flyio | uni-app 跨端兼容，小程序环境 axios 不可用 |
| 7 | 文件存储 | 本地文件系统 | 阿里云 OSS | MVP 简单优先，后期可迁移 |
| 8 | 部署 | Docker Compose 单机 | Kubernetes | MVP 用户量小，单机足够 |
| 9 | 跨端策略 | H5 先行 → 小程序跟进 | 同时上线 | H5 无需审核快速验证，小程序条件编译按需启用 |
| 10 | **任务状态** | 移除"待分配"状态 | v1.0 的 PENDING_ASSIGNMENT | requirements.md v1.1 要求任务必须归属执行人，简化状态机 |
| 11 | **验收开关** | 任务级 needs_verification 字段 | 全局开关 | 允许不同任务采用不同完成规则（普通任务无需验收，关键任务需要验收） |
| 12 | **重复任务** | 定时扫描 COMPLETED + repeat_rule → 生成新实例 | 预生成所有实例 | 预生成会导致大量未来任务数据；按需生成更灵活，支持修改重复规则 |
| 13 | **提醒开关** | family_members.reminder_enabled | 独立 notification_settings 表 | 开关与家庭成员关系绑定，按家庭+用户维度，查询简单 |
| 14 | **首页兜底** | 查询时动态计算 isOverdue / isNearExpiry | 定时任务标记状态 | 避免状态同步延迟，查询时实时计算更准确 |
| 15 | **驳回状态** | REJECTED 作为独立状态 | 回到 PENDING_COMPLETION + rejection_reason | 明确区分初次待完成和被驳回后重新处理，便于 UI 区分展示和统计 |
