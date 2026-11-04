# 技术结构与扩展位置

本地可无凭据运行；生产使用同一代码、不同持久路径。Next.js 16.4.4、React 19.3.1、TypeScript 5.9.3，准确依赖以 `package.json` 和 `pnpm-lock.yaml` 为准。

## 读取与通知链

```text
浏览器 → Next 页面 → GET /api/catalog → schema 校验 → 筛选/概要/来源链接
                                  ├ 本地 src/data/catalog.json
                                  └ 生产 /var/lib/enterprise-cases/catalog.json

服务器 timer（5 分钟）→ monitor:service → FastGPT 公开列表/新配图
    → 白名单概要映射 → 合并持久目录 → URL 去重 → 当前企微授权/群唯一匹配
    → 写 inFlight → 发送 → 明确确认后记 seenKeys、清 inFlight
```

Web/API 不提供写入/发送入口。API 不运行采集，不调用模型，没有数据库连接。只有服务器 worker 调用 wecom-cli；前端不应接触其凭据或内部会话标识。

## 目录与职责

| 路径 | 职责 |
| --- | --- |
| `src/app/page.tsx` / `customers/page.tsx` | 相同资料入口，保留旧路由 |
| `src/components/case-catalog.tsx` | 页面编排、只读接口加载、筛选/分页/主题状态 |
| `src/components/case-card.tsx` / `case-preview.tsx` | 卡片与 Radix 概要弹窗 |
| `src/app/api/catalog/route.ts` | Node 动态读取，no-store；失败返回通用 503 |
| `src/data/catalog.ts` | 共享类型、校验、统计与过滤规则 |
| `src/data/catalog.json` | 随代码交付的本地默认与发布种子 |
| `src/data/manual/` | 审核过的手工资料片段示例；不是自动导入目录 |
| `scripts/catalog-format.mjs` | 来源字段白名单/merge，保留首次收录时间与其他来源 |
| `scripts/import-reference.mjs` | 有界公开列表采集/配图/入库，再调用通知 |
| `scripts/notification-core.mjs` | URL 去重、正文分批、群唯一匹配、接口确认判断 |
| `scripts/notify-new-data.mjs` | CLI 预检、持久投递意图/确认，不确定时阻断自动重试 |
| `scripts/monitor-once.mjs` / `local-state.mjs` | 进程锁、超时、原子写入和状态摘要 |
| `scripts/runtime-paths.mjs` | 默认/生产绝对路径与可选 HTTPS 上游 |
| `scripts/check-environment.mjs` | 本地环境/隔离检查，不运行采集或 CLI |
| `scripts/prepare-runtime.mjs` | 仅补缺失文件，默认关闭通知，不重置账本 |
| `scripts/package-server.mjs` | Linux x64 standalone 打包及依赖链接完整性校验 |
| `deploy/server/` | 独立 systemd、资源限额、Nginx、证书模板 |

## 数据与接口

实际字段定义以 `src/data/catalog.ts` 为真源；概要目录版本 `schemaVersion: 2`。

| 集合 | 主要字段/关系 |
| --- | --- |
| sources | `id`、`name`、`url`、`description`、`collectedAt` |
| categories | `id`、`name`、`slug` |
| items | `id`、`slug`、`title`、`summary`、`kind`、`organization`、`categorySlug`、`sourceId`、`sourceUrl`、`cover`、`collectedAt` |

`kind` 只允许 `case` / `reference`，`organization` 可 null。`categorySlug` / `sourceId` 必须引用实际分类/来源，原始 URL 为 HTTPS，收录时间为 ISO 时间；不能把它当成来源发布日期。新增唯一 ID/slug、保留真实出处，配图放 `public/reference/covers/` 并保持本地 URL。通知跨来源按规范化的原始 URL 去重；目录合并同时考虑来源，详见核心实现。

`GET /api/catalog`：成功 200 返回整个 schemaVersion 2 目录，失败 503 返回 `{ "error": "资料暂时无法更新" }`；`Cache-Control: no-store`。客户端打开/重新聚焦/重试时读取，错误不暴露服务器路径。默认本地读取文件，设置 `ENTERPRISE_CASES_CATALOG_URL` 时读取 HTTPS 上游，不跟随重定向；可选 token 仅服务端读取。

当前浏览器关键词匹配，没有分页查询 API、写 API 或内容编辑权限。未来加入后台时，需要先约定写入校验、鉴权、审核/发布状态、重复提交与推送时点；不能只加一个公开写接口。

## 可修改范围与验证

界面调整从现有组件和 CSS 变量开始，补齐可查看设计系统。内容/分类变更跑 `test:catalog`；通知/去重/来源合并变更跑 `test:notifications`；路径/初始化/入口变更跑 `test:runtime`；环境隔离变更跑完整 `pnpm test`。所有提交运行 `pnpm check`，路由/依赖/构建相关变更补 `pnpm build:server`。

源码测试只使用临时目录和模拟响应，不实际发消息。真正的新增通知验证应单独获授权，使用真实资料，不能把生产账本删掉做测试。`inFlight` 表示投递结果尚未确认，需人工核对群内消息，不能自动清空重投。

## 运行环境与已知边界

生产入口与实际路径看 `PROJECT_STATUS.md`，操作流程看 `docs/deployment/self-hosted.md`。网页与 worker 使用独立 Node/pnpm、服务用户和资源上限，共用持久概要/配图，通知状态保持私密。GitHub 无生产密钥、无自动部署。

当前不是多节点数据库架构；本地文件锁和原子写适合单机，不应复制多个 worker 并发运行。无通用来源管理/后台导入/告警通道，新增来源需明确采集范围和审核规则；无全文检索、embedding 或 AI 摘要。Vercel 仅保留只读网页+外置 worker 方案，实际生产是腾讯云单机。
