# Dynamic Acquisition and Operations Intake Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic acquisition metrics in enterprise intake step 3 with an easy-to-answer common status form, seven business-mode-specific status groups, optional numeric details, and one improvement priority.

**Architecture:** Reuse the business-mode checkbox state already owned by step 2. Step 3 renders one common section plus independent `data-acquisition-mode-section` cards whose visibility is synchronized from `selectedBusinessModes()`; hidden cards retain their values. Completion calculation includes only common controls, the improvement priority, and controls inside currently visible mode cards.

**Tech Stack:** Single-file HTML/CSS/vanilla JavaScript prototype, Node.js built-in test runner, Chrome DevTools Protocol capture script.

---

## File responsibility map

- Modify `prototype/index.html`: step 3 markup, responsive styling, mode synchronization, mutually exclusive “not sure” choices, and completion calculation.
- Modify `prototype/tests/enterprise-diagnosis-v1.test.mjs`: static contract tests for common fields, seven dynamic groups, optional numeric details, and removal of the old generic metrics.
- Modify `prototype/scripts/capture-v1-prototype.mjs`: real-browser interaction and layout audit for common status, online/offline dynamic cards, value preservation, and mobile overflow.
- Read-only validation output `validation/v1-prototype/`: desktop and mobile screenshots plus JSON audits.

The worktree already contains broad user changes in `prototype/index.html`, while `prototype/tests/` and `prototype/scripts/` are untracked as a group. Implementation files must not be committed wholesale; only this plan document is committed independently.

---

### Task 1: Lock the step 3 form contract with failing tests

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Add a failing test for the common status fields**

Assert these IDs exist:

```js
for (const id of [
  'intakeAcquisitionSources',
  'intakeBusinessStability',
  'intakeLeadOwner',
  'intakeImprovementPriority'
]) assert.match(html, new RegExp(`id="${id}"`));
```

Also assert that `intakeMonthlyLeads`, `intakeConversionRate`, and `intakeRevenueModel` no longer exist inside `enterpriseIntakeOperations`.

- [ ] **Step 2: Add a failing test for seven dynamic mode cards**

Assert one card exists for each value:

```js
for (const mode of [
  'online-retail', 'offline-store', 'wholesale', 'project-sales',
  'professional-service', 'subscription', 'custom-production'
]) assert.match(html, new RegExp(`data-acquisition-mode-section="${mode}"`));
```

Assert the online and offline cards contain both plain-language state controls and optional numeric-detail containers.

- [ ] **Step 3: Add a failing interaction-contract test**

Assert the source contains:

```js
function syncAcquisitionModeSections()
function syncExclusiveUncertainChoice(input)
```

Assert hidden acquisition cards are excluded from the completion denominator and that mode values are not cleared when a card is hidden.

- [ ] **Step 4: Run the focused test and verify RED**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: the new tests fail because the common status IDs and `data-acquisition-mode-section` cards are missing.

---

### Task 2: Implement common acquisition status and seven dynamic cards

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Replace the four generic selects in step 3**

Remove the existing controls for `intakeAcquisitionChannels`, `intakeMonthlyLeads`, `intakeConversionRate`, and `intakeRevenueModel`.

Add:

- `intakeAcquisitionSources`: checkbox chips with common sources and an exclusive “说不清楚”.
- `intakeBusinessStability`: radio-card group.
- `intakeLeadOwner`: radio-card group.
- `intakeImprovementPriority`: one radio-card group after all mode cards.

All controls remain optional and use native checkbox/radio inputs.

- [ ] **Step 2: Add the seven mode cards**

Each card uses `data-acquisition-mode-section="<mode>"` and starts hidden. Implement the exact state and optional numeric fields defined in `docs/superpowers/specs/2026-08-11-dynamic-acquisition-operations-intake-design.md`.

Use these optional-detail container IDs:

```text
intakeOnlineMetrics
intakeOfflineMetrics
intakeWholesaleMetrics
intakeProjectMetrics
intakeServiceMetrics
intakeSubscriptionMetrics
intakeCustomMetrics
```

