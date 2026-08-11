# Generated Content as Formal Knowledge Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将系统生成内容直接纳入正式企业知识，自动归入现有主分组，并取消独立的“内容资产”展示层。

**Architecture:** 复用现有企业大脑状态和正式知识列表。`recordGeneratedContent` 在生成时写入 `formal=true`、语义主分组和“系统生成内容”类型；渲染层将这些条目注入现有正式知识列表。修改、发布、删除仍作用于同一条目，软删除后从可检索正式知识中移除但保留审计。

**Tech Stack:** 单文件 HTML/CSS/JavaScript 原型、Node.js `node:test`、Chrome DevTools Protocol 真实浏览器截图与交互验收。

---

## 文件责任图

- Modify: `prototype/index.html`
  - 将企业大脑二级入口“内容与知识”改为“企业知识”。
  - 取消独立内容资产卡片，将生成内容注入正式知识列表。
  - 为生成内容保存正式状态、主分组、类型、版本、依据、评分和审计。
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
  - 锁定五个企业大脑入口的新名称和顺序。
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
  - 更新企业大脑导航文案断言。
- Modify: `prototype/tests/backoffice-design-system.test.mjs`
  - 将旧“内容与知识”的验收语义更新为“企业知识”。
- Modify: `prototype/tests/enterprise-brain-evolution-v1.test.mjs`
  - 增加生成即正式入库、自动分组、硬事实不反向覆盖和软删除退出检索的行为测试。
- Modify: `prototype/scripts/capture-enterprise-brain-evolution.mjs`
  - 验证生成内容出现在对应正式知识分组，软删除后不再可见或复用。

### Task 1: 锁定导航与正式知识合并契约

**Files:**
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Modify: `prototype/tests/backoffice-design-system.test.mjs`
- Modify: `prototype/tests/enterprise-brain-evolution-v1.test.mjs`

- [ ] **Step 1: Write the failing navigation assertions**

```js
assert.equal(labels.join('|'), '诊断总览|企业认知|企业知识|外部情报|进化与治理');
assert.doesNotMatch(contentPanel, /内容资产记录|id="enterpriseBrainContentAssets"/);
```

- [ ] **Step 2: Write the failing state assertions**

```js
const item = brain.recordGeneratedContent({ title: '新品海报', type: '海报', text: '产品套餐与服务' });
assert.equal(item.formal, true);
assert.equal(item.group, '产品与服务');
assert.equal(item.knowledgeType, '系统生成内容');
assert.equal(item.reusable, true);
assert.equal(item.factAuthority, false);
```

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: FAIL because the navigation still says “内容与知识” and generated records do not yet expose formal-knowledge metadata.

### Task 2: 将生成内容写入正式知识模型

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-brain-evolution-v1.test.mjs`

- [ ] **Step 1: Extend `recordGeneratedContent`**

```js
function recordGeneratedContent({title='未命名内容',type='内容',source='系统生成',text=''}={}) {
  const group=classifyBrainKnowledge({text:title+' '+text,type});
  const asset={
    id:enterpriseBrainId('content'),title,type,source,text,
    formal:true,reusable:true,factAuthority:false,
    knowledgeType:'系统生成内容',group,status:'active',version:1,
    processCount:0,createdAt:new Date().toISOString(),audit:[]
  };
  enterpriseBrainEvolutionState.contentAssets.unshift(asset);
  reprocessContentAsset(asset,'generated','生成后直接进入正式知识');
  return asset;
}
```

- [ ] **Step 2: Preserve the same formal item across lifecycle changes**

`recordContentRevision` increments `version`, `recordContentPublication` keeps `formal=true`, and `softDeleteContentAsset` sets `formal=false`, `reusable=false`, and preserves the audit trail. None of these functions writes generated text into the enterprise-profile or confirmed-fact stores.

- [ ] **Step 3: Run model tests and verify GREEN**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: PASS for formal state, grouping, lifecycle and fact-authority boundaries.

### Task 3: 合并企业知识界面

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Test: `prototype/tests/backoffice-design-system.test.mjs`

- [ ] **Step 1: Rename the secondary entry**

Replace the visible label in both the left rail and page navigation with `企业知识`. Keep `data-kbtab="content"` as an internal compatibility key so existing routes remain valid.

- [ ] **Step 2: Remove the standalone asset card**

Remove `#enterpriseBrainContentAssets`, `#brainContentAssetCount`, and `#brainContentAssetList` from the top-level content panel. Keep the seven approved group definitions and the existing source/review/formal-knowledge views.

