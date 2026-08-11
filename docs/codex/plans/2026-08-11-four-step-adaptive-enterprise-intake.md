# Four-Step Adaptive Enterprise Intake Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current two-step enterprise intake with a four-step, form-first adaptive wizard whose optional uploads create asynchronous evidence candidates without overwriting user-entered values.

**Architecture:** Keep the static prototype in `prototype/index.html` and extend its existing onboarding state functions. Four persistent DOM panels hold native form controls so back/next navigation does not discard values; a single step controller updates visibility, progress, completion, and final actions. Existing async task helpers remain the source of truth for uploaded evidence and URL tasks, while tests and the CDP capture script verify structure and real browser behavior.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Chrome DevTools Protocol capture script.

---

## File responsibility map

- Modify `prototype/index.html`: four-step markup, form controls, upload surfaces, adaptive state, completion calculation, navigation and candidate rules.
- Modify `prototype/tests/enterprise-diagnosis-v1.test.mjs`: static regression tests for four steps, fields, optional controls, accepted file types, and no-overwrite behavior.
- Modify `prototype/scripts/capture-v1-prototype.mjs`: real-browser flow for empty completion, manual entry, license recognition, multi-file upload, content source tasks, four-step navigation, return-state preservation and responsive screenshots.
- Regenerate `validation/v1-prototype/*`: desktop and mobile evidence plus layout audit JSON.

### Task 1: Lock the four-step structure with failing tests

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Replace the two-step structure assertion with four-step assertions**

Add expectations for the panel IDs and controller range:

```js
test('enterprise intake uses four optional form steps', () => {
  for (const id of [
    'enterpriseIntakeIdentity',
    'enterpriseIntakeBusiness',
    'enterpriseIntakeOperations',
    'enterpriseIntakeGoals'
  ]) assert.match(html, new RegExp(`id="${id}"`));
  for (const label of ['企业身份', '业务、产品与客户', '获客与经营', '目标、资源与品牌']) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /Math\.max\(1,Math\.min\(4,step\)\)/);
  assert.match(html, /case 'skip-enterprise-intake'/);
});
```

- [ ] **Step 2: Add field mapping and optional-state assertions**

Assert the new field IDs exist, no onboarding field contains `required`, and the final button is enabled:

```js
for (const id of [
  'intakeIndustry', 'intakeBusinessStage', 'intakeMainBusiness',
  'intakeCoreProduct', 'intakePricingModel', 'intakeCoreCustomer',
  'intakeBuyingScenario', 'intakeCustomerPain', 'intakeVerifiedValue',
  'intakeAcquisitionChannels', 'intakeMonthlyLeads', 'intakeConversionRate',
  'intakeRevenueModel', 'intakeAnnualGoal', 'intakeMarketingBudget',
  'intakeTeamSize', 'intakeMainConstraint', 'intakeBrandTone',
  'intakeForbiddenClaims'
]) assert.match(html, new RegExp(`id="${id}"`));
assert.doesNotMatch(html, /data-intake-step="[1-4]"[\s\S]*?\srequired(?:\s|>)/);
```

- [ ] **Step 3: Add candidate and preservation contract assertions**

```js
assert.match(html, /function updateEnterpriseIntakeCompletion\(\)/);
assert.match(html, /function applyEnterpriseIntakeCandidate\(/);
assert.match(html, /if\(target\.value\.trim\(\)\)return/);
assert.match(html, /资料候选 · 待确认/);
```

- [ ] **Step 4: Run the focused test and verify RED**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: FAIL because the four panel IDs, fields and four-step bound are absent.

### Task 2: Build the four persistent form panels

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Replace the step bar with four indicators**

Use the existing `enterprise-intake-steps` component and these labels:

```html
<span class="on" data-intake-step-indicator="1"><i>1</i><b>企业身份</b><small>可选</small></span>
<span data-intake-step-indicator="2"><i>2</i><b>业务、产品与客户</b><small>可选</small></span>
<span data-intake-step-indicator="3"><i>3</i><b>获客与经营</b><small>可选</small></span>
<span data-intake-step-indicator="4"><i>4</i><b>目标、资源与品牌</b><small>可选</small></span>
```

