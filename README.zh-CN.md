# dsh-assistant

[English](README.md) | 简体中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的助手 profile。
一切都是插件：身份、记忆、学习、浏览与连接器。

早期阶段。一个 profile、七个插件，暂无发布渠道。

## 环境要求

- Node >= 24.9
- DSH 0.2.2-rc.2：`npm i -g @deepseek-ai/dsh`
- `pnpm`（DSH 的插件管理器依赖它）
- Chrome 或 Chromium，供浏览器插件使用（渲染层驱动 Linux chromium
  无头 shell）

## 快速开始

```sh
npm run setup
npm start
```

打开打印出的 URL，进入 **Settings → Models**，添加一个模型密钥。然后：

```sh
npm run doctor
```

`setup` 会创建 `~/.dsh-assistant`（权限 0700），链接本地插件，安装锁定版本的
浏览器插件，并写入关闭遥测的补丁。它绝不会改动已有的 DSH home 或宿主机。

## 安装了什么

| 插件 | 作用 |
|---|---|
| `@local/dsh-soul` | 以提示词顺序 0 注入 `soul/SOUL.md`。直接编辑该文件即可，无需重启或改配置。 |
| `@local/dsh-memory` | 一个有容量上限的 `memory/profile.json`，外加 `memory_remember` / `memory_recall` / `memory_forget`。默认本地保存；Hindsight 需显式开启。 |
| `@local/dsh-learn` | 在后台复盘一次已完成的对话轮次，并在 `$DSH_HOME` 下记录持久记忆与程序性技能，附带审计日志、容量上限，且不弹审批提示。它不出现在任务列表里；被复盘的轮次只会在回复下方加一行不显眼的脚注（`learned 1 memory`，写入技能时还会附带技能名），完整记录在 `learning/audit.jsonl`。只要人类写下了足以表达某件持久事实的内容，或者工作本身足够扎实（8 次以上工具调用或很长的最终答复），该轮次就会进入复盘——所以一句只有一行、却跑了二十分钟的请求同样会被复盘。 |
| `@local/dsh-connectors` | Connectors 页面：Gmail、Outlook、Slack、Google 日历/云盘、Dropbox、Notion、HubSpot、Stripe、QuickBooks、Xero 和 Shopify，通过 Composio 进行连接/断开，外加带探活/重启的实时 MCP 服务器集群。Composio 密钥从页面保存；会话 MCP 会把已连接的应用暴露为工具。 |
| `@local/dsh-organiser` | 日程管理器：Day、Week、Month 三种视图，覆盖计划、每天的纯文本笔记和 DSH 自动化任务，每个日历一种颜色，周视图可直接点击创建条目。提醒（“给我发一条聊天消息”）与自动化任务从日历经 Schedule 服务创建；已完成的计划保持可见并加删除线，垃圾箱会真正删除。日历条带会提示尚未连接任何日历；下一步是通过 Connectors 读取 Google 日历。 |
| `@local/dsh-browse` | 浏览栈。第 1 层是宿主的 `web_fetch`；第 2 层是基于 CamoFox 服务器的 `browse`（JS 页面、会话、下载、验证码即停）；第 3 层是 `render_html`（用 chromium 把我们自己的 HTML 按精确毫米数打印成 PDF/PNG）和 `render_view`（同样的渲染，但一次调用同时返回图像与排版检查——文字超出边缘、盒子被裁剪、小于 15px 的字号、绘制文本碰撞）。 |
| `dsh-softshell` | 个人界面，以单个包交付。它隐藏开发者界面元素（Trajectory 与多余视图、模型与访问模式选择器、agent 预设标签、轮次/token 徽标、每轮的 “Edited N files” 卡片、分支操作），在空白屏幕上放置四个日常入口，把工作区文件夹放在附件控件旁，新增带内联 “read N pages” 行的 **Sources** 面板与每轮条带，朗读答复，并添加一条带 `ambient_place` / `ambient_weather` 的 `Right now: …` 提示行。一个 bundle 开关即可全部关闭。 |

## 数据与隐私

- 数据存放在 `~/.dsh-assistant/`，权限 0700：soul、记忆、会话、凭据。
- 遥测外发默认关闭；profile 补丁为 `config/telemetry-off.patch.yml`。
- 记忆默认本地保存。除非你在 memory 行上设置 `apiUrl`，语义记忆处于关闭
  状态。
- 语义记忆限定在一个 Hindsight bank 内（默认为 `dsh-assistant`）。扩展
  `allowBanks` 要谨慎；对不属于这个助手的任何 bank（包括其他 agent 的），
  请设置 `denyBanks` 加以隔离。
- 学习只写入 `$DSH_HOME/{memory,skills,learning}`；它绝不编辑 `SOUL.md`、
  profile 配置或宿主状态。每次改动都记录在 `learning/audit.jsonl`，被替换
  的技能在 `skills/.history/` 下保留最近五个版本。
- 浏览栈只在回环地址上访问 CamoFox 服务器；它绝不自行启动浏览器，也不读取
  凭据存储。`browse` 以你的身份在网站上行动——请把它的操作视为有后果的；
  页面要求验证码时立即停止（不要重试）。
- Connectors 使用 Composio 作为 OAuth 中介：已连接应用的令牌由 Composio
  持有，不落在这个 home 里。密钥本身存在 0600 权限的凭据存储中，绝不回传给
  页面。请为这个助手使用专门的 Composio 项目。

## 添加插件

1. 创建 `plugins/<name>/`，其中的 `package.json` 声明 `dsh.bundle`。
2. 把它的包名加进 `lib/paths.mjs` 的 `dsh.profile.bundles`。
3. `npm run setup`，然后 `npm run doctor`。

不修补核心。不给已经能用的东西写第二份实现。

## 测试

```sh
npm test          # 封闭环境
npm run test:live # 对本地 Hindsight 守护进程做只读测试
```
