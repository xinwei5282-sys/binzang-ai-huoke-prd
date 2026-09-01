# Brand Report Diagnosis Cases Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show independently previewable initial-diagnosis and deep-diagnosis report cases, with the deep case rendered as a complete 11-chapter management decision document.

**Architecture:** Keep `prototype/index.html` as the only product truth source. The brand-report table uses one shared preview action; the deep report content is defined as an ordered section array and rendered into a continuous document with desktop table of contents and a mobile section selector. Static contract tests protect the two-row structure, 11-chapter completeness, navigation hooks, management-level content, and honest demo boundaries.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js `node:test`, project `codex-verify` adapter.

---

## File responsibility map

- Modify: `prototype/index.html` — render the two report-case rows, build the two distinct preview bodies, and route clicks to the shared preview function.
- Modify: `prototype/tests/business-artifacts-v1.test.mjs` — define the brand-report case and interaction contract.
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md` — maintain the complete P-011 initial-diagnosis and P-012 deep-diagnosis prompts and output contracts.
- Modify: `prd/PRD_提示词.md` — register P-011 and P-012 without duplicating their full prompt bodies.
- Create: `docs/codex/plans/2026-08-12-brand-report-diagnosis-cases.md` — track this implementation and its verification steps.

### Task 1: Lock the brand-report case contract

**Files:**
- Test: `prototype/tests/business-artifacts-v1.test.mjs`

- [x] **Step 1: Write the failing test**

Add a test that extracts `data-subview-panel="brand-report"` and asserts:

```js
for (const title of ['企业初步诊断报告案例', '企业深度诊断报告案例']) {
  assert.match(brandReport, new RegExp(title));
}
assert.match(brandReport, /data-act="preview-diagnosis-report-case"[^>]*data-report-case="initial"/);
assert.match(brandReport, /data-act="preview-diagnosis-report-case"[^>]*data-report-case="deep"/);
assert.doesNotMatch(brandReport, /企业品牌诊断报告|品牌定位初稿/);
```

Also assert that `openDiagnosisReportCasePreview` and the click-dispatch case exist, and that the source contains the distinct phrases `六维概览`, `信息缺口`, `跨维度根因`, `证据链`, and `30 / 60 / 90 天`.

- [x] **Step 2: Run the test and verify it fails**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: FAIL because the current brand-report table still renders the old report rows and has no shared case-preview action.

### Task 2: Implement the two case rows and previews

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/business-artifacts-v1.test.mjs`

- [x] **Step 1: Replace the old rows**

Render exactly two report cases inside the existing brand-report table:

```html
<button class="btn sm" data-act="preview-diagnosis-report-case" data-report-case="initial">预览案例</button>
<button class="btn sm pri" data-act="preview-diagnosis-report-case" data-report-case="deep">预览案例</button>
```

Both rows must use the status `案例 · 可预览` and must not expose download, regenerate, failure, or retry actions.

- [x] **Step 2: Add the shared preview function**

Add:

```js
function openDiagnosisReportCasePreview(kind='initial') {
  const report = kind === 'deep' ? deepCase : initialCase;
  modal('报告案例预览 · ' + report.title, report.body, '关闭', closeModal, true);
}
```

The initial body must include enterprise status, six-dimension overview, strengths/problems, information gaps, confidence, and next-step supplementation. The deep body must include cross-dimension root causes, evidence chain, priority, risk/opportunity, 30/60/90-day actions, and the data-snapshot boundary.

- [x] **Step 3: Route the click action**

Add to the existing action dispatcher:

```js
case 'preview-diagnosis-report-case':
  openDiagnosisReportCasePreview(el.dataset.reportCase || 'initial');
  break;
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: all tests in the file pass.

### Task 3: Verify delivery boundaries

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/business-artifacts-v1.test.mjs`

- [x] **Step 1: Run focused project verification**

Run: `codex-verify --focus content`

Expected: the new case contract passes; any unrelated pre-existing failure must be reported separately with its exact test name.

- [x] **Step 2: Run the full automated suite**

Run: `node --test --test-reporter=dot prototype/tests/*.test.mjs`

