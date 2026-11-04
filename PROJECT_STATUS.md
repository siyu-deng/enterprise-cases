# 企业 AI 落地观察 项目现状

- 更新：2026-11-04，Asia/Shanghai；GitHub 已公开并验证匿名读取；交接源码/资料与单独企微配置分包交付，生产未改。
- 项目 /Users/siyudeng/side-projects/enterprise-cases；同目录 worktree。
- 工作分支 feature/public-handoff；公开 GitHub https://github.com/siyu-deng/enterprise-cases ，默认 main；首次代码基线 3917f24，后续版本见 Git 历史。
- 版本 0.2.0；服务器发布 20261103065654Z；公开入口 https://flow.ciyufish.cn 。

## 目标与已确认范围

- 自有品牌企业 AI 落地信息聚合，只保留原始来源概要和链接，完整内容回来源；不再一比一复刻。
- 暂名“企业 AI 落地观察”，沿用已确认 Apple 风格、灰白表面/系统字体/蓝色操作与统一设计系统。
- 用户授权腾讯云统一运行网页、采集和企微；网页公开，正式运行不依赖本机/Codex。
- 定时仍仅采集 FastGPT 公开列表/配图；另手工收录用户提供的森马抖音视频概要，不抓视频全文、不扩展自动来源。
- 新原文 URL 去重通知群「ai宠物专项」，当前每 5 分钟，原 89 条历史不补发，无新增不发周期消息。
- Creator Agent 按用户明确指令暂停，数据/代码保留；其他项目保留。
- 用户新增任务已完成：读取引用分析对话，手工加入森马案例，服务器改为 5 分钟；15:28:52 企微接口确认新增 1 条，15:30 检查 unchanged 未重复。

## 当前状态与验证

| 事项 | 状态 | 证据/边界 |
| --- | --- | --- |
| 产品/设计系统 | 已实现、已验证 | docs/product.md、docs/design-system.md；/design-system |
| 概要与来源适配 | 已验证 | 90 条：34 企业案例/56 场景参考，2 来源/14 实际行业；当前 18 个回归全通过 |
| 页面筛选/概要/原文 | 已验证 | 类型/行业/搜索/排序、12→24、弹窗关闭保留筛选；docs/acceptance.md |
| 生产网页 | 已部署、工程验证 | /、/customers、/api/catalog、配图 HTTPS 200，API no-store、90 条 |
| 生产交互 | 已验证（限定范围） | Playwright 1440/390，无溢出，搜索/筛选/概要/更多正常，控制台错误 0 |
| 采集/企微 | 已迁移、真实投递已验证 | timer 触发 sent/newCount=1，下一轮 unchanged；见 docs/deployment/semir-case-2026-11-03.md |
| 唯一调度器 | 已切换 | 服务器 timer active/enabled；旧 Codex 定时任务已删除，本地 enabled=false |
| 二次开发交接 | 已验证、已上传 | docs/handoff/README.md；Mac 隔离副本安装/初始化/检查/构建/预览通过，远端克隆与 Linux CI 通过；同事电脑/权限待接入 |
| 公开与企微本地接入 | 已实现、已验证 | 历史 2 提交无已识别密钥/状态；匿名读取 200；单独 .env.local 仅配置目录，同事自行扫码，auth/status 不发送；doc 见 handoff/wecom-local.md |
| HTTPS 续期 | 已配置、已验证 | flow 独立账户/目录/timer；实际 certbot dry-run 成功，证书至 2027-02-01 |
| 其他项目保护 | 已复核 | 原 Nginx 文件哈希/8 个服务 MainPID/active 不变，六站点响应基线一致 |
| 业务/真实新增效果 | 业务待验收/接口确认已验证 | 真实 timer 与新增接口确认已验证；未核验群成员已读/经营成效，不把工程检查当业务验收 |

## 生产与恢复入口

