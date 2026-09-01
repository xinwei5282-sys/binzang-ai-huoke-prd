# Presenton-Inspired PPT Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留当前 PPT 大纲审核、异步任务、企业知识和 VI 边界的前提下，将原型调整为 Presenton 式的主题选择、多版式候选和浏览器编辑体验，并在 PRD 中锁定安全导出方案。

**Architecture:** 继续以 `prototype/index.html` 为唯一原型真源，在现有 `PptDeck` 纯函数模型中增加主题、版式候选、媒体替换和页面管理状态。原型仅表达产品交互；正式导出通过 `PptExportAdapter` 对接 MIT/Apache-2.0 组件，不使用许可不明的 `presenton-export`。

**Tech Stack:** 单文件 HTML/CSS/Vanilla JavaScript、Node.js `node:test`、项目 `codex-verify`、后续正式导出预留 PptxGenJS。

---

## 文件责任图

- Modify: `prototype/index.html`
  - PPT 主题选择、大纲审核、多版式候选、浏览器编辑、页面管理和导出边界。
- Modify: `prototype/tests/ppt-creation-flow.test.mjs`
  - 主题选择与大纲门禁。
- Modify: `prototype/tests/ppt-slide-editor.test.mjs`
  - 版式候选、媒体替换、页面排序/复制/删除/隐藏和 AI 候选隔离。
- Modify: `prototype/tests/ppt-global-consistency.test.mjs`
  - 原型、设计和 PRD 的导出许可边界。
- Modify: `docs/superpowers/specs/2026-08-12-ppt-async-generation-download-design.md`
  - 将已确认的主题与编辑器增强并入现行 PPT 设计。
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md`
  - 明确 Presenton 框架参考、`presenton-export` 排除和导出适配器。

### Task 1: Freeze Theme And License Contracts

**Files:**
- Modify: `prototype/tests/ppt-creation-flow.test.mjs`
- Modify: `prototype/tests/ppt-global-consistency.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing tests**

断言创建页包含企业 VI 与 3 套自有主题预览，`createPptOutlineDraft` 锁定 `themeId`；全局文本包含 `PptExportAdapter` 和 `PptxGenJS`，且明确禁用 `presenton-export`。

- [ ] **Step 2: Verify RED**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs prototype/tests/ppt-global-consistency.test.mjs`

Expected: FAIL because theme selection and export-license wording are absent.

- [ ] **Step 3: Implement minimal theme state and creation UI**

新增 `PPT_THEME_OPTIONS`、`selectPptTheme`，并在需求卡与大纲之间增加可预览主题卡。大纲保存主题 ID 和 VI 版本。

- [ ] **Step 4: Verify GREEN**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs prototype/tests/ppt-global-consistency.test.mjs`

Expected: PASS.

### Task 2: Add Layout Variants And Page Operations

**Files:**
- Modify: `prototype/tests/ppt-slide-editor.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing pure-model tests**

覆盖 `changePptSlideLayout`、`duplicatePptSlide`、`deletePptSlide`、`togglePptSlideHidden`和 `movePptSlide`；验证操作只改变指定页或顺序，且候选版不覆盖原页。

- [ ] **Step 2: Verify RED**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs`

Expected: FAIL because layout variants and page-operation functions are absent.

- [ ] **Step 3: Implement minimal deck operations**

每页生成 3 个自有版式 ID；实现版式切换、上下移动、复制、删除和隐藏的不可变纯函数。

- [ ] **Step 4: Verify GREEN**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs`

Expected: PASS.

### Task 3: Upgrade The Browser Editor

**Files:**
- Modify: `prototype/tests/ppt-slide-editor.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing UI-contract tests**

断言编辑页存在版式候选、替换图片、编辑图表、上移、下移、复制、删除、隐藏和导出说明，同时保留右侧 AI 候选边界。

- [ ] **Step 2: Verify RED**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs`

Expected: FAIL because the editor controls are absent.

- [ ] **Step 3: Implement editor controls and render states**

在中间画布顶部提供页面操作，画布下方提供版式候选和图片/图表工具；右侧仍只负责 AI 追问和候选采用。

- [ ] **Step 4: Verify GREEN**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs`

Expected: PASS.

### Task 4: Align PRD And Design

**Files:**
- Modify: `docs/superpowers/specs/2026-08-12-ppt-async-generation-download-design.md`
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md`
- Modify: `prototype/tests/ppt-global-consistency.test.mjs`

- [ ] **Step 1: Add failing consistency assertions**

要求两份文档同时出现 Presenton 框架参考、仅引入 Apache-2.0 可审计源码、排除 `presenton-export`、`PptExportAdapter` 和 PptxGenJS。

- [ ] **Step 2: Verify RED**

Run: `node --test prototype/tests/ppt-global-consistency.test.mjs`

Expected: FAIL because the documents do not yet contain the complete boundary.

- [ ] **Step 3: Update current design and PRD**

增加开源来源、导出适配器、禁止组件、主题/版式/编辑器和验收标准。

- [ ] **Step 4: Verify GREEN**

Run: `node --test prototype/tests/ppt-global-consistency.test.mjs`

Expected: PASS.

### Task 5: Full Verification

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/*.test.mjs`

- [ ] **Step 1: Run focused PPT tests**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs prototype/tests/ppt-slide-editor.test.mjs prototype/tests/ppt-global-consistency.test.mjs`

Expected: all pass.

- [ ] **Step 2: Run full regression and diff check**

Run: `node --test prototype/tests/*.test.mjs`

Run: `git diff --check`

Expected: all tests pass and no whitespace errors.

- [ ] **Step 3: Run real-browser verification**

Run: `codex-verify --full`

Expected: desktop 1440×900 and mobile 390×844 render without console errors, horizontal overflow or unusable controls; manually inspect the PPT creation and editor captures.
