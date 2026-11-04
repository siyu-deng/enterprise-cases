# 新增资料企微通知 · 2026-11-03

## 用户已确认范围

- 数据：企业 AI 落地观察新增资料。定时只采集 FastGPT 公开列表，额外手工加入用户的森马抖音案例概要。
- 目标群：ai宠物专项；只在每次新查到的机器人可发送会话中按群名精确且唯一匹配。
- 频率：每 5 分钟，由腾讯云 enterprise-cases-monitor.timer 触发。旧 Codex 定时任务已按用户要求删除，本地发送关闭；其他自动化未修改。
- 既有 89 条作为基线，不补发。旧资料修改不通知；按原始 URL 去重。
- 内容：标题、最多 120 字的来源概要、企业案例/场景参考、行业、来源和原始链接。不发送全文或原始记录；不在群里发测试或周期状态。

## 流程与文件

服务器 systemd timer → pnpm monitor:service → 来源列表与配图采集 → 白名单摘要合并 → 新原文 URL 检测 → wecom-cli 群 Markdown。

- scripts/monitor-once.mjs：单次检查，锁防并发；重复采集故障只报告一次新故障。
- scripts/import-reference.mjs：固定公开来源，有界三页，只下载新配图，原子写入；不读取原文详情。
- scripts/catalog-format.mjs：合并时保留首次收录时间和其他来源资料，不因本次未返回而删除旧记录。
- scripts/notification-core.mjs：原始 URL 去重、消息字节上限、最多 6 条合并成一条、精确群名匹配。
- scripts/notify-new-data.mjs：CLI 版本/授权/当前会话检查；发送前写 inFlight，接口明确确认后才标记已通知。
- .local/wecom-notifications.json：本地启用与群名配置；.local/notification-state.json：基线与发送状态；均已被 Git 忽略，不保存 CLI 凭据或会话内部标识。
- 生产 state 为 /var/lib/enterprise-cases/state；迁移了原有 89 条去重记录，未重建基线。服务器 CLI 重新授权并核对为原机器人/原授权人。
- /api/catalog：从当前概要文件读取，no-store；网页打开、刷新或重新获得焦点后读取最新入库数据，不再需要每次采集重建页面。

## 异常与恢复

- 目标群不在最近会话中、重名或授权失效时，不猜测、不向其他目标发送；保留新增记录，提示用户处理。
- 结果不确定（网络中断、进程异常、未收到成功确认）时保留 inFlight，后续不自动重投。先核对群中是否已出现该批通知，再人工决定确认或重试，不能直接清空状态造成重复发送。
- 首次初始化命令 pnpm notify:init 只在没有状态文件时建立基线，已有文件不会被覆盖。不要为排障删除基线文件。
- pnpm notify:preview 查看新增计划，不发送；pnpm notify:send 只发送尚未通知的新增资料；pnpm monitor:once 执行一次实际采集和配置内通知。
- 生产暂停使用 systemctl stop enterprise-cases-monitor.timer；保持重启后停用则再 disable。完全停用发送还应将服务器 enabled 改为 false；不要恢复旧本地调度并行运行。
- 网页、采集、授权与状态均位于服务器，不依赖本机/Codex。故障记入 systemd journal，没有新增其他报警渠道。

## 实际验证

- wecom-cli 1.2.0，授权状态 authorized；目标群在本次列表唯一匹配。
- CLI send --dry-run 本地格式校验通过，实际发送 0 条；未向群发送人工构造的测试新增。
- 实际一次采集/检测返回 unchanged、newCount=0；基线 89 条，inFlight 为空，没有已发送记录。
- 5 个通知回归 + 3 个摘要回归通过；Lint、类型检查、构建通过。
- /api/catalog HTTP 200、Cache-Control no-store、返回数据与当前文件一致，原条目首次收录日期保持不变；网页当前 89 条、无更新失败提示、控制台无错误。
- 森马真实新增已由 timer 触发并获得接口确认，后续一轮 unchanged，没有重复；接口确认不代表成员已阅读。
- 生产预检 ready；实际 systemd 单次采集返回 unchanged / newCount=0，timer 已 active / enabled，下一次计划已核对。没有发送测试消息。

参考：[企业微信官方 CLI](https://github.com/WecomTeam/wecom-cli)。具体参数与发送范围同时以本机 CLI --doc 和当前会话返回为准。

## 生产迁移

2026-11-03 已迁移腾讯云：先停本机调度、等待锁释放、迁移资料与账本，再预检并启用唯一服务器 timer；本地发送关闭。详见 deployment/production-2026-11-03.md。Vercel 远端概要 API 入口保留为可选方案，本次未部署 Vercel。

## 5 分钟与真实新增验证

用户于 2026-11-03 要求先改为 5 分钟，用其森马案例验证。15:28:52 sent/newCount=1/messageCount=1；15:30 unchanged/newCount=0，seenKeys=90、inFlight=null。详见 deployment/semir-case-2026-11-03.md。
