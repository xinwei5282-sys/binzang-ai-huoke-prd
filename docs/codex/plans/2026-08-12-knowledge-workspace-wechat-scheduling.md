# Knowledge Workspace and WeChat Scheduling Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify enterprise knowledge into formal knowledge plus one source-centered work queue, add plan-aware per-article WeChat scheduling, and make the four enterprise intake steps directly navigable without promoting drafts to facts.

**Architecture:** Keep the static prototype in `prototype/index.html` as the only runtime truth source. Add small pure state helpers for source-task status, article scheduling, and intake-step state, then render them through the existing event dispatcher and modal patterns. Preserve account-level defaults and the existing formal-knowledge flow while moving all source and candidate work into one expandable list.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js `node:test`, local `codex-verify`, real browser inspection at 1440×900 and 390×844.

---

## File responsibility map

- Modify: `prototype/index.html` — UI markup, state helpers, rendering, event dispatch, responsive behavior.
- Create: `prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs` — focused contracts for the four confirmed changes.
- Modify: `prototype/tests/consumer-protection-knowledge.test.mjs` — remove the obsolete expectation that enterprise knowledge renders Agent authorization.
- Reference only: `docs/superpowers/specs/2026-08-12-enterprise-knowledge-workspace-wechat-scheduling-design.md` — approved behavior and acceptance truth source.

### Task 1: Lock the four feature contracts with failing tests

**Files:**
- Create: `prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`
- Modify: `prototype/tests/consumer-protection-knowledge.test.mjs`

- [ ] **Step 1: Add the enterprise knowledge authorization-removal contract**

Assert that the enterprise knowledge section has no `data-kbpanel="agents"`, `data-kbtab="agents"`, `kbAgentRows`, `renderConsumerAgents`, or `Agent 知识与动作授权`, while the settings navigation still contains `data-v="agent-center"` and “Agent 权限”.

- [ ] **Step 2: Add the unified work-queue contract**

Assert that the knowledge data tabs contain only “正式知识” and “资料与待处理”, and that the prototype defines `KNOWLEDGE_WORK_ITEMS`, `deriveKnowledgeWorkStatus`, `renderKnowledgeWorkQueue`, `toggleKnowledgeWorkItem`, plus the five labels “处理中、待确认、有冲突、处理失败、已完成”.

- [ ] **Step 3: Add the article scheduling contract**

Assert that `openWechatComposer` renders controls with IDs `wechatOperatingPlan`, `wechatPlanMilestone`, `wechatRecommendedPublishAt`, `wechatScheduledPublishAt`, and `wechatArticleAutoPublish`; the created row stores `operatingPlanId`, `planMilestoneId`, `recommendedPublishAt`, `scheduledPublishAt`, `scheduleSource`, and `autoPublishEnabled`; the list displays plan node and scheduled time.

- [ ] **Step 4: Add the clickable intake-step contract**

Assert that the four indicators are buttons with `data-act="switch-enterprise-intake-step"`, the dispatcher calls `saveEnterpriseIntakeDraft()` before `showEnterpriseIntakeStep`, and `showEnterpriseIntakeStep` updates `aria-current` plus draft/confirmed labels.

- [ ] **Step 5: Run focused tests and confirm RED**

Run: `node --test prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs prototype/tests/consumer-protection-knowledge.test.mjs`

Expected: failures identify the missing unified queue, scheduling controls, and clickable step behavior; the already-applied Agent removal may pass.

### Task 2: Finish removing Agent authorization from enterprise knowledge

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`
- Test: `prototype/tests/consumer-protection-knowledge.test.mjs`

- [ ] **Step 1: Remove all enterprise-knowledge Agent authorization remnants**

Remove the dedicated entry, panel, `agents` route alias/detail option, `KB_SALES_VIEW.agents`, consumer Agent renderer, and `edit-agent-auth` dispatcher case. Do not remove settings navigation or the separate `agent-center` page.

- [ ] **Step 2: Remove orphaned responsive CSS only when it is exclusive to the deleted panel**

Delete `.agent-governance` rules only if no remaining settings or governance view uses them; keep shared `.agent-row` rules used elsewhere.

- [ ] **Step 3: Run the authorization-removal tests**

Run: `node --test prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs prototype/tests/consumer-protection-knowledge.test.mjs`

Expected: the Agent-removal assertions pass; queue and scheduling assertions may still fail.

### Task 3: Merge source inbox and candidates into one expandable queue

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`

- [ ] **Step 1: Replace the three data tabs with two workspaces**

Render only:

```html
<button class="on" data-act="kb-data-tab" data-kbdata="domains">正式知识</button>
<button data-act="kb-data-tab" data-kbdata="work">资料与待处理 <span class="bdg warn">4</span></button>
```

Replace separate `sources` and `review` panels with one `data-kbpanel="work"` panel containing `id="knowledgeWorkQueue"`.

- [ ] **Step 2: Add source-centered demo state**

Define `KNOWLEDGE_WORK_ITEMS` with five representative sources and nested candidates. Each item contains `id`, `name`, `kind`, `origin`, `processingState`, `updatedAt`, and `candidates`; each candidate contains `id`, `label`, `extractedValue`, `currentValue`, `sourceLocator`, `confidence`, `owner`, and `status`.

- [ ] **Step 3: Add deterministic derived status**

Implement:

```js
function deriveKnowledgeWorkStatus(item){
  if(item.processingState==='failed')return 'failed';
  if(['queued','collecting','parsing'].includes(item.processingState))return 'processing';
  if(item.candidates.some(candidate=>candidate.status==='conflict'))return 'conflict';
  if(item.candidates.some(candidate=>candidate.status==='pending'))return 'review';
  return 'completed';
}
```

