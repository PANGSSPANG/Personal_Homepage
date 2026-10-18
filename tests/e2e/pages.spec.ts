import { expect, test } from '@playwright/test';

test('中文首页可访问并显示主导航', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('h1')).toHaveText(/\S+/);
  await expect(page.getByRole('link', { name: '经历', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '能力', exact: true }).first()).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
});

test('经历、能力与 404 页面可达', async ({ page }) => {
  await page.goto('/experience/');
  await expect(page.locator('h1')).toContainText('全部经历');

  await page.goto('/skills/');
  await expect(page.locator('h1')).toContainText('全部能力');

  await page.goto('/404.html');
  await expect(page.locator('h1')).toContainText('页面不存在');
});
