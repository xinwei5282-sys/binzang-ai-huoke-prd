# Enterprise Work Hub Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 AI 获客单页原型中增加按账号区分的“工作中枢”，完整演示会议/聊天资料进入企业记忆、形成客户档案与待办、受控生成 PPT/合同/报价/沟通话术，以及员工发现同项目冲突后自主判断的闭环。

**Architecture:** 继续以 `prototype/index.html` 作为唯一原型真源，在现有一级路由、二级视图、抽屉和事件委托机制上扩展。新增 `workhub` 一级路由承载待办、客户、项目；企业大脑新增 `memory`。所有数据使用显式标注的内存演示对象。任务中心是行动真源，企业记忆/客户档案/项目空间保存上下文与证据，交付物按类型路由到既有归属页面。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Node.js `node:test`、Chrome DevTools Protocol、项目内 `codex-task` / `codex-verify` 工作流。

---

## File structure map

### Create

- `prototype/tests/enterprise-work-hub.test.mjs` — 信息架构、演示数据、权限、冲突和交付物路由契约。
- `prototype/scripts/capture-enterprise-work-hub.mjs` — 桌面/移动工作闭环交互验收与截图。
- `prd/pages/工作中枢-我的待办.md` — 任务树、候选确认、Agent 子任务、交付物归属。
- `prd/pages/工作中枢-客户.md` — 客户档案、意向证据、时间线、跟进助手。
- `prd/pages/工作中枢-项目.md` — 项目空间、商业文档、冲突处理。
- `prd/pages/企业大脑-企业记忆.md` — 会议/聊天上传、解析、纪要、证据、隐私。

### Modify

- `prototype/index.html` — 路由、UI、状态、账号、业务交互、PPT 深链、内嵌页面 PRD。
- `prototype/tests/prototype-distillation.test.mjs` — 一级业务路由从六个更新为七个。
- `prototype/tests/content-hierarchy.test.mjs` — `workhub` 加入统一标题层级。
- `prototype/tests/secondary-navigation-heading.test.mjs` — 新增四个二级标题契约。
- `prototype/tests/backoffice-design-system.test.mjs` — 加入工作中枢和企业记忆导航。
- `prototype/tests/ai-huoke-system-management.test.mjs` — 加入四个页面 PRD 上下文。
- `prototype/verification-manifest.json` — 注册 `enterprise-work-hub` 聚焦验证。
- `prototype/scripts/capture-v1-prototype.mjs` — 全量门禁覆盖新页面代表状态。
- `prd/pages/README.md`、`prd/PRD索引.md`、`prd/PRD_企业AI经营大脑_当前开发基线.md` — 更新页面索引、IA、契约和验收。

### Explicitly unchanged

- `prototype/mobile.html` — 不是当前原型真源；移动端验收使用 `prototype/index.html` 的 390×844 视口。
- `prototype/index.html.artifact.json` — 不承载页面逻辑，校验以服务端和源文件 SHA 为准。
- 真实后端、对象存储、ASR、LLM、合同模板引擎、消息发送接口 — 本轮不接入，只展示可辨认的演示状态。

## Shared contracts

页面、测试和截图统一使用：

```js
const WORK_HUB_ACCOUNT_TEMPLATES = { boss: {}, employee: {} };
const WORK_HUB_MEMORIES = [];
const WORK_HUB_CUSTOMERS = [];
const WORK_HUB_PROJECTS = [];
const WORK_HUB_TASKS = [];
const WORK_HUB_CONFLICTS = [];
let workHubState = {
  currentAccountId: 'acct-boss',
  activeSubview: 'work-tasks',
  selectedMemoryId: null,
  selectedCustomerId: null,
  selectedProjectId: null,
  taskFilter: 'mine'
};
```

状态枚举固定为：

```text
memory: uploaded → parsing → ready | failed
candidate task: candidate → confirmed | dismissed
task: pending → running → ready | failed
conflict: open → adopted | kept_with_reason | consultation_started
customer intent: high | medium | low | unknown
visibility: private | project | enterprise
```

页面统一显示“原型演示”或“模拟生成”，不得暗示已接入真实会议、自动发送或电子签署。

---

## Task 0: Create an isolated implementation worktree

