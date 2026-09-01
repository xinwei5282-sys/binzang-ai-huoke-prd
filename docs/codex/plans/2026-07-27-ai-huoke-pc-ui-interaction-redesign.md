---
title: "AI获客 PC 端界面与交互重构实施计划"
tags: ["type/设计", "domain/ai获客", "kw/PC端", "kw/界面重构", "kw/交互设计"]
keywords: ["PC端", "界面重构", "交互设计"]
project: "AI获客产品"
date: 2026-07-27
---

# AI Huoke PC UI and Interaction Redesign Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AI 获客单 HTML 原型的内容区域重构为参考增长云台的连续后台工作区，同时保留已经完成的 PC 壳层、导航、业务功能与任务闭环。

**Architecture:** 保留 `prototype/index.html` 单文件可直接打开的形态，在现有 PC 壳层上增加内容工作区契约。通过共用类把页面标题、工具栏、指标、表单、列表和表格改为连续白色工作面；仅调整 DOM 容器和 CSS，不重写 `data-act` 事件路由或业务数据。

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Node.js `node:test`, Chrome 真实渲染。

---

## File responsibility map

- Modify: `prototype/index.html` — 内容工作区骨架、共用组件样式和既有页面 DOM 容器。
- Modify: `prototype/tests/pc-ui-system.test.mjs` — 增加连续工作区、轻量页头、紧凑密度和禁用深色英雄区的契约。
- Existing tests: `prototype/tests/*.test.mjs` — 保证企业 Agent、商业工作流和知识初始化功能不回归。
- Create: `validation/pc-ui/` — 1440×900 与 1920×1080 真实渲染验收图和布局审计结果。

### Task 1: Lock PC shell and navigation contracts

**Files:**
- Create: `prototype/tests/pc-ui-system.test.mjs`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Write failing navigation and PC-only tests**

```js
test('PC shell follows the growth console structure', () => {
  for (const token of ['--sidebar-w:228px', '--topbar-h:56px', '--page-pad:32px']) {
    assert.match(html, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /min-width:\s*1024px/);
});

test('review belongs to intelligent assets', () => {
  assert.match(html, /data-nav-group="assets"[\s\S]*data-v="review"/);
  assert.doesNotMatch(html, /data-nav-group="management"[\s\S]*data-v="review"/);
});
```

- [ ] **Step 2: Run the test and verify the intended failure**

Run: `node --test prototype/tests/pc-ui-system.test.mjs`
Expected: FAIL because the new shell tokens and navigation group contracts are absent.

- [ ] **Step 3: Commit the failing contract**

```bash
git add prototype/tests/pc-ui-system.test.mjs
git commit -m "test: define AI huoke PC UI contracts"
```

### Task 2: Rebuild the global PC shell and visual tokens

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Replace global tokens with the approved SaaS system**

Define `--sidebar-w:228px`, `--topbar-h:56px`, `--page-pad:32px`, blue-gray page colors, white panels, 8px radii, light borders, and the approved Chinese font stack.

- [ ] **Step 2: Make the app explicitly PC-only**

Set the application shell to `min-width:1024px`; remove mobile drawer behaviors and mobile-only layout overrides from the active prototype CSS.

- [ ] **Step 3: Normalize sidebar, topbar, main content, page headers and focus styles**

Use one fixed sidebar, one 56px topbar, one scrolling content area, visible keyboard focus, and one primary action per page header.

- [ ] **Step 4: Run the focused test**

Run: `node --test prototype/tests/pc-ui-system.test.mjs`
Expected: PC shell token assertions PASS; navigation grouping may still FAIL until Task 3.

- [ ] **Step 5: Commit shell changes**

```bash
git add prototype/index.html prototype/tests/pc-ui-system.test.mjs
git commit -m "style: align AI huoke PC shell with growth console"
```

### Task 3: Regroup navigation and preserve routing

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Add explicit navigation group contracts**

Use `data-nav-group="workspace|content|business|assets|management"` and place every existing `data-v` entry in the approved group without renaming route keys.

- [ ] **Step 2: Move result review under intelligent assets**

Place `data-v="review"` after knowledge, avatar and prompt management; keep management limited to data sources, members and usage.

- [ ] **Step 3: Verify navigation and existing routes**

Run: `node --test prototype/tests/pc-ui-system.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs`
Expected: PASS with all existing `data-p` routes intact.

- [ ] **Step 4: Commit navigation changes**

```bash
git add prototype/index.html prototype/tests/pc-ui-system.test.mjs
git commit -m "refactor: regroup AI huoke PC navigation"
```

### Task 4: Lock the reference-style content workspace contract

**Files:**
- Modify: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Write failing workspace structure assertions**

```js
test('content pages use a continuous admin workspace', () => {
  for (const className of ['workspace-header', 'workspace-toolbar', 'workspace-surface']) {
    assert.match(html, new RegExp(`class="[^"]*${className}`));
  }
  assert.match(html, /--panel-radius:\s*6px/);
  assert.match(html, /--control-h:\s*36px/);
});

test('enterprise Agent no longer uses a dark hero block', () => {
  assert.doesNotMatch(html, /class="agent-hero"/);
  assert.match(html, /class="[^"]*agent-command-bar/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test prototype/tests/pc-ui-system.test.mjs`
Expected: FAIL because the current pages still use `.lead`, `.card` and `.agent-hero` as primary content containers.

