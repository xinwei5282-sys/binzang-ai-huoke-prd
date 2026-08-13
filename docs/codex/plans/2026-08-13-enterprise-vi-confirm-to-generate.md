# Enterprise VI Confirm-to-Generate Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both enterprise VI direction confirmation actions immediately start the complete VI draft generation while preserving the separate formal activation gate.

**Architecture:** Add one orchestration function that selects the direction, derives scene recommendations, marks the scene plan confirmed, and starts the existing asynchronous VI draft flow. Both card and preview actions call this function, so their behavior and idempotency stay aligned; existing draft completion, retry, activation, and active-VI consumers remain unchanged.

**Tech Stack:** Static HTML/CSS/JavaScript prototype, Node.js built-in test runner, Markdown PRD.

---

## File responsibility map

- Modify `prototype/tests/enterprise-cognition-vi-v1.test.mjs`: define the new confirmation-to-generation contract before implementation.
- Modify `prototype/index.html`: add the shared confirmation orchestration and route both direction actions through it; simplify the scene section to generation context instead of a blocking confirmation step.
- Modify `prd/pages/企业大脑-企业VI.md`: align flow, field behavior, status machine, failure behavior, and acceptance criteria.

### Task 1: Lock the interaction contract with tests

**Files:**
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`

- [x] **Step 1: Write the failing test**

Add assertions that `confirmEnterpriseViDirectionAndGenerate(directionId, snapshot)`:

```js
const started = vi.confirmEnterpriseViDirectionAndGenerate('vi-direction-a', snapshot);
assert.equal(started.status, 'generating_vi');
assert.equal(started.selectedDirectionId, 'vi-direction-a');
assert.equal(started.scenePlanConfirmed, true);
assert.ok(started.draft);
```

Also assert that both click actions invoke the shared function and that the active VI is unchanged until `activateEnterpriseViDraft()`.

- [x] **Step 2: Run the test and verify it fails**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL because the orchestration function and new action contract do not exist.

### Task 2: Implement confirmation-to-generation

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`

- [x] **Step 1: Add the orchestration function**

Implement:

```js
function confirmEnterpriseViDirectionAndGenerate(directionId, snapshot = {}) {
  prepareEnterpriseViSceneRecommendations(directionId, snapshot);
  enterpriseViState.scenePlanConfirmed = true;
  const runningDraft = enterpriseViState.draft?.status === 'generating_vi';
  if (!runningDraft) generateEnterpriseViDraft();
  saveEnterpriseViState();
  return enterpriseViState;
}
```

The implementation must reuse a running draft for the same direction and must not activate it.

- [x] **Step 2: Route both actions through the shared function**

Replace the card and preview handlers with calls to `confirmEnterpriseViDirectionAndGenerate`, render the VI page, close the drawer when applicable, scroll to `#enterpriseViDraft`, schedule the existing `completeEnterpriseViDraftGeneration()` demo completion, and show:

```text
已确认该 VI 方向与 Logo，完整 VI 正在生成
```

- [x] **Step 3: Remove the blocking scene confirmation action**

Render recommended scenes as generation context after direction confirmation. Remove the `confirm-enterprise-vi-scene-plan` button from this route; preserve scene evidence and selection display.

- [x] **Step 4: Run the focused test**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS.

### Task 3: Align the field-level PRD

**Files:**
- Modify: `prd/pages/企业大脑-企业VI.md`

- [x] **Step 1: Update workflow and rules**

State that confirming a direction immediately derives recommended scenes and creates an idempotent `generating_vi` task; remove the separate pre-generation scene confirmation.

- [x] **Step 2: Update fields and state machine**

Replace “选择该方向” with “确认此方向与 Logo”; document its immediate generation side effect, idempotency key, loading state, failure retention, and separate “确认并启用” gate.

- [x] **Step 3: Update acceptance criteria**

Require both direction entry points to enter generation, prohibit duplicate running tasks, and confirm that downstream materials still use only active VI.

### Task 4: Verify the complete change

**Files:**
- Test: `prototype/tests/*.test.mjs`
- Check: `prototype/index.html`
- Check: `prd/pages/企业大脑-企业VI.md`

- [x] **Step 1: Run format checks**

Run: `git diff --check -- prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs prd/pages/企业大脑-企业VI.md`

Expected: no output and exit code 0.

- [x] **Step 2: Run the full automated suite**

Run: `node --test prototype/tests/*.test.mjs`

Expected: all tests pass.

- [x] **Step 3: Inspect the task-only diff**

Run: `git diff -- prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs prd/pages/企业大脑-企业VI.md`

Expected: only the approved confirmation-to-generation behavior and matching documentation are changed.
