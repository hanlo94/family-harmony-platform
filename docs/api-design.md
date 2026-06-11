# API 接口设计文档

**版本**：v1.1
**日期**：2026-06-11
**依赖**：[requirements.md](./requirements.md)、[database.md](./database.md)
**API 风格**：RESTful JSON

> v1.1 变更摘要：任务创建接口新增 repeatRule / needsVerification 字段、完成接口改为 JSON body 并新增 completionNote、新增 4 个端点（模板列表、用户设置读写、家庭任务统计）、权限矩阵调整为三角色（ORGANIZER/MEMBER/CHILD）、创建任务和取消任务权限放宽至 MEMBER、任务状态枚举与 requirements.md 对齐。

---

## 1. API 约定

### 1.1 基础 URL
```
开发环境: http://localhost:3001/api
生产环境: https://your-domain.com/api
```

### 1.2 通用响应格式

**成功响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

**分页响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

**错误响应**：
```json
{
  "code": 40001,
  "message": "任务不存在",
  "detail": "Task with id xxx not found in family yyy"
}
```

### 1.3 认证方式

所有需要登录的接口在 Header 中携带 JWT：
```
Authorization: Bearer <access_token>
```

### 1.4 错误码约定

| 范围 | 含义 | 示例 |
|------|------|------|
| 0 | 成功 | — |
| 40001-40099 | 参数校验失败 | 缺少必填字段 |
| 40100-40199 | 认证相关 | Token 过期、未登录 |
| 40300-40399 | 权限相关 | 非组织者操作、非家庭成员、孩子角色无权创建 |
| 40400-40499 | 资源不存在 | 任务不存在、家庭不存在 |
| 40900-40999 | 业务冲突 | 重复加入家庭、状态不允许操作 |
| 50000-50099 | 服务端错误 | 数据库异常、微信 API 异常 |

---

## 2. 接口分组概览

| 模块 | 接口数 | 前缀 |
|------|--------|------|
| Auth 认证 | 4 | `/api/auth` |
| User 用户 | 4 | `/api/users` |
| Family 家庭 | 8 | `/api/families` |
| Task 任务 | 8 | `/api/families/:familyId/tasks` |
| Upload 上传 | 1 | `/api/upload` |
| Templates 模板 | 1 | `/api/task-templates` |

**共计 26 个接口**。

---

## 3. 接口详情

### 3.1 Auth — 认证模块

#### `POST /api/auth/wechat/h5/login`

**说明**：微信公众号 H5 登录。前端跳转微信 OAuth 获取 code，后端用 code 换 openid 并签发 JWT。

```
Request:
  Body: { "code": "021x1H0w3..." }

Response 200:
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 7200,
    "user": {
      "id": "uuid",
      "nickname": "小明妈妈",
      "avatarUrl": "https://thirdwx.qlogo.cn/..."
    }
  }
}
```

#### `POST /api/auth/wechat/mp/login`

**说明**：微信小程序登录。前端调用 `uni.login` 获取 code，后端用 code 换 openid。

```
Request:
  Body: { "code": "0c13K..." }

Response 200: 同上
```

#### `POST /api/auth/refresh`

**说明**：刷新过期的 Access Token。

```
Request:
  Body: { "refreshToken": "eyJhbG..." }

Response 200:
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbG...",
    "expiresIn": 7200
  }
}
```

#### `GET /api/auth/me`

**说明**：获取当前登录用户信息。

```
Request:
  Header: Authorization: Bearer <access_token>

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "nickname": "小明妈妈",
    "avatarUrl": "https://...",
    "families": [
      { "id": "uuid", "name": "幸福三口之家", "role": "ORGANIZER" }
    ]
  }
}
```

---

### 3.2 User — 用户模块

#### `GET /api/users/me`

同 `GET /api/auth/me`。

#### `PATCH /api/users/me`

**说明**：更新当前用户信息。

```
Request:
  Body: {
    "nickname": "新的昵称",
    "avatarUrl": "https://新头像.jpg"
  }

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "nickname": "新的昵称",
    "avatarUrl": "https://新头像.jpg"
  }
}
```

#### `GET /api/users/me/settings` 🆕

**说明**：获取当前用户在各家庭下的提醒设置。

```
Request:
  Header: Authorization: Bearer <access_token>

Response 200:
{
  "code": 0,
  "data": {
    "settings": [
      { "familyId": "uuid", "familyName": "幸福三口之家", "reminderEnabled": true },
      { "familyId": "uuid", "familyName": "老爸老妈的家", "reminderEnabled": false }
    ]
  }
}
```

