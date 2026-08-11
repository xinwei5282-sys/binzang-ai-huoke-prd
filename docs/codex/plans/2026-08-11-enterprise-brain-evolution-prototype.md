# Enterprise Brain Evolution Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将企业档案、知识、系统生成内容、外部情报、评分与受控自我学习收口到一个可操作的企业大脑原型。

**Architecture:** 保留单文件原型的现有路由和本地状态模式，以 `kb` 作为企业大脑唯一一级路由，用五个 `kbtab` 承载诊断、认知、内容知识、外部情报和进化治理。新增 `aiHuokeEnterpriseBrainEvolutionV1` 本地模型统一保存内容资产、情报候选、学习候选和可解释评分；候选的审核与软删除都保留来源和审计信息。

**Tech Stack:** HTML/CSS/Vanilla JavaScript、`localStorage`、Node.js `node:test`、Chrome DevTools Protocol 真实浏览器验收。

---

## 文件责任图

- Modify: `prototype/index.html` — 导航、五个企业大脑页面、进化状态模型、评分、内容记录、软删除、外部情报和审核交互。
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs` — 一级/二级导航、自我进化边界和生成内容接入契约。
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs` — 诊断页迁移、补充信息、每日提醒与旧路由兼容。
- Create: `prototype/tests/enterprise-brain-evolution-v1.test.mjs` — 执行真实本地模型函数，验证评分、软删除、自动分组、情报确认和学习边界。
- Modify: `prototype/scripts/capture-v1-prototype.mjs` — 新导航、五页切换、内容处理、情报审核、软删除与双端布局审计。
- Reuse: `validation/v1-prototype/` — 存放桌面端和手机端截图与 JSON 审计。

### Task 1: 收口企业大脑导航与路由

**Files:**
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing navigation tests**

测试必须断言：

```js
assert.equal((nav.match(/<button type="button" data-v=/g) || []).length, 6);
assert.doesNotMatch(nav, /data-v="enterprise-profile"/);
assert.match(nav, /data-v="kb"[\s\S]*?>企业大脑/);
for (const label of ['诊断总览','企业认知','内容与知识','外部情报','进化与治理']) {
  assert.match(brainNav, new RegExp(`>${label}<`));
}
```

诊断测试同时断言 `continue-deep-diagnosis`、`confirm-modal-profile` 和 `confirm-profile` 都进入 `go('kb');showKbTab('diagnosis')`。

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，因为仍有独立企业档案和旧的三项知识菜单。

- [ ] **Step 3: Implement the navigation and compatibility redirect**

修改左侧导航为五个 `data-kbtab`：

```html
<button data-kbtab="diagnosis">诊断总览</button>
<button data-kbtab="cognition">企业认知</button>
<button data-kbtab="content">内容与知识</button>
<button data-kbtab="intelligence">外部情报</button>
<button data-kbtab="evolution">进化与治理</button>
```

点击一级 `kb` 时执行 `showKbTab('diagnosis')`。在 `go(v)` 入口增加兼容判定：

```js
if(v==='enterprise-profile'){v='kb';requestedKbTab='diagnosis';}
```

旧跳转全部改为新路径，兼容分支只承接遗留调用。

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

### Task 2: 建立五个企业大脑页面

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

- [ ] **Step 1: Write failing page-responsibility tests**

每个 `data-kbpanel` 必须存在且只出现一次：

```js
for (const panel of ['diagnosis','cognition','content','intelligence','evolution']) {
  assert.equal((html.match(new RegExp(`data-kbpanel="${panel}"`, 'g')) || []).length, 1);
}
```

并验证诊断进度、四步补充入口、品牌视觉、正式知识、内容资产、外部情报和进化候选的责任文案。

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

Expected: FAIL，因为尚未存在五个面板。

- [ ] **Step 3: Move and compose existing views**

