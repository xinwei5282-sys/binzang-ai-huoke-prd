# Goals, Resources and Brand Intake Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace enterprise intake step 4 with the approved goal-first, resource-aware and collapsed-brand form while preserving optional completion, asynchronous uploads and legacy values.

**Architecture:** Keep the existing single-file HTML/CSS/vanilla JavaScript prototype. Step 4 will use native radio, checkbox, select, textarea and details controls; small synchronization functions will manage the step-3 recommendation, budget period, mutual exclusion, brand-tone limit, draft persistence and conceptual completion counting. Static Node tests lock the source contract, while the existing Chrome DevTools Protocol capture flow verifies interactions, migration and desktop/mobile layout.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, browser localStorage, Node.js built-in test runner, Chrome DevTools Protocol capture script.

---

## File responsibility map

- Modify `prototype/index.html`: step 4 markup, responsive styling, goal recommendation, budget switching, resource and brand interaction rules, draft persistence, legacy migration and completion calculation.
- Modify `prototype/tests/enterprise-diagnosis-v1.test.mjs`: static contract tests for the approved fields, removed visual questions, optional behavior and interaction functions.
- Modify `prototype/scripts/capture-v1-prototype.mjs`: real-browser assertions for recommendation, budget switching, mutual exclusion, brand folding, multi-file asynchronous upload, persistence and legacy migration.
- Read-only validation output `validation/v1-prototype/`: updated desktop/mobile screenshots and JSON layout audits.

The worktree already contains broad user changes in `prototype/index.html`; `prototype/tests/` and `prototype/scripts/` are also untracked as groups. Implementation files must not be committed wholesale. Use test and browser checkpoints during execution, and only commit a task when its exact diff can be isolated without absorbing pre-existing user work.

---

### Task 1: Lock the new step 4 source contract with failing tests

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Replace the old step 4 field assertion**

Assert the approved goal and resource controls exist:

```js
for (const id of [
  'intakeGoalDirection', 'intakeGoalHorizon', 'intakeGoalResult',
  'intakeBudgetPeriod', 'intakeBudgetMonthlyRange', 'intakeBudgetAnnualRange',
  'intakeExecutionOwner', 'intakeWeeklyTime', 'intakeExecutionTeamSize',
  'intakeCapabilities', 'intakeExecutionConstraint'
]) assert.match(goals, new RegExp(`id="${id}"`));
```

Require six `name="intakeGoalDirection"` options, four `name="intakeGoalHorizon"` options and seven `name="intakeCapabilities"` options.

- [ ] **Step 2: Assert the brand form is reduced to business-readable fields**

Require:

```js
for (const id of [
  'enterpriseIntakeBrandDetails', 'intakeLogoStatus',
  'intakeBrandToneGroup', 'intakeForbiddenClaims', 'onboardingBrandFile'
]) assert.match(goals, new RegExp(`id="${id}"`));
```

Inside `enterpriseIntakeGoals`, assert the old manual visual controls are absent:

```js
for (const id of ['intakePrimaryColor','intakeVisualStyle','intakeImageStyle']) {
  assert.doesNotMatch(goals, new RegExp(`id="${id}"`));
}
```

Also assert the text explains that AI will infer brand color and visual style from materials and ask the enterprise to confirm later.

- [ ] **Step 3: Assert optional and asynchronous behavior contracts**

Require the step to state that all fields are optional and the completion button remains available. Assert `onboardingBrandFile` is `multiple`, supports the current document/image formats, and is still bound through `bindOnboardingEvidenceInput`.

- [ ] **Step 4: Assert required controller and migration functions**

Require these source functions:

```js
function syncGoalRecommendation()
function syncBudgetPeriod()
function syncCapabilityChoice(input)
function syncBrandToneChoice(input)
function saveEnterpriseIntakeDraft()
function restoreEnterpriseIntakeDraft()
function migrateEnterpriseIntakeDraft(raw)
```

Assert the new key `aiHuokeEnterpriseIntakeDraftV2` exists and that the migration source maps `annualGoal` only to `intakeGoalResult`, never to a goal radio or time horizon.

- [ ] **Step 5: Run the focused test and verify RED**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: the newly added tests fail because the new step 4 IDs and controller functions do not yet exist.

---

### Task 2: Build the goal-first and resource-aware form

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Add step 4 card styling**

Add reusable classes near the existing intake styles:

