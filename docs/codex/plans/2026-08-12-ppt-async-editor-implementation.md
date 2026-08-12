# PPT Async Generation And Structured Editor Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 PPT 创建收口为“需求 → 大纲审核 → 后台生成 → 直接下载”，并提供可按页预览、结构化编辑和 AI 追问修改的 PPT 详情页。

**Architecture:** 继续使用 `prototype/index.html` 作为唯一原型真源，在现有 PPT 纯函数模型上增加任务、单页、候选版和历史版本状态。营销物料的 PPT 列表负责异步任务入口与下载，`studio` 页负责创建和详情编辑；原型定时器只演示任务状态，不宣称真实文件已生成。

**Tech Stack:** 单文件 HTML/CSS/Vanilla JavaScript、Node.js `node:test`、项目 `local-web-workflow`、日常 Chrome 真实渲染验收。

---

## 文件责任图

- Modify: `prototype/index.html`
  - PPT 列表、两阶段创建、异步状态、直接下载、详情预览、结构化编辑、AI 追问候选版和响应式样式。
- Modify: `prototype/tests/ppt-creation-flow.test.mjs`
  - 大纲审核门禁、异步任务和去除成品审核的契约。
- Create: `prototype/tests/ppt-slide-editor.test.mjs`
  - 单页结构化编辑、候选版、采用/撤回、历史恢复和详情页控件契约。
- Modify: `prototype/tests/commercial-workflows.test.mjs`
  - 营销物料 PPT 列表的状态、预览、编辑和下载入口契约。

### Task 1: Freeze The Async PPT State Contract

**Files:**
- Modify: `prototype/tests/ppt-creation-flow.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing state tests**

Add assertions for a task contract equivalent to:

```js
const task = createPptGenerationTask(approvedOutline);
assert.equal(task.status, 'generating');
assert.equal(completePptGenerationTask(task).status, 'ready');
assert.equal(canDownloadPpt(task), false);
assert.equal(canDownloadPpt(completePptGenerationTask(task)), true);
```

Also assert that the studio markup contains only `填写需求` and `审核大纲`, and does not contain `提交成品审核`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs`

Expected: FAIL because `createPptGenerationTask`, `completePptGenerationTask`, `canDownloadPpt`, and the two-stage markup are missing.

- [ ] **Step 3: Implement the minimal pure state model**

Add pure functions near `PPT_CREATION_STAGES`:

```js
function createPptGenerationTask(outline){
  if(outline?.status!=='outline_approved') return null;
  return {id:'ppt-task-'+Date.now(),status:'generating',outline,progressLabel:'后台生成中',createdAt:new Date().toISOString()};
}
function completePptGenerationTask(task){
  return task?.status==='generating'?{...task,status:'ready',version:'v1.0',completedAt:new Date().toISOString()}:task;
}
function canDownloadPpt(task){return task?.status==='ready';}
```

Reduce `PPT_CREATION_STAGES` to `['brief','outline_review','generating','ready']`; `generating` is a task state, not a visible wizard step.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs`

Expected: PASS.

### Task 2: Replace The Four-Step Wizard With Two Immediate Phases And A PPT List

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/commercial-workflows.test.mjs`

- [ ] **Step 1: Write failing list and UI assertions**

Assert the PPT surface exposes:

```text
新建 PPT
生成中
可下载
预览
编辑
下载 PPTX
下载 PDF
已创建后台生成任务
```

Assert the old `data-ppt-stage="generating"`, `data-ppt-stage="output"`, and `submit-studio-review` controls are absent from the studio page.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: FAIL on the old four-stage creation/output markup and old `待审核` PPT list state.

- [ ] **Step 3: Implement the two-phase UI and task list state**

Replace the four-cell progress strip with a compact two-phase indicator. Update the material PPT list to render from `pptGenerationTasks`, with row actions governed by task state:

```js
const actions=task.status==='ready'
  ? '<button data-act="open-ppt-detail">预览 / 编辑</button><button data-act="download-pptx">下载 PPTX</button><button data-act="download-pdf">下载 PDF</button>'
  : '<span class="mini">可离开页面，完成后提醒</span>';
```

After outline approval, create a task, render the list, show `已创建后台生成任务`, and route to `marketing-materials/material-ppt`. A prototype timer may change the row to `ready`, but the create page must not display a long progress screen.

- [ ] **Step 4: Verify list state transitions and direct download gates**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: PASS; no completed-artifact review gate remains.

### Task 3: Add The Structured Slide Editor Model

