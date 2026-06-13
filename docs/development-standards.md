# 开发规范

> **适用范围**：C01 前端 + C02 后端开发，及后续所有阶段  
> **版本**：v1.0（与设计文档 v1.1 配套）  
> **更新**：阶段三开始时建立

---

## 已有规范（无需新建，直接沿用）

这些规范已在阶段二中通过工具链强制执行，**开发时无需额外关注**（pre-commit hook 会自动修正）：

| 类别 | 规范 | 来源 |
|------|------|------|
| 命名 | kebab-case 文件、PascalCase 组件、camelCase 函数/变量、snake_case_plural 表名、RESTful 路由、Conventional Commits | [CLAUDE.md](../CLAUDE.md) |
| 格式化 | 分号、单引号、尾逗号、100 字符宽度、2 空格缩进、LF 换行 | [.prettierrc](../.prettierrc) |
| TypeScript | strict 模式、noUncheckedIndexedAccess、ES2022 | [tsconfig.base.json](../tsconfig.base.json) |
| ESLint | TS recommended + vue recommended、no-explicit-any=warn、no-unused-vars=warn/error | 各 apps eslint.config.mjs |
| Git Hook | pre-commit → lint-staged → eslint --fix + prettier --write | [.husky/pre-commit](../.husky/pre-commit) |

---

## C02 后端规范（9 条）

### 后端规范 ①：Module 结构 — 标准 NestJS 三层 + 单文件模块

每个业务模块严格遵循以下结构，禁止在其他模块中混入业务逻辑：

```
src/{module}/
├── {module}.module.ts          # @Module：声明 controllers + providers + imports
├── {module}.service.ts         # 纯业务逻辑，注入 PrismaService
├── {module}.controller.ts      # 路由定义，调用 service，不直接访问数据库
├── {module}.service.spec.ts    # 单元测试（mock PrismaService）
├── {module}.controller.spec.ts # 集成测试（Test.createTestingModule）
├── dto/                        # 已存在，开发中按需引用
│   ├── xxx.dto.ts
│   └── ...
└── guards/                     # 仅 Auth 模块需要
```

**规则**：
- 业务模块的文件直接放 `src/{module}/` 下，不再嵌套子目录（除 dto/）
- Controller 只做路由委托，真正逻辑都在 Service
- 模块间通过 `@Module({ imports: [...], exports: [...] })` 共享 Provider

---

### 后端规范 ②：Prisma 使用规范 — Service 层注入，禁止 Controller 直调

```typescript
// ✅ 正确：Service 注入 PrismaService
@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async findById(taskId: string, familyId: string) {
    return this.prisma.task.findFirst({
      where: { id: taskId, familyId },         // 始终带 familyId 做隔离
      include: { assignee: true, creator: true },
    });
  }
}

// ❌ 错误：Controller 直接调 PrismaService
export class TaskController {
  constructor(private prisma: PrismaService) {} // 不允许
}
```

**规则**：
- 所有跨表查询必须用 `include` 而非多次 `findUnique`
- 所有查询必须带 `familyId` 做多家庭数据隔离
- 复杂查询可提取为 Service 的 private 方法

---

### 后端规范 ③：统一响应格式 — 拦截器 + 禁止手动包装

在 C02-1 建立 `TransformInterceptor`，所有成功响应自动包装为：

```typescript
// 自动包装格式
{ code: 0, message: 'success', data: <原始返回> }

// Controller 直接 return 数据，不手动包装
@Get()
async getTasks(@Param('familyId') familyId: string) {
  return this.taskService.findByFamily(familyId); // 直接返回数据
}
```

分页数据也统一包装：

```typescript
{ code: 0, message: 'success', data: { items: [...], total: 30, page: 1, pageSize: 20 } }
```

---

### 后端规范 ④：错误处理规范 — 统一异常类 + 错误码

使用 `src/common/exceptions/business.exception.ts` 自定义异常类：

```typescript
throw new BusinessException(ErrorCode.TASK_NOT_FOUND);           // 40400
throw new BusinessException(ErrorCode.PERMISSION_DENIED);        // 40300
throw new BusinessException(ErrorCode.INVITE_CODE_INVALID);      // 40900
throw new BusinessException(ErrorCode.TASK_ALREADY_COMPLETED);   // 40901
```

**所有已知错误码从 `specs/openapi.yaml` 的 ErrorCode 枚举提取，集中定义到 `src/common/constants/error-code.ts`。**

全局异常过滤器 `HttpExceptionFilter` 统一捕获并转换为：

```typescript
{ code: <ErrorCode>, message: '<中文错误信息>' }
```

---

### 后端规范 ⑤：DTO 校验规范 — 直接复用已有 DTO，禁止重复定义

