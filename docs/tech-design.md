---
doc: tech-design
title: 个人主页技术方案：Astro 静态站 + Pages CMS 后台
version: 7
updated: 2026-10-18
based-on: PRD v8
based-on-date: 2026-10-18
---
## 1. 技术栈

### 1.1 前端

| 选择 | 版本 | 用途 |
| --- | --- | --- |
| Astro | ^5.0.0 | 静态生成、文件路由、内容集合、i18n 路由、图片优化 |
| TypeScript | ^5.6.0 | 全站类型约束，`strict: true` |
| Tailwind CSS | ^4.0.0 | 原子化样式与设计令牌 |
| @tailwindcss/vite | ^4.0.0 | 在 Astro 的 Vite 管道中启用 Tailwind 4 |
| Astro 内置 i18n | Astro 5 自带 | `/` 与 `/en/` 双语言路由 |

**为什么用 Astro**：纯内容站，构建期生成 HTML，默认零客户端 JavaScript；语言切换用普通链接，禁用 JS 也能用；内容集合的 Zod schema 能在构建期拦住字段错误；`getStaticPaths` 只给项目生成详情页。

**没有选的方案**：Next.js / Nuxt 需要 SSR 与运行时；Vite + React SPA 依赖 JS；Hugo / Jekyll 缺少类型化内容校验；i18next 等运行时 i18n 库和零 JS 目标冲突。

### 1.2 后端

**没有自建后端。** 没有 API、数据库、服务端会话和自建登录。

内容管理通过 **Pages CMS**（Git 型 CMS，托管在 `app.pagescms.org`）：

- 用户用 GitHub 账号登录，GitHub App 授权后读写仓库。
- 保存内容 = 生成一次 Git commit，推到默认分支。
- Cloudflare Pages 监听推送，自动跑 `pnpm build` 并发布 `dist/`。
- 后台权限完全由 GitHub 仓库权限控制；站点不提供 `/admin`，也不暴露任何写接口。

不选 Directus / Sanity / Strapi 的原因：它们需要长期维护数据库、账号、媒体库和升级，单人对低频内容不值得。Pages CMS 的代价是没有实时预览、没有数据库查询、图片随仓库变大，这些在当前规模可接受。

### 1.3 数据存储

- `src/content/profile/{zh,en}.md`：个人信息。
- `src/content/experience/{zh,en}/<slug>.md`：经历；`kind: project` 带正文。
- `src/content/skills/{zh,en}/<slug>.md`：能力分类。
- `public/projects/<slug>/`：已有案例配图。
- `public/uploads/`：Pages CMS 后续上传的图片，输出路径 `/uploads/...`。
- `src/assets/`：头像等需要构建优化的图片。

内容仍然全部在 Git 仓库里，没有数据库。历史版本、回滚和审计由 Git 承担。

### 1.4 关键依赖与部署配置

| 包 | 版本 | 用途 |
| --- | --- | --- |
| astro | ^5.0.0 | 核心框架 |
| @astrojs/check | ^0.9.0 | `astro check` |
| tailwindcss / @tailwindcss/vite | ^4.0.0 | 样式 |
| eslint / typescript-eslint / eslint-plugin-astro | ^9 / ^8 / ^1 | Lint |
| prettier / prettier-plugin-astro | ^3.3 / ^0.14 | 格式化 |
| @playwright/test | ^1.48.0 | 端到端测试 |

**管理端配置**：仓库根目录 `.pages.yml`，不需要安装 npm 包。字段定义必须与 `src/content.config.ts` 保持一致。

**Cloudflare Pages**：

- 项目名 `personal-homepage`，默认域名 `https://personal-homepage.pages.dev`
- 生产分支 `main`，其他分支 Preview Deployment
- 构建命令 `pnpm build`，输出目录 `dist`
- 环境变量 `NODE_VERSION=24`
- 不引入 `@astrojs/cloudflare` adapter
- `public/_headers` 原样复制为 `dist/_headers`

### 1.5 本地 Windows 说明

- `.npmrc` 使用 `node-linker=hoisted`，避免 Windows 下 pnpm 符号链接栈溢出。
- corepack 缓存目录不可写时，运行 pnpm 前设置 `COREPACK_HOME` 到仓库内 `.corepack`。
- 构建前设置 `ASTRO_TELEMETRY_DISABLED=1`，避免 Astro 遥测写用户目录失败。
- 本机已装 Chrome 时，用 `PLAYWRIGHT_CHANNEL=chrome` 跑 E2E。

## 2. 项目结构