Expected: no new failures compared with the current baseline of two unrelated assertion failures.

- [x] **Step 3: Check patch formatting**

Run: `git diff --check -- prototype/index.html prototype/tests/business-artifacts-v1.test.mjs`

Expected: exit code 0 with no output.

- [x] **Step 4: Reuse the existing browser page for acceptance**

Refresh the already-open `127.0.0.1:8010` prototype tab, navigate to “品牌报告,” open both report-case previews, and inspect the visible modal at desktop and narrow widths without creating extra user tabs.

Expected: both buttons open different readable previews, closing returns to the list, and neither the list nor modal causes horizontal overflow. If the existing tab is actively controlled or unavailable, stop browser interaction and report this acceptance item as not closed.

- [x] **Step 5: Preserve the dirty worktree**

Do not stage or commit `prototype/index.html` or its tests automatically because both files already contain user-owned uncommitted changes. Report the changed files and verification evidence only.

### Task 4: Lock the complete deep-deliverable contract

**Files:**
- Test: `prototype/tests/business-artifacts-v1.test.mjs`

- [ ] **Step 1: Add a failing full-document test**

Add a test that requires `deepDiagnosisCaseSections` and the following stable section IDs:

```js
const sectionIds = [
  'report-context', 'executive-summary', 'decision-list',
  'evidence-confidence', 'six-dimension', 'causal-chain',
  'root-priority', 'strategy-options', 'recommendation',
  'action-plan', 'risks-appendix'
];
for (const id of sectionIds) assert.match(html, new RegExp(`id:'${id}'`));
```

Require the management deliverable phrases `管理层摘要`, `老板决策清单`, `定位与战略`, `组织与执行`, `保守优化`, `聚焦突破`, `增长扩张`, `为什么暂不选择`, `负责人角色`, `验收指标`, `停止条件`, and `证据引用清单`.

- [ ] **Step 2: Add failing navigation and document-layout assertions**

Assert that the source includes:

```js
function buildDeepDiagnosisCaseDocument()
function navigateDiagnosisReportSection(sectionId)
data-act="navigate-diagnosis-report-section"
id="diagnosisCaseSectionSelect"
class="diagnosis-case-document"
class="diagnosis-case-toc"
class="diagnosis-case-content"
```

Also require a mobile media rule that collapses `.diagnosis-case-layout` to one column, hides `.diagnosis-case-toc`, and shows `.diagnosis-case-mobile-nav`.

- [ ] **Step 3: Run the test and verify it fails**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: FAIL because the current deep case is a short `status-stack` summary without an ordered section model or navigation.

### Task 5: Build the continuous management document

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/business-artifacts-v1.test.mjs`

- [ ] **Step 1: Define the 11 ordered sections**

Add `const deepDiagnosisCaseSections=[...]` with one object per stable section ID. Every object has `id`, `title`, `summary`, and `body`. Content requirements are:

```js
{id:'executive-summary',title:'02 管理层摘要',summary:'三个核心结论与一个关键矛盾',body:'...'}
{id:'strategy-options',title:'08 战略方案比较',summary:'三种互斥路径与取舍',body:'...'}
{id:'action-plan',title:'10 90 天行动计划',summary:'目标、负责人、交付物和验收指标',body:'...'}
```

Use the explicitly labelled example `某成长型企业服务公司`; all numbers are demo values and are not presented as industry benchmarks.

- [ ] **Step 2: Render the document shell**

Add `buildDeepDiagnosisCaseDocument()` returning:

```html
<div class="diagnosis-case-document">
  <header class="diagnosis-case-cover">...</header>
  <label class="diagnosis-case-mobile-nav">...</label>
  <div class="diagnosis-case-layout">
    <aside class="diagnosis-case-toc">...</aside>
    <article class="diagnosis-case-content">...</article>
  </div>