- [ ] **Step 2: Keep step 1 and add industry and stage fields**

Retain the six always-visible license fields and add native controls with IDs `intakeIndustry` and `intakeBusinessStage`. Keep the license upload and local preview unchanged.

- [ ] **Step 3: Create step 2 as a standard form**

Create `#enterpriseIntakeBusiness` with native controls for business, product, pricing, customer, buying scenario, pain, value, advantage and service boundary. Keep `#onboardingMaterialFile` as a multi-file input accepting only `.doc,.docx,.txt,.pdf,.ppt,.pptx` and the corresponding MIME types.

- [ ] **Step 4: Create step 3 with operating fields and content sources**

Create `#enterpriseIntakeOperations` with acquisition channel, monthly leads, conversion rate and revenue model controls. Move the website/public-account source form, async legend and `#onboardingAsyncTasks` into this panel. Add an optional operating-evidence upload button without claiming spreadsheet parsing is connected.

- [ ] **Step 5: Create step 4 with goals, resources and collapsible brand fields**

Create `#enterpriseIntakeGoals`. Put annual goal, budget, team and constraint in the main form. Use a native `<details id="enterpriseIntakeBrandDetails">` for logo status, colors, visual style, image style, tone and forbidden claims.

- [ ] **Step 6: Replace per-step action blocks with one shared footer**

```html
<div class="new-user-guide-actions" id="enterpriseIntakeActions">
  <span class="mini" id="enterpriseIntakeCompletion">信息完整度 0%</span>
  <button class="btn" id="enterpriseIntakePrevBtn" data-act="prev-enterprise-intake" hidden>上一步</button>
  <button class="btn gho" id="enterpriseIntakeSkipBtn" data-act="skip-enterprise-intake">暂时跳过</button>
  <button class="btn pri" id="enterpriseIntakeNextBtn" data-act="next-enterprise-intake">保存并下一步</button>
  <button class="btn pri" id="confirmModalProfileBtn" data-act="confirm-modal-profile" hidden>完成初步设置</button>
</div>
```

- [ ] **Step 7: Add responsive styles**

Change the step bar to four equal columns on desktop and two columns on screens below 700px. Reuse `.license-result-grid` and add one `.intake-form-grid` rule that collapses to one column on mobile. Do not introduce card grids for upload categories.

- [ ] **Step 8: Run the focused test and verify the structural assertions pass**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: the four-step and field structure tests PASS; interaction tests may remain pending until Task 3.

### Task 3: Implement adaptive navigation, completion and evidence candidates

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Expand the step controller to four steps**

Implement the controller without rebuilding form DOM:

```js
function showEnterpriseIntakeStep(step){
  enterpriseIntakeStep=Math.max(1,Math.min(4,step));
  $$('[data-intake-step]').forEach(panel=>panel.hidden=Number(panel.dataset.intakeStep)!==enterpriseIntakeStep);
  $$('[data-intake-step-indicator]').forEach(item=>{
    const index=Number(item.dataset.intakeStepIndicator);
    item.classList.toggle('on',index===enterpriseIntakeStep);
    item.classList.toggle('done',index<enterpriseIntakeStep);
  });
  $('#enterpriseIntakePrevBtn').hidden=enterpriseIntakeStep===1;
  $('#enterpriseIntakeNextBtn').hidden=enterpriseIntakeStep===4;
  $('#confirmModalProfileBtn').hidden=enterpriseIntakeStep!==4;
  updateEnterpriseIntakeCompletion();
}
```

- [ ] **Step 2: Add next, previous and skip actions**

Keep `next-enterprise-intake` and `prev-enterprise-intake`; add:

```js
case 'skip-enterprise-intake':
  showEnterpriseIntakeStep(Math.min(4,enterpriseIntakeStep+1));
  toast('本步已保留为空，可稍后补充','warn');
  break;
```

- [ ] **Step 3: Calculate non-blocking completeness**