C06 阶段已生成 14 个 DTO 文件，**严格复用，不新建同级 DTO**。如需要新增字段，在已有 DTO 上扩展。

```typescript
// ✅ 正确：直接用已有 DTO
@Post()
async create(@Body() dto: CreateTaskDto) { ... }

// ❌ 错误：不要在其他地方再定义一个功能相同的 CreateTaskInput
```

---

### 后端规范 ⑥：Controller 编码规范

每个 Controller 文件必须包含：

```typescript
@ApiTags('任务管理')                    // Swagger 分组（中文）
@Controller('api/families/:familyId/tasks')  // 统一 /api 前缀
@UseGuards(JwtAuthGuard)               // 全局或类级别
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: '获取任务列表' })
  @ApiResponse({ status: 200, type: PaginatedData })
  async list(
    @Param('familyId') familyId: string,
    @Query() query: ListTaskDto,
    @CurrentUser() user: JwtPayload,  // 自定义装饰器取当前用户
  ) {
    return this.taskService.findByFamily(familyId, query, user.sub);
  }
}
```

**规则**：
- Controller 方法名用简短动词：`list()` / `create()` / `detail()` / `update()` / `complete()` / `cancel()`
- 每个端点必须标注 `@ApiOperation` + `@ApiResponse`
- 取当前用户统一用 `@CurrentUser()` 装饰器
- 参数顺序：Path → Query → Body → CurrentUser

---

### 后端规范 ⑦：Service 编码规范

```typescript
@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  // 公开方法 = 一个方法对应一个 Controller 调用
  async findByFamily(familyId: string, query: ListTaskDto, userId: string) {
    // 1. 权限校验
    await this.ensureFamilyMember(familyId, userId);

    // 2. 构建 Prisma 查询
    const where: Prisma.TaskWhereInput = { familyId, ... };

    // 3. 执行查询 + 计算字段
    const [items, total] = await Promise.all([
      this.prisma.task.findMany({ ... }),
      this.prisma.task.count({ where }),
    ]);

    // 4. 计算 isOverdue / isNearExpiry
    return { items: items.map(this.mapTaskListItem), total, page: query.page, pageSize: query.pageSize };
  }

  // 私有方法 = 复用逻辑
  private async ensureFamilyMember(familyId: string, userId: string) { ... }
  private mapTaskListItem(task: TaskWithRelations) { ... }
}
```

**规则**：
- 每个 public 方法负责一个主要操作，返回值类型明确
- 不能同时做查询 + 修改（CQRS 轻量版）
- 计算字段（isOverdue/isNearExpiry）在 Service 层算出，不在数据库存储
- 复杂 Prisma 类型用 `Prisma.TaskWhereInput` 等内置类型

---

### 后端规范 ⑧：权限控制规范 — 声明式 Guard

```typescript
// 类级别：需要登录
@UseGuards(JwtAuthGuard)
// 方法级别：需要 ORGANIZER 角色
@Roles(MemberRole.ORGANIZER)
@Post('/:taskId/reject')
async reject(...) { }
```

**规则**：
- `JwtAuthGuard` = 需要登录（全局或类级别）
- `@Roles()` = 需要特定角色（方法级别，与 JwtAuthGuard 组合使用）
- `@CurrentUser()` = 从 JWT 提取当前用户信息，注入方法参数
- 家庭内权限（创建者才能取消自己的任务等）在 Service 层用 `ensureFamilyMember` + 业务判断

---

### 后端规范 ⑨：测试规范 — 覆盖 happy path + 权限拒绝 + 边界条件

```typescript
describe('TaskService', () => {
  let service: TaskService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [TaskService],
    }).compile();
    service = module.get(TaskService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a task with PENDING_COMPLETION status', async () => {
      // Arrange → Act → Assert
    });

    it('should throw when assignedTo user is not a family member', async () => {
      // 验证跨家庭分配被拒绝
    });

    it('should use template defaults when templateId is provided', async () => {
      // 验证模板自动填充
    });
  });
});
```

**规则**：
- Service 用 `Test.createTestingModule` 集成测试（连测试数据库）
- Controller 可先跳过（E2E 测试覆盖），但核心 Service 必须有测试
- 每个子模块至少覆盖：1 happy path + 1 权限拒绝 + 1 边界条件

---

## C01 前端规范（9 条）

### 前端规范 ①：Vue SFC 结构 — `<script setup>` + 统一块顺序

```vue
<script setup lang="ts">
// 1. Imports (Vue, components, API, stores, types)
// 2. Props & Emits
// 3. Composables / stores
// 4. Reactive state (ref/reactive/computed)
// 5. Methods (async functions)
// 6. Lifecycle hooks (onMounted, onShow, etc.)
// 7. Watchers
</script>

<template>
  <!-- 模板：使用 kebab-case 调用组件 -->
</template>

<style lang="scss" scoped>
/* 样式：使用 Design Token var(--xxx) */
</style>
```