#### `PATCH /api/users/me/settings` 🆕

**说明**：更新当前用户在指定家庭下的提醒开关。

```
Request:
  Body: {
    "familyId": "uuid",
    "reminderEnabled": false
  }

Response 200:
{
  "code": 0,
  "data": {
    "familyId": "uuid",
    "reminderEnabled": false
  }
}

Error 40400: { "code": 40400, "message": "你不在该家庭中" }
```

---

### 3.3 Family — 家庭模块

#### `POST /api/families`

**说明**：创建家庭（创建者自动成为 ORGANIZER）。

```
Request:
  Body: { "name": "幸福三口之家" }

Response 201:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "幸福三口之家",
    "inviteCode": "ABC123",
    "createdBy": "uuid",
    "createdAt": "2026-06-10T10:00:00Z"
  }
}
```

#### `GET /api/families`

**说明**：获取当前用户所属的家庭列表。

```
Response 200:
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "幸福三口之家",
      "role": "ORGANIZER",
      "memberCount": 3
    },
    {
      "id": "uuid",
      "name": "老爸老妈的家",
      "role": "MEMBER",
      "memberCount": 2
    }
  ]
}
```

#### `GET /api/families/:id`

**说明**：获取家庭详情。

```
Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "幸福三口之家",
    "inviteCode": "ABC123",
    "createdBy": "uuid",
    "createdAt": "2026-06-10T10:00:00Z"
  }
}
```

#### `GET /api/families/:id/members`

**说明**：获取家庭成员列表。

```
Response 200:
{
  "code": 0,
  "data": [
    { "id": "uuid", "userId": "uuid", "nickname": "小明妈妈", "avatarUrl": "...", "role": "ORGANIZER", "reminderEnabled": true, "joinedAt": "2026-06-10T10:00:00Z" },
    { "id": "uuid", "userId": "uuid", "nickname": "小明爸爸", "avatarUrl": "...", "role": "MEMBER", "reminderEnabled": true, "joinedAt": "2026-06-10T10:30:00Z" },
    { "id": "uuid", "userId": "uuid", "nickname": "小明", "avatarUrl": "...", "role": "CHILD", "reminderEnabled": true, "joinedAt": "2026-06-10T11:00:00Z" }
  ]
}
```

#### `POST /api/families/:id/invitations`

**说明**：生成新的邀请码（仅 ORGANIZER）。

```
Request: (空 Body)

Response 201:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "code": "XYZ789",
    "expiresAt": "2026-06-13T10:00:00Z",
    "inviteUrl": "https://your-domain.com/invite?code=XYZ789"
  }
}
```

#### `POST /api/families/join`

**说明**：通过邀请码加入家庭。

```
Request:
  Body: { "code": "XYZ789" }

Response 200:
{
  "code": 0,
  "data": {
    "familyId": "uuid",
    "familyName": "幸福三口之家",
    "role": "MEMBER"
  }
}

Error 40001: { "code": 40001, "message": "邀请码无效或已过期" }
Error 40900: { "code": 40900, "message": "你已经是这个家庭的成员" }
```

#### `DELETE /api/families/:id/members/:memberId`

**说明**：移除家庭成员（仅 ORGANIZER，不能移除自己）。

```
Response 200: { "code": 0, "message": "ok" }
Error 40300: { "code": 40300, "message": "仅家庭组织者可以移除成员" }
Error 40301: { "code": 40301, "message": "不能移除自己" }
```

#### `GET /api/families/:id/tasks/stats` 🆕

**说明**：获取家庭任务轻量统计（每个成员当前待办数 + 本周完成数）。

```
Request:
  Header: Authorization: Bearer <access_token>

Response 200:
{
  "code": 0,
  "data": {
    "members": [
      {
        "userId": "uuid",
        "nickname": "小明妈妈",
        "avatarUrl": "...",
        "pendingCount": 2,
        "weeklyCompletedCount": 5
      },
      {
        "userId": "uuid",
        "nickname": "小明爸爸",
        "avatarUrl": "...",
        "pendingCount": 3,
        "weeklyCompletedCount": 2
      }
    ]
  }
}
```

---

### 3.4 Task — 任务模块（核心）

#### `POST /api/families/:familyId/tasks`

**说明**：创建任务（ORGANIZER 或 MEMBER 均可创建；CHILD 默认不可创建）。