```css
.goal-resource-stack{display:grid;gap:12px}
.goal-resource-card{border:1px solid var(--line);border-radius:9px;background:var(--surface);padding:15px}
.goal-resource-card-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}
.goal-resource-index{width:28px;height:28px;border-radius:7px;background:var(--brand-sft);color:var(--brand-d);display:grid;place-items:center;font:600 11px Sora;flex:none}
.goal-resource-options{display:flex;flex-wrap:wrap;gap:7px}
.goal-resource-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 12px}
.goal-recommendation{padding:8px 10px;border:1px solid var(--warn);border-radius:7px;background:var(--warn-sft);font-size:11px}
.brand-inference-note{padding:9px 11px;border-radius:7px;background:var(--brand-sft);color:var(--brand-d);font-size:11px;line-height:1.55}
```

At `max-width:700px`, make `.goal-resource-grid` one column and keep all option labels wrapping within the modal width.

- [ ] **Step 2: Replace the old goal fields**

Create `#intakeGoalDirection` as a `data-intake-concept` radio group with values:

```text
awareness, inquiry, conversion, repeat, trust, efficiency
```

Create `#intakeGoalHorizon` as a `data-intake-concept` radio group with values:

```text
3-months, 6-months, 12-months, uncertain
```

Add optional textarea `#intakeGoalResult` with examples for orders, store visits and project sales cycle. Add `#intakeGoalRecommendation`, initially hidden, above the direction choices.

- [ ] **Step 3: Replace the old budget, team and constraint fields**

Add:

- `#intakeBudgetPeriod`: blank, `monthly`, `annual`, `uncertain`.
- `#intakeBudgetMonthlyRange`: the five approved monthly ranges plus uncertain.
- `#intakeBudgetAnnualRange`: the five approved annual ranges plus uncertain.
- `#intakeExecutionOwner`: the eight approved owner choices.
- `#intakeWeeklyTime`: less than 3, 3–5, 5–10, more than 10 hours, uncertain.
- `#intakeExecutionTeamSize`: 1, 2–3, 4–10, more than 10, uncertain.
- `#intakeCapabilities`: seven native checkbox choices.
- `#intakeExecutionConstraint`: optional free-text execution difficulty.

Both budget-range selects start hidden until their period is selected. Choosing `uncertain` shows neither range.

- [ ] **Step 4: Replace the brand details content**

Keep `#enterpriseIntakeBrandDetails` as a closed `<details>` element. Inside it:

- retain `#intakeLogoStatus` with `existing`, `none`, `needs-design`, `uncertain`;
- replace the brand-tone select with checkbox group `#intakeBrandToneGroup`, name `intakeBrandTone`, containing the six approved tones plus uncertain;
- retain `#intakeForbiddenClaims` with compliance-focused helper text;
- retain `#onboardingBrandFile` as a multiple asynchronous upload;
- add `.brand-inference-note` stating that main color, visual style and image style are inferred from Logo, website, WeChat and historical materials, then confirmed later.

Remove `#intakePrimaryColor`, `#intakeVisualStyle` and `#intakeImageStyle` from this step only. Do not remove brand visual fields from unrelated brand-planning pages.

- [ ] **Step 5: Run focused structural tests and verify GREEN for markup**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: the markup and removed-field assertions pass; controller assertions may remain RED until Task 3.

---

### Task 3: Implement synchronization, mutual exclusion and conceptual completion

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Implement a non-confirming recommendation from step 3**

Use this mapping:

```js
const INTAKE_GOAL_RECOMMENDATIONS={
  awareness:'awareness', inquiry:'inquiry', conversion:'conversion',
  repeat:'repeat', cost:'efficiency', cycle:'efficiency'
};
```

`syncGoalRecommendation()` reads `input[name="intakeImprovementPriority"]:checked`, adds a `recommended` class and “根据上一步推荐” badge to the matching direction label, and updates `#intakeGoalRecommendation`. It must not assign `.checked=true` and must return without changing an already selected step 4 goal.

- [ ] **Step 2: Implement budget period switching**

```js
function syncBudgetPeriod(){
  const period=$('#intakeBudgetPeriod')?.value||'';
  $('#intakeBudgetMonthlyRange').hidden=period!=='monthly';
  $('#intakeBudgetAnnualRange').hidden=period!=='annual';
  updateEnterpriseIntakeCompletion();
}
```

Changing the period hides but does not clear the inactive range so a user can switch back without losing the previous selection. Only the active range participates in completion and the draft summary.

- [ ] **Step 3: Enforce capability exclusivity**

Implement `syncCapabilityChoice(input)` for `input[name="intakeCapabilities"]`:

- selecting `none` clears every concrete capability;
- selecting a concrete capability clears `none`;
- values are preserved only for choices that remain checked;
- completion and draft state update after synchronization.

- [ ] **Step 4: Enforce the brand-tone limit and uncertain exclusivity**

Implement `syncBrandToneChoice(input)`:

- selecting `uncertain` clears all concrete tones;
- selecting a concrete tone clears `uncertain`;
- if a third concrete tone is selected, immediately uncheck that third choice and show `最多选择 2 项` through the existing toast mechanism;
- the two previously selected tones remain unchanged.

