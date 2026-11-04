# 企业 AI 落地观察

聚合企业 AI 落地案例与场景参考，阅读概要后回到原始来源。Next.js App Router + TypeScript，网页、采集和企微推送独立运行在腾讯云。

- **线上入口**：[flow.ciyufish.cn](https://flow.ciyufish.cn/)
- **业务同事从这里开始**：[二次开发交接手册](docs/handoff/README.md)
- **第一次配置 Mac**：[Git、Node、pnpm 与仓库配置](docs/handoff/macos-setup.md)
- **AI 编程工具先读**：[AGENTS.md](AGENTS.md)，再读 [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **源码仓库**：[siyu-deng/enterprise-cases](https://github.com/siyu-deng/enterprise-cases)（公开，无需登录即可查看、下载或克隆）

## 本地运行

首次先完成 Mac 配置；已有 nvm、Git 和 pnpm 的同事执行：

```sh
git clone https://github.com/siyu-deng/enterprise-cases.git
cd enterprise-cases
nvm install
nvm use
pnpm install --frozen-lockfile
pnpm setup:local
pnpm dev
```

打开 [本地首页](http://127.0.0.1:12091/) 或 [设计系统](http://127.0.0.1:12091/design-system)。无须数据库、AI API key、企微授权或服务器账号。`Ctrl+C` 停止预览。

Node 固定基线 22.14.0，pnpm 10.19.0；进入新终端后先 `nvm use`。`pnpm run doctor` 检查工具版本和本地隔离，`pnpm setup:local` 只创建缺失配置，默认关闭本地发送，不覆盖现有账本。

## 开发和检查

```sh
git switch -c feature/your-change
pnpm check
pnpm build:server
```

`check` 包含 Lint、类型和回归测试。本地下载、克隆与开发无需 GitHub 账号；要向仓库推送或发起 PR，仍需注册登录并取得写权限，或从自己的 fork 提交 PR。GitHub Actions 只运行检查，**不会部署或发送企微消息**。发布由维护者另行执行。

## 当前能力与数据

支持关键词/行业/类型筛选、排序、加载更多、概要弹窗、原文跳转和明暗主题。无登录、内容管理后台、语义搜索或自动摘要模型。

交接种子为 2026-11-03 的 90 条概要：34 企业案例、56 场景参考、2 个来源。自动来源仍只有 FastGPT 公开列表；森马视频是用户提供资料的手工收录。只保存概要与原始链接，来源方成效未独立核验。

| 内容 | 权威位置 |
| --- | --- |
| 本地预览/发布种子 | `src/data/catalog.json` |
| 内容类型、筛选与校验 | `src/data/catalog.ts` |
| 生产最新概要 | 服务器 `/var/lib/enterprise-cases/catalog.json` |
| 只读数据接口 | `/api/catalog` |
| 样式变量/共享组件 | `src/app/globals.css`、`src/components/ui.tsx` |
| 通知去重/投递状态 | 服务器私有 `state` 目录，不进入 Git |

生产每 5 分钟采集并向「ai宠物专项」推送真正新增 URL；无新增静默，原 89 条不补发。服务器保留唯一调度器，旧 Codex 定时任务已删除。本地发送关闭。

`pnpm import:reference`、`pnpm monitor:once`、`pnpm monitor:service` 会采集并可能真实发送，不能当日常预览命令。生产数据导入独立于代码发布，不能用 Git 种子覆盖线上内容/通知账本。

## 文档入口

- [技术结构与扩展位置](docs/handoff/architecture.md)
- [同事电脑的企微接入](docs/handoff/wecom-local.md)：`.env.local` 单独交付，同事自行扫码，默认不启用本地发送
- [产品与内容规则](docs/product.md)、[设计系统](docs/design-system.md)、[界面验收](docs/acceptance.md)
- [通知规则与异常恢复](docs/wecom-notifications.md)
- [服务器更新与回滚](docs/deployment/self-hosted.md)、[初次部署记录](docs/deployment/production-2026-11-03.md)、[真实案例推送验证](docs/deployment/semir-case-2026-11-03.md)

`docs/history`、`docs/kickoff` 和带日期的记录保留历史背景；当前结论以 `PROJECT_STATUS.md` 为准。第三方配图和来源资料保留原始权利，仓库公开不代表获得额外使用授权。