```text
.
├─ .pages.yml                     # Pages CMS 后台配置（内容模型）
├─ src/
│  ├─ content/
│  │  ├─ profile/{zh,en}.md
│  │  ├─ experience/{zh,en}/<slug>.md
│  │  └─ skills/{zh,en}/<slug>.md
│  ├─ content.config.ts           # Zod schema + 空值归一化
│  ├─ i18n/{ui.ts,routes.ts}
│  ├─ lib/{content.ts,dates.ts,experiences.ts}
│  ├─ layouts/BaseLayout.astro
│  ├─ views/*.astro
│  ├─ components/*.astro
│  ├─ pages/
│  │  ├─ index.astro / experience/ / skills.astro / 404.astro
│  │  └─ en/ ...                # 英文镜像路由
│  ├─ styles/global.css
│  └─ assets/
├─ public/
│  ├─ _headers
│  ├─ robots.txt
│  ├─ favicon.svg
│  ├─ projects/<slug>/          # 已有案例图
│  ├─ uploads/                  # Pages CMS 上传图
│  └─ resume.pdf                # 可选
├─ scripts/check-content.mjs
├─ tests/e2e/*.spec.ts
├─ docs/tech-design.md
├─ .github/workflows/{ci.yml,release-check.yml}
├─ astro.config.mjs
├─ package.json
├─ pnpm-lock.yaml
├─ PRD.md
└─ AGENTS.md
```

职责：

- `src/pages/` 只做路由声明；`src/views/` 放页面级取数与组装；`src/components/` 放展示组件。
- `src/i18n/ui.ts` 是 UI 文案唯一来源；`routes.ts` 负责 `/en` 前缀与语言切换路径。
- `src/content/` 只放 Markdown；`public/uploads/` 只放后台上传图。
- `.pages.yml` 是后台契约，不能与 schema 脱节。

## 3. 数据模型

### 3.1 Profile

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| locale | `zh \| en` | 是 | 与目录一致 |
| sample | boolean | 否 | 示例内容标记 |
| name / headline / location | string | 是 | 姓名、定位、所在地 |
| email | string | 是 | 公开展示 |
| avatar | string | 否 | `src/assets/` 下文件名 |
| socials | `{label,url,icon?}[]` | 是 | 社交链接 |
| resumeUrl | string | 否 | 有值才显示下载 |
| updated | date | 是 | 最近更新 |
| body | Markdown | 是 | 2–4 段简介 |

### 3.2 Experience

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| locale / sample | 枚举 / boolean | 是 / 否 | 语言与示例标记 |
| kind | `work \| project \| education` | 是 | 决定是否有详情页 |
| title / org | string | 是 | 角色、组织 |
| start | `YYYY-MM` | 是 | 开始时间 |
| end | `YYYY-MM \| null` | 是 | 空表示至今 |
| location | string | 否 | 地点 |
| summary | string | 是 | ≤120 字 |
| highlights | string[] | 是 | 最多 5 条 |
| tags | string[] | 是 | 软引用技能名 |
| links | `{label,url}[]` | 否 | 相关链接 |
| draft | boolean | 是 | 草稿不发布 |
| body | Markdown | 条件 | 项目必填，其他必须为空 |

规则：中文必填，英文可选；英文文件名必须与中文相同；英文存在时 `kind/start/end/draft/sample` 必须一致；仅英文的条目构建失败。

### 3.3 SkillGroup

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| locale / sample | 枚举 / boolean | 是 / 否 | 语言与示例标记 |
| category | string | 是 | 分类名 |
| order | number | 是 | 升序 |
| items | `{name,level?,years?,note?}[]` | 是 | 至少 1 项 |

### 3.4 Pages CMS 与 schema 的对应

| `.pages.yml` 条目 | 文件路径 | 对应 schema |
| --- | --- | --- |
| profile-zh / profile-en | `src/content/profile/*.md` | profile |
| experience-zh / experience-en | `src/content/experience/{zh,en}/` | experience |
| skills-zh / skills-en | `src/content/skills/{zh,en}/` | skills |

字段名与 schema 一一对应；`body` 是 Pages CMS 的特殊字段，映射到 frontmatter 下方的 Markdown 正文。

**空值归一化**：Pages CMS 会把留空字段写成空字符串。schema 用 `z.preprocess` 把 `end` 的 `''` 转成 `null`，把 `avatar`、`resumeUrl`、`icon`、`level`、`years` 的 `''` 转成 `undefined`，避免后台保存后构建失败。

### 3.5 派生视图

- `BilingualPair<T>`：`{ slug, zh, en | null }`
- `resolveForLocale(pair, locale)`：英文缺失时回退中文并标记 `isFallback`
- `ExperienceView`：`href`、`period`、`isFallback`、`hasDetail`
- `SiteFlags.hasSample`：任一已发布条目为示例内容时显示全局横幅

## 4. 关键技术点

1. **后台是 Git 客户端，不是服务器**。Pages CMS 保存时提交 Markdown；Cloudflare Pages 重新构建。没有数据库、没有运行时 API，攻击面只有 GitHub 权限。

2. **`.pages.yml` 与 Zod schema 必须同步**。新增/重命名字段时先改 schema，再改 `.pages.yml`；否则后台能填但构建失败。字段类型、必填、选项列表都要对齐。