Use native `<details>` elements so numeric sections are collapsed by default without additional JavaScript state.

- [ ] **Step 3: Add synchronized visibility without data loss**

Implement:

```js
function syncAcquisitionModeSections(){
  const active=selectedBusinessModes();
  $$('[data-acquisition-mode-section]').forEach(section=>{
    section.hidden=!active.has(section.dataset.acquisitionModeSection);
  });
  $('#acquisitionModeEmpty').hidden=active.size>0;
  updateEnterpriseIntakeCompletion();
}
```

Call this from `syncBusinessModeSections()` so step 2 changes immediately affect step 3. Do not reset inputs inside hidden cards.

- [ ] **Step 4: Enforce exclusive uncertain choices**

Add `data-exclusive-uncertain` to each multi-select group and `value="uncertain"` to its uncertain checkbox. On change:

- selecting `uncertain` unchecks all sibling choices;
- selecting any concrete choice unchecks `uncertain`;
- completion is recalculated.

- [ ] **Step 5: Update completion calculation**

Replace old step 3 IDs in `ENTERPRISE_INTAKE_FIELD_IDS` with the common status field keys. Include controls inside visible `data-acquisition-mode-section` cards and exclude hidden cards. Count each radio/checkbox group as one conceptual field instead of counting every option as a separate requirement.

- [ ] **Step 6: Add responsive styles**

Desktop:

- common choices wrap as chips;
- mode state cards use up to three columns;
- optional numeric fields use two columns.

At `max-width:700px`:

- all mode state and numeric fields become one column;
- chips wrap without forcing page width;
- `<details>` summaries and choices retain touch-friendly height.

- [ ] **Step 7: Run the focused and full suites**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
node --test prototype/tests/*.test.mjs
```

Expected: all focused tests and the full current suite pass.

---

### Task 3: Extend real-browser acceptance coverage

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Read: `validation/v1-prototype/layout-audit-1440x900.json`
- Read: `validation/v1-prototype/layout-audit-390x844.json`

- [ ] **Step 1: Fill the common status controls in the browser flow**

After entering step 3, select:

- platform natural traffic and customer referral;
- “有客户，但时好时坏”;
- “客服 / 导购”;
- “提高下单或签约成交”.

- [ ] **Step 2: Verify mode inheritance and value preservation**

With online retail and offline store already selected in step 2:

- verify exactly those two acquisition cards are visible;
- fill one online state and one offline state;
- fill one optional number in each card;
- uncheck offline store in step 2, verify its acquisition card hides;
- recheck offline store, verify its values return.

- [ ] **Step 3: Capture the redesigned step**

Add `new-user-acquisition-dynamic-modes` for both 1440×900 and 390×844. Include audit values for visible modes, preserved values, uncertain-choice exclusivity, and selected improvement priority.

- [ ] **Step 4: Run desktop and mobile capture**

Run:

```bash
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --width 1440 --height 900 --out-dir validation/v1-prototype
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --width 390 --height 844 --out-dir validation/v1-prototype
```

Expected: both commands print `V1 prototype capture PASS`; audit JSON contains no console errors, uncaught errors, horizontal overflow, duplicate visible pages, or outside elements.

---

### Task 4: Final verification and handoff

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Verify: `prototype/scripts/capture-v1-prototype.mjs`
- Verify: `validation/v1-prototype/`

- [ ] **Step 1: Run final automated checks**

```bash
node --test prototype/tests/*.test.mjs
node --check prototype/scripts/capture-v1-prototype.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
```

Expected: all tests pass, the capture script parses, and the three implementation files have no whitespace errors.

- [ ] **Step 2: Inspect key screenshots**

Open the desktop and mobile `new-user-acquisition-dynamic-modes` PNG files. Confirm visual hierarchy, readable labels, full-width mobile controls, and no clipped content.

- [ ] **Step 3: Report without absorbing unrelated worktree changes**

Report the implemented fields, automated test count, desktop/mobile capture result, remaining prototype-only integration boundaries, and the pre-existing dirty-worktree constraint. Do not commit the implementation files wholesale.
