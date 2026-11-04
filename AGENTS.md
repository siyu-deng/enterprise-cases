# 企业 AI 落地观察：AI 开发接续规则

先读 `PROJECT_STATUS.md`、`docs/handoff/README.md`，再按任务读取相关模块。

## 开发与交付

- 使用 Node.js 22.14.0、pnpm 10.19.0；`.nvmrc`、`package.json` 为环境约定。只使用 pnpm 管理依赖/执行 Node 工具，不用 npm、npx、yarn。
- `pnpm install --frozen-lockfile` → `pnpm setup:local` → `pnpm dev`。本地端口 12091，不能结束未知进程腾端口。
- 每个需求创建 `feature/<英文业务名>` 分支，主干 `main` 用于审核后的代码；通过 PR 合并。禁止强推、覆盖他人工作。
- 先说明用户任务、允许修改范围和验收条件，再实现一个完整闭环。复用现有实现与 Radix/Lucide，不随意换框架/组件体系。
- Next.js API/约定以安装版本的 `node_modules/next/dist/docs/` 和当前官方文档为准，不套用旧版本训练记忆；项目自行维护本文件，已关闭 dev 自动追加规则。
- 修改后运行 `pnpm check`；影响构建/路由/依赖时再运行 `pnpm build:server`。涉及页面交互时检查桌面/手机、加载/空/错误状态。不要把构建或 HTTP 200 当业务验收。
- 完成时更新本任务 `PROJECT_STATUS.md` 条目，记录修改、检查、未验证范围；只提交相关文件。推送、合并、部署按用户本次授权执行。

## 产品与内容

- 这是概要聚合平台；FastGPT 只是来源。只存标题、短概要、类型、行业、相关企业、来源、原始 URL、配图、收录时间。
- `case` 与 `reference` 区分；来源自述效果未独立核验。禁止编造案例/成效/日期、保存全文或原站营销统计。
- 本地种子 `src/data/catalog.json`；类型真源 `src/data/catalog.ts`；生产唯一内容真源是服务器持久目录，Git 数据不是线上最新账本。
- 样式数值真源 `src/app/globals.css`，组件 `src/components/ui.tsx`，可查看 `/design-system`。修改设计时同步规范并覆盖响应式/异常状态。

## 生产边界

- 正式网页、采集和企微都在腾讯云运行；当前每 5 分钟检查，唯一目标群「ai宠物专项」。旧 Codex 定时任务已删除。
- 日常开发不连接生产服务器，不启用本地通知，不运行真实发送/采集，不配置新的调度器。新增来源/真实推送/线上发布须有对应用户授权。
- `monitor:once`、`monitor:service`、`import:reference` **可能实际发送消息**；并非预览。不能为了检查而运行它们。
- 保留原始 URL 去重、独占锁、原 89 条基线、不确定投递 `inFlight` 人工核对机制。不得重置/回滚生产账本、猜会话标识、发送伪造新增或测试消息。
- 凭据由服务器服务账户的 wecom-cli 管理；不要复制、提交或输出 CLI 身份/密钥、`.local`、`.env.local`、服务器私有配置和发送状态。
- 服务器共享多个项目；只操作获授权的 `enterprise-cases-*` 单元/目录，不停止其他项目或升级全局 Node/pnpm。
- GitHub 提交/合并不会自动发布；没有自动部署工作流。生产更新使用 `docs/deployment/self-hosted.md`，代码更新和业务数据导入是两个操作。