- 主机 tc-vps-124.221.180.106（124.221.180.106），OpenCloudOS 9.6，2 核/约 4 GB。
- 独立用户 enterprise-cases，home /var/lib/enterprise-cases；Node 22.14.0 / pnpm 10.19.0 独立放在 /opt/enterprise-cases/runtime，不升级全局工具。
- 正式包 /opt/enterprise-cases/releases/20261103065654Z，current 为版本链接；Web systemd 经 pnpm 运行 standalone，仅监听 127.0.0.1:12091。
- 环境 /etc/enterprise-cases.env；生产唯一内容真源 /var/lib/enterprise-cases/catalog.json，另有 covers/、asset-manifest.json、私有 state/。
- 本地 src/data/catalog.json 是本地默认/发布种子；生产更新不自动回写 Mac。数据/API schema 在 src/data/catalog.ts，路径配置 scripts/runtime-paths.mjs。
- systemd 单元 enterprise-cases-web、enterprise-cases-monitor.service/.timer、enterprise-cases-certificate.service/.timer、enterprise-cases.slice。
- 查看 systemctl status/list-timers 与 journalctl -u enterprise-cases-monitor.service；只操作本项目单元，不重启共享服务。
- 运行总限额 CPU 90%/内存 640 MiB；构建独立限额 CPU 50%/1 GiB，实际峰值 851.3 MiB、Swap 0。部署后 available 1622 MiB，未做高峰并发验证。
- 私有 ops 目录保存原 Nginx 备份/基线、源码归档与迁移前状态。更新/回滚只换代码，不覆盖 state；生产说明见 docs/deployment/production-2026-11-03.md。
- 本地预览不参与生产；本地 dev/start 共用 12091，启动前核对已知进程，不结束未知服务。

## 新增通知任务（当前）

- 当前执行链：服务器 systemd timer → pnpm monitor:service → 固定公开列表/新配图 → 白名单概要 upsert → URL 去重 → wecom-cli Markdown。
- 原 89 个 seenKeys 已迁移；新增实际确认后 seenKeys=90、inFlight=null；服务器通知启用，本机 .local/wecom-notifications.json 已关闭。
- 服务用户 CLI 1.2.0 已扫码授权，内部核对原机器人/原授权人一致；发送前重新查版本/授权/当前群名唯一匹配，不保存旧会话标识。
- 用户于 2026-11-03 明确要求删除，原 Codex「企业 AI 新增资料推送到企微」已通过应用工具删除并核对配置文件不存在；服务器任务未改，其他自动化未改。
- 无新增静默；旧条目修改不通知；发送不确定保留 inFlight，后续不自动重投，先核对群内消息再人工处理。
- 2026-11-03 15:28 timer 自动触发真实新增 1 条；15:30 unchanged/newCount=0，无历史补发；2026-11-04 只读复核 seenKeys=90、inFlight=false、lastError=null。失败仅记 journal，未新增其他报警通道。
- 详细边界/恢复 docs/wecom-notifications.md；不输出机器人凭据、内部标识或身份上下文。

## 版本与工程证据

- 新增 Linux standalone 打包、依赖链接完整性校验、低内存 webpack 构建和独立服务/证书模板。
- 18 回归（原 15 加 3 个企微本地隔离）及 Lint/类型通过 Node 22.14.0；新入口用单独 env-file 实测 unauthorized/initialized=false/messagesSent=0；此前完整构建/CI 记录见 handoff 验证文档。
- 生产 Chrome/IAB CUA 连接超时，公开无登录页改用独立 Playwright；截图 docs/deployment/flow-desktop.png。
- 只做本次基础响应观察，单次公网 HEAD 首字节约 0.24s；未做压力测试、完整 Web Vitals、真实手机软键盘或业务高峰验证。
- Creator app/MongoDB 已正常退出 0、专属备份 timer disabled，数据保留；恢复方式见 docs/deployment/server-audit-2026-11-03.md。
- shizhe/jietixia 两个旧站点证书过期与原 certbot-renew 失败未处理；不混入本项目部署。
- Vercel 混合读取能力保留，真实 Vercel/全云 worker 未部署；v0.1 历史方向仅存 docs/history。

## 下一步

1. 同事可免登录下载源码/交接包，按 docs/handoff/macos-setup.md 本地预览；要推送/PR 再注册 GitHub，申请写权限或 fork。企微由同事独立扫码，默认不启用本地通知。
2. 后续需求先写任务/范围/验收；CI 只检查，不自动发布，代码审核、生产内容导入与服务器更新分别执行。本轮未改生产服务或发送消息。
3. 后续自有资料入库先约定来源/分类/概要核验与发布规则，再实现审核后台或适配；不自行扩大采集/推送，旧证书问题另项处理。