- 将现有诊断 DOM 迁入 `data-kbpanel="diagnosis"`。
- 将企业信息摘要、补充按钮与现有品牌视觉迁入 `data-kbpanel="cognition"`。
- 将现有知识总览、资料、知识库数据视图收入 `data-kbpanel="content"`。
- 新建 `data-kbpanel="intelligence"` 和 `data-kbpanel="evolution"`。
- 删除独立企业档案的可见导航和页面标题，保留必要的内部兼容路由映射。

- [ ] **Step 4: Update `showKbTab`**

`showKbTab(id='diagnosis')` 直接切换五个顶层面板；“内容与知识”内部继续用现有 `sources/domains/review/agents` 视图，但它们不再占据企业大脑二级导航。

- [ ] **Step 5: Run focused tests**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

### Task 3: 实现进化状态、自动分组与三层评分

**Files:**
- Create: `prototype/tests/enterprise-brain-evolution-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write behavior-first tests**

从 HTML 中提取与执行纯函数，用手工给定的样本断言：

```js
assert.equal(classifyBrainKnowledge({text:'标准服务价格 2880 元'}).group, '产品与服务');
const highTrustFixture={sourceAuthority:.8,confirmed:1,freshness:1,consistency:.8,scope:1,rights:1};
const knowledgeScore=scoreKnowledgeItem(highTrustFixture,'2026-08-11T10:00:00.000Z');
assert.equal(knowledgeScore.score, 92);
assert.equal(knowledgeScore.band, 'high');
assert.ok(knowledgeScore.reasons.includes('已人工确认'));
const repeatedEditFixture={repetition:1,evidence:.8,outcome:.7,clarity:1,reuse:1,risk:.5};
const learningScore=scoreLearningCandidate(repeatedEditFixture,'2026-08-11T10:00:00.000Z');
assert.equal(learningScore.score, 87);
assert.equal(learningScore.band, 'priority');
```

期望值必须为人工计算的字面量，不复用生产函数生成预期值。

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: FAIL，因为模型和评分函数尚未存在。

- [ ] **Step 3: Add the local evolution model**

```js
const enterpriseBrainEvolutionKey='aiHuokeEnterpriseBrainEvolutionV1';
const defaultEnterpriseBrainEvolution={
  contentAssets:[], intelligenceCandidates:[], learningCandidates:[],
  weights:{knowledge:{source:25,confirmed:25,freshness:20,consistency:15,scope:10,rights:5},content:{facts:25,brand:15,compliance:20,completeness:15,humanEdit:10,outcome:15},learning:{repetition:25,evidence:25,outcome:20,clarity:15,reuse:10,risk:5}}
};
```

增加 `loadEnterpriseBrainEvolution`、`saveEnterpriseBrainEvolution`、`classifyBrainKnowledge`、`scoreKnowledgeItem`、`scoreContentAsset`、`scoreLearningCandidate` 和 `scoreBand`。所有评分结果返回 `score`、`band`、`reasons`、`deductions`、`evidence`、`updatedAt`，不只返回数字。

- [ ] **Step 4: Keep weight changes manual**

生产代码仅提供 `suggestScoreWeightChange()` 生成候选，不定义自动写入 `weights` 的路径。

- [ ] **Step 5: Run behavior tests and verify GREEN**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: PASS。

### Task 4: 记录所有系统生成内容并处理删除

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-brain-evolution-v1.test.mjs`

- [ ] **Step 1: Write failing lifecycle tests**

验证：

```js
const asset=recordGeneratedContent({type:'poster',title:'夏季活动',knowledgeRefs:['价格表 v4']});
assert.equal(asset.status, 'generated');
assert.equal(asset.processCount, 1);
softDeleteContentAsset(asset.id, '事实错误', '蔚然');
assert.equal(asset.status, 'deleted');
assert.equal(asset.reusable, false);
assert.equal(asset.processCount, 2);
assert.equal(state.learningCandidates.at(0).kind, 'prohibited_rule');
```

另外断言“活动过期”不会生成质量禁用规则，防止把所有删除都当作负向学习。

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: FAIL，因为内容生命周期函数尚未存在。