Define a stable list of intake field IDs and calculate the percentage from non-empty values. Update `#enterpriseIntakeCompletion` on input and step changes. Never disable navigation or completion because of the percentage.

- [ ] **Step 4: Add non-overwriting candidate application**

```js
function applyEnterpriseIntakeCandidate(targetId,value,source){
  const target=$('#'+targetId);
  if(!target||target.value.trim())return false;
  target.dataset.candidateValue=value;
  target.dataset.candidateSource=source;
  // Render a candidate row; only the explicit adopt action writes target.value.
  return true;
}
```

Add `adopt-enterprise-intake-candidate` and `dismiss-enterprise-intake-candidate` actions. The adopt action writes the candidate, dispatches `input`, and marks the row confirmed.

- [ ] **Step 5: Keep file tasks independent and asynchronous**

Use `queueOnboardingMaterial(file, kind)` once per selected file. Do not await parsing before navigation. Keep failures scoped to their row and preserve existing retry/cancel behavior.

- [ ] **Step 6: Preserve an honest completion result**

On `confirm-modal-profile`, set the profile to confirmed only if at least one diagnostic field has content. Empty completion keeps `brainState.profile === 'draft'`, enters the enterprise profile, and displays `初步设置已完成 · 资料待补充`.

- [ ] **Step 7: Run the focused test and verify GREEN**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: all focused tests PASS with zero failures.

### Task 4: Update the real-browser acceptance flow

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Regenerate: `validation/v1-prototype/*`

- [ ] **Step 1: Capture all four steps**

After login, capture step 1. Upload the synthetic license, modify a returned field, then navigate through and capture:

```text
new-user-login-guide
new-user-license-recognized
new-user-business-step
new-user-operations-step
new-user-goals-step
new-user-async-sources
```

- [ ] **Step 2: Exercise multi-file and candidate behavior**

Assign `公司介绍.docx` and `产品手册.pdf` to `#onboardingMaterialFile` with one `DataTransfer`. Verify two independent task names and confirm the manually edited company field remains unchanged after navigation.

- [ ] **Step 3: Exercise empty completion**

Reset `brainState`, clear all intake fields, skip through steps 1–3, complete step 4, and assert the stored completion flag is `1` while `brainState.profile` remains `draft` and the status contains `资料待补充`.

- [ ] **Step 4: Add four-step audit assertions**

Require all of the following in the JSON audit:

```js
fourStepIndicators === 4
stepBackVisible === true
fieldsStillVisible === true
editedCompany === '识别后手动修改有限公司'
taskCount >= 3
emptyFlow.profileState === 'draft'
```

- [ ] **Step 5: Run desktop capture**

```bash
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 1440 --height 900
```

Expected: `V1 prototype capture PASS`, no console errors, no horizontal overflow, one visible routed page.

- [ ] **Step 6: Run mobile capture**

```bash
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 390 --height 844
```

Expected: `V1 prototype capture PASS`, no console errors, no horizontal overflow, and the form controls remain reachable.

- [ ] **Step 7: Inspect the six key screenshots at both sizes**

Use image inspection on the step 1, license recognized, business, operations, goals and async task screenshots. Confirm hierarchy, labels, field visibility, footer actions and mobile single-column layout.

### Task 5: Full regression and handoff

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Verify: `prototype/scripts/capture-v1-prototype.mjs`
- Verify: `validation/v1-prototype/*`

- [ ] **Step 1: Run the complete test suite**

```bash
node --test prototype/tests/*.test.mjs
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Check syntax and whitespace**

```bash
node --check prototype/scripts/capture-v1-prototype.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
```

Expected: both commands exit 0 with no output from `git diff --check`.

- [ ] **Step 3: Review the scoped diff without overwriting unrelated changes**

```bash
git diff -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
git status --short
```

Confirm only in-scope hunks are described in the handoff. Do not commit the dirty prototype files wholesale unless the user explicitly requests it.

- [ ] **Step 4: Report evidence and remaining boundary**

Report changed behavior, exact test count, desktop/mobile browser results, the local HTTP URL, and that OCR/document/website/public-account processing remains an explicitly simulated integration boundary.
