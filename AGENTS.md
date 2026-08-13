# AI 获客原型协作规则

## 目标和真源

- 当前原型唯一真源是 `prototype/index.html`。
- 静态原型、本地定时器和演示数据不得表述为已上线生产能力。
- 未经人工确认的 OCR、文档解析、网站/公众号采集和 AI 推断不能自动成为企业事实。

## 交互协议

- 开始前用一句话锁定“可验证目标”；多步需求可使用 `.codex/TASK_CARD.md`。
- 用户说“确认”“直接做”“可以”后，当前方案视为冻结：连续实施和验证，不再逐项询问 A/B/C。
- 只有范围明显扩大、不可逆操作、外部发布/付费、隐私数据或会改变核心结果时才再次请求决策。
- 用户追加需求时，默认保持已确认部分不变，只调整追加范围。
- 中间进度只报告“已完成、正在验证、真正阻塞”，不把内部工作流仪式化。

## 工作区和提交

- 编辑前先运行 `git status --short` 和目标文件的 `git diff`。
- 现有未提交内容默认属于用户；不覆盖、不回滚、不夹带进新提交。
- 新的中大型功能优先在独立 branch/worktree 实施。当主工作区已脏且无法安全分离时，实现可继续，但不得声称已形成干净提交。
- 用户未要求时不自动 push；用户要求“提交”时，分别汇报本地 commit 和远程 push 状态。
- 新任务的标准隔离入口：`codex-task <task-slug> --dry-run` 先预演，确认后去掉 `--dry-run` 创建 `.worktrees/codex-<task-slug>` 和 `codex/<task-slug>` 分支并运行基线测试。全局入口不可用时，回退到 `node prototype/scripts/start-codex-task.mjs`。

## 验收

- 开发中快速入口：`codex-verify --focus <name>`；用 `--list-focus` 查看可用范围，加 `--browser` 时自动启动并关闭隔离 Chrome。
- 交付前完整入口：`codex-verify --full`，运行全量测试、真源检查和桌面/手机浏览器验收。
- 兼容入口：`node prototype/scripts/verify-prototype.mjs`，在全局命令不可用时运行相同的项目适配器。
- 需要全仓健康检查时显式使用 `--all-diff`。
- 需要手工覆盖截图脚本时：`node prototype/scripts/verify-prototype.mjs --capture prototype/scripts/<capture-script>.mjs --browser`。
- 验收顺序：全量 `node:test` → `git diff --check` → `127.0.0.1:8010` 与本地真源校验 → 1440×900 → 390×844 → console/overflow/layout audit → 人工查看关键截图。
- 未执行真实浏览器或未人工查看截图时，必须标为“未关闭”，不得用结构测试代替。

## 本地预览

- 不再直接把 `file://` 或未检查的浏览器标签交付给用户。
- 标准入口：`codex-preview --route <route>`；全局入口不可用时回退到 `node prototype/scripts/open-prototype-preview.mjs --route <route>`。
- 预览器必须先确认 8010 页面与 `prototype/index.html` 的 SHA-256 一致；服务未启动时自动启动。
- 预览器只做服务可达、8010 页面与 `prototype/index.html` 真源一致、HTML 非空预检；通过后用 macOS `open` 在日常 Chrome 用户目录中直接打开带 `review` 路由的 URL。
- 本地预览不得启动临时用户目录、远程调试 Chrome 或其他隔离浏览器。预检失败时不打开浏览器并输出诊断。
- 直接打开只证明服务、真源和路由 URL 已交付；DOM、登录遮罩、console、overflow 与布局仍由 `codex-verify --full` 的真实浏览器验收关闭。
