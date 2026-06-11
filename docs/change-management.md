# 变更管理文档

**版本**：v1.1
**日期**：2026-06-11

---

## 1. 变更分类

| 分类 | 定义 | 示例 | 处理流程 |
|------|------|------|----------|
| **需求变更** | 新增/修改功能需求 | 新增积分系统、"待分配"改成"待认领" | PRD 更新 → 评审 → 同步更新设计文档 |
| **设计变更** | 架构/数据库/接口层面调整 | 表结构加字段、接口参数调整 | 架构/数据库/API 文档更新 → 前后端对齐 |
| **Bug 修复** | 代码缺陷修复 | 状态流转 bug、提醒未发送 | 直接修复 + 测试验证 |
| **技术债** | 代码重构、性能优化 | 缓存优化、代码拆分 | Issue 登记 → 排期 → 执行 |

---

## 2. 变更流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  提出变更  │ →  │  影响评估  │ →  │  评审决策  │ →  │  执行+同步 │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 2.1 提出变更

- 任何人在 GitHub 创建 Issue，使用对应模板
- 模板类型：`需求变更` / `Bug 报告` / `技术改进`
- 必须描述：现状、期望、影响范围

### 2.2 影响评估

评估清单：

| 维度 | 检查项 |
|------|--------|
| **PRD** | 是否需要更新 requirements.md？ |
| **架构** | 是否影响系统架构？ |
| **数据库** | 是否需要新增字段/表/迁移？ |
| **API** | 接口是否变更？向后兼容吗？ |
| **UI** | 页面/交互是否有变化？ |
| **工作量** | 预估人天？ |
| **风险** | 是否阻塞其他任务？ |

### 2.3 评审决策

| 角色 | 职责 |
|------|------|
| **项目负责人** | 最终决策：接受/拒绝/延后 |
| **开发者** | 技术可行性评估 |

决策结果：
- ✅ **接受** → 创建分支执行
- ❌ **拒绝** → 关闭 Issue 并说明原因
- ⏳ **延后** → 标记 `P2/P3`，放入 Backlog

### 2.4 执行 + 同步

变更执行完毕后必须同步更新以下文档：

| 变更类型 | 必须更新的文档 |
|----------|---------------|
| 需求变更 | `docs/requirements.md` |
| 接口变更 | `docs/api-design.md` + `specs/openapi.yaml` |
| 数据库变更 | `docs/database.md` + `prisma/schema.prisma` + migration |
| UI 变更 | `docs/ui-design.md` |

---

## 3. 分支策略

```
main ─────●────────●────────●──── (生产就绪)
           \        \        \
feature/xxx \──●──●  \        \
                      \        \
fix/xxx                 \──●──●  \
                                  \
refactor/xxx                        \──●
```

| 分支类型 | 命名格式 | 从哪分 | 合并到哪 |
|----------|----------|--------|----------|
| 功能开发 | `feature/功能描述` | `main` | `main` |
| Bug 修复 | `fix/问题描述` | `main` | `main` |
| 重构 | `refactor/描述` | `main` | `main` |
| 紧急修复 | `hotfix/描述` | `main` | `main` |

**规则**：
- 分支名全小写英文，单词用 `-` 连接
- 一个分支只做一件事
- 合并前必须通过 CI 检查
- 合并后删除分支

---

## 4. Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>

[optional body]
```

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 格式调整（不影响代码逻辑） |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |
| `perf` | 性能优化 |

示例：
```
feat(task): 添加任务验收驳回功能