- [ ] **Step 5: Update conceptual completion**

Replace old step 4 IDs in `ENTERPRISE_INTAKE_FIELD_IDS` with:

```js
'intakeGoalResult','intakeBudgetPeriod','intakeBudgetMonthlyRange',
'intakeBudgetAnnualRange','intakeExecutionOwner','intakeWeeklyTime',
'intakeExecutionTeamSize','intakeExecutionConstraint','intakeLogoStatus',
'intakeForbiddenClaims'
```

Goal direction, horizon, capabilities and tone use `data-intake-concept` and count once per group. Add `activeEnterpriseIntakeFieldIds()` so:

- inactive budget ranges are excluded;
- empty controls inside a closed brand `<details>` are excluded;
- once any brand value exists, filled brand controls still contribute after the section is collapsed;
- asynchronous task state never enters the denominator;
- an entirely empty step still leaves the completion button enabled.

- [ ] **Step 6: Bind controller events**

Bind:

```js
$('#intakeBudgetPeriod')?.addEventListener('change',syncBudgetPeriod);
$$('input[name="intakeCapabilities"]').forEach(input=>input.addEventListener('change',()=>syncCapabilityChoice(input)));
$$('input[name="intakeBrandTone"]').forEach(input=>input.addEventListener('change',()=>syncBrandToneChoice(input)));
$$('input[name="intakeImprovementPriority"]').forEach(input=>input.addEventListener('change',syncGoalRecommendation));
```

Call `syncGoalRecommendation()` when entering step 4 and call `syncBudgetPeriod()` once during initialization.

- [ ] **Step 7: Run focused tests**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: all focused static contract tests pass.

---

### Task 4: Persist the form and migrate legacy step 4 data without silent assumptions

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Browser test: `prototype/scripts/capture-v1-prototype.mjs`

- [ ] **Step 1: Define versioned draft keys and serializable scope**

Add:

```js
const ENTERPRISE_INTAKE_DRAFT_KEY='aiHuokeEnterpriseIntakeDraftV2';
const ENTERPRISE_INTAKE_LEGACY_DRAFT_KEY='aiHuokeEnterpriseIntakeDraftV1';
```

Serialize non-file input, select and textarea values under `[data-intake-step]`, plus checkbox/radio checked state and `enterpriseIntakeBrandDetails.open`. Do not serialize `File` objects, object URLs or asynchronous timer handles.

- [ ] **Step 2: Implement legacy migration**

`migrateEnterpriseIntakeDraft(raw)` returns a V2 object using these exact rules:

```js
if(raw.annualGoal) values.intakeGoalResult=raw.annualGoal;
if(raw.mainConstraint) values.intakeExecutionConstraint=raw.mainConstraint;
if(raw.logoStatus) values.intakeLogoStatus=raw.logoStatus;
if(raw.forbiddenClaims) values.intakeForbiddenClaims=raw.forbiddenClaims;
```

Map the legacy team labels to the nearest new execution-team range as a `pendingValues.intakeExecutionTeamSize` candidate, not a confirmed value. Store the old budget as `pendingLegacyBudget` with `needsPeriodConfirmation:true`; do not set monthly or annual period. Store legacy primary color, visual style and image style under `brandVisualCandidates` so they are retained outside the initial form. Convert a recognized single legacy tone to an unconfirmed `pendingBrandTones` candidate.

- [ ] **Step 3: Implement save and restore**

`saveEnterpriseIntakeDraft()` writes V2 JSON after field changes and the brand `<details>` toggle. `restoreEnterpriseIntakeDraft()`:

1. reads V2 if present;
2. otherwise reads V1 and calls `migrateEnterpriseIntakeDraft`;
3. restores only controls that still exist;
4. never overwrites a non-empty current DOM value;
5. renders legacy budget/team/tone as `资料候选 · 待确认` rows;
6. restores the brand open state;
7. runs all synchronization and completion functions.

Malformed JSON must be ignored without throwing or blocking onboarding.

- [ ] **Step 4: Bind autosave after synchronization**

Extend the existing intake `input` listener to call `saveEnterpriseIntakeDraft()` after synchronization. Add a `change` listener for select, checkbox and radio controls, plus a `toggle` listener for `#enterpriseIntakeBrandDetails`. Avoid recursive saves during restore with an `isRestoringEnterpriseIntakeDraft` guard.

- [ ] **Step 5: Ensure asynchronous upload remains non-blocking**

Keep `bindOnboardingEvidenceInput('onboardingBrandFile','目标、资源与品牌资料')`. Files should continue to create independent task rows through `queueOnboardingMaterial`; the input resets after queuing and neither parsing nor failure disables `#confirmModalProfileBtn`.

