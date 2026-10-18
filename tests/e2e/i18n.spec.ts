import { expect, test } from '@playwright/test';

test('语言切换停留在当前页并可往返', async ({ page }) => {
  await page.goto('/experience/');
  await page.getByRole('link', { name: '切换到英文' }).click();

  await expect(page).toHaveURL(/\/en\/experience\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('link', { name: 'Switch to Chinese' }).click();
  await expect(page).toHaveURL(/\/experience\/$/);
});

test('案例详情页切换语言后仍停留在同一篇', async ({ page }) => {
  await page.goto('/experience/2024-orion-checkout/');
  await page.getByRole('link', { name: '切换到英文' }).click();

  await expect(page).toHaveURL(/\/en\/experience\/2024-orion-checkout\/$/);
  await expect(page.locator('h1')).toContainText('Orion checkout rebuild');
});

test('语言切换是普通链接，不依赖 JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/skills/');
  await page.getByRole('link', { name: '切换到英文' }).click();

  await expect(page).toHaveURL(/\/en\/skills\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await context.close();
});