**规则**：
- 所有 `.vue` 文件统一用 `<script setup lang="ts">`（**禁止 Options API**）
- 样式统一 `scoped` + SCSS，引用 Design Token CSS 变量
- 模板中调用子组件用 `kebab-case`（`<task-card />` 而非 `<TaskCard />`）

---

### 前端规范 ②：组件命名与目录规范

```
src/components/           # 共享组件（被 2+ 页面引用）
├── TaskCard.vue          # PascalCase 文件名
├── EmptyState.vue
├── StarRating.vue
└── ...

src/pages/{module}/       # 页面文件（仅在 pages.json 注册）
├── index.vue             # 列表/主页面
├── create.vue            # 创建/表单页
├── detail.vue            # 详情页
└── components/           # 页面专属组件（仅 1 个页面使用）
    └── TaskFilter.vue
```

**判断组件放哪里**：
- 被 2+ 页面引用 → `src/components/`
- 仅 1 个页面使用 → 该页面的 `components/` 子目录

---

### 前端规范 ③：Pinia Store 规范 — Setup Store 风格

统一使用 **Setup Store**（组合式）语法，**禁止 Options Store**：

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { components } from '@/types/api';
import { getTaskList, createTask } from '@/api/task';

export const useTaskStore = defineStore('task', () => {
  // State（ref）
  const tasks = ref<components['schemas']['TaskListItem'][]>([]);
  const isLoading = ref(false);

  // Getters（computed）
  const overdueTasks = computed(() => tasks.value.filter(t => t.isOverdue));
  const nearExpiryTasks = computed(() => tasks.value.filter(t => t.isNearExpiry));

  // Actions（async functions）
  async function fetchTasks(familyId: string, status?: string) {
    isLoading.value = true;
    const result = await getTaskList(familyId, { status, page: 1, pageSize: 50 });
    if (result.data) {
      tasks.value = result.data.items;
    }
    isLoading.value = false;
  }

  async function addTask(familyId: string, dto: components['schemas']['CreateTaskRequest']) {
    const result = await createTask(familyId, dto);
    if (result.data) {
      await fetchTasks(familyId); // 创建后自动刷新列表
    }
    return result;
  }

  return { tasks, isLoading, overdueTasks, nearExpiryTasks, fetchTasks, addTask };
});
```

**规则**：
- Store 名用 kebab-case（`'task'`、`'auth'`、`'family'`）
- State = `ref()`，Getter = `computed()`，Action = `async function`
- 每个 Action 里处理 loading 状态和错误
- 创建/更新操作成功后，自动刷新关联数据

---

### 前端规范 ④：API 调用规范 — 直接复用已有 API 层

C06 阶段的 `src/api/` 和 `src/types/api.ts` 已完整，**所有 HTTP 请求必须通过 `src/api/` 调用，禁止在页面/组件中直接调用 `uni.request`**。

```typescript
// ✅ 正确：通过 API 模块
import { getTaskList, createTask } from '@/api/task';
const result = await getTaskList(familyId, { status: 'PENDING_COMPLETION' });

// ❌ 错误：绕过 API 层
const [err, res] = await uni.request({ url: 'http://localhost:3000/api/...' });
```

**处理 API 返回的统一模式**：

```typescript
const result = await getTaskList(familyId, params);
if (result.data) {
  // 成功路径
  tasks.value = result.data.items;
} else {
  // 失败路径：用 uni.showToast 提示
  uni.showToast({ title: result.error.message, icon: 'none' });
}
```

---

### 前端规范 ⑤：组件通信规范 — Props down, Emits up

```vue
<!-- ✅ 父传子：Props -->
<TaskCard :task="taskItem" :show-actions="true" />

<!-- ✅ 子传父：Emits -->
<TaskCard :task="taskItem" @complete="handleComplete" @cancel="handleCancel" />

