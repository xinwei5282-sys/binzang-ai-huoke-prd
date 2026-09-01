# Marketing Video Remix-Style Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将营销视频改为与 AI 混剪一致的列表入口、两步创建和右侧预览。

**Architecture:** 继续以 `prototype/index.html` 为唯一原型真源，复用 AI 混剪的标题、工作台和步骤样式，但使用独立的 `data-create-step-*` 状态和营销内容字段。PRD 同步当前页面契约。

**Tech Stack:** HTML、CSS、Vanilla JavaScript、Node `node:test`

---

### Task 1: 锁定两步结构测试

**Files:**
- Modify: `prototype/tests/commercial-workflows.test.mjs`

- [ ] 新增列表、两步面板、可点击步骤、右侧预览和状态操作断言。
- [ ] 运行 `node --test prototype/tests/commercial-workflows.test.mjs`，预期新断言先失败。

### Task 2: 重组营销视频原型

**Files:**
- Modify: `prototype/index.html`

- [ ] 将列表改为直接展示状态任务，营销视频和 AI 混剪均不展示统计卡。
- [ ] 增加创建态返回图标、标题和两步指示器。
- [ ] 将原配置字段收纳到第一步。
- [ ] 增加第二步平台分版、可编辑完整内容、事实/合规状态和确认生成。
- [ ] 增加右侧竖屏内容预览并与标题/正文输入联动。
- [ ] 扩展 `showCreate()` 和 `showCreateStep()`，完成列表/创建/详情跳转。

### Task 3: 同步页面 PRD

**Files:**
- Modify: `prd/pages/AI获客-短视频创作.md`

- [ ] 将页面名称和流程更新为营销视频两步式契约。
- [ ] 写清列表状态、两步字段、右侧预览、人工确认和可选视频路径。

### Task 4: 验证

**Files:**
- Test: `prototype/tests/commercial-workflows.test.mjs`
- Test: `prototype/tests/prototype-distillation.test.mjs`

- [ ] 运行相关 `node:test`，预期全部通过。
- [ ] 运行 `git diff --check`，预期通过。
- [ ] 运行 `codex-verify --full`，验收 1440×900、390×844、console 和 overflow。
