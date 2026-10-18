---
doc: agents
title: 个人主页开发规范
version: 8
updated: 2026-10-18
based-on: 技术方案 v7
based-on-date: 2026-10-18
---
## 1. 项目概述

这是一个**以站主本人为主要用户**的单人多页静态个人主页，招聘方是次要读者。它展示个人信息、工作 / 项目 / 教育经历、能力清单和项目案例长文。中文是内容源，英文可选；缺英文时英文页面回退展示中文原文并明确提示。只有项目类经历有案例详情页，工作与教育只出现在时间线上。站点部署在 **Cloudflare Pages**（项目 `personal-homepage`，默认域名 `https://personal-homepage.pages.dev`），内容通过 **Pages CMS** 的 Git 型后台编辑：GitHub 登录 → 填表保存 → 自动 commit → Cloudflare 重建。站点不做搜索引擎收录、不做访问统计、不做站内登录或访问密码、不展示「在职 / 开放机会」状态标签。首次搭建使用一套带 `sample: true` 的虚拟示例内容，页面上会显示「示例内容，待替换」。技术形态是 Astro 5 静态站点，`pnpm build` 产出 `dist/`。本文件派生自 `PRD.md` 与 `docs/tech-design.md`；三者冲突时以文档为准，先改文档再改代码。

## 2. 开发规范

### 2.1 环境与版本

- Node.js 24.x LTS，以仓库根目录 `.nvmrc` 为准。开始前执行 `node -v`，应输出 `v24.*`。Node 22+ 也兼容，但本机与 CI 以 24 为准。
- pnpm 10.x。首次使用执行 `corepack enable`，再执行 `corepack prepare pnpm@10 --activate`。
- 禁止使用 npm 或 yarn 安装依赖；仓库只保留 `pnpm-lock.yaml`。
- 仓库使用 `.npmrc` 的 `node-linker=hoisted`。不要改回符号链接布局：Windows 下 pnpm 的 symlink 阶段会栈溢出。
- 如果本机 corepack 缓存目录不可写，在运行 pnpm 前把 `COREPACK_HOME` 指向仓库内 `.corepack`：`$env:COREPACK_HOME='D:\codes\harnessCodes\.corepack'`。
- 在受限环境里 Astro 遥测会写用户目录失败，构建前设置 `ASTRO_TELEMETRY_DISABLED=1`。
- 浏览器测试依赖 Playwright chromium，首次执行 `pnpm exec playwright install chromium`。本机已装 Chrome 时，可设 `PLAYWRIGHT_CHANNEL=chrome`。

### 2.2 常用命令

| 目的 | 确切命令 |
| --- | --- |
| 安装依赖（本地） | `pnpm install` |
| 安装依赖（CI） | `pnpm install --frozen-lockfile` |
| 启动开发服务器 | `pnpm dev`（默认 http://localhost:4321） |
| 类型与内容校验 | `pnpm check`（即 `astro check`） |
| 生产构建 | `pnpm build`（依次执行 `astro check`、`node scripts/check-content.mjs`、`astro build`） |
| 预览构建产物 | `pnpm preview`（需先 `pnpm build`） |
| Lint | `pnpm lint`（即 `eslint .`） |
| 格式化写入 | `pnpm format`（即 `prettier --write .`） |
| 格式化检查 | `pnpm format:check`（即 `prettier --check .`） |
| 端到端测试 | `pnpm build && pnpm test:e2e`（后者即 `playwright test`） |
| 发布前示例清零检查 | `pnpm check:release`（即 `node scripts/check-content.mjs --release`） |
| 全量门禁 | `pnpm verify`（依次执行 `format:check`、`lint`、`check`、`build`、`test:e2e`） |

### 2.3 目录约定

