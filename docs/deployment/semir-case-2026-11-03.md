# 森马案例入库与真实推送验证

- 日期：2026-11-03，Asia/Shanghai。用户明确要求公开加入该案例、验证企微推送，并将服务器检查间隔先改为 5 分钟。
- 已读取引用对话「分析抖音视频并整理企业AI案例」；原分析目录为用户 Downloads 下该视频的企业AI转型案例_森马。
- 仅使用其已完成分析的概要，没有重跑 ASR/切片、发布完整报告或扩大定时采集来源。

## 入库内容

- 标题：森马电商：AI 融入直播、商品图与客服流程。
- 类型：企业案例；行业：电商/零售/商贸；相关企业：森马电商 / 巴拉巴拉。
- 来源：光羽的平行世界 · 抖音；[原视频定位链接](https://www.douyin.com/video/7642252037626907958)。链接按用户下载留存的视频标识定位，在线返回校验页面，未独立回读核验；概要依据用户提供的视频分析。
- 概要：数字人直播、商品图生成、设计迭代、批量营销话术及客服 RPA 融入流程，并保留人工审核与跨部门协作。经营效果数字来自采访自述，未独立核验；没有把“2 亿”等自述当作本平台独立验证的增收。
- 配图：已有分析选图 02:55 的业务覆盖截图，直接复制，未生成或修改图片。源位置记录在原分析的关键图片清单。
- 数据片段 src/data/manual/semir-ai-transformation.json；本地种子同步为 90 条，生产真源仍是服务器 catalog.json。
- 合计 90 条：34 企业案例、56 场景参考、2 来源、14 实际行业。FastGPT 定时 upsert 后仍保留手工案例。

## 5 分钟和投递证据

- 本项目 timer 暂停后，在 monitor 文件锁内原子 upsert 一条；当时 total=90、pending=1、seenKeys=89，未手工修改 seenKeys 或伪造新增。
- server config intervalMinutes=5；timer 每小时 00/05/10/…/55 分触发，已语法检查并恢复 active/enabled。旧 Codex heartbeat 继续 PAUSED，本机 enabled=false。
- 恢复时 Persistent timer 自动补执行错过的周期：15:28:47 启动，15:28:52 完成。
- 实际结果 sent/newCount=1/messageCount=1/target=ai宠物专项；通过脚本发送前的 CLI 版本、授权和当前群名唯一匹配检查。
- 接口明确确认后账本 seenKeys=90，inFlight=null，lastSentAt=2026-11-03T07:28:52.181Z。仅代表平台确认接收，不代表群成员已阅读。
- 15:30:00 timer 再次自然触发，15:30:03 返回 unchanged/newCount=0；lastSentAt 未变，未重复通知原 89 条或该案例。下一轮 15:35。
- 记录保存在服务器 root 私有 ops/semir-case-verification.json，日志在 journalctl -u enterprise-cases-monitor.service。

## 网页与工程核验

- 公网 API 90 条、新案例唯一，图片 HTTP 200/image/jpeg。
- 真实浏览器搜索“森马”得 1 条，概要、原视频链接、归属和声明正确，无横向溢出。
- 当前概要契约回归 3 个通过；本次只新增资料/配图和调整本项目 timer，没有重建网页、修改其他项目或重启共享服务。
- 5 分钟为用户当前要求，未设置未经要求的自动恢复 15 分钟任务。