</div>
```

The table of contents buttons use `data-act="navigate-diagnosis-report-section"` and `data-section-id`. The mobile selector uses `id="diagnosisCaseSectionSelect"`.

- [ ] **Step 3: Implement in-modal navigation**

Add:

```js
function navigateDiagnosisReportSection(sectionId){
  $('#diagnosisCaseSection-'+sectionId)?.scrollIntoView({behavior:'smooth',block:'start'});
}
```

Route the desktop action through the shared click dispatcher. After opening the deep preview, bind `change` on `#diagnosisCaseSectionSelect` to the same function.

- [ ] **Step 4: Add document and responsive styling**

Desktop styles must provide a readable document surface, a sticky table of contents, bounded line length, clear section hierarchy, evidence/decision tables, causal flow, strategy comparison, and 30/60/90-day action rows. Under `700px`, hide the desktop table of contents, show the mobile selector, collapse tables or grids into cards, and keep controls at least 44px high.

- [ ] **Step 5: Replace only the deep preview body**

Keep the existing initial report preview unchanged. Change the deep case mapping to use `buildDeepDiagnosisCaseDocument()` so the two report types remain distinct and the brand-report list remains exactly two rows.

- [ ] **Step 6: Run the focused test and verify it passes**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: all tests in the file pass.

### Task 6: Verify the full document delivery

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/business-artifacts-v1.test.mjs`

- [ ] **Step 1: Run content-focused verification**

Run: `codex-verify --focus content`

Expected: PASS, including source-hash validation against the reused local server.

- [ ] **Step 2: Run the full automated suite**

Run: `node --test --test-reporter=dot prototype/tests/*.test.mjs`

Expected: no new failures beyond the two known unrelated external-intelligence assertions.

- [ ] **Step 3: Check formatting**

Run: `git diff --check -- prototype/index.html prototype/tests/business-artifacts-v1.test.mjs docs/codex/plans/2026-08-12-brand-report-diagnosis-cases.md`

Expected: exit code 0 with no output.

- [ ] **Step 4: Reuse the existing brand-report tab for browser acceptance**

Open the deep report in the already-open `127.0.0.1:8010` brand-report tab. Verify the cover, all 11 headings, desktop table-of-contents navigation, mobile section selector, scrollable long-document behavior, zero horizontal overflow at desktop and narrow width, and zero console errors. Release the existing tab after inspection and do not create another browser tab.

### Task 7: Maintain initial and deep diagnosis prompts

**Files:**
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md`
- Modify: `prd/PRD_提示词.md`
- Test: `prototype/tests/business-artifacts-v1.test.mjs`

- [ ] **Step 1: Add failing Prompt contract assertions**

Load both PRD files in the business-artifacts test. Require `P-011 企业初步诊断`, `P-012 企业深度诊断`, the separate output types `initial_diagnosis_report` and `deep_diagnosis_report`, `prompt_version`, `input_snapshot_id`, evidence references, validation errors, and the 11 deep-report section keys.

- [ ] **Step 2: Add P-011 to the main PRD**

Define a complete copyable Prompt containing role, allowed inputs, generation steps, fact/evidence/inference boundaries, downgrade behavior, forbidden behavior, and a JSON output contract. Require six-dimension summaries, gaps, confidence, priority, next information, citations, and `status=draft_review`.

- [ ] **Step 3: Add P-012 to the main PRD**

Define a complete copyable Prompt that rejects unmet `80% / every dimension 60%` thresholds, builds the evidence hierarchy before conclusions, produces six-dimension analysis and cross-dimension causal chains, compares three mutually exclusive strategies, gives one conditional recommendation, and returns the complete 11-section management document JSON. Every major conclusion must carry evidence references, judgment level, and confidence.

- [ ] **Step 4: Update the Prompt registry only**

Add P-011 and P-012 rows to `prd/PRD_提示词.md` §12.1. Keep the existing statement that complete bodies live only in the main PRD.

- [ ] **Step 5: Surface Prompt traceability in the demo**

The deep report cover or evidence appendix must show `P-012 v1.0` and a demo `input_snapshot_id`, explicitly labelled as example metadata.

- [ ] **Step 6: Verify Prompt maintenance**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Run: `git diff --check -- prd/PRD_企业AI经营大脑_当前开发基线.md prd/PRD_提示词.md`

Expected: all focused tests pass and both PRDs have clean formatting.
