import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

test('页面输出 noindex，robots.txt 禁止抓取', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

  const robots = await page.request.get('/robots.txt');
  const text = await robots.text();
  expect(text).toContain('Disallow: /');
});

test('构建产物包含 Cloudflare Pages 的 _headers', () => {
  const headers = readFileSync(path.join(process.cwd(), 'dist', '_headers'), 'utf8');
  expect(headers).toContain('X-Robots-Tag: noindex, nofollow');
  expect(headers).toContain('X-Content-Type-Options: nosniff');
});

test('不生成 sitemap', async ({ request }) => {
  const response = await request.get('/sitemap-index.xml');
  expect(response.status()).toBe(404);
});

test('只保留中文，/en/ 返回 404', async ({ request }) => {
  const response = await request.get('/en/');
  expect(response.status()).toBe(404);
});
