# 同事电脑的企微 CLI 接入

2026-11-04 用户确认：同事自行扫码授权。此文档只接入本地 CLI，不启用本地自动采集/通知，不改变线上服务或原机器人配置。

## 文件与授权的区别

`.env.local` 单独交付，放在源码根目录，与 `package.json` 同级。它仅设置独立配置目录和关闭遥测，不含当前服务器/作者的机器人 Secret、token 或授权文件；默认使用 `~/.config/wecom-enterprise-cases`，不覆盖电脑上其他 CLI 配置。

官方 CLI 不会自动读取项目 `.env.local`。本项目的 `wecom:auth` / `wecom:status` 显式通过 Node `--env-file` 加载，再将目录展开为同事自己电脑上的绝对路径。不能直接把 dotenv 文件当作官方 CLI 的凭据文件。

扫码产生的凭据由官方 CLI 加密保存，参见 [官方命令参考](https://github.com/WecomTeam/wecom-cli/blob/main/docs/cli-reference.md)。`.env.local` 已在 `.gitignore`，加密凭据在项目目录外；均不放进公共源码压缩包或 Git。

## 同事执行步骤

1. 先按 Mac 教程配置 Node 22.14.0 / pnpm 10.19.0，确保网页可本地预览。
2. 把单独收到的 `.env.local` 放入项目根目录。Mac Finder 中可按 `Command+Shift+.` 显示隐藏文件；也可用终端复制。
3. 只在自己电脑安装指定 CLI：

```sh
pnpm add --global @wecom/cli@1.2.0
wecom-cli --version
```

若提示未配置全局可执行目录，执行 `pnpm setup`，重开终端再安装。无需安装/升级服务器上的工具。

4. 在项目目录中授权和核对：

```sh
pnpm wecom:auth
pnpm wecom:status
```

第一条先核对版本与独立目录的授权状态；未授权才显示二维码，由同事用自己的企业微信扫码。已有授权不重新绑定。第二条只输出 authorized/unauthorized 状态摘要，不显示身份/凭据，不发消息。

扫码授权是否允许接入由同事所属企业的管理员和实际扫码流程决定，本次没有代替同事完成授权或赋予原生产群的权限。不要为了测试去绑定/重置现有生产机器人，或直接在原群发送消息。后续确需调试通知时先约定独立测试机器人/群和发送授权。

## 当前边界

- 普通网页开发不需要执行这些命令。
- 本地 `.local/wecom-notifications.json` 仍为 `enabled=false`；授权成功不会启用发送或定时器。
- 本地辅助入口仅支持 auth/status，没有发送、采集、迁移生产凭据或导出 token 的操作。
- 生产仍由原服务器唯一 timer 每 5 分钟运行；同事电脑不运行第二套任务。
- 忘记带 `.env.local` 时，入口直接失败，不回退使用全局/生产凭据。
