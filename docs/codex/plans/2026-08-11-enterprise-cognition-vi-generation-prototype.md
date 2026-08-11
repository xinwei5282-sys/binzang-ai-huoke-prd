# Enterprise Cognition VI Generation Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将企业大脑的“企业认知”改为企业偏好与 VI 生成页，完成“归纳偏好 → 三套方向 → 完整 VI 草案 → 人工确认启用”的可操作原型。

**Architecture:** 在单文件原型中新增独立的 `enterpriseViState`，使用 `localStorage` 保存偏好、三套方向、草案、当前启用版本和历史版本。企业认知页只读写该状态；内容工厂通过一个受控的上下文函数仅读取 `active` VI，未确认草案始终不进入正式生成上下文。异步过程在原型中用可恢复的定时状态演示，不宣称已接入真实文档理解、图像或商标服务。

**Tech Stack:** 单文件 HTML/CSS/Vanilla JavaScript、`localStorage`、Node.js `node:test`、Chrome DevTools Protocol 真实浏览器验收。

---

## File responsibility map

- **Modify:** `prototype/index.html`
  - 企业认知页面结构、响应式样式、VI 状态模型、引导提交后的异步触发、方向选择、草案确认、版本切换和内容工厂读取边界。
- **Create:** `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
  - 纯状态行为、页面结构、人工确认门禁、失败恢复和内容工厂上下文边界。
- **Modify:** `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
  - 企业认知的职责文案从“企业档案与品牌视觉”更新为“企业偏好与 VI 基础内容”，保留五个二级页面互不串页的回归。
- **Modify:** `prototype/tests/enterprise-diagnosis-v1.test.mjs`
  - 确认引导提交后启动 VI 方向生成，但不阻塞基础诊断。
- **Create:** `prototype/scripts/capture-enterprise-cognition-vi.mjs`
  - 验证三套方向、方向选择、草案生成、未确认隔离、确认启用、失败恢复以及桌面/手机布局。
- **Create:** `validation/enterprise-cognition-vi/`
  - 保存 1440×900 与 390×844 截图、DOM/溢出/控制台审计 JSON。

---

### Task 1: Lock the VI state contract with failing tests

**Files:**
- Create: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

- [ ] **Step 1: Add a source extractor for the VI model**

```js
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = html.match(/const ENTERPRISE_VI_STATE_KEY=[\s\S]*?(?=\nfunction renderEnterpriseCognitionVi)/)?.[0] || '';
```

- [ ] **Step 2: Add failing state-transition tests**

```js
test('VI directions must be selected before a complete draft can be generated', () => {
  const vi = loadViModel();
  vi.startEnterpriseViDirectionGeneration({ brandTone: '专业、直接' });
  vi.completeEnterpriseViDirectionGeneration();
  assert.equal(vi.getState().status, 'directions_ready');
  assert.equal(vi.getState().directions.length, 3);
  assert.equal(vi.generateEnterpriseViDraft(), null);
  vi.selectEnterpriseViDirection(vi.getState().directions[0].id);
  assert.equal(vi.generateEnterpriseViDraft().status, 'generating_vi');
});
```

```js
test('only a confirmed VI version becomes active and reusable', () => {
  const vi = loadViModel();
  const draft = vi.seedDraft();
  assert.equal(vi.getActiveEnterpriseVi(), null);
  vi.activateEnterpriseViDraft(draft.id, '企业管理员');
  assert.equal(vi.getActiveEnterpriseVi().id, draft.id);
  assert.equal(vi.getActiveEnterpriseVi().status, 'active');
  assert.equal(vi.getActiveEnterpriseVi().version, 1);
  assert.equal(vi.getState().history.length, 0);
});
```

- [ ] **Step 3: Add failing UI and boundary assertions**

Assert the page contains `enterpriseViPreferenceSummary`, `enterpriseViDirections`, `enterpriseViDraft`, three direction cards, `data-act="select-enterprise-vi-direction"`, `data-act="activate-enterprise-vi"`, source labels `AI 推断` / `企业确认`, and the prototype boundary `原型演示 · 待接入`. Assert the old cognition wording `企业档案与品牌视觉统一形成企业认知` is absent.

