# AI Huoke System Management and Prompt Catalog Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy AI Huoke settings and Agent permissions surface with the seven-page Hangxiaoxiao-aligned system management area, expose every real Prompt with full content and governance actions, and display a route-specific field-level PRD on every system page.

**Architecture:** Keep `prototype/index.html` as the runnable UI truth and add data-driven registries for routes, RBAC, Prompt assets, logs and page PRDs. Reuse Hangxiaoxiao's information architecture and interaction contracts without importing its runtime. Keep written page PRDs under `prd/pages/`, then verify the browser drawer registry matches those documents.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, local `codex-verify` browser workflow, GitHub Pages-compatible assets.

---

## File responsibility map

### Create

- `prototype/tests/ai-huoke-system-management.test.mjs` — structural contracts for routes, RBAC, Prompt inventory, actions and page PRDs.
- `prototype/scripts/capture-ai-huoke-system-management.mjs` — browser acceptance for seven routes, Prompt interactions, legacy redirect and responsive layout.
- `prd/pages/设置-系统设置.md` — field-level PRD for tenant enterprise information.
- `prd/pages/设置-成员管理.md` — field-level PRD for member lifecycle and role assignment.
- `prd/pages/设置-权限管理.md` — field-level PRD for SaaS RBAC.
- `prd/pages/设置-提示词管理.md` — field-level PRD for complete Prompt assets and governance.
- `prd/pages/设置-用量管理.md` — field-level PRD for shared quota and member caps.
- `prd/pages/设置-日志与审计.md` — field-level PRD for five audit categories.

### Modify

- `prototype/index.html` — navigation, seven pages, data registries, Prompt renderer/actions, old-route redirects, responsive styling and `PAGE_PRD_CONTENT` entries.
- `prototype/verification-manifest.json` — add the `system-management` focus profile.
- `prd/pages/设置-平台账号.md` — align title, fields, actions and ten-section structure with the new system area.
- `prd/pages/README.md` — replace legacy settings entries with the seven current pages.
- `prd/PRD_提示词.md` — declare the browser Prompt asset directory and current registry relationship.
- `prd/PRD_企业AI经营大脑_当前开发基线.md` — update the settings information architecture.
- `prd/PRD索引.md` — index the seven current system page PRDs.

### Delete after replacements exist

- `prd/pages/设置-Agent权限.md`
- `prd/pages/设置-企业设置.md`
- `prd/pages/设置-成员与权限.md`
- `prd/pages/设置-用量与套餐.md`
- `prd/pages/设置-帮助与服务.md`

---

### Task 1: Lock the seven-page information architecture with failing tests

**Files:**
- Create: `prototype/tests/ai-huoke-system-management.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write a failing navigation and route test**

```js
test('system management exposes the approved seven routes in order', () => {
  const order = ['system','members','permissions','bind','prompts','usage','logs'];
  assert.match(html, new RegExp(order.map(route => `data-v="${route}"`).join('[\\s\\S]*')));
  for (const label of ['系统设置','成员管理','权限管理','平台账号','提示词管理','用量管理','日志与审计']) {
    assert.match(html, new RegExp(label));
  }
  assert.doesNotMatch(settingsNavigation, />Agent 权限</);
});
```

- [ ] **Step 2: Add failing assertions for legacy route compatibility**

Require `LEGACY_SYSTEM_ROUTES` to map `settings → system`, `member → members`, and `agent-center → prompts`; require current titles and `ROUTE_PARENT` entries for all seven routes.

- [ ] **Step 3: Run the focused test and confirm RED**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: FAIL because the current navigation still exposes Agent permissions and lacks the new routes.

- [ ] **Step 4: Implement the seven-item navigation and route skeletons**

In `prototype/index.html`, replace both legacy settings navigation lists with:

```js
const SYSTEM_ROUTES = [
  ['system','系统设置'],
  ['members','成员管理'],
  ['permissions','权限管理'],
  ['bind','平台账号'],
  ['prompts','提示词管理'],
  ['usage','用量管理'],
  ['logs','日志与审计']
];
const LEGACY_SYSTEM_ROUTES = {
  settings: 'system',
  member: 'members',
  'agent-center': 'prompts'
};
```

Create page sections with `data-p` values matching those routes. Update `titles`, `ROUTE_PARENT`, `go`, `reviewState` and startup routing so legacy routes normalize before page lookup.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: PASS for navigation, labels, route parents and legacy redirects.

- [ ] **Step 6: Commit the information architecture**

```bash
git add prototype/index.html prototype/tests/ai-huoke-system-management.test.mjs
git commit -m "feat: align AI Huoke system management navigation"
```

### Task 2: Implement system, members and RBAC permissions

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/ai-huoke-system-management.test.mjs`

