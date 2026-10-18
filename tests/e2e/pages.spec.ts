import { expect, test } from '@playwright/test';

test('中文首页包含姓名、定位与主导航', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText('林亦舟');
  await expect(page.locator('body')).toContainText('后端工程师');
  await expect(page.getByRole('link', { name: '经历', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '能力', exact: true }).first()).toBeVisible();
});

test('英文首页可以访问', async ({ page }) => {
  await page.goto('/en/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('Lin Yizhou');
});

test('经历、能力与 404 页面可达', async ({ page }) => {
  await page.goto('/experience/');
  await expect(page.locator('h1')).toContainText('全部经历');

  await page.goto('/skills/');
  await expect(page.locator('h1')).toContainText('全部能力');

  await page.goto('/404.html');
  await expect(page.locator('h1')).toContainText('页面不存在');
});