feat(task): 新增验收驳回功能，组织者可驳回不符合要求的任务
- 驳回后任务状态回到 PENDING_COMPLETION
- 增加 rejection_reason 字段
- 对应的 API: POST /tasks/:id/reject
```

---

## 5. PR 审查清单

每个 PR 合并前必须通过：

- [ ] 代码通过 lint + typecheck
- [ ] 相关测试已编写并通过
- [ ] 无遗留的 console.log / debug 代码
- [ ] API 变更已同步 OpenAPI 规范
- [ ] 数据库变更包含迁移文件
- [ ] 相关设计文档已更新
- [ ] 无安全风险（敏感信息、注入漏洞）
- [ ] PR 描述清晰，关联对应 Issue

---

## 6. 版本管理

| 版本 | 内容 | 预计时间 |
|------|------|----------|
| v0.1.0 | MVP：家庭管理 + 任务 CRUD + 微信登录 + 模板 + 重复任务 + 验收 | 第 1-4 周 |
| v0.2.0 | 验收流程 + 微信提醒 + 首页提醒兜底 | 第 5-6 周 |
| v1.0.0 | MVP 正式发布（覆盖所有 P0 + P0-lite 功能） | 第 7 周 |
| v1.1.0 | 积分 + 贡献可视化 | 后续 |
| v2.0.0 | 购物清单 + 共享日历 + 智能分配 | 后续 |

版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：`主版本.次版本.修订号`

---

## 7. v1.0 → v1.1 变更日志 (Changelog)

**变更日期**：2026-06-11
**变更范围**：requirements.md 更新触发全设计文档同步

### 7.1 requirements.md v1.1 变更摘要

| 变更项 | 说明 |
|--------|------|
| 平台范围明确 | MVP 仅做微信公众号 H5，代码兼容后续微信小程序，不做原生 App |
| 新增产品边界 | 明确不做商业 SaaS、不做运营后台、不做公开社交 |
| P0-lite 层级 | 新增 P0-lite 优先级：任务模板、简单重复任务、验收开关、轻量统计 |
| 角色扩展 | 新增"孩子/青少年成员"角色，三分角色权限体系（组织者/普通成员/孩子） |
| 权限调整 | MEMBER 可创建任务、可取消自己创建的任务 |
| 任务状态 | 移除"待分配"、新增"已驳回"独立状态、标记"临近到期/已逾期"为计算状态 |
| 重复任务 | P0-lite：不重复/每天/每周 |
| 完成备注 | 新增可选完成备注字段 |
| 提醒开关 | P0：用户可关闭个人提醒 |
| 首页提醒兜底 | P0：临近到期和逾期任务在首页突出展示 |
| 验收开关 | P0-lite：任务级验收开关，默认无需验收 |
| 明确不做 | 扩展"明确不做"列表（积分、排行榜、惩罚、购物清单等） |

### 7.2 database.md v1.1 变更

| 变更项 | 详情 |
|--------|------|
| `member_role` 枚举 | 新增 `CHILD` 值 |
| `task_status` 枚举 | 移除 `PENDING_ASSIGNMENT`，新增 `REJECTED` |
| 新增 `RepeatRule` 枚举 | `NONE` / `DAILY` / `WEEKLY` |
| `tasks` 表新增字段 | `completion_note` (TEXT)、`repeat_rule` (RepeatRule)、`needs_verification` (BOOLEAN)、`cancelled_reason` (TEXT) |
| `tasks.assigned_to` | NULLABLE → NOT NULL |
| `family_members` 新增字段 | `reminder_enabled` (BOOLEAN, DEFAULT TRUE) |
| 新增 `task_templates` 表 | 标题、描述、难度、建议重复规则、验收开关、分类、排序、启用状态 |
| 新增索引 | `idx_tasks_repeat_rule`、`idx_tasks_needs_verification`、`idx_task_templates_category`、`idx_task_templates_active_sort` |
| 新增 SQL 查询 | 首页提醒兜底查询、重复任务生成查询、家庭看板统计查询 |

### 7.3 api-design.md v1.1 变更

| 变更项 | 详情 |
|--------|------|
| 新增 5 个端点 | `GET /api/task-templates`、`PATCH /api/users/me/settings`、`GET /api/users/me/settings`、`GET /api/families/:id/tasks/stats`、`GET /api/families/:familyId/tasks/stats` |
| `POST /tasks` 新增字段 | `repeatRule` (必填)、`needsVerification` (必填) |
| `POST /tasks/:id/complete` 重构 | 改为 JSON body，新增 `completionNote` 字段，照片通过独立上传+URL 传入 |
| `GET /tasks` 查询扩展 | 新增 `overdue`、`nearExpiry` 查询参数 |
| 权限矩阵重做 | 创建任务：ORGANIZER + MEMBER 均可；取消任务：ORGANIZER(任意) + 创建者(自己)；新增 CHILD 角色 |
| 任务状态枚举更新 | 移除 PENDING_ASSIGNMENT，新增 REJECTED |
| 接口总数 | 21 → 26 |

### 7.4 architecture.md v1.1 变更

| 变更项 | 详情 |
|--------|------|
| 任务生命周期重做 | 移除"待分配"，新增 REJECTED 状态，新增"临近到期/已逾期"计算状态 |
| 新增后端模块 | `template/` 模块 |
| 新增流程 | 重复任务生成流程、首页提醒兜底机制 |
| 更新提醒流程 | 增加 `reminder_enabled` 开关检查步骤 |
| 新增前端组件 | TemplateSelector、RepeatRulePicker、VerificationToggle、MemberStatsCard、OverdueBanner |
| 新增前端页面 | `pages/profile/settings` |
| 新增 ADR | #10-#15 共 6 条新决策（任务状态、验收开关、重复任务、提醒开关、首页兜底、驳回状态） |

### 7.5 ui-design.md v1.1 变更

| 变更项 | 详情 |
|--------|------|
| 首页重设计 | 新增逾期/临近到期专区（红色/橙色高亮横条 + 特殊卡片样式） |
| 筛选 Tab 扩展 | 新增"已驳回"和"已取消" Tab |
| 任务卡片增强 | 新增重复规则 Badge、验收标记、逾期时长/剩余时间 |
| 创建流程重设计 | 增加步骤 1（模板选择横向滑动）→ 步骤 2（表单，新增重复规则选择器、验收开关 Toggle） |
| 任务详情增强 | 完成操作增加备注输入框、驳回原因独立展示区、照片限制标注 |
| 家庭页增强 | 新增"本周家庭贡献"统计区（待办数 + 本周完成数，不做排名） |
| 新增页面 | 提醒设置页（按家庭维度的 Toggle 开关） |
| 组件树更新 | 新增 7 个组件（OverdueBanner、RepeatBadge、VerificationBadge、RejectionInfo、CompletionNoteInput、TemplateSelector、CompletionNoteDisplay） |
| 状态管理更新 | Pinia store 新增 overdueTasks、nearExpiryTasks、stats 字段 |
| 配色扩展 | 新增 `--color-overdue-bg`、`--color-near-expiry-bg` token |

---

## 8. 文档版本同步状态

| 文档 | v1.0 日期 | v1.1 日期 | 状态 |
|------|-----------|-----------|------|
| requirements.md | 2026-06-10 | 2026-06-11 | ✅ v1.1 |
| architecture.md | 2026-06-10 | 2026-06-11 | ✅ v1.1 |
| database.md | 2026-06-10 | 2026-06-11 | ✅ v1.1 |
| api-design.md | 2026-06-10 | 2026-06-11 | ✅ v1.1 |
| ui-design.md | 2026-06-10 | 2026-06-11 | ✅ v1.1 |
| change-management.md | 2026-06-10 | 2026-06-11 | ✅ v1.1 |
| prisma/schema.prisma | — | 2026-06-11 | ✅ v1.1 |
| specs/openapi.yaml | — | 待更新 | ⬜ |