**Files:** None.

- [ ] **Step 1: Confirm the source checkout is clean**

```bash
git status --short
git diff --check
```

Expected: 无错误；若有无关用户改动，保留且不带入隔离 worktree。

- [ ] **Step 2: Dry-run then create the worktree**

```bash
codex-task enterprise-work-hub --dry-run
codex-task enterprise-work-hub
```

Expected: 依次得到 `DRY_RUN` 和 `READY`，分支为 `codex/enterprise-work-hub`，baseline 为 `PASS`。

- [ ] **Step 3: Continue from the returned path**

```bash
cd /Users/xinwei/aihuoke-agent-prompt-management/.worktrees/codex-enterprise-work-hub
git status --short
```

Expected: clean worktree。后续命令均在此目录执行。

---

## Task 1: Lock navigation and domain contracts with tests

**Files:** Create `prototype/tests/enterprise-work-hub.test.mjs`; modify `prototype/index.html` and the four navigation/hierarchy tests listed above.

- [ ] **Step 1: Write the failing contract test**

核心断言：

```js
test('work hub owns tasks customers and projects while enterprise brain owns memory', () => {
  assert.match(html, /data-v="workhub"/);
  assert.match(html, /data-p="workhub"/);
  for (const view of ['work-tasks', 'work-customers', 'work-projects']) {
    assert.match(html, new RegExp(`data-subview="${view}"`));
    assert.match(html, new RegExp(`data-subview-panel="${view}"`));
  }
  assert.match(html, /data-kbtab="memory"/);
  assert.match(html, /data-kbpanel="memory"/);
  assert.doesNotMatch(html, /data-p="tasks"/);
});

test('prototype declares controlled account and conflict contracts', () => {
  for (const name of ['WORK_HUB_ACCOUNT_TEMPLATES', 'WORK_HUB_MEMORIES',
    'WORK_HUB_CUSTOMERS', 'WORK_HUB_PROJECTS', 'WORK_HUB_TASKS',
    'WORK_HUB_CONFLICTS']) assert.match(html, new RegExp(`const ${name}=`));
  for (const choice of ['adopt', 'keep', 'consult']) {
    assert.match(html, new RegExp(`data-conflict-resolution="${choice}"`));
  }
  assert.match(html, /不会自动覆盖/);
});
```

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL，因为新路由、面板和常量尚不存在。

- [ ] **Step 3: Add the minimal shell**

在 `prototype/index.html` 中按“首页 → 品牌与经营 → 工作中枢 → 营销物料 → AI 获客 → 企业大脑 → 系统管理”加入一级入口；新增 `data-nav-sub="workhub"`、`data-p="workhub"`、三个工作中枢面板和 Enterprise Brain 的 `memory` 面板。同步 `titles`、`DEFAULT_SECONDARY_NAVIGATION`、`hierarchyRoutes`。

二级标题精确使用：

```js
'work-tasks': ['我的待办', '候选确认 · 任务树 · Agent 执行 · 交付物'],
'work-customers': ['客户', '客户档案 · 意向证据 · 跟进建议'],
'work-projects': ['项目', '协作资料 · 商业文档 · 冲突处理'],
'memory': ['企业记忆', '会议与聊天 · 纪要 · 证据 · 关联关系']
```

- [ ] **Step 4: Update existing navigation assertions and run green**

`prototype-distillation.test.mjs` 断言七个一级路由但继续禁止独立 `data-p="tasks"`；其余测试加入 `workhub`/`memory`。

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/prototype-distillation.test.mjs prototype/tests/content-hierarchy.test.mjs prototype/tests/secondary-navigation-heading.test.mjs prototype/tests/backoffice-design-system.test.mjs
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs prototype/tests/prototype-distillation.test.mjs prototype/tests/content-hierarchy.test.mjs prototype/tests/secondary-navigation-heading.test.mjs prototype/tests/backoffice-design-system.test.mjs
git commit -m "feat: add enterprise work hub navigation shell"
```

---

## Task 2: Add account-scoped fixtures and the role-aware home workbench

**Files:** Modify `prototype/index.html`, `prototype/tests/enterprise-work-hub.test.mjs`.

- [ ] **Step 1: Add failing account assertions**

要求 fixture 包含 `tenantId`、`ownerAccountId`、`visibility`、`projectId`、`customerId`，并要求 `setWorkHubAccount`、`canCurrentAccountSeeWorkItem`、`[data-work-account]`。

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
```