```
Request:
  Body: {
    "title": "今天洗碗",                    // string, 必填
    "description": "用洗洁精认真洗，洗完擦干放回原位", // string, 可选
    "difficulty": 2,                       // int 1-5, 可选, 默认 1
    "deadline": "2026-06-10T20:00:00Z",    // ISO8601, 必填
    "assignedTo": "uuid",                  // UUID, 必填
    "repeatRule": "NONE",                  // enum, 必填, NONE|DAILY|WEEKLY, 默认 NONE
    "needsVerification": false             // boolean, 必填, 默认 false
  }

Response 201:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "familyId": "uuid",
    "title": "今天洗碗",
    "description": "用洗洁精认真洗，洗完擦干放回原位",
    "difficulty": 2,
    "deadline": "2026-06-10T20:00:00Z",
    "status": "PENDING_COMPLETION",
    "repeatRule": "NONE",
    "needsVerification": false,
    "assignedTo": {
      "id": "uuid",
      "nickname": "小明爸爸",
      "avatarUrl": "..."
    },
    "createdBy": { "id": "uuid", "nickname": "小明妈妈" },
    "createdAt": "2026-06-10T10:00:00Z"
  }
}

Error 40302: { "code": 40302, "message": "当前角色不允许创建任务" }
```

#### `GET /api/families/:familyId/tasks`

**说明**：获取家庭任务列表（支持按状态、执行人、逾期筛选 + 分页）。

```
Request:
  Query:
    status=          // 可选: PENDING_COMPLETION | PENDING_VERIFICATION | REJECTED | COMPLETED | CANCELLED
    overdue=true     // 可选: 筛选已逾期任务（status=PENDING_COMPLETION AND deadline < NOW()）
    nearExpiry=true  // 可选: 筛选临近到期任务（status=PENDING_COMPLETION AND deadline BETWEEN NOW() AND NOW()+1h）
    assignedTo=      // 可选: user_id（查某人的任务）
    page=1           // 默认 1
    pageSize=20      // 默认 20，最大 50

Response 200:
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "今天洗碗",
        "difficulty": 2,
        "deadline": "2026-06-10T20:00:00Z",
        "status": "PENDING_COMPLETION",
        "repeatRule": "DAILY",
        "needsVerification": false,
        "isOverdue": false,
        "isNearExpiry": true,
        "assignedTo": { "id": "uuid", "nickname": "小明爸爸", "avatarUrl": "..." },
        "createdBy": { "id": "uuid", "nickname": "小明妈妈" },
        "createdAt": "2026-06-10T10:00:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  }
}
```

#### `GET /api/families/:familyId/tasks/:id`

**说明**：获取任务详情。

```
Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "今天洗碗",
    "description": "用洗洁精认真洗...",
    "difficulty": 2,
    "deadline": "2026-06-10T20:00:00Z",
    "status": "PENDING_COMPLETION",
    "repeatRule": "NONE",
    "needsVerification": false,
    "assignedTo": { "id": "uuid", "nickname": "小明爸爸", "avatarUrl": "..." },
    "createdBy": { "id": "uuid", "nickname": "小明妈妈" },
    "completionNote": null,
    "completionPhoto": null,
    "completedAt": null,
    "verifiedAt": null,
    "verifiedBy": null,
    "rejectionReason": null,
    "cancelledReason": null,
    "createdAt": "2026-06-10T10:00:00Z",
    "updatedAt": "2026-06-10T10:00:00Z"
  }
}
```

#### `PATCH /api/families/:familyId/tasks/:id`

**说明**：编辑任务（仅 ORGANIZER）。

```
Request:
  Body: {
    "title": "今天洗碗+拖地",       // 部分字段可选
    "description": "新增拖地任务",
    "difficulty": 3,
    "deadline": "2026-06-10T21:00:00Z",
    "assignedTo": "new-user-uuid",
    "repeatRule": "WEEKLY",
    "needsVerification": true
  }

Response 200: { "code": 0, "data": { ... } }

Error 40300: { "code": 40300, "message": "仅家庭组织者可以编辑任务" }
Error 40900: { "code": 40900, "message": "已完成或已取消的任务不可编辑" }
```

#### `POST /api/families/:familyId/tasks/:id/complete`

**说明**：执行人标记任务完成。改为 JSON body，照片通过独立上传接口上载后传入 URL。

