#!/usr/bin/env node
/**
 * 内容门禁：检查中文必填、英文可选、英文不能独立存在、项目正文、
 * 示例内容与待翻译条目统计。
 *
 * 用法：
 *   node scripts/check-content.mjs            日常构建检查（示例/回退只警告）
 *   node scripts/check-content.mjs --release  发布检查（示例未清零则失败）
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
const RELEASE = process.argv.includes('--release');

const errors = [];
const warnings = [];
const samples = [];
const fallbacks = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '') return '';
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function parseFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    fail(`${file}: 缺少 frontmatter`);
    return { data: {}, body: '' };
  }

  const data = {};
  let activeList = null;
  let lastItem = null;

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const top = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (top) {
      const [, key, rest] = top;
      activeList = null;
      lastItem = null;
      if (rest.trim() === '') {
        data[key] = [];
        activeList = key;
      } else {
        data[key] = parseScalar(rest);
      }
      continue;
    }

    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && activeList && Array.isArray(data[activeList])) {
      const content = listItem[1].trim();
      const kv = content.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (kv) {
        lastItem = { [kv[1]]: parseScalar(kv[2]) };
        data[activeList].push(lastItem);
      } else {
        lastItem = null;
        data[activeList].push(parseScalar(content));
      }
      continue;
    }

    const nested = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (nested && lastItem && typeof lastItem === 'object') {
      lastItem[nested[1]] = parseScalar(nested[2]);
    }
  }

  return { data, body: source.slice(match[0].length).trim() };
}

async function listMarkdown(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function loadEntry(file) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(ROOT, file).replaceAll('\\', '/');
  const { data, body } = parseFrontmatter(source, relative);
  return { file: relative, data, body };
}

async function loadLocaleDir(dir) {
  const files = await listMarkdown(dir);
  const entries = new Map();

  for (const name of files) {
    const entry = await loadEntry(path.join(dir, name));
    const slug = name.replace(/\.md$/, '');
    entries.set(slug, entry);
  }

  return entries;
}

function sameValue(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

async function main() {
  const profileZh = await loadEntry(path.join(CONTENT_DIR, 'profile', 'zh.md')).catch(() => null);
  if (!profileZh) fail('缺少 src/content/profile/zh.md（中文个人信息必填）');
  if (!profileZh?.file) fail('无法读取中文个人信息');

  const profileEn = await loadEntry(path.join(CONTENT_DIR, 'profile', 'en.md')).catch(() => null);
  if (!profileEn) fallbacks.push('profile');

  const experience = {
    zh: await loadLocaleDir(path.join(CONTENT_DIR, 'experience', 'zh')),
    en: await loadLocaleDir(path.join(CONTENT_DIR, 'experience', 'en')),
  };
  const skills = {
    zh: await loadLocaleDir(path.join(CONTENT_DIR, 'skills', 'zh')),
    en: await loadLocaleDir(path.join(CONTENT_DIR, 'skills', 'en')),
  };

  if (experience.zh.size === 0) fail('至少需要一条中文经历（experience/zh/*.md）');
  if (skills.zh.size === 0) fail('至少需要一个中文能力分类（skills/zh/*.md）');

  for (const [locale, entries] of Object.entries(experience)) {
    for (const [slug, entry] of entries) {
      if (entry.data.locale !== locale) {
        fail(`${entry.file}: locale 应为 ${locale}，实际为 ${entry.data.locale}`);
      }
      if (!entry.data.kind) fail(`${entry.file}: 缺少 kind`);
      if (entry.data.sample === true) samples.push(`experience/${locale}/${slug}`);
      if (entry.data.draft === true) continue;

      if (entry.data.kind === 'project') {
        if (!entry.body) fail(`${entry.file}: 项目必须有案例正文`);
      } else if (entry.body) {
        fail(`${entry.file}: 只有项目可以写案例正文，${entry.data.kind} 的正文必须为空`);
      }
    }
  }

  for (const [slug, enEntry] of experience.en) {
    const zhEntry = experience.zh.get(slug);
    if (!zhEntry) {
      fail(`${enEntry.file}: 英文条目没有对应的中文源（${slug}）`);
      continue;
    }
    for (const field of ['kind', 'start', 'end', 'draft', 'sample']) {
      if (!sameValue(zhEntry.data[field], enEntry.data[field])) {
        fail(
          `${enEntry.file}: 字段 ${field} 与中文源不一致（zh=${JSON.stringify(
            zhEntry.data[field],
          )}, en=${JSON.stringify(enEntry.data[field])}）`,
        );
      }
    }
  }

  for (const [slug] of experience.zh) {
    if (!experience.en.has(slug)) fallbacks.push(`experience/${slug}`);
  }

  for (const [locale, entries] of Object.entries(skills)) {
    for (const [slug, entry] of entries) {
      if (entry.data.locale !== locale) {
        fail(`${entry.file}: locale 应为 ${locale}，实际为 ${entry.data.locale}`);
      }
      if (!Array.isArray(entry.data.items) || entry.data.items.length === 0) {
        fail(`${entry.file}: items 至少需要一项`);
      }
      if (entry.data.sample === true) samples.push(`skills/${locale}/${slug}`);
    }
  }

  for (const [slug, enEntry] of skills.en) {
    if (!skills.zh.has(slug)) {
      fail(`${enEntry.file}: 英文能力分类没有对应的中文源（${slug}）`);
    }
  }

  for (const [slug] of skills.zh) {
    if (!skills.en.has(slug)) fallbacks.push(`skills/${slug}`);
  }

  const skillNames = new Set();

  // 能力名从原始 Markdown 中提取，用于检查经历标签的软引用。
  for (const locale of ['zh', 'en']) {
    const dir = path.join(CONTENT_DIR, 'skills', locale);
    for (const name of await listMarkdown(dir)) {
      const source = await readFile(path.join(dir, name), 'utf8');
      for (const match of source.matchAll(/^\s*-\s*name:\s*(.+)$/gm)) {
        skillNames.add(match[1].trim());
      }
    }
  }

  for (const entry of experience.zh.values()) {
    if (!Array.isArray(entry.data.tags)) continue;
    for (const tag of entry.data.tags) {
      if (!skillNames.has(tag)) {
        warn(`${entry.file}: 标签「${tag}」在能力清单里找不到同名技能`);
      }
    }
  }

  if (profileZh?.data.sample === true) samples.push('profile/zh');
  if (profileEn?.data.sample === true) samples.push('profile/en');

  if (RELEASE && samples.length > 0) {
    fail(`发布检查失败：仍有 ${samples.length} 条示例内容，请替换并删除 sample 标记`);
  }

  if (profileZh) {
    console.log(
      `✓ 中文内容：profile 1，experience ${experience.zh.size}，skills ${skills.zh.size}`,
    );
  }
  console.log(
    `  英文覆盖：profile ${profileEn ? '有' : '回退'}，experience ${
      experience.zh.size - fallbacks.filter((item) => item.startsWith('experience/')).length
    }/${experience.zh.size}，skills ${
      skills.zh.size - fallbacks.filter((item) => item.startsWith('skills/')).length
    }/${skills.zh.size}`,
  );

  for (const warning of warnings) console.warn(`! ${warning}`);
  for (const fallback of fallbacks) console.warn(`  [i18n] 回退中文：${fallback}`);
  if (samples.length > 0) {
    console.log(`  [sample] ${samples.length} 条示例内容：${samples.join(', ')}`);
  }

  if (errors.length > 0) {
    console.error('\n内容检查失败：');
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }

  console.log(
    RELEASE ? '\n✓ 发布检查通过：没有残留示例内容' : '\n✓ 内容检查通过（示例与回退不阻断构建）',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