- [ ] **Step 1: Add failing tests for member and role separation**

Require `AI_HUOKE_MEMBERS`, `AI_HUOKE_PERMISSION_MODULES`, `AI_HUOKE_ROLE_GRANTS`, independent `members` and `permissions` pages, multi-role assignment, permission union text, module/data/button controls, and Prompt buttons `查看/编辑/测试/发布`.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: FAIL on missing registries, role builder and member actions.

- [ ] **Step 3: Add the data registries and renderers**

Implement stable objects:

```js
const AI_HUOKE_PERMISSION_MODULES = [
  {key:'knowledge', label:'企业大脑', buttons:['查看','上传资料','编辑','归档']},
  {key:'content', label:'营销物料', buttons:['查看','创作','编辑','发布']},
  {key:'acquisition', label:'AI 获客', buttons:['查看','创建任务','确认','发布']},
  {key:'prompts', label:'提示词管理', buttons:['查看','编辑','测试','发布']},
  {key:'system', label:'系统管理', buttons:['查看','成员管理','权限管理','导出日志']}
];
```

Add member rows, role rows, role permission builder, parent/child checkbox synchronization, add member, assign roles, enable/disable and reset-password demonstrations. System settings contains only the six approved enterprise fields.

- [ ] **Step 4: Add action handling and accessible states**

Implement `add-system-member`, `edit-system-member-roles`, `toggle-system-member`, `reset-system-member-password`, `create-system-role`, `edit-system-role`, `copy-system-role`, `delete-system-role`, and role checkbox synchronization. Use current modal/toast helpers and preserve focus behavior.

- [ ] **Step 5: Run focused and relevant regression tests**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

Expected: PASS; update obsolete legacy assertions only when they contradict the approved specification.

- [ ] **Step 6: Commit system identity and RBAC**

```bash
git add prototype/index.html prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs
git commit -m "feat: add AI Huoke member and role management"
```

### Task 3: Build the complete Prompt asset catalog

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/ai-huoke-system-management.test.mjs`

- [ ] **Step 1: Write failing Prompt inventory tests**

Require `AI_HUOKE_ENABLED_CAPABILITIES`, `AI_HUOKE_PROMPT_CATALOG`, `AI_HUOKE_PROMPT_CONTENT`, `sourceRef`, `inputContract`, `outputContract`, unique IDs, and non-empty full content for every visible item. Require at least the approved Prompt names and IDs from the design specification, including P-000, P-001, P-010, P-011, P-012, P-020, P-021, P-030, P-040–P-044, P-050, P-060, knowledge governance prompts, material prompts and the two Remotion prompts.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: FAIL because no AI Huoke Prompt registry or complete content map exists.

- [ ] **Step 3: Add the data-driven Prompt catalog**

Each record must follow:

```js
{
  id: 'P-042',
  name: '营销视频方向推断 Prompt',
  featureKey: 'acquisition',
  feature: 'AI 获客',
  scene: '根据已确认事实判断营销场景与目标客户',
  model: 'DeepSeek-V3',
  parameters: '温度 0.2 · 最大 1,600 tokens',
  version: 'v1.0',
  status: '已发布',
  scope: '平台基线 · 只读',
  visibleToCurrentAccount: true,
  sourceRef: 'prd/pages/AI获客-营销视频.md#P-042',
  inputContract: 'confirmed_enterprise_facts, active_vi, task_input',
  outputContract: 'marketing_scenario, target_customer, evidence_refs, missing_inputs'
}
```

Store every full Prompt in `AI_HUOKE_PROMPT_CONTENT[id]`. Adapt business wording to AI Huoke and remove Hangxiaoxiao-specific tenant language.

- [ ] **Step 4: Render search, filter and table states**

Implement `visibleAiHuokePrompts`, `aiHuokePromptRows`, `renderAiHuokePromptRows`, feature filter, search over ID/name/feature/scene/model, result count and a resettable zero-result state.

- [ ] **Step 5: Implement view, edit, test, publish and rollback**

Use a single configuration modal that always displays full content, source reference, contracts, model and parameters. Read-only baseline items expose view/test only. Tenant items save drafts, require a successful test before publish, increment version on publish and create a new audit entry on rollback.

- [ ] **Step 6: Run tests and confirm GREEN**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/business-artifacts-v1.test.mjs prototype/tests/remotion-video-workflow.test.mjs`

