# 自有服务器部署与更新

当前入口为 https://flow.ciyufish.cn ，实际版本和验证见 [生产记录](production-2026-11-03.md)。以下为后续更新约定，不要重新初始化现有通知账本。

## 运行约定

- 服务账户 enterprise-cases，真实 home /var/lib/enterprise-cases；凭据由此账户的官方 CLI 管理。
- 版本目录 /opt/enterprise-cases/releases/<release>，current 为版本链接；独立 runtime 提供 Node.js 22.14.0 和 pnpm 10.19.0，不升级全局工具。
- /etc/enterprise-cases.env 为路径配置，不含机器人 Secret。环境和工作目录必须同时设置，避免误用开发默认路径。
- 可变概要、配图、清单和 state 位于 /var/lib/enterprise-cases。父目录/配图目录 0755，配图 0644；state 0700，账本/配置 0600。不得发布整个 home。
- 采集与网页有各自资源限制，总预算在 enterprise-cases.slice；保留服务器既有其他项目和数据库。

## 构建和打包

在 Linux x64 环境按锁文件安装，以低优先级、资源限额构建。当前共享服务器使用独立 cgroup：CPU 50%、MemoryMax 1 GiB、禁止任务 Swap、Nice 19、IOWeight 10。失败时先检查原因，不停止其他项目腾资源。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:server
pnpm exec node scripts/package-server.mjs /opt/enterprise-cases/releases/<new-release>
```

package-server 仅接受 Linux x64 和新的绝对输出目录，包含 standalone、静态文件、公开资源、概要种子、独立 worker 和服务模板；保留相对依赖链接并校验依赖都在发布目录内。Next 已追踪的种子必须与源文件一致，不要直接部署 Mac node_modules。

新代码 root 持有、服务账户只读；仅 .next/cache 和持久数据允许其写入。先验证新包与配置，再切换 current 并只重启本项目 Web。模板中的私有 pnpm 可执行文件放在 runtime/pnpm/bin/pnpm.cjs。

## 首次准备和迁移

全新安装可使用 pnpm deploy:prepare，它只创建缺失文件、默认不启用通知。迁移必须先保存原 catalog、covers、manifest 和 notification-state.json，保留 seenKeys/inFlight，不复制活动锁文件，不迁移 Mac CLI 密钥。

迁移归档只允许上述四类数据，不能覆盖 CLI 私密配置。解压不得继承打包主机 UID/GID，也不要让归档根目录权限覆盖服务用户 home。恢复后明确核对 home 的用户归属、0755/state 0700，以及文件权限。

CLI 未授权时由用户在服务器服务账户下扫码或交互授权，验证后删除临时图片/日志。当前已授权，普通代码更新不重复初始化。

在 current 目录中，以服务用户并加载实际环境执行：

```sh
pnpm exec node --env-file=/etc/enterprise-cases.env scripts/deployment-check.mjs
```

它不发送消息。目录可读写、无 inFlight、CLI 版本/授权有效、当前群唯一匹配时才返回 ready。prepare/notify 支持 current 符号链接路径，并有部署回归覆盖。

## 服务与唯一调度

deploy/server 保存实际服务、资源预算、flow Nginx 与证书续期模板。安装前核对用户名、路径和已有文件，不覆盖其他项目。

```sh
systemd-analyze verify /etc/systemd/system/enterprise-cases-*.service /etc/systemd/system/enterprise-cases-*.timer /etc/systemd/system/enterprise-cases.slice
nginx -t
systemctl daemon-reload
systemctl restart enterprise-cases-web.service
```

首次迁移先停旧调度、等旧检查/发送结束、最终同步账本，预检后再启用服务器 timer；此项目已完成切换。普通更新不要同步旧 Mac 账本，也不要启用两套调度。

```sh
systemctl enable --now enterprise-cases-monitor.timer
systemctl list-timers enterprise-cases-monitor.timer
journalctl -u enterprise-cases-monitor.service -n 40 --no-pager
```

单次失败不自动 Restart；下一周期仍由脚本核对状态。不确定发送保留 inFlight，须人工核对群消息。当前没有新增其他报警通道。

## HTTPS 与回滚

flow 使用独立 ACME config/work/log 目录与 enterprise-cases-certificate.timer，renew 仅针对本项目配置。deploy hook 先 nginx -t 再平滑 reload，不使用旧站点失败账户或批量修改其他证书。

更新前备份数据、配置并保持私密权限。代码回滚只切换版本，不回滚发送账本；有疑问先停本项目 timer，保留状态，不自动恢复本机调度。不得通过重启共享 Nginx/PM2/数据库或停其他项目排障。
