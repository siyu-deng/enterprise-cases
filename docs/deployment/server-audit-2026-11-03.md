# 腾讯云部署前检查与 Creator Agent 暂停记录

- 时间：2026-11-03 14:46–14:50，Asia/Shanghai。
- 主机：`tc-vps-124.221.180.106`，公网 `124.221.180.106`；未访问另一台经此机跳转的服务器。
- 项目：企业 AI 落地观察 v0.2.0，计划域名 `flow.ciyufish.cn`。
- 授权范围：先检查现有环境、保护其他项目；用户随后明确要求暂停 Creator Agent。
- 本项目尚未上传、安装、启动或切换调度器。本机/Codex 通知仍运行。

## 环境与资源

| 项目 | 实际观察 |
| --- | --- |
| 系统 | OpenCloudOS 9.6，x86_64，2 核 |
| 内存 | 系统可见 3655 MiB；暂停 Creator 前 available 1348 MiB，暂停后 1715 MiB |
| Swap | 总计 2047 MiB；暂停前使用 1669 MiB，暂停后使用 1552 MiB |
| 磁盘 | 根盘约 70 GB，剩余约 40 GB，使用率 44%；inode 使用率 3% |
| 当时负载 | load average 0.78 / 0.25 / 0.14；短时 vmstat CPU idle 97–98%，无持续换出 |
| Node / pnpm | 全局 Node v22.14.0、pnpm 10.33.2；未安装、升级或改变全局工具 |
| 管理与入口 | Nginx、systemd、PM2、Docker 均在使用 |
| 企微 | 当前服务器 PATH 未发现 wecom-cli；未迁移或读取本机机器人凭据 |
| 来源连通性 | 服务器 GET FastGPT 公开列表页 HTTP 200；未采集全文或运行新增推送 |
| 新项目冲突检查 | 127.0.0.1:12091 未占用；计划代码、数据、环境文件与服务路径均不存在 |

这些是短时观察，并非业务高峰或新项目并发负载验证。内存有余量但应避免在共享主机上进行高内存构建。

## 既有项目与依赖

| 项目 / 服务 | 入口或端口 | 本轮结果 |
| --- | --- | --- |
| A-Level | alevel、server.alevel；3000 | HTTPS 根路径 HEAD 200，PM2 在线 |
| AI Chat | 3101；A-Level 仍代理 ai-chat-api、ai-tools-api 和 health | GET /api/health 返回 ok=true，必须保留 |
| 萌宠空间 | petspace；12121 Web、12122 AI worker | 根路径 HEAD 307；两个 systemd 服务 active |
| 贺啥 / tabletop-loyalty | hesha；3010 | 根路径 HEAD 307；PM2 在线 |
| 学员礼品 | gift；3110 | 根路径 HEAD 307；服务 active，原同步/备份定时器未动 |
| Bonjour Lab | bonjour-lab；18765 | 根路径 HEAD 200；服务 active，原备份定时器未动 |
| 识者 / 解题侠 | shizhe、jietixia；3001、3102 | PM2 在线；已有证书过期，见下文 |
| Creator Agent | cestlavie；13089，Docker app + mongodb | 按用户新指令暂停，见下文 |
| 共享基础服务 | Nginx、MySQL 3306、PostgreSQL 5432 | 均未修改或重启 |

HEAD 200/307 仅验证入口和 TLS 响应，没有验证登录后的完整业务。暂停 Creator 后复查 A-Level、Bonjour、贺啥、萌宠空间和礼品入口，状态码及 TLS 验证结果与暂停前相同。

## 域名与已有证书问题

- `flow.ciyufish.cn` A 记录已经指向 `124.221.180.106`；未发现 AAAA 或 CNAME。
- Nginx 当前配置检查退出 0，没有 flow 专属 server_name，也没有包含 flow 的证书。
- flow HTTP 当前返回 301 到自身 HTTPS；HTTPS 校验失败，现有证书名称不匹配。尚无本项目生产入口。
- 检查前 `certbot-renew.service` 已是 failed；近期错误涉及 shizhe、jietixia 的历史 ACME 账户配置缺失。
- shizhe、jietixia 证书于 2026-09-17 过期，实际 HTTPS 请求也返回证书过期。此为已有问题，未执行修复或续期。
- 其他已检查活跃站点证书仍有效。没有运行批量 certbot renew，没有改动已有域名配置。
- 系统还留有 ipmi、mcelog 及两个 petspace 候选/性能测试单元的失败状态；本轮未处理。

## 用户授权暂停 Creator Agent

- 核对两个容器均属 compose 项目 creator-agent；专属 Docker 网络只连接这两个容器，MongoDB 没有宿主机端口映射。
- 定时任务引用检查仅发现 Creator 专属备份 timer/service；备份依赖 mongodump，执行时备份 service 为 inactive。
- 已 `disable --now creator-agent-backup.timer`；核对结果为 inactive / disabled。
- 先优雅停止 `creator-agent-app-1`，再停止 `creator-agent-mongodb-1`，二者均 exited、退出码 0、OOMKilled=false。
- 保留容器、镜像、网络、数据目录、MongoDB 数据、SQLite 快照和已有备份；没有执行 compose down、删除或 prune。
- 两个容器原策略均为 unless-stopped；此次手动停止后按此策略保持停用，未改成自动拉起，也未测试服务器重启。
- Nginx 的 Creator 路由未改；暂停后其应用入口不再可用，现有静态入口仍由原配置提供。
- 暂停前后对照：Nginx、PM2、萌宠空间 Web/AI、学员礼品、Bonjour、MySQL、PostgreSQL 的 MainPID 与 active 状态一致。
- 恢复时先 `docker start creator-agent-mongodb-1`，确认数据库健康，再 `docker start creator-agent-app-1`；应用健康后再恢复 `creator-agent-backup.timer`。本轮未执行恢复。

## 后续部署约束

1. 新项目使用独立用户、代码目录、持久化数据目录和 systemd 单元，保留全局 Node/pnpm、原 PM2、Docker 和数据库配置；服务只监听回环 12091。
2. 在隔离 Linux 构建环境准备兼容产物，避免共享主机上直接执行高内存构建；运行阶段设置适当资源限制，并验证现有入口基线。具体产物与限额尚未实现或验证。
3. 为 flow 新增独立 Nginx 站点和专属证书；先验证配置，再平滑 reload，保留原域名、路由和证书。不将修复其他项目证书混入本项目。
4. 上线前仍需确定公开/内部访问范围，安装并授权专属运行用户的企微 CLI；不假定 Mac 授权文件可直接复用。
5. 同步原有概要、配图和去重账本，确认无 inFlight 后再切换唯一调度器；服务器验证通过前不停止本机 heartbeat，不补发历史，不发送测试消息。

## 本轮验证边界

只执行系统/进程/端口/配置读取、少量 HTTP/HTTPS 检查，以及明确授权的 Creator 停服与专属备份 timer 暂停。未部署本项目、签发证书、安装软件、重启共享服务、修改防火墙或发送企微消息。
