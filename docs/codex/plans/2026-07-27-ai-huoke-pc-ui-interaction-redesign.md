# AI Huoke PC UI and Interaction Redesign Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AI 获客单 HTML 原型统一为参考增长云台样式的 PC 端企业 SaaS 系统，保留现有功能并改善导航、任务状态和核心闭环。

**Architecture:** 保留 `prototype/index.html` 单文件可直接打开的形态，先用契约测试锁定 PC 壳层、导航分组和交互状态，再收敛 CSS 变量与共用类。页面级布局继续复用现有 DOM 和 `data-act` 事件路由，避免重写业务演示逻辑。

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Node.js `node:test`, Chrome 真实渲染。

---

## File responsibility map

- Modify: `prototype/index.html` — PC 端壳层、导航、视觉变量、共用组件和核心交互。
- Create: `prototype/tests/pc-ui-system.test.mjs` — PC 宽度、导航分组、视觉 token、页头和状态契约。
- Existing tests: `prototype/tests/*.test.mjs` — 保证企业 Agent、商业工作流和知识初始化功能不回归。
- Create: `prototype/validation/pc-ui/` — 1440×900 与 1920×1080 真实渲染验收图。

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

### Task 4: Normalize system components and interaction states

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: Normalize page headers, metric strips and toolbars**

Apply shared classes to existing page leads, metrics, filters, task rows and tables. Keep one primary action and demote secondary actions to ghost/text styles.

- [ ] **Step 2: Normalize task and approval semantics**

Ensure approval surfaces expose impact, evidence, risk and post-approval action; keep success feedback in Toast and high-risk approval in the existing confirmation layer.

- [ ] **Step 3: Normalize generation lifecycle states**

Use consistent wording and badge styling for preparing, generating, waiting for confirmation, completed and failed states across marketing, remix and PPT flows.

- [ ] **Step 4: Add and run component contract assertions**

Run: `node --test prototype/tests/pc-ui-system.test.mjs prototype/tests/commercial-workflows.test.mjs`
Expected: PASS for shared page headers, state labels and existing workflow actions.

- [ ] **Step 5: Commit component changes**

```bash
git add prototype/index.html prototype/tests/pc-ui-system.test.mjs
git commit -m "style: unify AI huoke PC components and states"
```

### Task 5: Full regression and real-render acceptance

**Files:**
- Modify if needed: `prototype/index.html`
- Test: `prototype/tests/*.test.mjs`
- Create: `prototype/validation/pc-ui/*.png`

- [ ] **Step 1: Run the full prototype test suite**

Run: `node --test prototype/tests/*.test.mjs`
Expected: all tests PASS with zero failures.

- [ ] **Step 2: Render the canonical prototype at 1440×900 and 1920×1080**

Capture at least the enterprise Agent home, marketing creation, PPT/moments, knowledge brain and review pages.

- [ ] **Step 3: Exercise core click paths**

Verify enterprise Agent → plan → approval; marketing generation → confirmation; PPT/moments switch → generate → review; knowledge → review → next plan; all sidebar entries.

- [ ] **Step 4: Inspect overflow and console errors**

Expected: no clipped labels, unintended horizontal scrolling above 1024px, blocked primary actions, or new JavaScript errors.

- [ ] **Step 5: Commit final visual fixes and validation artifacts**

```bash
git add prototype/index.html prototype/tests/pc-ui-system.test.mjs prototype/validation/pc-ui
git commit -m "test: verify AI huoke PC UI redesign"
```
