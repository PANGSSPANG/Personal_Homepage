import { expect, test } from '@playwright/test';

test('项目卡片可以进入案例详情', async ({ page }) => {
  await page.goto('/experience/');

  const project = page.locator('[id="2024-orion-checkout"]');
  await project.getByRole('link', { name: /查看案例/ }).click();

  await expect(page).toHaveURL(/\/experience\/2024-orion-checkout\/$/);
  await expect(page.locator('h1')).toContainText('Orion 结算台重构');
  await expect(page.locator('.prose')).toContainText('结算成功率从 92% 提升到 99.6%');
});

test('工作经历没有详情入口', async ({ page, request }) => {
  await page.goto('/experience/');

  const work = page.locator('[id="2022-acme-backend"]');
  await expect(work.getByRole('link', { name: /查看案例/ })).toHaveCount(0);

  const response = await request.get('/experience/2022-acme-backend/');
  expect(response.status()).toBe(404);
});

test('英文页面缺翻译时显示中文回退', async ({ page }) => {
  await page.goto('/en/experience/2023-atlas-console/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('This entry is not translated yet.')).toBeVisible();
  await expect(page.locator('[lang="zh-CN"]')).toContainText('Atlas 的运营团队有大量重复操作');
});