Map these states to the five approved Chinese labels and tones.

- [ ] **Step 4: Render one row per source with inline candidates**

Implement `renderKnowledgeWorkQueue()` and `toggleKnowledgeWorkItem(id)`. The source row shows state, counts, update time, and action; the detail row renders candidates and actions without duplicating the source elsewhere.

- [ ] **Step 5: Wire candidate and failure actions**

Add dispatcher actions for expand/collapse, approve candidate, resolve conflict, retry failed processing, and view completed history. Updating a candidate must re-render the source so its derived status moves toward “已完成”.

- [ ] **Step 6: Update knowledge routing**

Make `showKbDataView` accept only `domains|work`; map legacy `sources|review` requests to `work` so old buttons or stored routes do not break.

- [ ] **Step 7: Add responsive rules**

At ≤700px, render each source as a stacked card, keep the expanded candidate actions full width, and prevent tables from forcing horizontal page overflow.

- [ ] **Step 8: Run the focused test**

Run: `node --test prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`

Expected: unified queue tests pass.

### Task 4: Add plan-aware, per-article scheduled publishing

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`

- [ ] **Step 1: Add an active-plan scheduling context**

Extend `buildCompanyOperatingPlan()` with stable demo milestones such as:

```js
milestones:[
  {id:'milestone-aug-acquisition',name:'8 月获客活动启动',date:'2026-08-20',contentPurpose:'预热'},
  {id:'milestone-sep-review',name:'9 月经营复盘',date:'2026-09-25',contentPurpose:'复盘'}
]
```

Add `recommendWechatPublishAt(planId,milestoneId)` that returns the milestone date minus two days at 09:30 in the local demo timezone.

- [ ] **Step 2: Add composer controls**

In `openWechatComposer`, add publishing account, operating plan, milestone, read-only recommended time, editable `datetime-local` scheduled time, and per-article auto-publish checkbox. If no active plan exists, show “未关联经营计划” and allow manual scheduling.

- [ ] **Step 3: Keep plan recommendation and manual override distinct**

On milestone change, update both recommended and scheduled time only while `scheduleSource==='plan_recommended'`. On scheduled-time input, set `scheduleSource='manually_set'`; subsequent milestone changes update the recommendation notice but do not overwrite the chosen time.

- [ ] **Step 4: Persist scheduling metadata on the article row**

When creating a row, write the six approved fields to `row.dataset`, retain `articleId`, and render columns for account, plan milestone, scheduled time, publish status, reads, shares, and actions.

- [ ] **Step 5: Add scheduling gate state**

Implement `evaluateWechatScheduleGate(row)` returning `ready` and `blockingReasons`. Demonstrate paused states for unreviewed content, unauthorized account, disabled auto publish, version mismatch, and cancelled milestone; never silently alter time.

- [ ] **Step 6: Keep article-level metrics**

Preserve reads and shares on the corresponding article row. Do not reintroduce “在看” or “新增关注”.

- [ ] **Step 7: Run the focused test**

Run: `node --test prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`

Expected: scheduling contract passes.

### Task 5: Make all four enterprise-intake steps clickable

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`

- [ ] **Step 1: Convert indicators from spans to buttons**

Each button uses `type="button"`, `data-act="switch-enterprise-intake-step"`, `data-intake-step-target="N"`, and a minimum 44px touch height. Preserve the four-column desktop and two-column mobile layouts.

- [ ] **Step 2: Add step-state derivation**

Implement `getEnterpriseIntakeStepState(step)` using current step controls and final profile confirmation. Return `current`, `draft`, `confirmed`, or `optional` without changing business facts.

- [ ] **Step 3: Update `showEnterpriseIntakeStep(step)`**

Clamp to 1–4, toggle sections, update `aria-current="step"`, update each status label to “当前、已填写、已确认、可选”, retain previous/next/complete buttons, and focus the target section heading only for direct step clicks.

- [ ] **Step 4: Wire direct switching through the dispatcher**

Add:

```js
case 'switch-enterprise-intake-step':
  saveEnterpriseIntakeDraft();
  showEnterpriseIntakeStep(Number(el.dataset.intakeStepTarget)||1,{focus:true});
  break;
```

No validation gate is added because all fields are optional.

- [ ] **Step 5: Run the focused test**

Run: `node --test prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs`

Expected: all four feature-contract tests pass.

### Task 6: Regression and real-browser verification

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/*.test.mjs`

- [ ] **Step 1: Run content-focused verification**

Run: `/Users/xinwei/.local/bin/codex-verify --focus content`

Expected: PASS.

- [ ] **Step 2: Run the full Node test suite**

Run: `node --test --test-reporter=dot prototype/tests/*.test.mjs`

Expected: new tests pass. Any pre-existing failures are recorded with exact test names and are not represented as caused by this feature without evidence.

- [ ] **Step 3: Check whitespace and source integrity**

Run: `git diff --check -- prototype/index.html prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs prototype/tests/consumer-protection-knowledge.test.mjs`

Expected: no output and exit code 0.

- [ ] **Step 4: Reuse one existing prototype browser tab for desktop verification**

At 1440×900 verify: enterprise knowledge has two workspaces, no Agent authorization entry, all five work statuses render, a source expands inline, WeChat composer shows plan recommendation and editable schedule, and all four intake steps switch without losing a typed value.

- [ ] **Step 5: Verify 390×844 in the same tab**

Verify: no horizontal overflow; source cards and candidates stack; article scheduling fields remain usable; the four steps render as two columns with ≥44px controls.

- [ ] **Step 6: Check console and retain the useful deliverable state**

Expected: no new console errors. Reset the viewport and leave the existing tab on the most useful completed screen without opening another tab.
