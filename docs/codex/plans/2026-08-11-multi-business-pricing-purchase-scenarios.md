# Multi-Business Pricing and Purchase Scenarios Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single pricing and buying-scenario controls with multi-select business modes that reveal mode-specific pricing, sales-method and purchase-scenario fields while preserving hidden values.

**Architecture:** Extend the existing step-2 DOM in `prototype/index.html` with native checkbox groups and persistent dynamic sections. A small controller reads selected business-mode checkboxes, toggles sections without rebuilding them, and updates completeness from only common fields plus fields belonging to active modes. The existing static tests and CDP browser flow verify the source contract and user-visible behavior.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Chrome DevTools Protocol.

---

## File responsibility map

- Modify `prototype/index.html`: business-mode controls, common transaction fields, dynamic pricing and purchase-scenario groups, visibility and completeness logic.
- Modify `prototype/tests/enterprise-diagnosis-v1.test.mjs`: regression tests for mode coverage, multi-select controls, dynamic sections and persistence functions.
- Modify `prototype/scripts/capture-v1-prototype.mjs`: select online and offline modes, fill independent values, toggle a mode off/on, and capture desktop/mobile evidence.
- Regenerate `validation/v1-prototype/*`: updated screenshots and audit JSON.

### Task 1: Add failing field-model tests

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Test the seven business modes and multi-select contract**

```js
test('business modes support mixed online and offline operations', () => {
  for (const mode of ['online-retail','offline-store','wholesale','project-sales','professional-service','subscription','custom-production']) {
    assert.match(html, new RegExp(`value="${mode}"`));
  }
  assert.ok((html.match(/name="intakeBusinessModes"/g) || []).length >= 7);
});
```

- [ ] **Step 2: Test dynamic pricing and purchase sections**

Assert IDs `intakeTransactionCustomer`, `intakeTransactionMethod`, `intakeOnlinePriceMin`, `intakeOnlinePriceMax`, `intakeOnlineAverageOrder`, `intakeOfflinePriceMin`, `intakeOfflinePriceMax`, `intakeOfflineAverageOrder`, `intakeOnlinePurchaseScenes`, and `intakeOfflinePurchaseScenes`.

- [ ] **Step 3: Test persistent visibility logic**

```js
assert.match(html, /function syncBusinessModeSections\(\)/);
assert.match(html, /section\.hidden=!active\.has\(section\.dataset\.businessModeSection\)/);
assert.doesNotMatch(html, /section\.innerHTML=/);
```

- [ ] **Step 4: Run focused tests and verify RED**

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: FAIL because the seven checkboxes and dynamic section IDs are missing.

### Task 2: Build the form-first dynamic controls

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Replace `intakePricingModel` and `intakeBuyingScenario`**

Add a checkbox group named `intakeBusinessModes` for all seven modes, then add common controls `intakeTransactionCustomer` and `intakeTransactionMethod`.

- [ ] **Step 2: Add online and offline sections with full visible controls**

Online section fields: platform checkboxes, minimum/maximum price, average order value, sales-method checkboxes, purchase-scene checkboxes and custom scene.

Offline section fields: store type, minimum/maximum spend, average store order, sales-method checkboxes, purchase-scene checkboxes and custom scene.

- [ ] **Step 3: Add compact sections for the other five modes**

Each section must contain at least its primary pricing method or range and its purchase-scene checkbox group, using the options in the approved spec. All fields remain optional.

- [ ] **Step 4: Add responsive layout rules**

Use `business-mode-options`, `business-mode-section`, `business-mode-fields`, and `business-scene-options` classes. Desktop sections use two-column fields; mobile collapses to one column with no horizontal scrolling.

- [ ] **Step 5: Run focused tests and verify structural GREEN**

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: new structure tests PASS.

### Task 3: Implement visibility, value preservation and completeness

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Implement selected-mode lookup and section toggling**

```js
function selectedBusinessModes(){
  return new Set($$('input[name="intakeBusinessModes"]:checked').map(input=>input.value));
}
function syncBusinessModeSections(){
  const active=selectedBusinessModes();
  $$('[data-business-mode-section]').forEach(section=>{
    section.hidden=!active.has(section.dataset.businessModeSection);
  });
  updateEnterpriseIntakeCompletion();
}
```

- [ ] **Step 2: Preserve hidden values**

Never clear values in `syncBusinessModeSections`. Checkbox changes only toggle `hidden`; reselecting a mode reveals its previous values.

- [ ] **Step 3: Update completeness inputs**

Keep common field IDs in `ENTERPRISE_INTAKE_FIELD_IDS`. Add `activeEnterpriseIntakeFieldIds()` to include checked business-mode values and fields inside visible mode sections while excluding hidden-mode fields.

- [ ] **Step 4: Bind checkbox and field events**

Call `syncBusinessModeSections` on every `intakeBusinessModes` change. Existing intake input listeners continue to update completeness.

- [ ] **Step 5: Run focused tests and verify GREEN**

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: all focused tests PASS.

### Task 4: Browser acceptance and full regression

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Regenerate: `validation/v1-prototype/*`

- [ ] **Step 1: Exercise mixed retail in the browser**

Select `online-retail` and `offline-store`, assert both sections become visible, enter `39–199 / 89` for online and `20–300 / 110` for offline, and select at least two scenes in each group.

- [ ] **Step 2: Exercise hide and restore**

Uncheck `offline-store`, assert its section is hidden, recheck it, and assert `intakeOfflineAverageOrder === '110'`.

- [ ] **Step 3: Capture evidence**

Add `new-user-business-mixed-modes` screenshots at 1440×900 and 390×844, scrolling the dynamic pricing area into view before capture.

- [ ] **Step 4: Extend audit JSON**

Require `businessModeCount === 7`, `onlineVisible`, `offlineVisible`, `offlineValueRestored`, and no console errors or horizontal overflow.

- [ ] **Step 5: Run full verification**

```bash
node --test prototype/tests/*.test.mjs
node --check prototype/scripts/capture-v1-prototype.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 1440 --height 900
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 390 --height 844
```

Expected: all tests PASS, both captures print `V1 prototype capture PASS`, and audit JSON contains no console errors, overflow or failed mixed-mode assertions.