- [ ] **Step 3: Populate deterministic fixtures**

使用一个租户、老板/员工两个账号、两个客户、两个项目、三条记忆、六条任务、一个开放冲突。最小账号结构：

```js
boss: { id: 'acct-boss', tenantId: 'tenant-weiran', name: '蔚然', roleLabel: '老板账号', dataScope: 'enterprise' },
employee: { id: 'acct-employee-lin', tenantId: 'tenant-weiran', name: '林晓', roleLabel: '员工账号', dataScope: 'self_and_shared_projects' }
```

老板看到企业会议、全部客户机会和跨项目任务；员工看到本人私有文件、本人任务和参与项目。员工私有文件未关联项目时不进入企业记忆或冲突检测。

- [ ] **Step 4: Implement account and visibility rendering**

新增 `getCurrentWorkAccount()`、`setWorkHubAccount(accountId)`、`canCurrentAccountSeeWorkItem(item)`、`renderWorkHubAccountContext()`、`renderHomeWorkSummary()`。切换账号只改变账号与数据范围，不改变租户。

- [ ] **Step 5: Add three home summaries**

```html
<section id="homeDecisionQueue" data-work-summary="decisions"></section>
<section id="homeCustomerOpportunities" data-work-summary="customers"></section>
<section id="homeTaskTree" data-work-summary="tasks"></section>
```

老板态突出客户决策和跨项目进度；员工态突出个人任务、项目冲突和私有文件处理。卡片必须深链到归属页面。

- [ ] **Step 6: Verify and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: add account scoped workbench demo"
```

---

## Task 3: Build Enterprise Memory intake and meeting analysis

**Files:** Modify `prototype/index.html`, `prototype/tests/enterprise-work-hub.test.mjs`.

- [ ] **Step 1: Add failing memory tests**

要求 `#workMemoryUpload` 支持 `audio/*,video/*,image/*,.pdf,.doc,.docx,.txt` 和多文件；上传类型覆盖会议音视频、聊天截图、PDF/Word/TXT、粘贴文本；详情覆盖原文、纪要、意向、证据、候选待办和下一步；至少有 ready/parsing/failed 三种样例。

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec --test-name-pattern="memory|meeting|upload" prototype/tests/enterprise-work-hub.test.mjs
```

- [ ] **Step 3: Build list and upload drawer**

新增 `renderEnterpriseMemoryList()`、`openWorkMemoryUpload()`、`submitWorkMemoryUpload()`、`retryWorkMemoryParsing(memoryId)`。提交后演示 `uploaded → parsing → ready`；失败样例显示原因和重试。全程显示“原型演示 · 未上传到真实服务器”。

- [ ] **Step 4: Build evidence-first detail**

`openEnterpriseMemoryDetail(memoryId)` 按顺序展示：来源与关联、纪要/聊天摘要、客户意向、逐条证据、候选待办、下一步。抽取内容只标为“会议证据/聊天证据”，不得直接变成正式企业事实。

- [ ] **Step 5: Connect task confirmation**

`confirmMemoryCandidateTasks(memoryId)` 只把已选候选克隆进 `WORK_HUB_TASKS`，保留 `sourceMemoryId/evidenceIds`，并保证重复点击不重复建任务。下一步生成动作也必须成为子待办。

- [ ] **Step 6: Verify and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
rg -n "原型演示|模拟生成|会议证据|聊天证据" prototype/index.html
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: add enterprise memory intake and analysis"
```

---

## Task 4: Build cumulative customer profiles and Follow-up Assistant

**Files:** Modify `prototype/index.html`, `prototype/tests/enterprise-work-hub.test.mjs`.

- [ ] **Step 1: Add failing customer tests**