- [ ] **Step 3: Commit only the failing contract when safe**

```bash
git add prototype/tests/pc-ui-system.test.mjs
git commit -m "test: define AI huoke content workspace contracts"
```

If the test file already contains unrelated user changes, leave it uncommitted and record that boundary in the final handoff.

### Task 5: Build the shared continuous workspace system

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Add the approved density and surface tokens**

Add `--panel-radius:6px`, `--control-h:36px`, `--row-h:44px`, `--workspace-gap:16px`; remove default card shadows and reserve shadow for overlays only.

- [ ] **Step 2: Implement the shared workspace classes**

```css
.workspace-header{display:flex;align-items:flex-end;gap:16px;margin:0 0 16px;padding:0;border:0;background:transparent;box-shadow:none}
.workspace-toolbar{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--surface);border:1px solid var(--line);border-bottom:0;border-radius:var(--panel-radius) var(--panel-radius) 0 0}
.workspace-surface{background:var(--surface);border:1px solid var(--line);border-radius:var(--panel-radius);box-shadow:none}
.workspace-toolbar+.workspace-surface{border-radius:0 0 var(--panel-radius) var(--panel-radius)}
```

- [ ] **Step 3: Normalize controls, tables and status rows**

Set inputs and standard buttons to `min-height:var(--control-h)`, table rows to approximately `var(--row-h)`, light table headers, border-separated sections and compact 12–14px typography.

- [ ] **Step 4: Run the workspace contract**

Run: `node --test prototype/tests/pc-ui-system.test.mjs`
Expected: shared token and class assertions PASS; enterprise Agent assertion remains FAIL until Task 6.

### Task 6: Convert the five representative content pages

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Convert enterprise Agent**

Replace `.agent-hero` with `.workspace-surface agent-command-bar`; keep the conversation, textarea, quick commands and `data-act="agent-send|agent-quick"`. Place diagnosis, plan, approvals and execution as divided sections inside one continuous workspace.

- [ ] **Step 2: Convert PPT / moments**

Use a lightweight `.workspace-header`, a compact mode toolbar and a two-column work surface. Keep `data-studio-panel`, `data-act="studio-mode"`, generation and approval actions unchanged.

- [ ] **Step 3: Convert AI sales**

Join lead filters, lead list and lead detail into one work surface. Use borders and column dividers instead of separate nested cards; retain diagnosis and approval actions.

- [ ] **Step 4: Convert knowledge brain and result review**

Use the same header, toolbar, tab and table density. Preserve knowledge onboarding, authorization, review candidates, charts and route keys; keep result review under intelligent assets.

- [ ] **Step 5: Run focused workflow tests**

Run: `node --test prototype/tests/pc-ui-system.test.mjs prototype/tests/commercial-workflows.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs prototype/tests/unified-knowledge-onboarding.test.mjs`
Expected: all tests PASS and all existing route/action strings remain present.

### Task 7: Normalize remaining pages without duplicating styles

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Apply the shared skeleton to remaining routes**

Convert plan, tasks, content creation, remix, trends, automation, works, Agent center, local workspace, avatars, prompt management, bindings, members and usage. Do not introduce page-specific replacements for rules already covered by `.workspace-*`.

- [ ] **Step 2: Preserve task and approval semantics**

Ensure approval surfaces expose impact, evidence, risk and post-approval action; keep success feedback in Toast and high-risk approval in the existing confirmation layer.

- [ ] **Step 3: Preserve normalized generation lifecycle states**

Use consistent wording and badge styling for preparing, generating, waiting for confirmation, completed and failed states across marketing, remix and PPT flows.

- [ ] **Step 4: Run full static regression**

Run: `node --test prototype/tests/*.test.mjs`
Expected: 19 or more tests PASS with zero failures.

- [ ] **Step 5: Commit implementation only when file ownership is clean**

```bash
git add prototype/index.html prototype/tests/pc-ui-system.test.mjs
git commit -m "style: align AI huoke content workspace"
```

If `prototype/index.html` includes pre-existing user edits that cannot be separated safely, do not commit it.

### Task 8: Full regression and real-render acceptance

**Files:**
- Modify if needed: `prototype/index.html`
- Test: `prototype/tests/*.test.mjs`
- Create: `validation/pc-ui/*.png`
- Create: `validation/pc-ui/layout-audit.json`

- [ ] **Step 1: Run the full prototype test suite**

Run: `node --test prototype/tests/*.test.mjs`
Expected: all tests PASS with zero failures.

- [ ] **Step 2: Render the canonical prototype at 1440×900 and 1920×1080**

Capture at least the enterprise Agent home, marketing creation, PPT/moments, knowledge brain and review pages.

- [ ] **Step 3: Exercise core click paths**

Verify enterprise Agent → plan → approval; marketing generation → confirmation; PPT/moments switch → generate → review; knowledge → review → next plan; all sidebar entries.

- [ ] **Step 4: Inspect reference alignment, overflow and console errors**

Expected: content headers are unboxed, primary content uses continuous white surfaces, controls and tables are compact, no dark hero block remains, and there are no clipped labels, unintended horizontal scrolling above 1024px, blocked primary actions, or new JavaScript errors.

- [ ] **Step 5: Commit final visual fixes and validation artifacts**

```bash
git add prototype/index.html prototype/tests/pc-ui-system.test.mjs validation/pc-ui
git commit -m "test: verify AI huoke PC UI redesign"
```
