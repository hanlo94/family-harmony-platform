# API 接口设计文档

**版本**：v1.0  
**日期**：2026-06-10  
**依赖**：[requirements.md](./requirements.md)、[database.md](./database.md)  
**API 风格**：RESTful JSON

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
| 40300-40399 | 权限相关 | 非组织者操作、非家庭成员 |
| 40400-40499 | 资源不存在 | 任务不存在、家庭不存在 |
| 40900-40999 | 业务冲突 | 重复加入家庭、状态不允许操作 |
| 50000-50099 | 服务端错误 | 数据库异常、微信 API 异常 |

---

## 2. 接口分组概览

| 模块 | 接口数 | 前缀 |
|------|--------|------|
| Auth 认证 | 4 | `/api/auth` |
| User 用户 | 2 | `/api/users` |
| Family 家庭 | 7 | `/api/families` |
| Task 任务 | 8 | `/api/families/:familyId/tasks` |
| Upload 上传 | 1 | `/api/upload` |

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
    { "id": "uuid", "userId": "uuid", "nickname": "小明妈妈", "avatarUrl": "...", "role": "ORGANIZER", "joinedAt": "2026-06-10T10:00:00Z" },
    { "id": "uuid", "userId": "uuid", "nickname": "小明爸爸", "avatarUrl": "...", "role": "MEMBER", "joinedAt": "2026-06-10T10:30:00Z" }
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

---

### 3.4 Task — 任务模块（核心）

#### `POST /api/families/:familyId/tasks`

**说明**：创建任务（仅 ORGANIZER）。

```
Request:
  Body: {
    "title": "今天洗碗",
    "description": "用洗洁精认真洗，洗完擦干放回原位",
    "difficulty": 2,
    "deadline": "2026-06-10T20:00:00Z",
    "assignedTo": "uuid  // 可以为空，空=待分配
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
    "assignedTo": {
      "id": "uuid",
      "nickname": "小明爸爸",
      "avatarUrl": "..."
    },
    "createdBy": { "id": "uuid", "nickname": "小明妈妈" },
    "createdAt": "2026-06-10T10:00:00Z"
  }
}
```

#### `GET /api/families/:familyId/tasks`

**说明**：获取家庭任务列表（支持按状态、执行人筛选 + 分页）。

```
Request:
  Query:
    status=          // 可选: PENDING_COMPLETION | PENDING_VERIFICATION | COMPLETED
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
    "assignedTo": { "id": "uuid", "nickname": "小明爸爸", "avatarUrl": "..." },
    "createdBy": { "id": "uuid", "nickname": "小明妈妈" },
    "completionPhoto": null,
    "completedAt": null,
    "verifiedAt": null,
    "verifiedBy": null,
    "rejectionReason": null,
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
    "assignedTo": "new-user-uuid"
  }

Response 200: { "code": 0, "data": { ... } }

Error 40300: { "code": 40300, "message": "仅家庭组织者可以编辑任务" }
Error 40900: { "code": 40900, "message": "已完成或已取消的任务不可编辑" }
```

#### `POST /api/families/:familyId/tasks/:id/complete`

**说明**：执行人标记任务完成（Multipart 表单上传照片）。

```
Request:
  Content-Type: multipart/form-data
  Fields:
    photo: <file>  // 图片文件，可选，最大 5MB

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "PENDING_VERIFICATION",
    "completedAt": "2026-06-10T18:30:00Z",
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

**说明**：组织者驳回任务（仅 ORGANIZER）。

```
Request:
  Body: { "reason": "碗没洗干净，请重新洗" }

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "PENDING_COMPLETION",
    "rejectionReason": "碗没洗干净，请重新洗"
  }
}

Error 40300: { "code": 40300, "message": "仅家庭组织者可以驳回任务" }
Error 40901: { "code": 40901, "message": "仅待验收状态的任务可以驳回" }
```

#### `POST /api/families/:familyId/tasks/:id/cancel`

**说明**：取消任务（仅 ORGANIZER）。

```
Request:
  Body: { "reason": "今天不在家吃饭，不需要洗碗" }  // 可选

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2026-06-10T15:00:00Z"
  }
}

Error 40300: { "code": 40300, "message": "仅家庭组织者可以取消任务" }
Error 40901: { "code": 40901, "message": "已完成或已取消的任务不能再次取消" }
```

---

### 3.5 Upload — 上传模块

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
| POST | `/api/families` | 登录 | 创建家庭 |
| GET | `/api/families` | 登录 | 我的家庭列表 |
| GET | `/api/families/:id` | 成员 | 家庭详情 |
| GET | `/api/families/:id/members` | 成员 | 成员列表 |
| POST | `/api/families/:id/invitations` | ORGANIZER | 生成邀请码 |
| POST | `/api/families/join` | 登录 | 通过邀请码加入 |
| DELETE | `/api/families/:id/members/:memberId` | ORGANIZER | 移除成员 |
| POST | `/api/families/:familyId/tasks` | ORGANIZER | 创建任务 |
| GET | `/api/families/:familyId/tasks` | 成员 | 任务列表 |
| GET | `/api/families/:familyId/tasks/:id` | 成员 | 任务详情 |
| PATCH | `/api/families/:familyId/tasks/:id` | ORGANIZER | 编辑任务 |
| POST | `/api/families/:familyId/tasks/:id/complete` | 执行人 | 标记完成 |
| POST | `/api/families/:familyId/tasks/:id/verify` | ORGANIZER | 验收通过 |
| POST | `/api/families/:familyId/tasks/:id/reject` | ORGANIZER | 驳回任务 |
| POST | `/api/families/:familyId/tasks/:id/cancel` | ORGANIZER | 取消任务 |
| POST | `/api/upload/image` | 登录 | 上传图片 |

**共计 21 个接口**。

---

## 5. 权限矩阵

| 操作 | 公开 | 登录用户 | 家庭成员 | ORGANIZER | 任务执行人 |
|------|------|----------|----------|-----------|-----------|
| 微信登录 | ✓ | | | | |
| 刷新 Token | ✓ | | | | |
| 查看个人资料 | | ✓ | | | |
| 创建家庭 | | ✓ | | | |
| 查看家庭/成员 | | | ✓ | | |
| 加入家庭 | | ✓ | | | |
| 管理邀请/成员 | | | | ✓ | |
| 查看任务 | | | ✓ | | |
| 创建/编辑/取消任务 | | | | ✓ | |
| 标记任务完成 | | | | | ✓ |
| 验收/驳回任务 | | | | ✓ | |
| 上传图片 | | ✓ | | | |
