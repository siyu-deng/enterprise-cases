# 二次开发交接手册

交接日期：2026-11-04，Asia/Shanghai。适用：使用 macOS 的业务同事，借助 Codex、Cursor 或其他能读取本地项目的 AI 编程工具继续开发。

## 1. 先了解交付了什么

线上：[企业 AI 落地观察](https://flow.ciyufish.cn/)。源码：[GitHub 私有仓库](https://github.com/siyu-deng/enterprise-cases)。仓库主人需先邀请同事为协作者；同事使用自己的 GitHub 和 AI 工具账号。

这是“企业 AI 信息概要库”，核心任务是找资料、读概要、打开来源。企业案例 `case` 和场景参考 `reference` 分开；FastGPT 只是一个来源。保留标题、概要、行业、类型、相关企业、原始链接、配图和收录时间，不保存原文章全文。

目前有搜索/筛选/排序、加载更多、概要弹窗、主题切换、来源区和设计系统。网页公开访问；采集与企微在服务器独立运行，每 5 分钟检查一次，新 URL 去重通知「ai宠物专项」。没有后台管理、登录、多用户权限、AI 对话、自动摘要模型或数据库。

仓库种子截至 2026-11-03 为 90 条：34 案例、56 场景参考。生产数据持续变化，不能假设种子就是线上最新内容。森马视频仅为手工概要，没有增加自动抖音采集。

## 2. 推荐合作方式

| 角色 | 日常操作 | 交付结果 |
| --- | --- | --- |
| 业务同事 + AI | 本地需求、改页面/功能、预览和检查；推送功能分支 | PR、效果截图、验收步骤、未验证范围 |
| 项目维护者 | 审核内容规则、接口、通知与持久数据影响；合并代码 | 可发布版本 |
| 服务器维护者 | 获得发布授权后更新本项目，保留线上数据/账本 | 新发布版本、入口复核与回滚点 |

不必让每位业务同事配置 SSH、企微或服务器。GitHub 保存代码和审核记录；电脑负责试改；服务器继续运行正式版。推送、合并与部署是独立动作。

第一次只让同事做一个小需求，例如“搜索区增加一个清除按钮，并验证空结果时能恢复”。完成一次本地预览 → PR → 审核闭环，再逐步接触采集和后台能力。

## 3. 第一次跑起来

先按 [Mac 环境配置](macos-setup.md) 安装 Git、nvm/Node、pnpm，加入私有仓库，然后执行 README 的启动命令。预期结果：

1. `pnpm run doctor` 输出 `ready`，Node 22.14.0、pnpm 10.19.0。
2. `pnpm setup:local` 成功，`.local/wecom-notifications.json` 中 `enabled=false`。
3. `pnpm dev` 后打开 `http://127.0.0.1:12091/`，可搜索“森马”、打开概要、跳转来源。
4. 打开 `/design-system` 查看现有样式。无须任何业务密钥；本地没有定时采集/发送。

使用 Codex 时，把 **克隆后的 `enterprise-cases` 文件夹**作为项目；使用 Cursor 时 Open Folder 打开同一文件夹。不要只复制几个源文件，也不需要导入原 Codex 对话、作者的全局技能或电脑配置。AI 工具的登录/订阅由同事单独配置，网页运行本身不调用 AI 模型。

## 4. 可直接复制给 AI 的接续提示词

```text
这是企业 AI 落地观察项目。先读 AGENTS.md、PROJECT_STATUS.md、
docs/handoff/README.md 和与本任务有关的代码。

我的需求：<写明谁在什么场景下要完成什么操作>
允许修改：<页面/筛选/数据字段等范围>
验收标准：<列出正常、空、失败时应该出现的结果>

先核对 Git 分支和工作区，创建 feature/<英文业务名> 分支。
使用 Node 22.14.0 和 pnpm 10.19.0；复用已有设计系统和组件。
只在本地开发，不连接生产、不运行采集/企微发送，不改服务器。
实现后运行 pnpm check；涉及路由/构建/依赖时运行 pnpm build:server。
涉及界面时实际核对桌面与手机，并保留截图/操作结果。
更新本任务 PROJECT_STATUS.md，做一个聚焦的 Git 提交。
最后说明修改、测试、尚未验证的范围和提交 SHA；等我审查后再推送。
```

需求写具体，例如：“用户选择某行业后没有结果，需要显示清空条件按钮，点击后恢复全部资料，搜索框和类型筛选同步复位；沿用当前样式。”不要一次让 AI 重写全站、换技术栈、迁移数据库并上线。

## 5. 每次开发的完整步骤

开始前确认 `git status`，有未完成改动先保存到原分支，不用 `reset --hard` 或 `clean -fd`。工作区干净后：

```sh
git switch main
git pull --ff-only
git switch -c feature/search-reset
nvm use
pnpm install --frozen-lockfile
pnpm run doctor
pnpm dev
```

修改 → 浏览器预览 → 停止 dev → 检查。不要在同一份 `.next` 目录同时运行 dev 和 build。

```sh
pnpm check
pnpm build:server
git status
git diff
```

确认只有本需求修改后，选择实际改动的文件加入暂存；下面路径只是示例，应替换为本次文件：

```sh
git add src/components/case-catalog.tsx PROJECT_STATUS.md
git diff --cached
git commit -m "feat: improve catalog search reset"
git push -u origin feature/search-reset
```

在仓库页面点击 Compare & pull request，目标分支 `main`，按 PR 模板填写业务效果、验证和数据影响。GitHub Desktop 也可以完成分支、提交、推送和创建 PR，参见 Mac 配置文档。

GitHub Actions 自动执行环境检查、Lint、类型、测试及 Linux 构建，不需要企微/服务器/模型凭据，也不会上线。检查失败时打开 Actions 的失败步骤，把错误与任务范围交给 AI 修复，不删除检查绕过。分支保护是否强制执行以仓库 Settings 的实际配置为准；PR 流程本身不等于已强制保护。

验收关注：关键词+行业+类型组合、排序、加载更多、弹窗关闭保留筛选、空结果恢复、原文跳转、390px 手机宽度、深浅主题与错误恢复。与本次修改无关的全量性能审计可后续做；关键行为和内容准确性应随修改完成。

## 6. 去哪里改

| 需求 | 优先查看 |
| --- | --- |
| 首页文案、筛选、排序、列表状态 | `src/components/case-catalog.tsx`、`src/data/catalog.ts` |
| 卡片、概要弹窗、页脚 | `src/components/case-card.tsx`、`case-preview.tsx`、`footer.tsx` |
| 颜色、间距、按钮、布局 | `src/app/globals.css`、`src/components/ui.tsx`、`/design-system` |
| 本地新增/修改资料 | `src/data/catalog.json`，参考 `src/data/manual/semir-ai-transformation.json` |
| API 读取/远端目录 | `src/app/api/catalog/route.ts`、`scripts/runtime-paths.mjs` |
| 来源映射/合并 | `scripts/catalog-format.mjs`、`scripts/import-reference.mjs` |
| 企微通知 | `scripts/notification-core.mjs`、`notify-new-data.mjs`，先读通知文档 |
| 服务部署 | `deploy/server/`、`docs/deployment/self-hosted.md`，由维护者执行 |

扩展数据/API 的字段和错误处理见 [技术结构](architecture.md)。改内容时必须保留出处，不把方案写成已经落地的企业案例，不把采访自述写成平台核验的效果。

## 7. 代码、内容、通知分别处理

**代码**：通过 Git 分支/PR 管理。合并后并不会自动改变线上网站。

**内容**：本地 JSON 是种子。修改本地能预览；上线代码也不会覆盖生产 JSON。要导入真实新资料，需要维护者审核来源、类型、概要、URL、配图与分类，在服务器锁保护下合并持久数据，再由正常 timer 发现新 URL。现有手工森马 JSON 是资料片段示例，当前没有通用后台/手工导入命令；不能假装“放进 manual 目录就会自动发布”。

**通知**：生产 seenKeys/inFlight 是发送事实，不能作为普通源码回滚。原 89 条已建基线，森马新增推送在 2026-11-03 获接口确认；接口确认不代表成员已读。新增来源和真实推送的范围由项目负责人确认，禁止编造案例测试或随意加群。

下面这些命令具有副作用，业务同事日常不要执行：

| 命令 | 真实行为 |
| --- | --- |
| `pnpm import:reference` | 访问来源、写入概要/配图，并可能发送企微 |
| `pnpm monitor:once` / `monitor:service` | 执行采集及通知，受当前配置控制 |
| `pnpm notify:send` | 尝试真实发送并更新账本 |
| `pnpm notify:init` | 对全新状态创建当前数据基线；生产已有状态不能重建 |
| `pnpm deploy:check` | Worker/CLI/目标群预检，无发送；普通本地无 CLI 会 not_ready |

`pnpm setup:local` 不采集、不调用 CLI、不发送；本地状态不进 Git。不要复制作者 `.local`、服务器 state、机器人凭据或生产环境文件来解决本地问题。

## 8. 上线交接给维护者

PR 通过后提交：业务验收步骤/截图、检查结果、是否修改数据结构、是否需要导入内容、依赖或环境变更。维护者按 [服务器更新手册](../deployment/self-hosted.md) 构建 Linux 包，保留可回滚的旧代码版本与当前数据备份，只更新本项目。

生产代码回滚只切换版本，不回滚通知账本。数据迁移要单独设计与验证。不要让业务同事直接在 `/opt/enterprise-cases/current` 改文件，也不要靠重启共享 Nginx/数据库或停其他项目排错。

本次 GitHub 交接没有配置自动部署、共享服务器账号或新增线上权限。同事 GitHub 用户名未提供，尚未邀请协作者；仓库主人在 Settings → Collaborators（或 Manage access）添加，同事接受后才能克隆。邀请本身由主人完成，勿共享主人账号。

## 9. 后续更省事的演进

当前推荐 **私有 GitHub + 本地 AI 编程 + PR 检查 + 维护者发布**：沿用现有服务器，起步成本小，试改不影响线上。

如果多人主要做内容整理，下一步优先做有权限的“概要录入/来源审核/发布”后台，让业务同事日常录入不必改 JSON；先约定审核和推送时点。多人需要远程看效果时再加独立测试环境，测试通知使用明确隔离的通道/默认关闭。需要免本地安装时可评估 Codespaces；它的额度、AI 工具接入和网络需另行确认，本次没有开通或产生云开发环境。

待办与当前版本以根目录 `PROJECT_STATUS.md` 为准。历史部署文档记录当时情况，不代表现在仍未部署/仍每 15 分钟运行。
