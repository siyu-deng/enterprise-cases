> 历史启动包：仅记录 v0.1 复刻阶段。2026-11-03 已改为信息聚合平台，当前目标和规则以根目录 PROJECT_STATUS.md 与 docs/product.md 为准。

# 企业案例落地页 · 启动索引

- 项目：`/Users/siyudeng/side-projects/enterprise-cases`
- 基准版本：新仓库 feature/enterprise-cases，尚无提交
- 用户：了解企业 AI 落地场景的业务访客
- 目标：使用 Next.js 复刻 FastGPT 客户案例页，交付本地可浏览版本，为后续业务案例替换保留数据边界
- 阶段：原型

## 本轮范围

- 参考页面视觉与交互复刻
- 静态案例数据与本地媒体
- 本地可浏览验收

## 约束

- pnpm + Next.js App Router + TypeScript
- 不部署、不接真实线索系统
- 真实企业案例由用户后续整理入库

## 待验证假设

- 首版保留参考品牌与参考数据，用于核对复刻效果

## 对话与启动顺序

先启动可启动项，等待项在依赖交付后启动；暂缓项保留模板。按表中顺序检查依赖，不自动同时开启全部对话。

| 对话 | 计划 | 原因 | 入口 |
| --- | --- | --- | --- |
| 项目协调 / 商业价值 / 市场研究 / 产品定义 / 设计系统与布局 / 前端实现 / 测试与验收 | 可启动 | 本期单页复刻合并职责，由当前对话顺序实现与验证，无须新开对话 | [启动提示词](prompts/page-prototype.md) |
| 后端实现 | 暂缓 | 真实案例待用户整理入库，本期无后台实现 | [启动提示词](prompts/case-backend.md) |
| 运维与部署 | 暂缓 | 本期只本地预览，未获得生产发布授权 | [启动提示词](prompts/deployment.md) |

实际创建情况见 [对话登记](02-CONVERSATIONS.md)。提示词可复制到独立对话；准备完成不代表角色工作已经完成。

## 输入位置

- business：`/Users/siyudeng/side-projects/enterprise-cases/docs/business.md`（计划位置，尚未产出）
- market：`/Users/siyudeng/side-projects/enterprise-cases/docs/market.md`（计划位置，尚未产出）
- product：`/Users/siyudeng/side-projects/enterprise-cases/docs/product.md`（已存在，内容与版本待读取确认）
- design：`/Users/siyudeng/side-projects/enterprise-cases/docs/design-system.md`（已存在，内容与版本待读取确认）
- api：`/Users/siyudeng/side-projects/enterprise-cases/src/data/catalog.ts`（计划位置，尚未产出）
- frontend：`/Users/siyudeng/side-projects/enterprise-cases/src/app`（已存在，内容与版本待读取确认）
- backend：`/Users/siyudeng/side-projects/enterprise-cases/docs/backend.md`（计划位置，尚未产出）
- qa：`/Users/siyudeng/side-projects/enterprise-cases/docs/acceptance.md`（计划位置，尚未产出）
- release：`/Users/siyudeng/side-projects/enterprise-cases/docs/release.md`（计划位置，尚未产出）

## 验收与交接

角色输入输出与验收见 [角色资料](01-ROLES.md)。各组写自己的 handoffs 文件，协调角色汇总项目状态。

- [验收记录模板](templates/acceptance.md)
- [约定变更模板](templates/contract-change.md)

共享文件与资源由负责角色维护；接口/设计改动先更新真源并同步。先联调最小真实闭环，再扩展功能。