**Files:**
- Create: `prototype/tests/ppt-slide-editor.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing editor model tests**

Cover these behaviors:

```js
const deck = createEditablePptDeck(readyTask);
const manuallyEdited = updatePptSlideDraft(deck, 'page-2', {title:'新标题'});
assert.equal(manuallyEdited.slides[1].title, '新标题');
assert.equal(manuallyEdited.slides[0].title, deck.slides[0].title);

const candidate = createPptSlideCandidate(deck, 'page-2', '减少文字');
assert.equal(candidate.pending.slideId, 'page-2');
assert.equal(deck.slides[1].title, candidate.slides[1].title);

const adopted = adoptPptSlideCandidate(candidate);
assert.equal(adopted.pending, null);
assert.equal(adopted.version, 2);
```

Also test `discardPptSlideCandidate` and `restorePptSlideVersion` preserve all non-target slides.

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs`

Expected: FAIL because the editor model functions are missing.

- [ ] **Step 3: Implement immutable slide-level updates**

Define `createEditablePptDeck`, `updatePptSlideDraft`, `createPptSlideCandidate`, `adoptPptSlideCandidate`, `discardPptSlideCandidate`, and `restorePptSlideVersion`. Each update must identify one `slideId`, clone the deck, and leave other slides unchanged. Manual edits append page history immediately; AI follow-up writes `pending` until adoption.

- [ ] **Step 4: Run the new test and verify GREEN**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs`

Expected: PASS.

### Task 4: Build Preview, Structured Editing, And Per-Slide Follow-Up UI

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/ppt-slide-editor.test.mjs`

- [ ] **Step 1: Add failing detail-page UI assertions**

Assert the detail page contains:

```text
页面缩略图
编辑
预览
全屏播放
标题
正文要点
数据
图片
备注
版式
正在修改第 1 页
请告诉 AI 如何修改当前页
采用新版
撤回
版本历史
已保存
```

Assert actions exist for selecting slides, switching edit/preview, previous/next, fullscreen preview, requesting an AI revision, adopting/discarding a candidate, restoring history, and direct download.

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs`

Expected: FAIL because the detail workspace is missing.

- [ ] **Step 3: Implement the three-region detail workspace**

Add:

- a left thumbnail rail with an explicit selected page;
- a center 16:9 live preview and preview navigation;
- a right panel with `编辑` / `AI 追问` tabs;
- structured fields for title, subtitle, bullets, data, image description, notes, CTA, layout, and chart;
- save status `保存中` → `已保存`, with a recoverable `保存失败` demonstration action;
- candidate comparison with `上一版` and `新版`, followed by adopt/discard;
- page history restore;
- PPTX/PDF download actions always available for the latest adopted deck.

Do not add drag handles, absolute-position editing, layers, or a fake production export.

- [ ] **Step 4: Verify editor UI and interactions**

Run: `node --test prototype/tests/ppt-slide-editor.test.mjs prototype/tests/ppt-creation-flow.test.mjs`

Expected: PASS.

### Task 5: Regression And Real-Browser Acceptance

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/*.test.mjs`

- [ ] **Step 1: Run focused PPT tests**

Run: `node --test prototype/tests/ppt-creation-flow.test.mjs prototype/tests/ppt-slide-editor.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run script parse and diff checks**

Run: `node -e 'const fs=require("fs");const h=fs.readFileSync("prototype/index.html","utf8");[...h.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].forEach(x=>new Function(x[1]));console.log("PASS")'`

Run: `git diff --check -- prototype`

Expected: PASS.

- [ ] **Step 3: Run the full test suite**

Run: `node --test prototype/tests/*.test.mjs`

Expected: all PPT-related tests PASS. If unrelated legacy failures remain, report their exact test names and do not hide them.

- [ ] **Step 4: Open the checked route in the normal Chrome profile**

Run: `node prototype/scripts/open-prototype-preview.mjs --route studio`

Expected: `status: PASS`, served SHA-256 matches `prototype/index.html`, `isolatedBrowser: false`.

- [ ] **Step 5: Validate the complete flow in the existing Chrome tab**

At desktop and mobile breakpoints verify:

1. one sentence → 8-page outline;
2. outline confirmation creates a background row and returns to the PPT list;
3. no long-running wizard screen or completed-artifact review action appears;
4. a ready row downloads directly and opens the detail workspace;
5. selecting page 2 changes the active preview and editor scope;
6. manual title editing updates only page 2 and shows `已保存`;
7. an AI follow-up creates a candidate without replacing the active page;
8. adopt changes only page 2; discard preserves the original;
9. preview navigation and fullscreen preview open and close correctly;
10. no blank page, console error, or horizontal overflow appears.

