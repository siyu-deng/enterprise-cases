# flow.ciyufish.cn 部署记录

- 日期：2026-11-03，Asia/Shanghai；版本 v0.2.0，发布标记 20261103065654Z。
- 用户授权网页公开访问，采集/企微一并迁移，保留其他项目；目标 tc-vps-124.221.180.106。
- 当前阶段：已部署并切换，15:17–15:21 完成运行复核；业务验收与首次真实新增投递待自然验证。
- 前置观察见 [服务器检查](server-audit-2026-11-03.md)，更新步骤见 [部署步骤](self-hosted.md)。

## 运行与持久化

- 服务账户 enterprise-cases，实际 home /var/lib/enterprise-cases。
- 正式包 /opt/enterprise-cases/releases/20261103065654Z，current 指向该包；builds 下保留构建目录，运行不依赖它。
- 独立 Node runtime/bin/node 与 pnpm runtime/pnpm/bin/pnpm.cjs，版本 22.14.0 / 10.19.0；复制服务器既有 Node 和本项目已下载的 pnpm 缓存，未升级共享工具。服务统一通过 pnpm 执行。
- catalog.json、covers、manifest 和私有 state 位于 /var/lib/enterprise-cases；发布与回滚代码不覆盖账本。
- CLI 1.2.0 在服务用户私有 cli 目录，用户重新扫码授权；内部比对为原机器人/原授权人，当前群名唯一匹配。没有复制 Mac 凭据，临时二维码/授权日志已删除。
- flow 独立 Nginx 配置、ACME 账户及续期 timer；证书有效至 2027-02-01，未使用旧站点的失败账户。
- 首次源码包 SHA-256 e8166f527586613a449f679cb6f4f39a11e9e67348c6c5f4e046b3080772b756；修正后完整源码和部署说明另存 final-source-20261103065654Z.tar.gz，均在 root 私有 ops 中。
- Nginx 原配置备份、运行基线、迁移前状态备份、迁移归档在 ops 中；不作为 Web 静态目录。CLI 凭据继续由 CLI 管理。

## 工程与权限验证

- 构建独立 cgroup：CPU 50%、MemoryHigh 850 MiB、MemoryMax 1 GiB、任务 Swap 0、Nice 19、IOWeight 10。本机无 Linux 容器，故采用此受限构建。
- Linux webpack 完整通过，单 worker，耗时 7m49s（含依赖安装），内存峰值 851.3 MiB，无任务 Swap。
- 发布包保留相对依赖链接并校验全部位于包内；处理 Next 已追踪种子重复问题，种子内容一致才保留。
- prepare/notify 入口兼容绝对 current 符号链接，实际初始化返回 prepared；新增真实进程回归覆盖此部署方式。
- 归档恢复后显式核对 home 0755/用户归属、state 0700/文件 0600、covers 0755/文件 0644；只恢复四类数据，不覆盖 CLI 配置。
- systemd-analyze verify 通过（仅显示既有 tat_agent 的旧 PIDFile 路径提示，未修改该服务）；Nginx 语法通过后仅平滑 reload。
- Web active/enabled，无失败自动重启；只监听回环 12091。Web/采集各有限额，总 slice CPU 90%/MemoryMax 640 MiB。
- 本地 Lint、类型与 13 个摘要/通知/路径回归通过；未做业务效果核验。

## 页面与基本性能验证

- HTTPS /、/customers、/api/catalog、配图均 200，TLS 校验正常；API no-store、89 条，原记录首次收录日期与迁移源一致。
- .env/.local 私密路径 403，非公开 state 路径 404；不公开发送账本、CLI 目录或凭据。
- Chrome/IAB CUA 均连接超时，改用独立 Playwright 验收公开无登录页面；1440×1000、390×844 无横向溢出。
- 类型/财报搜索组合得到 1 条；概要、原始链接、关闭保留筛选、清除筛选、12→24 加载更多正常。最终刷新显示 89 条、无更新失败，控制台错误/警告 0。
- [桌面截图](flow-desktop.png)。
- Mac 公网单次 GET（已有请求预热）HTML/API 约 0.14–0.19s，切换后 HEAD 首字节约 0.24s；浏览器一次 DOMContentLoaded 160ms、load 170ms。
- 部署后瞬时可用内存 1622 MiB，Web cgroup 约 92 MiB。以上是本次基础观察，未做并发压测、完整 Web Vitals 或业务高峰验证。

## 通知切换

- 先以 enabled=false 在真实 systemd 沙箱执行采集，返回 disabled，未发消息。
- 旧 Codex heartbeat 持久化 PAUSED；等待旧锁释放，在 monitor/notifications 双锁内导出源概要和原账本，本地 enabled=false。
- 最终迁入 89 条概要、89 个 seenKeys、配图和清单；inFlight=null，没有重建基线或补发旧资料。
- 服务器无发送预检 ready：目录读写、CLI 版本/授权、当前目标群唯一匹配均通过。
- 配置启用后真实 systemd 单次检查 unchanged/newCount=0，Result=success；没有 lastSentAt，没有补发或测试消息。
- 唯一服务器 timer active/enabled，每刻钟执行；15:17 核对下一次为 15:30。已验证同一 unit 的单次执行与 timer 配置/状态，未专门等待首次计划触发。
- 真实新增的外部投递尚未发生；平台明确确认仅表示接口接收，不代表群成员已读。错误写 journal，没有新增其他报警通道。

## 其他项目与证书

- 原 Nginx 文件哈希、8 个既有共享/其他服务 MainPID/active 状态一致；六个站点 HTTPS 入口响应与部署前相同。
- Creator app/MongoDB 继续 Exited(0)，原备份 timer disabled，数据保留；其他项目未修改。
- flow 续期 timer active/enabled，只针对 flow 的 certbot dry-run 实际成功；没有替换生产证书或修复其他站点证书。
- 两个旧站点的过期证书与历史失败单元仍在原状，详见环境检查。

## 运维和恢复

```sh
systemctl status enterprise-cases-web enterprise-cases-monitor.timer enterprise-cases-certificate.timer
journalctl -u enterprise-cases-monitor.service -n 40 --no-pager
systemctl list-timers enterprise-cases-monitor.timer
```

暂停采集用 systemctl stop enterprise-cases-monitor.timer；保持重启后停用再 disable。结果不确定保留 inFlight，先核对群消息，不自动重投。代码回滚只切换版本，不能恢复旧发送账本造成重复；异常时不自动恢复本机调度。
