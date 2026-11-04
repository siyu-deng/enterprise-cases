# Vercel 路线

## 推荐：Vercel 网页 + 独立服务器 worker

worker 继续运行当前 Node 脚本、wecom-cli 和持久化账本；由服务器 systemd 每 15 分钟执行。Vercel 只运行 Next.js 网页，不安装机器人 CLI，不保存发送账本。

已增加网页配置入口（`deploy/vercel/environment.example`）：

- `ENTERPRISE_CASES_CATALOG_URL`：真实 worker 的 HTTPS `/api/catalog` 地址。未配置时维持当前本机/打包概要读取行为，不能宣称云端自动同步。
- `ENTERPRISE_CASES_CATALOG_TOKEN`：可选服务端 Bearer token，只有 worker 自己配置了对应鉴权时才使用；当前本地 API 没有自动添加鉴权。不要使用 NEXT_PUBLIC 前缀，不把 token 放 URL 参数。

网页服务端代理读取该 API，禁止跟随重定向、不缓存结果，并将相对配图地址解析为 worker 来源地址。当前配图为公开来源素材，需由 worker HTTPS 站点提供；受保护的私有媒体以后需另外实现鉴权代理，不能直接套用本配置。

Vercel 构建和安装命令仍为 pnpm，框架选择 Next.js。真实接入前需验证 API 证书、权限、图片地址、缓存/网络条件和数据实时性；本轮未创建 Vercel 项目、设置真实环境变量或部署。

## 如果要求全部放 Vercel

需要额外替换这些当前依赖：

1. 案例数据：持久化数据库。
2. 配图：对象存储，不能向部署目录的 public 写新文件。
3. 去重、锁、投递账本：数据库事务或共享队列，不能依赖临时文件和本机 PID 锁。
4. 通知：适合无服务器运行的明确授权通道，或独立的机器人桥接服务；不能假设本机 CLI 授权自动存在。
5. 调度：15 分钟 Cron 需要支持该频率的套餐/调度器；Hobby 的 Vercel Cron 只有每天一次。

这些持久化和发送替换尚未实现，因此本轮没有创建一个会失败或丢账本的 Vercel cron endpoint，也没有把 CLI 密钥打包进函数。当前 worker 在检测到 Vercel Functions 环境时明确停止执行。

官方依据（2026-11-03 核对）：[Functions 运行时与文件系统](https://vercel.com/docs/functions/runtimes)、[Cron 使用限制](https://vercel.com/docs/cron-jobs/usage-and-pricing)、[Cron 配置](https://vercel.com/docs/cron-jobs/quickstart)。
