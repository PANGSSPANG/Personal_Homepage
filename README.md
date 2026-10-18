# 个人主页

一个 Astro 5 静态个人主页：只保留中文，包含个人信息、经历、能力与项目案例详情页；全站不收录、无统计、无鉴权。

当前内容全部是 `sample: true` 的虚拟示例，页面顶部会显示「示例内容，待替换」。按下面的步骤替换成自己的信息即可。

## 本地运行

要求 Node.js 24（兼容 22+）与 pnpm 10。

```powershell
# 本机 corepack 缓存不可写时，先指定仓库内的缓存目录
$env:COREPACK_HOME = "$PWD\.corepack"
$env:ASTRO_TELEMETRY_DISABLED = '1'

pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 产出 dist/
pnpm preview    # 预览 dist/
```

常用检查：

```powershell
pnpm check            # 类型 + 内容 schema
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm test:e2e         # Playwright（首次需 pnpm exec playwright install chromium）
pnpm check:release    # 发布前检查：示例内容必须清零
```

## 后台编辑（Pages CMS）

后台是 **Git 型 CMS**：不跑服务器、不建数据库，保存时提交 Markdown，Cloudflare Pages 自动重建。

1. 打开 <https://app.pagescms.org>，用 GitHub 登录。
2. 安装 Pages CMS 的 GitHub App 到本仓库。
3. 选择仓库，Pages CMS 会读取根目录的 `.pages.yml`。
4. 在「个人信息 / 经历 / 能力」里改内容，保存。
5. 等 1 分钟左右，Cloudflare Pages 自动完成构建。

注意：

- 后台不在本站的 `/admin`，站点不暴露管理入口；权限由 GitHub 仓库协作者控制。
- 新建条目时文件名（slug）确定后不要随意改，否则会破坏详情页链接。
- 正文插图上传后会进 `public/uploads/`，引用路径是 `/uploads/...`；已有案例图仍在 `public/projects/`。
- 没有实时预览；保存后等重建，或本地 `pnpm dev` 看效果。
- 草稿用 `draft: true`，构建时排除。

## 替换示例内容

可以在 Pages CMS 里改，也可以直接改 Markdown：

| 内容                           | 文件                                      |
| ------------------------------ | ----------------------------------------- |
| 个人信息、简介、邮箱、社交链接 | `src/content/profile/zh.md`               |
| 工作 / 项目 / 教育经历         | `src/content/experience/zh/<slug>.md`     |
| 能力分类                       | `src/content/skills/zh/<slug>.md`         |
| 已有案例图片                   | `public/projects/<slug>/`                 |
| 后台上传的图片                 | `public/uploads/`                         |

规则：

- 站点只有中文，没有 `/en/` 路由，也没有语言切换按钮。
- 只有 `kind: 'project'` 会生成详情页，且正文必须非空；`work` / `education` 不能写正文。
- 替换真实内容后，把 frontmatter 里的 `sample: true` 删掉；全部清零后顶部示例横幅自动消失。
- 上线前跑 `pnpm check:release`，它会在仍有示例内容时失败并列出 slug。

## 部署到 Cloudflare Pages

- 项目名：`personal-homepage`（被占用时加 4 位随机后缀）
- 构建命令：`pnpm build`
- 输出目录：`dist`
- 环境变量：`NODE_VERSION=24`
- 生产分支：`main`

`public/_headers` 会给全站加 `X-Robots-Tag: noindex, nofollow`；`robots.txt` 也会禁止抓取。部署后可用 `curl -I https://personal-homepage.pages.dev/` 确认。

## 设计说明

- 页面：首页、经历、项目案例、能力、404，全部为中文。
- 没有中英文切换，也没有英文版本。
- 后台用 Pages CMS（Git 型），不引入数据库、后端 API 或统计脚本。
- 详细需求与实现约定见 `PRD.md`、`docs/tech-design.md`、`AGENTS.md`。
