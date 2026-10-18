#!/usr/bin/env node
/**
 * 内容门禁：中文站版本。
 * 检查中文内容是否存在、项目正文、示例内容数量。
 *
 * 用法：
 *   node scripts/check-content.mjs            日常构建检查（示例只警告）
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

async function loadCollection(dir) {
  const files = await listMarkdown(dir);
  const entries = [];

  for (const name of files) {
    const entry = await loadEntry(path.join(dir, name));
    entries.push({ slug: name.replace(/\.md$/, ''), ...entry });
  }

  return entries;
}

async function main() {
  const profile = await loadEntry(path.join(CONTENT_DIR, 'profile', 'zh.md')).catch(() => null);
  if (!profile) {
    fail('缺少 src/content/profile/zh.md（中文个人信息必填）');
  }

  const experiences = await loadCollection(path.join(CONTENT_DIR, 'experience', 'zh'));
  const skills = await loadCollection(path.join(CONTENT_DIR, 'skills', 'zh'));

  if (experiences.length === 0) {
    fail('至少需要一条中文经历（experience/zh/*.md）');
  }
  if (skills.length === 0) {
    fail('至少需要一个中文能力分类（skills/zh/*.md）');
  }

  for (const entry of experiences) {
    if (entry.data.locale !== 'zh') {
      fail(`${entry.file}: locale 应为 zh`);
    }
    if (!entry.data.kind) {
      fail(`${entry.file}: 缺少 kind`);
    }
    if (entry.data.sample === true) {
      samples.push(`experience/${entry.slug}`);
    }
    if (entry.data.draft === true) continue;

    if (entry.data.kind === 'project') {
      if (!entry.body) fail(`${entry.file}: 项目必须有案例正文`);
    } else if (entry.body) {
      fail(`${entry.file}: 只有项目可以写案例正文，${entry.data.kind} 的正文必须为空`);
    }
  }

  for (const entry of skills) {
    if (entry.data.locale !== 'zh') {
      fail(`${entry.file}: locale 应为 zh`);
    }
    if (!Array.isArray(entry.data.items) || entry.data.items.length === 0) {
      fail(`${entry.file}: items 至少需要一项`);
    }
    if (entry.data.sample === true) {
      samples.push(`skills/${entry.slug}`);
    }
  }

  if (profile?.data.sample === true) {
    samples.push('profile/zh');
  }

  // 能力名从原始 Markdown 中提取，用于检查经历标签的软引用。
  const skillNames = new Set();
  for (const name of await listMarkdown(path.join(CONTENT_DIR, 'skills', 'zh'))) {
    const source = await readFile(path.join(CONTENT_DIR, 'skills', 'zh', name), 'utf8');
    for (const match of source.matchAll(/^\s*-\s*name:\s*(.+)$/gm)) {
      skillNames.add(match[1].trim());
    }
  }

  for (const entry of experiences) {
    if (!Array.isArray(entry.data.tags)) continue;
    for (const tag of entry.data.tags) {
      if (!skillNames.has(tag)) {
        warn(`${entry.file}: 标签「${tag}」在能力清单里找不到同名技能`);
      }
    }
  }

  if (RELEASE && samples.length > 0) {
    fail(`发布检查失败：仍有 ${samples.length} 条示例内容，请替换并删除 sample 标记`);
  }

  if (profile) {
    console.log(`✓ 中文内容：profile 1，experience ${experiences.length}，skills ${skills.length}`);
  }

  for (const warning of warnings) console.warn(`! ${warning}`);
  if (samples.length > 0) {
    console.log(`  [sample] ${samples.length} 条示例内容：${samples.join(', ')}`);
  }

  if (errors.length > 0) {
    console.error('\n内容检查失败：');
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }

  console.log(
    RELEASE ? '\n✓ 发布检查通过：没有残留示例内容' : '\n✓ 内容检查通过（示例不阻断构建）',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