- [ ] **Step 3: Implement lifecycle functions**

增加 `recordGeneratedContent`、`recordContentRevision`、`recordContentPublication`、`softDeleteContentAsset` 和 `reprocessContentAsset`。软删除必须写入 `deletedAt`、`deletedBy`、`deleteReason`、`reusable:false` 和审计时间线。

- [ ] **Step 4: Connect every prototype generation completion path**

在图文、朋友圈、海报、公众号、PPT、AI 视频/脚本、销售话术和经营计划的生成完成回调中统一调用以下契约：

```js
recordGeneratedContent({sourceTaskId,type,title,version:'v1.0',knowledgeRefs,status:'generated'});
```

`sourceTaskId`、`type`、`title` 和 `knowledgeRefs` 由各生成回调的当前任务与知识上下文提供。重复调用通过 `sourceTaskId + version` 去重。

- [ ] **Step 5: Add content asset UI**

在“内容与知识”展示内容类型、状态、两次处理记录、知识引用、质量/效果分、学习状态和软删除操作。删除时必须选择原因，不提供无记录的硬删除。

- [ ] **Step 6: Run tests and verify GREEN**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: PASS。

### Task 5: 实现外部情报和进化治理交互

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-brain-evolution-v1.test.mjs`

- [ ] **Step 1: Write failing intelligence tests**

测试 `queueExternalIntelligence`、`confirmIntelligenceCandidate`、`rejectIntelligenceCandidate` 和 `retryIntelligenceCollection`，并断言未确认情报 `formal:false` 且 `usableForFacts:false`，人工确认后才设为 `formal:true`并自动分组。

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: FAIL，因为情报状态函数尚未存在。

- [ ] **Step 3: Implement external intelligence**

外部情报面板包含“立即采集”、“添加链接”、竞对/政策/行业三类筛选、异步状态、来源、时效、适用地区、知识可信度和 AI 影响分析。原型中的定期自动采集标记为“任务演示 · 待接入”，不伪装已连接真实外站。

- [ ] **Step 4: Implement evolution governance**

“进化与治理”按学习价值分从高到低展示候选，每条显示来源、证据、扣分项、影响范围和审核动作。“采用”仅将候选变为“已提交正式知识/规则确认”；评分权重候选必须单独人工确认。

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test prototype/tests/enterprise-brain-evolution-v1.test.mjs`

Expected: PASS。

### Task 6: 真实浏览器与完整回归

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Output: `validation/v1-prototype/layout-audit-1440x900.json`
- Output: `validation/v1-prototype/layout-audit-390x844.json`

- [ ] **Step 1: Update browser audit**

真实点击并断言：

1. 左侧只有 6 个一级业务入口，没有独立企业档案。
2. 点击企业大脑默认进入诊断总览，五个二级菜单均可切换。
3. 每日深度诊断提醒和补充信息返回新诊断位置。
4. 生成一份海报或图文后，内容资产数量增加且有首次处理分。
5. 软删除后内容 `reusable=false`，删除原因与二次处理记录存在。
6. 添加外部链接后生成候选，人工确认后才显示“已提交入脑”。
7. 进化候选展示三类评分、证据、扣分项和人工确认边界。

- [ ] **Step 2: Run desktop capture**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9229 --width 1440 --height 900 --out-dir validation/v1-prototype`

Expected: capture PASS，并产生企业大脑五页与关键交互截图。

- [ ] **Step 3: Run mobile capture**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9229 --width 390 --height 844 --out-dir validation/v1-prototype`

Expected: capture PASS，无横向溢出、重复可见页面、控制台错误或未捕获异常。

- [ ] **Step 4: Run the complete suite**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 0 failures。

- [ ] **Step 5: Check patch formatting and scope**

Run: `git diff --check -- prototype/index.html prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/enterprise-brain-evolution-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs`

Expected: exit code 0。由于真源单文件已包含用户的未提交改动，实现文件保留在本地工作区，不整体提交或覆盖无关改动。