3. **后台登录复用 GitHub App**。在 `app.pagescms.org` 安装 GitHub App 到目标仓库；只有仓库协作者能进入。不要在站点里加登录页、密码或用户表。

4. **图片走 `public/uploads/`**。`.pages.yml` 的 `media` 配置 `input: public/uploads`、`output: /uploads`；富文本插图会自动写 `/uploads/...`。`public/projects/` 继续放已有案例图。

5. **文件名配对仍需人工保证**。Pages CMS 新建条目时用 `filename.field: create` 允许改文件名；中英文两侧必须用同一个 slug，否则 `check-content.mjs` 会报英文孤儿或缺失。

6. **草稿与示例只影响构建**。`draft: true` 的条目在构建时整对排除；`sample: true` 只显示横幅并让 `--release` 失败，不阻止预览。后台仍能看到草稿。

7. **没有实时预览**。保存后要等 Cloudflare 构建（约 1 分钟）。需要即时看效果时本地 `pnpm dev`；Cloudflare 的 Preview Deployment 只对分支/PR 生效，Pages CMS 默认提交到 `main`。

8. **空字符串兼容**。后台保存的 `end: ""`、`level: ""`、`years: ""` 在 schema 层归一化；新增字段时也要考虑空值。

9. **双语回退与语言标注**。英文页 `lang="en"`，回退正文容器 `lang="zh-CN"`；提示条从 `ui.ts` 取文案。

10. **项目详情只由 `kind` 决定**。没有 `detail` 开关；`project` 自动生成 `/experience/<slug>/`，`work`/`education` 写了正文会构建失败。

11. **三重 noindex**。meta、`robots.txt`、Cloudflare `_headers`；后台页面在 Pages CMS 域名下，不在本站，不需要额外处理。

12. **构建确定性**。锁文件、Node 24、只装 chromium、系统字体、本地 SVG；Pages CMS 提交只改 Markdown/图片，不碰锁文件。

13. **回退内容可访问性**。英文页回退中文时，正文外层必须是 `lang="zh-CN"`；屏幕阅读器才不会用英文语音读中文。

14. **日期时区**。frontmatter 只存 `YYYY-MM`；展示用 `Date.UTC` + `Intl.DateTimeFormat`，不依赖构建机时区。

15. **后台图片与仓库体积**。图片随 Git 提交，仓库会变大；超过可接受范围再迁移到 R2/S3，并同步改 `media` 配置。

## 5. 与 PRD 的对应关系

| PRD 功能 | 实现 | 验收 |
| --- | --- | --- |
| M1 首页与个人信息 | `HomePage`、`ProfileHero`、`ContactLinks` | E2E 断言中英文首页 |
| M2 经历时间线 | `ExperienceListPage`、`ExperienceTimeline` | E2E 断言排序、分组、锚点 |
| M3 项目详情 | `ExperienceDetailPage` + `getStaticPaths` | E2E 从项目卡片进入，工作无入口 |
| M4 能力清单 | `SkillsPage`、`SkillGroup` | E2E 断言分类与条目 |
| M5 双语与回退 | `resolveForLocale`、`FallbackNotice`、`routes.ts` | E2E 双向往返、`lang`、回退提示 |
| M6 站点基础 | `BaseLayout`、`404`、`robots.txt`、`_headers` | E2E noindex、`dist/_headers` |
| M7 示例内容 | `sample` 字段、`SampleNotice`、`--release` | E2E 横幅；`--release` 失败 |
| M8 内容后台 | `.pages.yml`、Pages CMS、GitHub App | 后台改一条内容 → 提交 → Cloudflare 构建成功 |

## 6. 约束与假设

- 【假设】后台用 Pages CMS 托管版，不自建 CMS、不自建登录。
- 【假设】后台权限由 GitHub 仓库协作者控制，不建用户表。
- 【假设】保存后走 Git commit + Cloudflare 重建，接受约 1 分钟延迟。
- 【假设】没有实时预览；本地 `pnpm dev` 或 Preview Deployment 代替。
- 【假设】图片上传到 `public/uploads/`，随仓库提交。
- 【假设】`.pages.yml` 是唯一后台配置，不引入第二个 CMS。
- 【假设】页面仍是纯静态，不引 SSR adapter。
- 【假设】工作与教育没有详情页，只有项目有。
- 【假设】中文必填、英文可选；缺英文回退中文。
- 【假设】站点公开、无鉴权；后台不在本站。
- 【假设】Node 24 为本机与部署运行时，兼容 Node 22+。
- 【推断】E2E 只覆盖 chromium；Safari 手机端人工目检。

## 7. 待确认

1. Pages CMS 继续用托管版，还是以后自托管到自己的域名？
2. 是否需要保存后自动预览？当前只能等 Cloudflare 重建。
3. 仓库是公开还是私有？公开仓库的内容与提交历史会公开。
4. 图片长期放仓库，还是以后迁到 R2/S3？
5. 项目案例页是否需要固定写作模板？
6. 能力熟练度是否保留？
7. 是否需要简历 PDF？