Expected: PASS with all required Prompt assets registered and complete.

- [ ] **Step 7: Commit Prompt management**

```bash
git add prototype/index.html prototype/tests/ai-huoke-system-management.test.mjs
git commit -m "feat: expose complete AI Huoke Prompt assets"
```

### Task 4: Align usage and audit logging

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/ai-huoke-system-management.test.mjs`

- [ ] **Step 1: Add failing usage and log tests**

Require shared total/used/remaining quota, active member count, member cap actions, quota adjustment history, and five log types: operation, login, AI call, knowledge use and export.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: FAIL because the legacy usage page lacks shared/member semantics and no audit page exists.

- [ ] **Step 3: Implement usage and log registries and pages**

Add `AI_HUOKE_LOG_RECORDS` and render helpers. Rebuild usage with quota KPI fields, member rows, caps and platform adjustment history. Add filterable audit records and detail actions. Prompt test/publish/rollback actions append representative audit items.

- [ ] **Step 4: Implement empty and permission states**

Support no log results, reset filter, read-only member cap, export boundaries and non-exportable knowledge content notices.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit usage and audit**

```bash
git add prototype/index.html prototype/tests/ai-huoke-system-management.test.mjs
git commit -m "feat: align AI Huoke usage and audit management"
```

### Task 5: Rewrite the seven field-level page PRDs

**Files:**
- Create: `prd/pages/设置-系统设置.md`
- Create: `prd/pages/设置-成员管理.md`
- Create: `prd/pages/设置-权限管理.md`
- Create: `prd/pages/设置-提示词管理.md`
- Create: `prd/pages/设置-用量管理.md`
- Create: `prd/pages/设置-日志与审计.md`
- Modify: `prd/pages/设置-平台账号.md`
- Delete: `prd/pages/设置-Agent权限.md`
- Delete: `prd/pages/设置-企业设置.md`
- Delete: `prd/pages/设置-成员与权限.md`
- Delete: `prd/pages/设置-用量与套餐.md`
- Delete: `prd/pages/设置-帮助与服务.md`
- Modify: `prd/pages/README.md`
- Modify: `prd/PRD_提示词.md`
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md`
- Modify: `prd/PRD索引.md`
- Test: `prototype/tests/ai-huoke-system-management.test.mjs`

- [ ] **Step 1: Add failing documentation tests**

For each of the seven files, require the exact ten headings:

```js
const headings = [
  '页面概述','页面级业务规则','页面字段级定义','页面级操作定义','产品边界',
  '页面级流程','通知与日志','异常与空状态','页面验收标准','技术实现提示'
];
```

Require indexes to link only the seven current files and reject retired names.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: FAIL on missing new documents and stale legacy links.

- [ ] **Step 3: Write the seven PRDs**

Each document must define page route, roles, preconditions, field keys/types/rules, operations and result states, audit events, permission boundaries, error/empty states, acceptance cases and implementation guidance. The Prompt PRD must include the full inventory and source union contract.

- [ ] **Step 4: Update indexes and baseline documents**

Replace legacy page names and navigation descriptions. Update `PRD_提示词.md` so browser Prompt management is the current tenant surface rather than the historical “提示词微调” summary.

- [ ] **Step 5: Run documentation tests and check retired terms**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/business-artifacts-v1.test.mjs`

Run: `rg -n '设置-Agent权限|设置-企业设置|设置-成员与权限|设置-用量与套餐|设置-帮助与服务' prd`

Expected: tests PASS; retired terms appear only in explicitly labelled revision history if retained.

- [ ] **Step 6: Commit the PRD rewrite**

```bash
git add prd prototype/tests/ai-huoke-system-management.test.mjs
git commit -m "docs: align AI Huoke system management PRDs"
```

### Task 6: Display all seven PRDs in the page drawer

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/ai-huoke-system-management.test.mjs`

