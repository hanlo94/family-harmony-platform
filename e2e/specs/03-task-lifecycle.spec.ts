/**
 * E2E: 任务完整生命周期
 *
 * 场景：
 * 1. 创建任务（模板选择 → 表单填写 → 提交）
 * 2. 查看任务列表（含逾期/临近到期标记）
 * 3. 任务详情查看
 * 4. 标记任务完成
 * 5. 取消任务
 * 6. 重复任务自动生成
 */
import { test, expect } from '@playwright/test';

test.describe('Task Lifecycle', () => {
  test('should create a task from template', async ({ page }) => {
    test.skip();
    // TODO
  });

  test('should show tasks in list with overdue badges', async ({ page }) => {
    test.skip();
    // TODO
  });

  test('should mark task as complete', async ({ page }) => {
    test.skip();
    // TODO
  });

  test('should cancel a task', async ({ page }) => {
    test.skip();
    // TODO
  });

  test('should auto-generate next recurring task', async ({ page }) => {
    test.skip();
    // TODO
  });
});