```
Request:
  Body: {
    "completionNote": "已洗好并擦干放回原位",  // string, 可选
    "completionPhoto": "/uploads/2026/06/10/abc123.jpg"  // string, 可选（先通过 POST /api/upload/image 上传获得 URL）
  }

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "PENDING_VERIFICATION",   // 当 needsVerification=true
    // 或
    "status": "COMPLETED",              // 当 needsVerification=false
    "completedAt": "2026-06-10T18:30:00Z",
    "completionNote": "已洗好并擦干放回原位",
    "completionPhoto": "/uploads/2026/06/10/abc123.jpg"
  }
}

Error 40301: { "code": 40301, "message": "只有任务执行人可以标记完成" }
Error 40901: { "code": 40901, "message": "当前状态不允许此操作" }
```

#### `POST /api/families/:familyId/tasks/:id/verify`

**说明**：组织者验收通过（仅 ORGANIZER）。

```
Request: (空 Body)

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "verifiedAt": "2026-06-10T19:00:00Z",
    "verifiedBy": { "id": "uuid", "nickname": "小明妈妈" }
  }
}

Error 40300: { "code": 40300, "message": "仅家庭组织者可以验收任务" }
Error 40901: { "code": 40901, "message": "仅待验收状态的任务可以验收" }
```

#### `POST /api/families/:familyId/tasks/:id/reject`

**说明**：组织者驳回任务（仅 ORGANIZER）。驳回原因必填。

```
Request:
  Body: { "reason": "碗没洗干净，请重新洗" }  // string, 必填

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectionReason": "碗没洗干净，请重新洗"
  }
}

Error 40001: { "code": 40001, "message": "驳回原因不能为空" }
Error 40300: { "code": 40300, "message": "仅家庭组织者可以驳回任务" }
Error 40901: { "code": 40901, "message": "仅待验收状态的任务可以驳回" }
```

#### `POST /api/families/:familyId/tasks/:id/cancel`

**说明**：取消任务。ORGANIZER 可取消任何任务，MEMBER 仅可取消自己创建的任务。

```
Request:
  Body: { "reason": "今天不在家吃饭，不需要洗碗" }  // string, 可选

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2026-06-10T15:00:00Z",
    "cancelledReason": "今天不在家吃饭，不需要洗碗"
  }
}

Error 40300: { "code": 40300, "message": "仅家庭组织者或任务创建者可以取消任务" }
Error 40901: { "code": 40901, "message": "已完成或已取消的任务不能再次取消" }
```

---

### 3.5 Task Templates — 模板模块 🆕

#### `GET /api/task-templates`

**说明**：获取内置任务模板列表（用于快速创建任务）。

```
Request:
  Query:
    category=  // 可选: 按分类筛选

Response 200:
{
  "code": 0,
  "data": {
    "templates": [
      {
        "id": "uuid",
        "title": "洗碗",
        "description": "用洗洁精认真洗，洗完擦干放回原位",
        "difficulty": 2,
        "suggestedRepeatRule": "DAILY",
        "needsVerification": false,
        "category": "厨房",
        "sortOrder": 1
      },
      {
        "id": "uuid",
        "title": "倒垃圾",
        "description": "分类投放，更换垃圾袋",
        "difficulty": 1,
        "suggestedRepeatRule": "DAILY",
        "needsVerification": false,
        "category": "清洁",
        "sortOrder": 2
      },
      {
        "id": "uuid",
        "title": "拖地",
        "description": "全屋拖一遍，注意角落",
        "difficulty": 3,
        "suggestedRepeatRule": "WEEKLY",
        "needsVerification": false,
        "category": "清洁",
        "sortOrder": 3
      },
      {
        "id": "uuid",
        "title": "洗衣服",
        "description": "分类洗涤，晾干后叠好",
        "difficulty": 3,
        "suggestedRepeatRule": "WEEKLY",
        "needsVerification": false,
        "category": "洗衣",
        "sortOrder": 4
      },
      {
        "id": "uuid",
        "title": "整理房间",
        "description": "收拾桌面、床铺，物品归位",
        "difficulty": 2,
        "suggestedRepeatRule": "DAILY",
        "needsVerification": false,
        "category": "清洁",
        "sortOrder": 5
      }
    ]
  }
}
```

---

### 3.6 Upload — 上传模块

#### `POST /api/upload/image`

**说明**：上传图片（通用接口，可用于头像、任务照片等）。