- [ ] **Step 1: Add failing drawer registry tests**

Require `PAGE_PRD_CONTENT` keys `system`, `members`, `permissions`, `bind`, `prompts`, `usage`, `logs`; require ten rendered sections, matching route/title/version and system route visibility.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs`

Expected: FAIL because only the six AI acquisition business routes currently expose drawer data.

- [ ] **Step 3: Add the seven route-specific PRD records**

For every route, provide `overview`, `rules`, `fields`, `actions`, `boundary`, `flows`, `logs`, `exceptions`, `acceptance`, and `tech`. Match the written PRD's key fields and operations.

- [ ] **Step 4: Extend drawer route synchronization**

Update `syncPagePrdEntry` so the trigger is visible on all six AI acquisition pages and all seven system pages. Legacy routes normalize before PRD lookup. Ensure closing returns focus and route changes close stale content.

- [ ] **Step 5: Run focused drawer tests and confirm GREEN**

Run: `node --test prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/page-prd-drawer.test.mjs`

Expected: PASS with current route/title matching for all seven system PRDs.

- [ ] **Step 6: Commit drawer content**

```bash
git add prototype/index.html prototype/tests/ai-huoke-system-management.test.mjs
git commit -m "feat: display system management page PRDs"
```

### Task 7: Add browser acceptance and final delivery verification

**Files:**
- Create: `prototype/scripts/capture-ai-huoke-system-management.mjs`
- Modify: `prototype/verification-manifest.json`
- Modify: `prototype/tests/codex-workflow-automation.test.mjs`

- [ ] **Step 1: Write the browser capture script**

Capture seven desktop routes, Prompt filter/search/content/edit/test/publish/rollback states, legacy redirect, and representative mobile Prompt/PRD drawer states. Collect runtime and console errors and assert no document-level overflow.

- [ ] **Step 2: Add the focus profile**

```json
"system-management": {
  "tests": ["ai-huoke-system-management.test.mjs", "page-prd-drawer.test.mjs"],
  "capture": "prototype/scripts/capture-ai-huoke-system-management.mjs"
}
```

Update the focus-list assertion to include `system-management`.

- [ ] **Step 3: Run focused structural verification**

Run: `/Users/xinwei/.local/bin/codex-verify --focus system-management`

Expected: PASS.

- [ ] **Step 4: Run focused browser verification**

Run: `/Users/xinwei/.local/bin/codex-verify --focus system-management --browser`

Expected: PASS with screenshots for all required routes/states and zero runtime errors.

- [ ] **Step 5: Inspect representative screenshots**

Inspect at minimum: desktop Prompt catalog, desktop RBAC editor, desktop logs, mobile Prompt detail and mobile system page PRD drawer. Record any visual or overflow defects and fix before continuing.

- [ ] **Step 6: Run the full delivery gate**

Run: `/Users/xinwei/.local/bin/codex-verify --full`

Expected: all tests, source verification, desktop captures and mobile captures PASS.

- [ ] **Step 7: Run final repository checks**

Run: `git diff --check`

Run: `git status --short`

Expected: no whitespace errors; only planned files changed.

- [ ] **Step 8: Commit verification assets**

```bash
git add prototype/scripts/capture-ai-huoke-system-management.mjs prototype/verification-manifest.json prototype/tests/codex-workflow-automation.test.mjs
git commit -m "test: verify AI Huoke system management"
```

### Task 8: Final review and delivery

**Files:**
- Review all files listed above.

- [ ] **Step 1: Re-read the approved design against the implementation**

Confirm every in-scope requirement maps to visible UI, structural tests and browser acceptance; confirm no business workflow page changed outside route integration.

- [ ] **Step 2: Run fresh final verification**

Run: `node --test --test-reporter=dot prototype/tests/*.test.mjs`

Run: `git diff --check`

Expected: zero test failures and zero whitespace errors.

- [ ] **Step 3: Review commit history and worktree state**

Run: `git log --oneline --decorate -8`

Run: `git status -sb`

Expected: implementation commits are present on `codex/agent-prompt-management`; no unrelated files are staged or committed.

