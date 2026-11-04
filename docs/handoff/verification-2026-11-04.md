# 交接验证记录

日期：2026-11-04，Asia/Shanghai。首次代码基线 [3917f24](https://github.com/siyu-deng/enterprise-cases/commit/3917f2428f406bf8287ec4e2bafe9d6ab8529a22)；交接文档后续修订见 Git 历史。

## 本轮交付

初次交接为私有仓库 `siyu-deng/enterprise-cases`，同日随后按用户要求改为公开，默认 `main`；包括现有网页、采集/通知脚本、公开概要与配图、部署模板和 macOS/AI 开发手册。未配置生产 Secrets 或自动部署。PR 模板与自动检查已接入；未设置强制分支保护，需维护者按团队权限/套餐另行决定。

新增 `.nvmrc` / `.node-version` 固定 Node 22.14.0，`packageManager` 固定 pnpm 10.19.0，`engines` 限定兼容范围。`pnpm run doctor` 检查本地工具与隔离，`pnpm setup:local` 默认关闭发送，`pnpm check` 汇总必要检查。Next dev 的自动 AGENTS 追加关闭，仓库维护显式 AI 接续规则。

## 实际执行与结果

| 检查 | 环境/结果 |
| --- | --- |
| Node 基线 | macOS arm64，官方 22.14.0 归档经 SHA256 核对；未修改电脑全局 Node |
| 隔离安装 | 从候选 Git 文件复制至全新临时目录，无 node_modules/.local/.next；`pnpm install --frozen-lockfile` 成功 |
| 本地初始化 | `pnpm setup:local` 成功，90 条种子，配置 enabled=false；无 CLI/服务器/模型凭据 |
| 代码检查 | Lint、TypeScript、15 项测试通过；新增 2 项覆盖缺失工具、版本、误启用发送/环境覆盖与信息不泄漏 |
| 构建 | `pnpm build:server` 在固定 Node 的隔离 Mac 副本通过 |
| 本地启动 | 使用未占用 12092 避免影响旧 12091；首页、/customers、/design-system、/api/catalog 全部 200，API 90 条；自建 dev 已停止 |
| AI 规则稳定 | 关闭自动追加后启动 dev，AGENTS.md 与提交版本一致 |
| 上传排除 | 189 个初始文件扫描：无已识别密钥模式，无 `.local`、CLI 凭据、环境私密文件/发送账本、依赖/构建目录；只含 `.env.example` 模板 |
| 远端恢复 | 已从 GitHub 重新克隆；默认 main、源码/手册存在、无私有运行状态，工作区干净 |
| Linux CI | [首次自动检查](https://github.com/siyu-deng/enterprise-cases/actions/runs/41767841303) success：工具配置、锁文件安装、doctor、check、build:server 全通过 |
| 生产保护 | 只读复核：原发布 20261103065654Z，Web/timer active，90 条/2 来源，通知启用/5 分钟，seenKeys 90、无 inFlight/lastError；本轮未改服务器/未发送 |

上述记录不代表已替同事安装电脑/配置 Git 写权限、已验收后续业务需求，或执行了压力测试、Linux 发布包更新/生产部署。当前 5 分钟调度沿用既有服务器，不会因 GitHub 推送变化。

详细入口：[交接手册](README.md)、[Mac 配置](macos-setup.md)、[技术结构](architecture.md)。最新远端检查见仓库 Actions。