- [ ] **Step 4: Run the focused tests and verify RED**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs
```

Expected: FAIL because `ENTERPRISE_VI_STATE_KEY`, the VI state functions and the new staged page do not exist.

- [ ] **Step 5: Commit the test contract**

```bash
git add prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs
git commit -m "test: define enterprise cognition VI workflow"
```

---

### Task 2: Implement the persistent VI workflow model

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`

- [ ] **Step 1: Add the state key, default state and safe loader**

```js
const ENTERPRISE_VI_STATE_KEY='aiHuokeEnterpriseViStateV1';
const defaultEnterpriseViState={
  status:'idle',preferences:[],directions:[],selectedDirectionId:'',
  draft:null,activeVersion:null,history:[],error:null,updatedAt:null
};
function loadEnterpriseViState(){
  try{return {...defaultEnterpriseViState,...JSON.parse(localStorage.getItem(ENTERPRISE_VI_STATE_KEY)||'{}')};}
  catch(_){return {...defaultEnterpriseViState};}
}
```

- [ ] **Step 2: Add preference inference without overwriting confirmed values**

Create `buildEnterpriseViPreferences(input)` returning entries shaped as:

```js
{key:'tone',label:'品牌语气',value:'专业、直接、有依据',source:'企业引导',confirmation:'ai_inferred'}
```

When an existing entry has `confirmation:'enterprise_confirmed'`, preserve its value during regeneration.

- [ ] **Step 3: Add three differentiated direction generators**

Implement `startEnterpriseViDirectionGeneration(input)` and `completeEnterpriseViDirectionGeneration()` with three deterministic prototype directions: `稳健决策`, `人文专业`, `现代增长`. Each direction must contain `id`, `name`, `description`, `colors`, `font`, `imageStyle`, `scenarios`, and `previewTone`.

- [ ] **Step 4: Add selection, draft, failure and activation transitions**

Implement:

```js
selectEnterpriseViDirection(id)
generateEnterpriseViDraft()
completeEnterpriseViDraftGeneration()
failEnterpriseViGeneration(stage, message)
retryEnterpriseViGeneration()
activateEnterpriseViDraft(id, confirmedBy)
getActiveEnterpriseVi()
```

`generateEnterpriseViDraft()` returns `null` when no valid direction is selected. `activateEnterpriseViDraft()` copies the previous active version into `history`, creates an `activeVersion` with `status:'active'`, sets a new version number, records `confirmedBy` / `confirmedAt`, clears the draft and changes the top-level state status to `active`. The first activation leaves `history` empty; activating a replacement moves the previous active version into `history`.

- [ ] **Step 5: Run the model tests and verify GREEN**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs
```

Expected: state-transition tests PASS; UI assertions may remain RED until Task 3.

- [ ] **Step 6: Commit the model**

```bash
git add prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs
git commit -m "feat: add governed enterprise VI state model"
```

---

### Task 3: Replace enterprise cognition with the staged VI page

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Test: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

- [ ] **Step 1: Replace the cognition summary and legacy brand host**

Replace `enterpriseBrainCognitionHost` with these stable regions:

```html
<section id="enterpriseViPreferenceSummary"></section>
<section id="enterpriseViDirections"></section>
<section id="enterpriseViDraft"></section>
<section id="enterpriseViVersionHistory"></section>
```

Update the section note to `企业偏好与 VI 基础内容统一形成可复用的企业认知。` Remove the cognition-page entry that sends users back to the entire enterprise profile.

- [ ] **Step 2: Stop moving the legacy brand panel into cognition**

Change `mountEnterpriseBrainPanels()` so it only moves `profile-diagnosis` into `enterpriseBrainDiagnosisHost`. Keep the legacy `profile-brand` markup as an unreachable compatibility surface until a later cleanup; do not render it inside the new cognition page.

- [ ] **Step 3: Render preferences with sources and confirmation status**

Implement `renderEnterpriseViPreferences()` using compact rows or tags. Every preference must show its source and either `AI 推断` or `企业确认`. Add `data-act="edit-enterprise-vi-preferences"` to open an editable form; saving changes marks edited entries as `enterprise_confirmed` and regenerates directions only after explicit confirmation.

- [ ] **Step 4: Render three selectable direction cards**

Implement `renderEnterpriseViDirections()` with exactly three visually distinct cards. Each card shows color swatches, font, image style, scenarios and a preview. The selected card receives `aria-pressed="true"`; the primary button becomes `用此方向生成完整 VI`.

- [ ] **Step 5: Render the complete VI draft and active version**

Implement `renderEnterpriseViDraft()` with sections for Logo usage, colors, typography, imagery, layout, tone and application examples. If no uploaded Logo exists, show `未上传 Logo · 当前为方向占位` instead of a generated trademark claim. Only `draft_review` shows `确认并启用`; only `active` shows the active-version badge and version-management actions.

- [ ] **Step 6: Add responsive styles**

Use the existing OKLCH design tokens. Desktop lays direction cards in three columns. At `max-width:720px`, use a horizontal snap scroller with cards no narrower than `82vw`; keep VI sections as readable vertical blocks and preserve a 44px minimum touch target for primary actions.

- [ ] **Step 7: Wire page entry and actions**

Call `renderEnterpriseCognitionVi()` whenever `showKbTab('cognition')` is active. Add delegated-action cases for selecting a direction, regenerating directions, editing preferences, generating a draft, activating a draft, retrying a failed stage, and opening version history.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs
```

