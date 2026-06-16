-- ═══════════════════════════════════════════
-- 初始迁移：创建全部 6 张表 + 3 个枚举 + 索引 + 外键
-- 版本：v1.1（同步 requirements.md v1.1）
-- ═══════════════════════════════════════════

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ORGANIZER', 'MEMBER', 'CHILD');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING_COMPLETION', 'PENDING_VERIFICATION', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RepeatRule" AS ENUM ('NONE', 'DAILY', 'WEEKLY');

-- CreateTable: users
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "wechat_openid" VARCHAR(128) NOT NULL,
    "wechat_unionid" VARCHAR(128),
    "nickname" VARCHAR(64) NOT NULL,
    "avatar_url" VARCHAR(512),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: families
CREATE TABLE "families" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "created_by" UUID NOT NULL,
    "invite_code" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable: family_members
CREATE TABLE "family_members" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tasks
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "difficulty" SMALLINT NOT NULL DEFAULT 1,
    "deadline" TIMESTAMPTZ NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING_COMPLETION',
    "repeat_rule" "RepeatRule" NOT NULL DEFAULT 'NONE',
    "needs_verification" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "assigned_to" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "completion_note" TEXT,
    "completion_photo" VARCHAR(512),
    "verified_at" TIMESTAMPTZ,
    "verified_by" UUID,
    "rejection_reason" TEXT,
    "has_notified" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMPTZ,
    "cancelled_by" UUID,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_templates
CREATE TABLE "task_templates" (
    "id" UUID NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "difficulty" SMALLINT NOT NULL DEFAULT 1,
    "suggested_repeat_rule" "RepeatRule" NOT NULL DEFAULT 'NONE',
    "needs_verification" BOOLEAN NOT NULL DEFAULT false,
    "category" VARCHAR(32) NOT NULL DEFAULT '家务',
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: invitations
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "created_by" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- ═══ 索引 ═══

-- users 索引
CREATE UNIQUE INDEX "users_wechat_openid_key" ON "users"("wechat_openid");
CREATE INDEX "users_wechat_unionid_idx" ON "users"("wechat_unionid");

-- families 索引
CREATE UNIQUE INDEX "families_invite_code_key" ON "families"("invite_code");
CREATE INDEX "families_created_by_idx" ON "families"("created_by");

-- family_members 索引
CREATE UNIQUE INDEX "family_members_family_id_user_id_key" ON "family_members"("family_id", "user_id");
CREATE INDEX "family_members_user_id_idx" ON "family_members"("user_id");

-- tasks 索引
CREATE INDEX "tasks_family_id_status_idx" ON "tasks"("family_id", "status");
CREATE INDEX "tasks_assigned_to_status_idx" ON "tasks"("assigned_to", "status");
CREATE INDEX "tasks_deadline_has_notified_idx" ON "tasks"("deadline", "has_notified");
CREATE INDEX "tasks_created_by_idx" ON "tasks"("created_by");
CREATE INDEX "tasks_repeat_rule_idx" ON "tasks"("repeat_rule");
CREATE INDEX "tasks_needs_verification_idx" ON "tasks"("needs_verification");

-- task_templates 索引
CREATE INDEX "task_templates_category_idx" ON "task_templates"("category");
CREATE INDEX "task_templates_is_active_sort_order_idx" ON "task_templates"("is_active", "sort_order");

-- invitations 索引
CREATE UNIQUE INDEX "invitations_code_key" ON "invitations"("code");
CREATE INDEX "invitations_family_id_is_active_idx" ON "invitations"("family_id", "is_active");

-- ═══ 外键约束 ═══

-- families → users (created_by)
ALTER TABLE "families" ADD CONSTRAINT "families_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- family_members → families (CASCADE)
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_fkey"
  FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- family_members → users (CASCADE)
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- tasks → families (CASCADE)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_family_id_fkey"
  FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- tasks → users (created_by, RESTRICT)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- tasks → users (assigned_to, RESTRICT)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey"
  FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- tasks → users (verified_by, SET NULL)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_verified_by_fkey"
  FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- tasks → users (cancelled_by, SET NULL)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_cancelled_by_fkey"
  FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- invitations → families (CASCADE)
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_family_id_fkey"
  FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- invitations → users (created_by, RESTRICT)
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