- `src/pages/` 只做路由声明：每个文件设置 `lang`，渲染 `src/views/` 中对应视图，不写业务逻辑。中文页面在 `src/pages/`，英文页面在 `src/pages/en/`；新增页面必须同时新增两侧路由文件。
- `src/views/` 放页面级视图，接收 `lang` 并完成取数与区块组装；中英文共用。
- `src/components/` 放纯展示组件，PascalCase，一个文件一个组件；组件只接收 props，不直接读取内容集合。
- `src/i18n/ui.ts` 是界面文案的唯一来源，包含回退提示与示例提示。组件里不允许硬编码「经历」「返回」「暂无英文版」「示例内容」这类文案。
- `src/i18n/routes.ts` 放路径前缀与语言切换计算，禁止在组件里手拼 `/en` 前缀。
- `src/content/profile/` 必须有 `zh.md`，`en.md` 可选；`src/content/experience/zh/` 与 `src/content/skills/zh/` 必须有内容，对应的 `en/` 目录可选，英文文件名必须与中文侧完全相同。
- `src/lib/` 放纯函数，不 import Astro 运行时。中英文回退只允许在 `src/lib/content.ts` 的 `resolveForLocale` 里判断。
- `public/_headers` 是 Cloudflare Pages 的部署契约，必须提交，不能删。
- `public/uploads/` 只放 Pages CMS 上传的图片；`public/projects/<slug>/` 放已有案例图；两者不要混用。
- `src/assets/` 放需要构建优化的图片（头像）；`public/` 还放 `favicon.svg`、`robots.txt`、可选的 `resume.pdf`。
- `.pages.yml` 是 Pages CMS 的后台配置，必须与 `src/content.config.ts` 同步，不能脱节。
- `tests/e2e/` 放 Playwright 用例，按 `pages`、`content`、`i18n`、`privacy` 拆分。
- `scripts/` 放构建期校验脚本，只允许 Node 内置模块。
- 禁止把组件放进 `src/pages/`，禁止把页面逻辑写进 `src/components/`，禁止提交 `dist/`、`.astro/`、`node_modules/`、`.env*`。

### 2.4 提交与分支约定

无正式约定。单人仓库，默认直接在 `main` 提交；引入第二位贡献者后再启用 PR 评审与分支保护。提交信息用一句话说明改动内容，中文或英文均可，不强制 Conventional Commits。

### 2.5 Cloudflare Pages 部署约定

- Pages 项目名：`personal-homepage`；若该名称已被占用，追加 4 位随机后缀，代码无需改动。
- 默认域名：`https://personal-homepage.pages.dev`；暂不绑定自定义域名。
- 生产分支：`main`；其他分支生成 Preview Deployment。
- 构建命令 `pnpm build`，输出目录 `dist`，根目录为仓库根。
- 环境变量 `NODE_VERSION=24`；pnpm 版本由 `package.json` 的 `packageManager` 字段固定为 `pnpm@10.x`。
- 不引入 `@astrojs/cloudflare` adapter，不做 SSR；Pages 只托管静态 `dist/`。
- `public/_headers` 会原样复制为 `dist/_headers`，用于输出 `X-Robots-Tag: noindex, nofollow` 等响应头。
- 部署后必须用 `curl -I https://personal-homepage.pages.dev/` 确认响应头包含 `X-Robots-Tag`。

### 2.6 Pages CMS 后台约定

- 后台入口是 `https://app.pagescms.org`，不是本站的 `/admin`。不要在站点里新增管理入口、登录页或写接口。
- 首次使用：GitHub 登录 → 安装 Pages CMS GitHub App 到本仓库 → 选择仓库。只有仓库协作者能进入。
- 后台配置只有 `.pages.yml` 一个来源。改字段时先改 `src/content.config.ts`，再改 `.pages.yml`，两边保持一致。
- 后台字段的 `name` 必须与 schema 字段名完全一致；`body` 是特殊字段，映射到 frontmatter 下的 Markdown 正文。
- 新建中英文条目时，文件名必须相同（同一个 slug）。Pages CMS 新建时允许改文件名；英文侧不要用不同文件名。
- 图片统一上传到 `public/uploads/`，正文引用 `/uploads/...`；不要上传到 `public/projects/` 或外部图床。
- 保存后等待 Cloudflare 重建（约 1 分钟），不要以为保存后立即生效。
- 后台没有实时预览；要看效果用 `pnpm dev` 或 Cloudflare Preview Deployment。
- 草稿用 `draft: true` 排除；示例内容用 `sample: true` 标记，发布前在后台关闭或删除。
- 后台不提供版本对比界面，回滚用 GitHub 的提交历史。

## 3. 测试要求

- 跑测试的确切命令：`pnpm build && pnpm test:e2e`。首次需先执行 `pnpm exec playwright install chromium`。
- 提交前至少执行：`pnpm verify`。任何一步失败都不得提交。
- 以下改动必须新增或修改 `tests/e2e/` 下的用例：
  - 新增或修改 `src/pages/**` 下的路由；
  - 修改 `src/content.config.ts` 的集合定义、字段或校验规则；
  - 修改 `src/i18n/routes.ts`、`src/i18n/ui.ts`；
  - 修改 `src/lib/content.ts`、`dates.ts`、`experiences.ts`；
  - 修改 `LanguageSwitch.astro`、`SiteHeader.astro`、`FallbackNotice.astro`、`SampleNotice.astro` 或 `BaseLayout.astro`；
  - 修改项目详情页生成逻辑。