Expected: PASS with the staged layout present and the five enterprise-brain panels still isolated.

- [ ] **Step 9: Commit the page**

```bash
git add prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs
git commit -m "feat: build staged enterprise cognition VI page"
```

---

### Task 4: Trigger VI directions after onboarding without blocking diagnosis

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`

- [ ] **Step 1: Add failing trigger assertions**

Assert both `confirm-profile` and `confirm-modal-profile` call `queueEnterpriseViDirectionGeneration()` after saving the intake draft. Assert the handler still calls `go('kb')`, `showKbTab('diagnosis')` and `maybeStartBasicDiagnosis()` without awaiting VI generation.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/enterprise-cognition-vi-v1.test.mjs
```

Expected: FAIL because `queueEnterpriseViDirectionGeneration()` is not connected.

- [ ] **Step 3: Implement the non-blocking queue**

```js
function queueEnterpriseViDirectionGeneration(){
  startEnterpriseViDirectionGeneration(collectEnterpriseIntakeSnapshot());
  setTimeout(()=>{completeEnterpriseViDirectionGeneration();renderEnterpriseCognitionVi();},700);
}
```

Call it without `await` from both profile-confirmation handlers. Preserve the existing diagnosis navigation and automatic basic-diagnosis behavior.

- [ ] **Step 4: Add failure preservation**

If the timer callback encounters an invalid state, call `failEnterpriseViGeneration('directions','方向生成未完成')`; do not clear confirmed preferences or an existing active VI.

- [ ] **Step 5: Run and verify GREEN**

Run the same focused command. Expected: PASS and no test waits for the asynchronous VI task before asserting diagnosis navigation.

- [ ] **Step 6: Commit the trigger**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/enterprise-cognition-vi-v1.test.mjs
git commit -m "feat: queue VI directions after enterprise intake"
```

---

### Task 5: Gate marketing generation on the active VI version

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Test: `prototype/tests/marketing-material-generation.test.mjs`

- [ ] **Step 1: Add failing context-boundary tests**

Assert `buildPosterGenerationContext()` uses `getActiveEnterpriseVi()` and never reads `enterpriseViState.draft` directly. With a draft-only state, assert the returned context contains `vi.status:'system_default'`; after activation, assert it contains `vi.status:'active'` and the active `version`.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/marketing-material-generation.test.mjs
```

Expected: the new active-VI assertions FAIL.

- [ ] **Step 3: Add the governed VI context helper**

```js
function buildActiveEnterpriseViContext(){
  const active=getActiveEnterpriseVi();
  return active
    ? {status:'active',version:active.version,colors:active.colors,font:active.font,imageStyle:active.imageStyle,tone:active.tone}
    : {status:'system_default',version:null,notice:'未启用企业 VI'};
}
```

Inject this object into `buildPosterGenerationContext()` and the shared content-factory payload. Do not change publishing, price-review or compliance boundaries.

- [ ] **Step 4: Make fallback status visible**

Update the generation knowledge notice and preview source note to show either `企业 VI vN 已读取` or `未启用企业 VI · 使用系统默认视觉`. Do not label a draft as active.

- [ ] **Step 5: Run and verify GREEN**

Run the same focused command. Expected: active-VI tests PASS; unrelated legacy marketing-material expectations may remain separately reported if they do not describe the current simplified workflow.