- [ ] **Step 3: Render generated items inside the formal knowledge list**

```js
function renderGeneratedFormalKnowledge() {
  const list=$('#kbList2');
  list.querySelectorAll('[data-generated-knowledge]').forEach(item=>item.remove());
  enterpriseBrainEvolutionState.contentAssets
    .filter(item=>item.formal&&item.reusable&&item.status!=='deleted')
    .forEach(item=>list.insertAdjacentHTML('afterbegin', generatedKnowledgeRow(item)));
}
```

Each row must contain `data-group`, `data-type="generated"`, the main group, `系统生成内容` tag, version, score, source and lifecycle actions.

- [ ] **Step 4: Align the seven visible groups**

Change the formal-knowledge group rail to exactly:

```text
企业基础事实 / 产品与服务 / 客户与市场 / 品牌与内容规范 /
销售与经营规则 / 案例与证明材料 / 外部环境与行业情报
```

Update `groupOptions`, sample `data-group` values and filter labels consistently.

- [ ] **Step 5: Run interface contract tests**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS with five approved entries and no standalone content-asset card.

### Task 4: 保留复盘与软删除能力

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-brain-evolution-v1.test.mjs`

- [ ] **Step 1: Move lifecycle actions to generated formal-knowledge rows**

Generated rows expose `查看依据`, `记录修改`, and `软删除`. The existing actions call the same revision and deletion functions using the formal knowledge item id.

- [ ] **Step 2: Keep review signals in evolution governance**

Deletion reasons that indicate factual or compliance problems continue creating `pending_confirmation` learning candidates. Ordinary expiry or duplicate deletion does not automatically create a negative rule.

- [ ] **Step 3: Verify removal from formal retrieval**

After soft deletion, call `renderGeneratedFormalKnowledge()` and assert the row is absent while the state still contains the audit record with `formal=false` and `reusable=false`.

- [ ] **Step 4: Run focused lifecycle tests**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: PASS for revision, publication, soft deletion, learning-candidate and audit behavior.

### Task 5: 全量回归与真实浏览器验收

**Files:**
- Modify: `prototype/scripts/capture-enterprise-brain-evolution.mjs`
- Output: `validation/enterprise-brain-evolution/*.png`
- Output: `validation/enterprise-brain-evolution/audit-*.json`

- [ ] **Step 1: Run syntax, full tests and diff checks**

Run:

```bash
node -e "const s=require('fs').readFileSync('prototype/index.html','utf8');const b=s.match(/<script>\\n([\\s\\S]*?)<\\/script>/g).at(-1).replace(/^<script>\\n/,'').replace(/<\\/script>$/,'');new Function(b)"
node --test prototype/tests/*.test.mjs
git diff --check -- prototype/index.html prototype/tests prototype/scripts
```

Expected: syntax succeeds, all tests pass, and diff check returns no output.

- [ ] **Step 2: Capture desktop and mobile**

Run:

```bash
node prototype/scripts/capture-enterprise-brain-evolution.mjs --port 9228 --width 1440 --height 900 --out-dir validation/enterprise-brain-evolution
node prototype/scripts/capture-enterprise-brain-evolution.mjs --port 9228 --width 390 --height 844 --out-dir validation/enterprise-brain-evolution
```

Expected: the generated item appears under its semantic formal-knowledge group, no standalone asset card is visible, soft deletion removes it from formal retrieval, and both viewports have zero page-level horizontal overflow, console errors or runtime exceptions.

- [ ] **Step 3: Verify local server and source identity**

Run:

```bash
curl -s http://127.0.0.1:8010/index.html | shasum -a 256
shasum -a 256 prototype/index.html
```

Expected: both SHA-256 values match.