- 必须覆盖的断言：
  - 每个项目卡片都有详情入口，详情页有正文与返回链接；
  - 工作与教育卡片没有详情入口，直接访问 `/experience/<work-slug>/` 返回 404；
  - 从 `/experience/` 切到 `/en/experience/`，再切回，落点一致；
  - 从项目详情页切换语言后仍停留在同一篇，不回到列表；
  - 每个页面的 `<html lang>` 正确；
  - **英文缺失的条目**：`/en/experience/<slug>/` 返回 200，显示中文正文与回退提示，正文容器的 `lang` 为 `zh-CN`；
  - 存在 `sample: true` 内容时，页面顶部显示示例横幅；
  - `dist/_headers` 存在且包含 `X-Robots-Tag: noindex, nofollow`；
  - 页面包含 `meta robots=noindex`，`robots.txt` 为 `Disallow: /`，构建产物中不存在 `sitemap`。
- **后台改动的手动验收**：修改 `.pages.yml` 后，必须到 Pages CMS 里打开对应条目，确认字段、必填、选项、文件路径都能正常读写；再改一条内容并保存，确认 GitHub 产生提交、Cloudflare 构建成功。
- 发布前额外执行 `pnpm check:release`；存在 `sample: true` 条目时必须失败并列出 slug。英文回退不会让该命令失败。
- 发布检查由 `.github/workflows/release-check.yml` 在 `v*` tag 或手动 `workflow_dispatch` 时执行；日常 push 不跑。
- 允许跳过 E2E 的情形：纯文案替换、纯颜色或间距调整，且不改变 DOM 结构。跳过后仍必须执行 `pnpm build`，并用 `pnpm preview` 在 375px 与 1440px 宽度目检。
- 不允许跳过：`pnpm check` 与 `pnpm build`。中文缺失、英文孤儿、项目缺正文、非项目写了正文时必须修正内容，不许放宽校验。
- 覆盖率：MVP 阶段不设行覆盖率门槛，不引入 Vitest。
- CI：`.github/workflows/ci.yml` 在 push 与 PR 时执行 `pnpm verify`，失败即阻断合并。

## 4. 代码风格

- 格式化器：Prettier 3 加 `prettier-plugin-astro`，配置在 `.prettierrc.mjs`。写入用 `pnpm format`，CI 用 `pnpm format:check`。
- Linter：ESLint 9 flat config，配置文件 `eslint.config.js`，启用 `typescript-eslint` recommended 与 `eslint-plugin-astro` recommended。`pnpm lint` 必须 0 error、0 warning。
- 命名规则：
  - `.astro` 组件用 PascalCase；
  - 内容文件用 kebab-case 的 slug，中英文同名；
  - TS 变量与函数用 camelCase，类型与接口用 PascalCase，模块级常量用 UPPER_SNAKE_CASE；
  - CSS 只写 Tailwind 原子类；确需自定义类时用 kebab-case，放在 `global.css` 的 `@layer components`。
- 导入顺序：由 `eslint-plugin-simple-import-sort` 强制，分组顺序为副作用导入 → Node 内置 → 第三方 → 父级 → 同级 → 样式。执行 `pnpm lint --fix`。
- TypeScript：`strict: true`，禁止 `any`；禁止 `@ts-ignore`，确需忽略时用 `@ts-expect-error` 并写明原因。
- Astro 组件：frontmatter 只做取数与派生，不写副作用；视图组件必须显式声明 `lang: Locale` prop。
- 可访问性：交互元素用原生 `<a>` / `<button>` / `<details>`；图片必须有 `alt`；焦点样式用 `focus-visible`；语言切换链接要有 `hreflang` 与 `aria-label`；回退正文必须包在 `lang="zh-CN"` 容器里。
- 日期与数字：只通过 `src/lib/dates.ts` 格式化，不在组件里直接 `toLocaleDateString`。
- YAML：`.pages.yml` 用 2 空格缩进，不要用 tab；字段 `name` 与 schema 一致。

## 5. 注意事项