- [ ] **Step 6: Run focused and full automated suites**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
node --test prototype/tests/*.test.mjs
```

Expected: the focused file and all current prototype tests pass.

---

### Task 5: Extend real-browser acceptance and capture evidence

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Read: `validation/v1-prototype/layout-audit-1440x900.json`
- Read: `validation/v1-prototype/layout-audit-390x844.json`

- [ ] **Step 1: Reset the new draft keys at the start of each capture**

Remove `aiHuokeEnterpriseIntakeDraftV1` and `aiHuokeEnterpriseIntakeDraftV2` alongside the current onboarding completion keys so desktop and mobile runs are deterministic.

- [ ] **Step 2: Verify recommendation does not auto-confirm**

After step 3 selects `intakeImprovementPriority=conversion`, enter step 4 and assert:

- the “提高成交” label is marked recommended;
- no `intakeGoalDirection` radio is checked;
- selecting `trust` keeps `trust` selected when step 3 synchronization runs again.

- [ ] **Step 3: Exercise budget, resources and mutual exclusion**

In the browser flow:

- select monthly budget and `5,000–10,000 元`;
- switch to annual, choose `50,000–100,000 元`, switch back and verify the monthly value is preserved;
- fill owner, weekly time and execution team size;
- select two concrete capabilities, then `none`, verify only `none` remains; select one concrete capability and verify `none` clears;
- select two brand tones, attempt a third and verify the first two remain;
- select `uncertain` and verify concrete tones clear.

- [ ] **Step 4: Verify brand folding and asynchronous multi-file upload**

Open `#enterpriseIntakeBrandDetails`, fill Logo status and forbidden claims, collapse and reopen it, and verify values remain. Upload two files through `#onboardingBrandFile`; assert two independent asynchronous task rows are created and `#confirmModalProfileBtn` remains enabled while tasks are not terminal.

- [ ] **Step 5: Verify V2 persistence and V1 migration**

Call `saveEnterpriseIntakeDraft()`, clear the relevant DOM values, call `restoreEnterpriseIntakeDraft()`, and assert the confirmed goal/resource/brand values return.

Then clear V2, store a V1 fixture containing `annualGoal`, `marketingBudget`, `teamSize`, `mainConstraint`, `primaryColor`, `visualStyle`, `imageStyle`, `brandTone` and `forbiddenClaims`. Run restore and assert:

- annual goal returns only in `#intakeGoalResult`;
- no goal direction or horizon becomes selected;
- budget period remains blank and a pending legacy budget candidate is visible;
- team and tone are pending candidates rather than silently confirmed;
- visual legacy values exist in the migrated candidate data, not as visible manual fields.

Clear both draft keys after this audit so the rest of the capture flow remains stable.

- [ ] **Step 6: Capture the redesigned step**

Update `new-user-goals-step` at 1440×900 and 390×844 after representative goal and resource values are filled. Add `goalsResourcesBrandAudit` to the layout JSON with recommendation, selected goal, budget preservation, capability exclusivity, tone limit, brand value preservation, asynchronous task count, persistence and legacy migration results.

- [ ] **Step 7: Run desktop and mobile capture**

Run:

```bash
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --width 1440 --height 900 --out-dir validation/v1-prototype
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --width 390 --height 844 --out-dir validation/v1-prototype
```

Expected: both commands print `V1 prototype capture PASS`; audits show no console errors, uncaught errors, horizontal overflow, duplicate visible pages or outside elements, and every `goalsResourcesBrandAudit` assertion passes.

---

### Task 6: Final regression, visual inspection and handoff

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Verify: `prototype/scripts/capture-v1-prototype.mjs`
- Verify: `validation/v1-prototype/new-user-goals-step-1440x900.png`
- Verify: `validation/v1-prototype/new-user-goals-step-390x844.png`

- [ ] **Step 1: Run final automated checks**

```bash
node --test prototype/tests/*.test.mjs
node --check prototype/scripts/capture-v1-prototype.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
```

Expected: all tests pass, the capture script parses and the implementation files have no whitespace errors.

- [ ] **Step 2: Inspect the two real-browser screenshots**

Open the desktop and mobile `new-user-goals-step` images. Confirm:

- the reading order is goal, resources, then collapsed brand;
- desktop resource fields use at most two columns;
- mobile fields are one column and touch targets remain readable;
- recommendation is visibly different from a confirmed choice;
- the completion action remains visible and enabled;
- no content is clipped or horizontally scrollable.

- [ ] **Step 3: Report without absorbing unrelated worktree changes**

Report the implemented fields, automated test count, desktop/mobile capture results, persistence and migration evidence, asynchronous prototype boundary and the pre-existing dirty-worktree constraint. Do not describe OCR, document parsing, website collection or WeChat collection as connected production services.
