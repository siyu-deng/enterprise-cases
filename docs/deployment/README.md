# 独立服务器部署

2026-11-03 已按用户授权部署到腾讯云，公开入口 https://flow.ciyufish.cn 。网页、采集与企微推送均由服务器运行，不依赖本机或 Codex。

- [生产版本、验证与恢复](production-2026-11-03.md)
- [服务器环境与 Creator 暂停记录](server-audit-2026-11-03.md)
- [部署与更新步骤](self-hosted.md)
- [可选 Vercel 混合方案](vercel.md)，本次未部署 Vercel。

## 当前结构

| 职责 | 实际运行方式 | 持久化位置 |
| --- | --- | --- |
| 网页 | Linux Next.js standalone + 独立 pnpm/Node + systemd；Nginx HTTPS | /opt/enterprise-cases/current 为版本链接 |
| 采集和企微 | systemd 每 5 分钟，pnpm monitor:service | /var/lib/enterprise-cases |
| 来源概要和配图 | 白名单概要 upsert、只下载新配图；动态 API no-store | catalog.json、covers/、asset-manifest.json |
| 发送状态 | 原始 URL 去重、发送前 inFlight、明确确认后写入已发送 | 私有 state/；更新代码时不覆盖 |
| 企微凭据 | 运行用户在服务器通过官方 CLI 授权 | CLI 管理的私有配置，不进 Git/公开目录 |
| HTTPS | flow 独立 ACME 配置与续期 timer | /etc/enterprise-cases/acme |

旧 Codex 定时任务已按用户要求删除，本地 enabled=false。生产只启用一个采集定时器；收到不确定投递时须核对群消息，不自动重投或恢复旧账本。

新项目使用独立用户、目录、端口和资源限额，未升级全局 Node/pnpm，未修改其他项目配置。复核了原服务进程、Nginx 配置哈希和六个站点入口。Creator Agent 按用户另一条明确指令保持停用。

Vercel 可读取服务器 HTTPS 概要 API；文件锁/JSON/CLI worker 仍需持久服务器。全 Vercel 的数据库、对象存储和推送适配未实现。