- 不要为了让代码通过而修改 `PRD.md` 或 `docs/tech-design.md` 的结论。需求变更先改文档，再改实现。
- **不要自建后端或后台**：不加数据库、API、SSR adapter、登录页、密码、会话、用户表；后台就是 Pages CMS。
- **不要删除 `.pages.yml`**：它是后台契约。改字段时必须与 `src/content.config.ts` 同步；不确定就先在本地 build 一次。
- **不要改媒体路径**：`media.input` 固定 `public/uploads`，`output` 固定 `/uploads`；不要上传到 `public/projects/` 或外部图床。
- **不要给站点加 `/admin`**：后台在 `app.pagescms.org`；站点只保留公开页面。
- **不要删除 noindex 三件套**：meta、`robots.txt`、`_headers` 都是需求。
- **不要加访问密码或任何鉴权**：站点是公开链接；后台权限由 GitHub 控制。
- **不要加回状态标签**：Profile 没有 `status` 字段。
- **只有项目有详情页**：`kind: project` 自动生成详情；`work` / `education` 不生成，正文必须为空；不存在 `detail` 字段。
- **中文必填、英文可选**：至少提交 `zh`；英文可后补；只加 `en` 不加 `zh` 会被 `check-content.mjs` 拒绝；英文存在时 `kind/start/end/draft/sample` 必须一致。
- **示例内容必须可识别**：`sample: true`，发布前清零；不要在页面里隐藏示例横幅。
- **回退提示不可省略**：缺英文的英文页面必须显示 `FallbackNotice`，正文容器 `lang="zh-CN"`。
- **不要硬编码界面文案**：从 `src/i18n/ui.ts` 取，中英文都补。
- **语言切换保持为链接**：不写 localStorage、不写 JS 状态、不做浏览器语言跳转。
- **不要改路由前缀规则**：中文无前缀，英文 `/en/`，末尾斜杠统一；路径计算只走 `src/i18n/routes.ts`。
- **不要改 Pages 项目名与生产分支**：`personal-homepage`、`main`、`https://personal-homepage.pages.dev`。
- 公司名称、工作起止时间、邮箱是**有意公开**的；手机号、住址、身份证、未公开的公司信息禁止出现。
- 不要提交真实手机号、身份证号、住址、密钥；`example.com`、`TODO` 上线前清空。
- 不要引入客户端框架或运行时 JavaScript；不要引入数据库、统计、评论、表单服务。
- 不要删除 `pnpm-lock.yaml`，不要用 npm / yarn 重装依赖。
- 不要对 `main` 执行 `git push --force`，不要 `git reset --hard`。
- 案例图片提交到 `public/projects/<slug>/` 或 `public/uploads/`；Markdown 图片必须带 `width` / `height` 或由全局样式限定比例。
- 所有外链必须 `target="_blank"` 与 `rel="noopener noreferrer"`。
- 不引入 Web Font 与外部图标库。

## 6. 约束与假设

- 【假设】单人仓库，直接在 `main` 提交，无 PR 评审与分支保护。
- 【推断】CI 使用 GitHub Actions；Cloudflare Pages 直接连 GitHub 仓库构建。
- 【假设】部署目标是 Cloudflare Pages，项目名 `personal-homepage`，默认域名 `https://personal-homepage.pages.dev`。
- 【假设】暂不绑定自定义域名，先用 `*.pages.dev`。
- 【假设】生产分支 `main`，构建 `pnpm build`、输出 `dist`、`NODE_VERSION=24`。
- 【假设】后台用 Pages CMS 托管版，GitHub App 授权，只有仓库协作者可编辑。
- 【假设】后台保存走 commit + Cloudflare 重建，约 1 分钟生效，没有实时预览。
- 【假设】上传图片存 `public/uploads/`，随仓库提交。
- 【假设】`.pages.yml` 是唯一后台配置，不引入第二个 CMS。
- 【假设】`public/_headers` 长期保留，`X-Robots-Tag` 不因预览或调试移除。
- 【假设】只有项目有详情页，工作与教育没有；不存在 `detail` 字段。
- 【假设】中文是唯一内容源，英文可选；缺英文回退中文并提示。
- 【假设】首次搭建使用虚拟示例内容，发布前用 `pnpm check:release` 清零。
- 【假设】`pnpm check:release` 只在 `v*` tag 与手动 workflow 中执行。
- 【假设】站点公开、无鉴权，符合站主「不要访问密码」的明确要求。
- 【假设】不做 SEO 收录，`noindex` 三件套为长期约束。
- 【假设】Node 24 为本机与部署运行时，兼容 Node 22+。
- 【推断】测试只做 Playwright E2E 加 `astro check`，不引入 Vitest。
- 【假设】E2E 在 CI 只跑 chromium；本机可用 `PLAYWRIGHT_CHANNEL=chrome`。
- 【假设】MVP 阶段不设代码覆盖率门禁，`pnpm verify` 是唯一合并门禁。