要求客户列表、详情抽屉、意向、联系人、时间线、任务、物料、`customer-followup-assistant`，以及 `openWorkCustomerProfile`、`generateCustomerFollowupScript`、`adoptCustomerFollowupScript`。

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec --test-name-pattern="customer|follow-up|客户" prototype/tests/enterprise-work-hub.test.mjs
```

- [ ] **Step 3: Render one cumulative profile per customer**

客户档案动态聚合基础资料、当前意向及置信度、证据理由、会议/聊天/任务/物料时间线、关联项目和下一步。新 ready 记忆关联客户后，时间线和演示意向摘要随之更新，不复制源数据。

- [ ] **Step 4: Add Follow-up Assistant**

候选话术流程为“生成候选 → 采用并创建待办 / 重新生成 / 放弃”。采用后建立关联客户和源记忆的待办；只提供“复制话术 / 标记已人工发送”，不得声称已自动发送。

- [ ] **Step 5: Verify and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: add customer profiles and followup assistant"
```

---

## Task 5: Build Project Space, commercial documents, and employee conflict handling

**Files:** Modify `prototype/index.html`, `prototype/tests/enterprise-work-hub.test.mjs`.

- [ ] **Step 1: Add failing project/conflict tests**

要求项目详情包含概览、要求、任务、文件、`project-commercial-documents` 和冲突；“保留原方案”必须填写原因；老板会议证据优先但不得自动覆盖员工文件。

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec --test-name-pattern="project|conflict|commercial" prototype/tests/enterprise-work-hub.test.mjs
```

- [ ] **Step 3: Render project and commercial documents**

实现 `renderWorkProjectList()`、`openWorkProject(projectId, detail)`、`renderWorkProjectDetail()`、`createProjectCommercialDocument()`。quote/contract 的生成是可见子任务 `pending → running → ready|failed`；结果仅出现在项目空间/商业文档。

- [ ] **Step 4: Implement employee decisions**

使用“员工报价 28 万”与“老板会议要求 32 万”样例，左右展示来源、人员、时间和关系。`resolveWorkProjectConflict(conflictId, resolution, reason)` 支持：

- `adopt`：创建员工文档新版本并保留旧版。
- `keep`：原因必填，保留双方证据。
- `consult`：创建员工负责的协商待办，并在演示时间线通知老板。

由被指派员工判断，不新增老板确认步骤，也不静默修改正式事实。

- [ ] **Step 5: Verify and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: add project documents and conflict decisions"
```

---

## Task 6: Make Task Center the execution source of truth and deep-link PPT

**Files:** Modify `prototype/index.html`, `prototype/tests/enterprise-work-hub.test.mjs`; verify existing commercial/PPT tests.

- [ ] **Step 1: Add failing task and deliverable tests**

要求 mine/team/customer/project/status 筛选、父任务与生成子任务、候选/执行/完成/失败/重试、证据链接。PPT 路由必须复用 `#studioBrief`、`pptCreationState`、`material-ppt` 和既有大纲确认门。

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec --test-name-pattern="task|deliverable|PPT" prototype/tests/enterprise-work-hub.test.mjs
```

- [ ] **Step 3: Implement task tree and controlled Agent states**

新增 `renderWorkTaskCenter()`、`confirmWorkTask()`、`runWorkAgentTask()`、`retryWorkAgentTask()`、`openWorkTaskSource()`。父任务表达业务结果；每个 PPT/报价/合同/话术生成都是可见子任务，带日志、失败原因、重试和归属页面链接。

- [ ] **Step 4: Implement canonical deliverable routing**

```js
function openWorkTaskDeliverable(taskId) {
  const task = WORK_HUB_TASKS.find(item => item.id === taskId);
  if (!task) return;
  if (task.deliverableType === 'ppt') {
    go('marketing-materials');
    switchSubview('material-ppt', document.querySelector('[data-subview="material-ppt"]'));
    document.querySelector('#studioBrief').value = task.generationBrief;
    pptCreationState = { ...pptCreationState, stage: 'brief',
      taskContext: { taskId: task.id, customerId: task.customerId, projectId: task.projectId } };
    renderPptCreationWorkspace();
    return;
  }
  if (['quote', 'contract'].includes(task.deliverableType)) {
    openWorkProject(task.projectId, 'project-commercial-documents');
    return;
  }
  openWorkCustomerProfile(task.customerId, 'customer-followup-assistant');
}
```

不得绕过 `generatePptOutlineFromBrief()` 或 `approveAndGeneratePpt()`。任务只预填上下文，用户仍在营销物料/PPT 审核大纲。

- [ ] **Step 5: Link PPT result back to its task**

`approveAndGeneratePpt()` 在存在 `pptCreationState.taskContext` 时更新来源工作任务的状态和结果 ID；没有 taskContext 的独立 PPT 创建保持原行为。

- [ ] **Step 6: Run regression tests and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/commercial-workflows.test.mjs prototype/tests/marketing-material-generation.test.mjs
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: connect tasks to controlled deliverable execution"
```