<!-- ✅ 跨层级/跨页面：Pinia Store（不通过 props 逐层传递） -->
```

**规则**：
- 不跨页面的数据：Props + Emits
- 跨页面共享的数据：Pinia Store
- **禁止** `$parent.$refs` 或 `provide/inject`（难以追踪）
- 组件 Props 必须声明类型（`defineProps<{ ... }>()`）

---

### 前端规范 ⑥：页面生命周期规范

```typescript
<script setup lang="ts">
import { onShow, onHide, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';

// uni-app 页面生命周期（仅在 pages/ 中使用）
onShow(() => {
  taskStore.fetchTasks(currentFamilyId.value);
});

onPullDownRefresh(() => {
  taskStore.fetchTasks(currentFamilyId.value).finally(() => {
    uni.stopPullDownRefresh();
  });
});

onReachBottom(() => {
  if (taskStore.hasMore) {
    taskStore.loadMore(currentFamilyId.value);
  }
});
</script>
```

**规则**：
- `onShow` / `onHide` 等 uni-app 生命周期**仅在页面文件使用**，组件中用 Vue 生命周期
- 每个列表页必须实现 `onPullDownRefresh`（下拉刷新）
- 分页列表页必须实现 `onReachBottom`（触底加载更多）

---

### 前端规范 ⑦：路由跳转与参数传递规范

```typescript
// 跳转到详情页
uni.navigateTo({
  url: `/pages/task/detail?id=${taskId}&familyId=${familyId}`,
});

// 在目标页接收
onLoad((options) => {
  const taskId = options?.id;
  const familyId = options?.familyId;
});
```

**规则**：
- 页面间跳转统一用 `uni.navigateTo`（保留返回）或 `uni.redirectTo`（不保留返回）
- 参数通过 URL query string 传递（简单类型：string/number/boolean）
- 复杂对象不通过 URL 传递，用 Pinia Store 或 `uni.setStorageSync`（临时数据）
- TabBar 页面切换用 `uni.switchTab`

---

### 前端规范 ⑧：样式规范 — Design Token + Scoped SCSS

```vue
<style lang="scss" scoped>
.task-card {
  background: var(--color-surface);        /* ✅ Design Token，不用硬编码色值 */
  border-radius: var(--radius-md);         /* 10px */
  padding: var(--spacing-md);              /* 12px */
  box-shadow: var(--shadow-card);

  &__title {
    font-size: 16px;
    color: var(--color-ink);               /* #1A1A1A */
  }

  &--overdue {
    border-left: 3px solid var(--color-rose);
    background: rgba(232, 164, 160, 0.08); /* Rose 10% 透明 */
  }
}
</style>
```

**规则**：
- **禁止硬编码色值**：`color: #1A1A1A` → `color: var(--color-ink)`
- **禁止硬编码间距**：`padding: 12px` → `padding: var(--spacing-md)`
- 使用 BEM 加 `&__` / `&--` 语法
- 组件内 class 命名用组件名做前缀（`.task-card__title`）

---

### 前端规范 ⑨：表单校验规范 — 声明式规则

```typescript
const rules = {
  title: [
    { required: true, message: '请输入任务名称' },
    { maxLength: 128, message: '任务名称最多128个字' },
  ],
  difficulty: [{ required: true, message: '请选择难度' }],
  assignedTo: [{ required: true, message: '请选择负责人' }],
};

async function handleSubmit() {
  if (!formData.assignedTo) {
    uni.showToast({ title: '请选择负责人', icon: 'none' });
    return;
  }
  const result = await taskStore.addTask(familyId, formData);
  if (result.data) {
    uni.showToast({ title: '创建成功', icon: 'success' });
    uni.navigateBack();
  }
}
```

---

## 规范优先级

当规范冲突时，按以下优先级：

| 优先级 | 场景 | 遵循什么 |
|:---:|------|------|
| 1 | 文件命名、变量命名 | [CLAUDE.md](../CLAUDE.md) 命名约定 |
| 2 | 代码格式 | [.prettierrc](../.prettierrc) → pre-commit 自动修正 |
| 3 | 类型正确性 | `pnpm typecheck` 通过（strict 模式） |
| 4 | 代码风格 | ESLint（`pnpm lint`） |
| 5 | 后端 API 路径/参数/响应 | [specs/openapi.yaml](../specs/openapi.yaml)（唯一真相来源） |
| 6 | 前端 API 调用 | 已有 `src/api/` 模块（不绕开） |
| 7 | 前端 UI/颜色/间距 | Design Token CSS 变量（不硬编码） |
| 8 | 组件结构/SFC 写法 | 本文件 C01 前端规范 ①-⑨ |
| 9 | 模块结构/Controller/Service | 本文件 C02 后端规范 ①-⑨ |
| 10 | Commit 信息 | Conventional Commits |

---

## 相关文档

| 文档 | 用途 |
|------|------|
| [requirements.md](requirements.md) | 产品需求、角色权限、任务状态机 |
| [architecture.md](architecture.md) | 系统架构、模块拆分、ADR |
| [database.md](database.md) | 数据库设计、ER 图、索引 |
| [api-design.md](api-design.md) | 26 个端点、权限矩阵、错误码 |
| [ui-design.md](ui-design.md) | 10 页、30+ 组件、Design Token |
| [../specs/openapi.yaml](../specs/openapi.yaml) | OpenAPI 3.0.3 前后端契约 |
| [../prisma/schema.prisma](../prisma/schema.prisma) | 数据库 schema 代码表达 |
| [../TaskList.md](../TaskList.md) | 任务清单、进度跟踪、执行策略 |
