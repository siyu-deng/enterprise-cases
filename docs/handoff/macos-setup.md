# macOS：从零安装与运行

日期：2026-11-04。以下操作在同事自己的 Mac 完成。Apple Silicon 和 Intel 均可；无需 Docker、数据库、服务器密码、企微 CLI 或模型 API key。

## 1. 安装 Git

打开“终端”，输入：

```sh
git --version
```

如果提示安装开发者工具，按提示安装。没有提示且 Git 不可用时执行以下命令，等待系统弹窗安装结束再继续：

```sh
xcode-select --install
```

已安装则不重复。Git 的 macOS 官方说明包含这一安装路径：[Git 安装文档](https://git-scm.com/install/mac)。

## 2. 安装 Node.js 版本管理工具 nvm

本项目基线 Node.js **22.14.0**，与现有服务器一致；不是要求卸载电脑上其他项目的 Node。nvm 可以按项目切换版本。此版本是当前项目已验证的兼容基线，升级安全补丁/大版本由维护者单独验证后同步 `.nvmrc`、CI 和服务器，不自动升级全局工具。

先检查：

```sh
command -v nvm
```

有输出 `nvm` 时跳到第 4 节。没有时，按 [nvm 官方安装说明](https://github.com/nvm-sh/nvm#install--update-script)安装；以下下载的是官方 v0.40.8 安装脚本，查看后执行，会在个人目录安装并配置终端加载：

```sh
touch ~/.zshrc
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh -o /tmp/enterprise-cases-nvm-install.sh
less /tmp/enterprise-cases-nvm-install.sh
bash /tmp/enterprise-cases-nvm-install.sh
source ~/.zshrc
command -v nvm
```

`less` 用于查看文件，按 `q` 退出。无需 `sudo`。若仍找不到 nvm，关闭终端重开，再检查；不要反复叠加安装多个 Node 管理器。

不使用 nvm 的备选：从 [Node 官方 22.14.0 下载页](https://nodejs.org/en/download/archive/v22.14.0)安装 macOS `.pkg`，随后确认 `node --version`；这会改变系统可执行文件位置，不适合已有多个 Node 项目的同事。采用此备选时跳过后文 `nvm` 命令。

## 3. 下载公开项目

仓库已经公开，**无需 GitHub 账号、邀请或 Git 认证就能克隆并在本地开发**。可以直接解压交接包内的 `source/enterprise-cases`，或在 [仓库页面](https://github.com/siyu-deng/enterprise-cases)选择 Code → Download ZIP。

建议有 Git 后用以下命令克隆，保留版本管理能力：

```sh
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/siyu-deng/enterprise-cases.git
cd enterprise-cases
```

使用压缩包时，在终端 `cd` 进入解压后的源码目录，不再执行 clone。压缩包没有 `.git`，先跳过 Git 分支/提交相关命令，安装 Node/pnpm 后即可运行。

后续需要推送/PR 时，再注册自己的 GitHub 账号，让主人邀请为协作者，或 fork 后提交 PR。可选安装 [GitHub Desktop](https://desktop.github.com/download/)，登录后图形化完成克隆、分支、提交与推送；命令行 HTTPS 推送使用自己的 Git 认证，不能用 GitHub 账号密码代替。

仅对克隆得到的 Git 工作区设置提交身份，替换为自己的名字和邮箱；有 GitHub 账号时可在 Settings → Emails 找到自己的隐私邮箱。这里不使用 `--global`，避免改动其他项目配置。

```sh
git config user.name "你的名字"
git config user.email "你的 GitHub 提交邮箱"
git config --get user.name
git config --get user.email
```

## 4. 安装项目 Node 与 pnpm

进入项目目录后，nvm 会从 `.nvmrc` 读取固定版本：

```sh
nvm install
nvm use
node --version
```

预期 `v22.14.0`。新开终端进入项目后执行 `nvm use`，不设置全局默认版本。若显示其他版本，执行 `command -v node` 检查 PATH，并重新 `source ~/.zshrc`、`nvm use`。

pnpm 固定 **10.19.0**。先 `pnpm --version`；已有该版本直接继续。没有时用 [pnpm 10 官方独立安装方式](https://pnpm.io/10.x/installation)指定版本，无须 npm/npx：

```sh
curl -fsSL https://get.pnpm.io/install.sh -o /tmp/enterprise-cases-pnpm-install.sh
less /tmp/enterprise-cases-pnpm-install.sh
env PNPM_VERSION=10.19.0 sh /tmp/enterprise-cases-pnpm-install.sh
source ~/.zshrc
pnpm --version
```

预期 `10.19.0`。仓库 `packageManager` 也锁定该版本；不要复制最新 pnpm 的安装命令导致锁文件变化。若仍找不到 pnpm，重开终端；若版本不对，把 `command -v pnpm` 和版本交给 AI/维护者排查，不升级其他项目的工具。

## 5. 安装依赖并启动

```sh
pnpm install --frozen-lockfile
pnpm setup:local
pnpm dev
```

`pnpm setup:local` 检查版本和隔离状态，创建本地禁用的通知配置与初始基线。首次安装需要访问包仓库；正常界面运行不需要任何密钥。不要删除锁文件来处理下载错误。

打开 [http://127.0.0.1:12091/](http://127.0.0.1:12091/)。终端保持运行；页面修改后会更新。停止时按 `Ctrl+C`。

不需要 `.env.local`。`.env.example` 仅供了解可选配置；不要从服务器拷贝环境文件。启用远端 `ENTERPRISE_CASES_CATALOG_URL` 后，本地页面会读取远端概要，本地 JSON 编辑不会显示；新手开发保持默认本地数据即可。

如果 12091 被占用，先查是否自己已经开了一份 dev；在那个终端停止。不结束未知进程。需要临时并行预览时可以手工指定另一未占用端口，例如 `pnpm exec next dev --hostname 127.0.0.1 --port 12092`，不要同时启动同一个目录下的两个 Next 实例，宜使用独立 clone/worktree。

## 6. 打开 AI 工具与日常提交

用 Codex 或 Cursor 打开整个项目文件夹，粘贴 [交接手册中的接续提示词](README.md#4-可直接复制给-ai-的接续提示词)。工具由同事本人登录，不共享账号或服务器密钥；仓库中的 `AGENTS.md` 是跨电脑的开发约定。

Desktop 操作可以替代大部分 Git 命令：Current Branch → New Branch → `feature/需求英文名`，修改并预览；Changes 中选本次文件、填写摘要、Commit、Publish branch/Push origin，再 Create Pull Request。不要直接在 `main` 做试改。

提交前停止 dev，执行：

```sh
pnpm check
pnpm build:server
```

`build:server` 在 Mac 可验证构建，但发布打包器仅接受 Linux x64；不要把 Mac 的 `node_modules` 上传服务器。GitHub Actions 会再做 Linux 检查。

## 7. 常见问题

| 现象 | 处理 |
| --- | --- |
| 仓库 404 / Repository not found | 当前为公开仓库，核对地址和网络；本地开发也可从交接压缩包解压源码 |
| Node/pnpm 版本错误 | 进入项目后 `nvm use`；检查实际可执行路径，再按固定版本安装 |
| `pnpm run doctor` 提示运行环境覆盖 | 检查当前终端的 `ENTERPRISE_CASES_*`；新终端不继承生产配置，勿粘贴凭据给 AI |
| `pnpm run doctor` 提示发送未关闭 | 检查本地 `.local/wecom-notifications.json`，设 `enabled=false`；不要复制线上账本 |
| 端口占用 | 停止自己已启动的预览；不杀未知服务 |
| 改 JSON 页面没更新 | 确认没有远端目录配置，刷新/重新聚焦，并验证 JSON 字段关系 |
| 锁文件不匹配 | 查看是否改了 package.json；依赖调整统一 pnpm，并一起提交锁文件，不直接删锁 |
| `pnpm deploy:check` 显示 not_ready | 这是服务器 Worker 预检，本地无企微授权属预期，不是网页启动条件 |
| `git pull --ff-only` 失败 | 保留改动与分支，让 AI 查看差异/冲突，不强推或丢弃文件 |

首次本地接入以“自己电脑能预览”为准；Git 协作阶段再验收建分支、提交 PR。本手册不代表已代替同事安装或授权其账号。