Expected: PASS，营销物料仍是唯一 PPT 归属页。

---

## Task 7: Add page PRDs and update the product baseline

**Files:** Create four page PRDs; modify the three PRD indexes/baselines, `prototype/index.html`, `prototype/tests/ai-huoke-system-management.test.mjs`, and the new test.

- [ ] **Step 1: Add failing PRD context assertions**

`PAGE_PRD_CONTENT` 和 `pagePrdContexts` 必须包含：

```js
'work-tasks', 'work-customers', 'work-projects', 'kb-memory'
```

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/ai-huoke-system-management.test.mjs
```

Expected: FAIL，因为上下文和文档尚缺失。

- [ ] **Step 2: Write four complete page PRDs**

每份同时遵循浏览器评审十段结构和 `prd/pages/README.md` 的详细执行契约，完整定义字段、状态机、账号/数据范围、来源 ID、审计、幂等和原型边界。关键规则：

| Page key | Rule |
|---|---|
| `work-tasks` | 生成动作是子待办，Task Center 是行动真源。 |
| `work-customers` | 每客户一个累计档案，意向结论逐条链接证据。 |
| `work-projects` | 员工自主处理冲突，保留方案需原因，不静默覆盖。 |
| `kb-memory` | 私有资料未显式共享/关联前保持私有，上传分析明确为演示。 |

- [ ] **Step 3: Register documents and baseline rules**

`prd/pages/README.md` 页面数由 28 改为 32 并加四行；`prd/PRD索引.md` 加入工作中枢/企业记忆；当前开发基线更新 `IA-002`、功能需求、共享数据对象、验收用例和开发顺序。

- [ ] **Step 4: Add four inline PRD records**

为四个 key 各写十个完整 `sections`，内容直接可读，不只链接 Markdown：

```js
Object.assign(PAGE_PRD_CONTENT, {
  'work-tasks': { title: '我的待办', context: '工作中枢 / 我的待办', sections: [] },
  'work-customers': { title: '客户', context: '工作中枢 / 客户', sections: [] },
  'work-projects': { title: '项目', context: '工作中枢 / 项目', sections: [] },
  'kb-memory': { title: '企业记忆', context: '企业大脑 / 企业记忆', sections: [] }
});
```

- [ ] **Step 5: Verify completeness**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/page-prd-drawer.test.mjs
rg -n "\b(TO""DO|TB""D|FIX""ME)\b" prd/pages/工作中枢-我的待办.md prd/pages/工作中枢-客户.md prd/pages/工作中枢-项目.md prd/pages/企业大脑-企业记忆.md
```

Expected: tests PASS；占位符扫描无输出。

- [ ] **Step 6: Commit**

```bash
git add prototype/index.html prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/enterprise-work-hub.test.mjs prd/pages/工作中枢-我的待办.md prd/pages/工作中枢-客户.md prd/pages/工作中枢-项目.md prd/pages/企业大脑-企业记忆.md prd/pages/README.md prd/PRD索引.md prd/PRD_企业AI经营大脑_当前开发基线.md
git commit -m "docs: define enterprise work hub page contracts"
```

---

## Task 8: Add focused browser and responsive verification

**Files:** Create `prototype/scripts/capture-enterprise-work-hub.mjs`; modify manifest, full capture, and new test.

- [ ] **Step 1: Add a failing manifest assertion**

要求 manifest 注册：

```json
"enterprise-work-hub": {
  "tests": ["enterprise-work-hub.test.mjs"],
  "capture": "prototype/scripts/capture-enterprise-work-hub.mjs"
}
```

- [ ] **Step 2: Create the CDP capture script**

