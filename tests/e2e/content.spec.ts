import { expect, test } from '@playwright/test';

test('项目卡片可以进入案例详情', async ({ page }) => {
  await page.goto('/experience/');

  const projectLink = page.getByRole('link', { name: /查看案例/ }).first();
  await expect(projectLink).toBeVisible();
  await projectLink.click();

  await expect(page).toHaveURL(/\/experience\/[^/]+\/$/);
  await expect(page.locator('h1')).toHaveText(/\S+/);
  await expect(page.locator('.prose')).toHaveText(/\S+/);
});

test('工作经历没有详情入口', async ({ page, request }) => {
  await page.goto('/experience/');

  const workSection = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: '工作', exact: true }) });
  const workArticle = workSection.locator('article').first();

  if ((await workArticle.count()) === 0) return;

  await expect(workArticle.getByRole('link', { name: /查看案例/ })).toHaveCount(0);

  const slug = await workArticle.getAttribute('id');
  expect(slug).toBeTruthy();

  const response = await request.get(`/experience/${slug}/`);
  expect(response.status()).toBe(404);
});