```
Request:
  Content-Type: multipart/form-data
  Fields:
    file: <file>  // 必填，限制 5MB，允许 jpg/png/webp

Response 200:
{
  "code": 0,
  "data": {
    "url": "/uploads/2026/06/10/uuid-photo.jpg",
    "originalName": "photo.jpg",
    "size": 204800
  }
}

Error 40001: { "code": 40001, "message": "仅支持 JPG、PNG、WebP 格式" }
Error 40002: { "code": 40002, "message": "文件大小不能超过 5MB" }
```

---

## 4. 接口汇总表

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/auth/wechat/h5/login` | 公开 | H5 微信登录 |
| POST | `/api/auth/wechat/mp/login` | 公开 | 小程序微信登录 |
| POST | `/api/auth/refresh` | 公开 | 刷新 Token |
| GET | `/api/auth/me` | 登录 | 当前用户信息 |
| PATCH | `/api/users/me` | 登录 | 更新个人资料 |
| GET | `/api/users/me/settings` | 登录 | 读取提醒设置 🆕 |
| PATCH | `/api/users/me/settings` | 登录 | 更新提醒设置 🆕 |
| POST | `/api/families` | 登录 | 创建家庭 |
| GET | `/api/families` | 登录 | 我的家庭列表 |
| GET | `/api/families/:id` | 成员 | 家庭详情 |
| GET | `/api/families/:id/members` | 成员 | 成员列表 |
| POST | `/api/families/:id/invitations` | ORGANIZER | 生成邀请码 |
| POST | `/api/families/join` | 登录 | 通过邀请码加入 |
| DELETE | `/api/families/:id/members/:memberId` | ORGANIZER | 移除成员 |
| GET | `/api/families/:id/tasks/stats` | 成员 | 家庭任务统计 🆕 |
| POST | `/api/families/:familyId/tasks` | ORGANIZER + MEMBER | 创建任务 |
| GET | `/api/families/:familyId/tasks` | 成员 | 任务列表 |
| GET | `/api/families/:familyId/tasks/:id` | 成员 | 任务详情 |
| PATCH | `/api/families/:familyId/tasks/:id` | ORGANIZER | 编辑任务 |
| POST | `/api/families/:familyId/tasks/:id/complete` | 执行人 | 标记完成 |
| POST | `/api/families/:familyId/tasks/:id/verify` | ORGANIZER | 验收通过 |
| POST | `/api/families/:familyId/tasks/:id/reject` | ORGANIZER | 驳回任务 |
| POST | `/api/families/:familyId/tasks/:id/cancel` | ORGANIZER + 创建者 | 取消任务 |
| GET | `/api/task-templates` | 登录 | 任务模板列表 🆕 |
| POST | `/api/upload/image` | 登录 | 上传图片 |

**共计 26 个接口**（v1.0 为 21 个，新增 5 个）。

---

## 5. 权限矩阵

| 操作 | 公开 | 登录用户 | 家庭成员 | ORGANIZER | MEMBER | CHILD | 任务执行人 | 任务创建者 |
|------|------|----------|----------|-----------|--------|-------|-----------|-----------|
| 微信登录 | ✓ | | | | | | | |
| 刷新 Token | ✓ | | | | | | | |
| 查看个人资料 | | ✓ | | | | | | |
| 读取提醒设置 | | ✓ | | | | | | |
| 更新提醒设置 | | ✓ | | | | | | |
| 创建家庭 | | ✓ | | | | | | |
| 查看家庭/成员 | | | ✓ | | | | | |
| 查看任务统计 | | | ✓ | | | | | |
| 加入家庭 | | ✓ | | | | | | |
| 管理邀请/移除成员 | | | | ✓ | | | | |
| 查看任务 | | | ✓ | | | | | |
| 创建任务 | | | | ✓ | ✓ | 可配置 | | |
| 编辑所有任务 | | | | ✓ | | | | |
| 取消任务 | | | | ✓ | | | | ✓ |
| 标记任务完成 | | | | | | | ✓ | |
| 验收/驳回任务 | | | | ✓ | | | | |
| 上传图片 | | ✓ | | | | | | |
| 浏览模板 | | ✓ | | | | | | |

**权限说明**：
- CHILD 角色"创建任务"权限可配置，由 ORGANIZER 在家庭成员管理中设置（MVP 默认不可创建）
- MEMBER 只能取消**自己创建的**任务，ORGANIZER 可取消任何任务
- CHILD 默认不可创建任务、不可邀请成员