沿用 `capture-ai-huoke-system-management.mjs` 的连接和错误收集方式。出现 console error、uncaught exception、多页面可见、横向溢出、主操作隐藏或路由/详情不匹配时必须失败。

桌面 1440×900 与移动 390×844 均覆盖：boss-home、enterprise-memory-list、meeting-analysis、employee-home、employee-private-memory、customer-profile、customer-followup-assistant、project-conflict、work-task-tree、ppt-task-routing。脚本使用真实点击或公开原型函数，不只强制 CSS 状态。

- [ ] **Step 3: Extend the full capture**

`capture-v1-prototype.mjs` 至少加入 work-tasks、work-customers、work-projects、kb-memory 的代表状态；深层状态由聚焦脚本负责。

- [ ] **Step 4: Run fast focus verification**

```bash
codex-verify --focus enterprise-work-hub
```

Expected: tests 和结构检查 PASS。

- [ ] **Step 5: Open standard preview**

```bash
codex-preview --route workhub
```

Expected: 打开隔离 worktree 的工作中枢，原生导航可达。

- [ ] **Step 6: Run browser focus gate**

```bash
codex-verify --focus enterprise-work-hub --browser
```

Expected: 双视口截图、served/source SHA、console/runtime、交互和溢出检查全部 PASS。

- [ ] **Step 7: Inspect every PNG**

使用本地图片查看工具逐张检查：抽屉/筛选/任务树不裁切；390px 无横向溢出；账号、可见范围、意向、证据、演示状态清晰；冲突不暗示自动覆盖；PPT 深链确实落入原营销物料页面。发现问题时先补失败断言，再修正并重复 Steps 4–7。

- [ ] **Step 8: Commit verification**

```bash
git add prototype/scripts/capture-enterprise-work-hub.mjs prototype/scripts/capture-v1-prototype.mjs prototype/verification-manifest.json prototype/tests/enterprise-work-hub.test.mjs
git commit -m "test: add enterprise work hub browser coverage"
```

---

## Task 9: Run the full gate and prepare handoff

**Files:** All changed files.

- [ ] **Step 1: Run all prototype tests**

```bash
node --test --test-reporter=dot prototype/tests/*.test.mjs
```

Expected: 全部 PASS，无跳过的新功能契约。

- [ ] **Step 2: Run the canonical full verification**

```bash
codex-verify --full
```

Expected: tests、结构、SHA、桌面和移动浏览器验收全部 PASS。

- [ ] **Step 3: Run final scans**

```bash
git diff --check HEAD~1..HEAD
rg -n "真实已上传|已自动发送|已自动签署|已接入实时会议" prototype/index.html prd/pages/工作中枢-*.md prd/pages/企业大脑-企业记忆.md
git status --short
git log --oneline --decorate -8
```

Expected: diff check 和禁止承诺扫描无输出；工作区干净；日志显示增量提交。

- [ ] **Step 4: Confirm type and ownership consistency**

fixture、renderer、action handler、test、PRD 使用相同枚举；归属必须是：PPT → 营销物料/PPT；报价/合同 → 工作中枢/项目/商业文档；话术 → 工作中枢/客户/跟进助手；会议纪要/聊天 → 企业大脑/企业记忆；所有行动和生成过程 → 工作中枢/我的待办。

- [ ] **Step 5: Report evidence**

交付说明包含 worktree/分支、最终 commit、`codex-verify --full` 结果、桌面/移动截图目录，以及“当前仍是可点击原型，AI 与后端行为为模拟”的明确边界。

---

## Completion criteria

- 老板上传会议音视频演示后，可查看纪要、意向证据、确认候选待办，并在“我的待办”看到下一步。
- 员工可处理私有资料，只看到授权工作；遇到同项目报价冲突可采用/保留/协商，无老板确认门。
- 每个客户只有一个累计、证据可追溯的客户档案，并有跟进助手。
- PPT/报价/合同/话术生成均是带状态和来源的子待办，结果打开正确归属页。
- PPT 任务预填并复用既有营销物料/PPT 的大纲审核流程。
- 企业大脑/企业记忆保存会议与聊天；工作中枢保存执行。
- 1440×900 与 390×844 均通过交互、溢出、console 和视觉检查。
- 页面文案清楚区分演示状态与生产能力。