- [ ] **Step 6: Commit the integration**

```bash
git add prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/marketing-material-generation.test.mjs
git commit -m "feat: gate content generation on active enterprise VI"
```

---

### Task 6: Add browser interaction and responsive acceptance

**Files:**
- Create: `prototype/scripts/capture-enterprise-cognition-vi.mjs`
- Create: `validation/enterprise-cognition-vi/`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`

- [ ] **Step 1: Build the CDP acceptance script**

Navigate to `http://127.0.0.1:8010/index.html`, clear `aiHuokeEnterpriseViStateV1`, bypass the prototype login, open `showKbTab('cognition')`, and exercise these transitions:

```js
queueEnterpriseViDirectionGeneration();
completeEnterpriseViDirectionGeneration();
selectEnterpriseViDirection(enterpriseViState.directions[0].id);
generateEnterpriseViDraft();
completeEnterpriseViDraftGeneration();
const before=getActiveEnterpriseVi();
activateEnterpriseViDraft(enterpriseViState.draft.id,'验收员');
const after=getActiveEnterpriseVi();
```

Record that `directions.length===3`, `before===null`, `after.status==='active'`, and `buildPosterGenerationContext().vi.version===after.version`.

- [ ] **Step 2: Capture all meaningful states**

Capture `directions-ready`, `draft-review`, `active-version`, and `generation-failed` at 1440×900 and 390×844. Scroll the active area into view on mobile before capture.

- [ ] **Step 3: Add layout and runtime audits**

For every state assert:

- one and only one top-level enterprise-brain panel is active;
- `scrollWidth <= clientWidth + 2`;
- no empty required VI host;
- no `Runtime.exceptionThrown` or console error;
- the knowledge data tab strip is hidden while cognition is active.

- [ ] **Step 4: Run focused and full automated checks**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/enterprise-brain-evolution-v1.test.mjs
node --test prototype/tests/*.test.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-enterprise-cognition-vi.mjs
```

Expected: all VI and enterprise-brain focused tests PASS. Record the exact full-suite pass/fail count; do not describe unrelated existing failures as fixed.

- [ ] **Step 5: Verify served source identity**

```bash
curl -s http://127.0.0.1:8010/index.html -o /private/tmp/ai-huoke-served-index.html
shasum -a 256 prototype/index.html /private/tmp/ai-huoke-served-index.html
```

Expected: both SHA-256 hashes match.

- [ ] **Step 6: Run desktop and mobile browser acceptance**

```bash
node prototype/scripts/capture-enterprise-cognition-vi.mjs --port 9228 --width 1440 --height 900 --out-dir validation/enterprise-cognition-vi
node prototype/scripts/capture-enterprise-cognition-vi.mjs --port 9228 --width 390 --height 844 --out-dir validation/enterprise-cognition-vi
```

Expected: both commands exit 0 and write screenshots plus audit JSON with empty console/runtime error arrays.

- [ ] **Step 7: Inspect representative screenshots**

Open at least `active-version-1440x900.png`, `directions-ready-390x844.png`, and `generation-failed-390x844.png`. Confirm direction differentiation, readable VI sections, 44px touch targets, no clipped actions and no diagnosis/source-tab leakage.

- [ ] **Step 8: Commit the acceptance assets**

```bash
git add prototype/scripts/capture-enterprise-cognition-vi.mjs prototype/tests/enterprise-cognition-vi-v1.test.mjs validation/enterprise-cognition-vi
git commit -m "test: validate enterprise cognition VI workflow"
```

---

## Final acceptance checklist

- [ ] 引导页信息结构未改变。
- [ ] 引导完成后 VI 方向异步生成，基础诊断仍立即开始。
- [ ] 企业偏好显示来源和 AI/人工确认状态。
- [ ] 三套方向在色彩、字体、图片风格、场景和预览上可识别。
- [ ] 未选方向时无法生成完整 VI。
- [ ] 未确认 VI 不进入内容工厂上下文。
- [ ] 确认后各内容模块读取同一已启用 VI 版本。
- [ ] 新草案不覆盖旧正式版本，历史版本和审计保留。
- [ ] 生成失败可重试，不清空上一阶段或已启用 VI。
- [ ] 页面明确标记真实 AI/Logo/版权服务为待接入能力。
- [ ] 1440×900 和 390×844 真实浏览器验收通过。
