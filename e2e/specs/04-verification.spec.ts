/**
 * E2E: 验收流程
 *
 * 场景：
 * 1. needsVerification=true 的任务 → 完成后进入 PENDING_VERIFICATION
 * 2. ORGANIZER 验收通过 → COMPLETED
 * 3. ORGANIZER 驳回（含原因） → REJECTED
 * 4. needsVerification=false 的任务 → 完成后直接 COMPLETED
 * 5. 驳回原因展示
 */
import { test, expect } from '@playwright/test';

test.describe('Task Verification', () => {
  test('should go to PENDING_VERIFICATION when needsVerification is true', async ({ page }) => {
    test.skip();
    // TODO
  });

  test('should approve task as organizer', async ({ page }) => {
    test.skip();
    // TODO
  });

  test('should reject task with reason', async ({ page }) => {
    test.skip();
    // TODO
  });

  test('should auto-complete when needsVerification is false', async ({ page }) => {
    test.skip();
    // TODO
  });
});
