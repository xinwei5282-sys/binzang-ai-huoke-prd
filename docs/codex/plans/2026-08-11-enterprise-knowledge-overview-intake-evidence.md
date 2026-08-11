# Enterprise Knowledge Overview Intake Evidence Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“企业大脑 → 知识总览”改为由最新四步企业引导、客户已确认字段、资料任务和待确认候选共同驱动的企业认知总览。

**Architecture:** 继续使用 `prototype/index.html` 单文件原型。新增一个声明式字段映射和纯视图模型构建函数，分别读取现有引导草稿、确认状态、候选状态与资料任务元数据，再由单一渲染函数更新四张企业认知卡和资料证据汇总；上传文件本体不持久化。专项 `node:test` 先锁定结构、状态优先级、持久化和交互契约，最后更新真实浏览器截图脚本验证桌面与手机。

**Tech Stack:** HTML、CSS、原生 JavaScript、Web Storage、Node.js `node:test`、Chrome DevTools Protocol 截图脚本。

---

## 文件责任图

- Modify: `prototype/index.html`
  - 知识总览 DOM、响应式样式、字段映射、候选与资料任务状态、视图模型、渲染和交互。
- Create: `prototype/tests/knowledge-overview-intake-evidence.test.mjs`
  - 锁定四步映射、状态优先级、持久化、能力边界和跳转契约。
- Modify: `prototype/tests/backoffice-design-system.test.mjs`
  - 更新旧的固定质检指标断言，保留三入口导航、资料收件箱和维护中心回归。
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
  - 增加空态、已填写态、资料候选态的知识总览截图与布局审计。
- Create: `validation/v1-prototype/knowledge-overview-*-1440x900.png`
  - 桌面真实浏览器验收图，由截图脚本生成。
- Create: `validation/v1-prototype-mobile/knowledge-overview-*-390x844.png`
  - 手机真实浏览器验收图，由截图脚本生成。

---

### Task 1: 锁定四步企业认知总览结构

**Files:**
- Create: `prototype/tests/knowledge-overview-intake-evidence.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写知识总览结构失败测试**

在新测试文件读取 `../index.html`，截取 `data-kbpanel="overview"`，断言四张卡和资料证据汇总存在，并禁止旧固定指标出现在总览首屏：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const overview = html.match(/<div class="kb-panel show" data-kbpanel="overview">([\s\S]*?)<div class="kb-panel" data-kbpanel="sources">/)?.[1] ?? '';

test('knowledge overview mirrors the four-step enterprise intake', () => {
  for (const section of ['企业身份', '业务、产品与客户', '获客与经营', '目标、资源与品牌']) {
    assert.match(overview, new RegExp(section));
  }
  for (const id of ['knowledgeOverviewSummary', 'knowledgeOverviewCards', 'knowledgeEvidenceSummary']) {
    assert.match(overview, new RegExp(`id="${id}"`));
  }
});

test('knowledge overview does not present fixed demo metrics as customer facts', () => {
  for (const demoValue of ['知识健康度', '286 条', '1,248 次', '已验证可用 241']) {
    assert.doesNotMatch(overview, new RegExp(demoValue.replace(',', ',')));
  }
});
```

- [ ] **Step 2: 运行专项测试并确认失败**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs`

Expected: FAIL，原因是 `knowledgeOverviewSummary`、`knowledgeOverviewCards`、`knowledgeEvidenceSummary` 尚不存在，且旧固定指标仍在首屏。

- [ ] **Step 3: 用四张认知卡替换旧首屏 DOM**

在 `data-kbpanel="overview"` 内保留标题区和三入口导航，新增：

```html
<section class="card pad knowledge-overview-hero" data-hierarchy="current-focus">
  <div class="head">
    <div><h2>AI 已了解的企业信息</h2><p id="knowledgeOverviewSummary">还没有已确认的企业信息。</p></div>
    <button class="btn pri" data-act="supplement-enterprise-overview" data-step="1">补充企业信息</button>
  </div>
</section>
<div class="knowledge-overview-grid" id="knowledgeOverviewCards"></div>
<section class="card pad knowledge-evidence-summary" id="knowledgeEvidenceSummary"></section>
<section class="card pad knowledge-governance-summary" id="knowledgeGovernanceSummary"></section>
```

移除首屏中的 `.kb-init`、固定健康环、固定“今天需要处理”、固定质量百分比和固定知识域覆盖。知识库、资料收件箱、待确认和维护中心现有面板不删除。

- [ ] **Step 4: 添加桌面与手机样式**

在现有知识库样式附近新增：

```css
.knowledge-overview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
.knowledge-overview-card{display:flex;flex-direction:column;min-width:0}
.knowledge-overview-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.knowledge-overview-field{min-width:0;padding:9px 10px;border:1px solid var(--line);border-radius:var(--panel-radius)}
.knowledge-overview-status{display:flex;gap:6px;flex-wrap:wrap}
@media(max-width:760px){.knowledge-overview-grid{grid-template-columns:1fr}.knowledge-overview-fields{grid-template-columns:1fr}}
```

只使用现有 CSS 变量，不增加十六进制颜色。

- [ ] **Step 5: 运行专项测试**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs`

Expected: PASS。旧固定质检指标契约在 Task 5 集中更新。

- [ ] **Step 6: 提交结构改动**

```bash
git add prototype/index.html prototype/tests/knowledge-overview-intake-evidence.test.mjs
git commit -m "feat: reshape enterprise knowledge overview"
```

---

### Task 2: 建立四步字段映射和纯视图模型

**Files:**
- Modify: `prototype/tests/knowledge-overview-intake-evidence.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写字段映射与状态优先级失败测试**

测试从 HTML 中提取 `KNOWLEDGE_OVERVIEW_SECTIONS` 和 `buildKnowledgeOverviewModel` 的源码，用 `Function` 构造真实函数，断言：

```js
test('confirmed values stay separate from candidates and missing fields', () => {
  const model = buildKnowledgeOverviewModel({
    confirmed: true,
    snapshot: {
      licenseCompanyName: { display: '示例科技有限公司', filled: true },
      intakeMainBusiness: { display: '企业经营诊断', filled: true },
    },
    candidates: [{ targetId: 'intakeCustomerPain', value: '获客不稳定', source: '公司介绍.docx', status: 'pending' }],
    tasks: [],
  });
  assert.equal(model.sections[0].confirmedCount, 1);
  assert.equal(model.sections[1].candidateCount, 1);
  assert.equal(model.sections[1].fields.find(item => item.key === 'intakeCustomerPain').status, 'candidate');
  assert.doesNotMatch(model.sections[1].summary, /获客不稳定/);
});
```

另加断言：未完成初步设置时已填字段为 `draft`；候选与已确认值不同为 `conflict`；空字段为 `missing`；未填经营数字不生成 `0`。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs`

Expected: FAIL，原因是字段映射和纯视图模型函数尚不存在。

- [ ] **Step 3: 定义声明式字段映射**

在现有 `ENTERPRISE_INTAKE_FIELD_IDS` 后新增四组定义，字段用 `id` 或 `name` 读取：

```js
const KNOWLEDGE_OVERVIEW_SECTIONS = [
  {id:'identity',step:1,title:'企业身份',fields:[
    ['licenseCompanyName','企业名称'],['licenseCreditCode','统一社会信用代码'],
    ['licenseLegalRepresentative','法定代表人'],['licenseEstablishedDate','成立日期'],
    ['licenseRegisteredAddress','注册地址'],['licenseBusinessScope','经营范围'],
    ['intakeIndustry','所属行业'],['intakeBusinessStage','发展阶段']
  ]},
  {id:'business',step:2,title:'业务、产品与客户',fields:[
    ['intakeMainBusiness','主营业务'],['intakeCoreProduct','核心产品或服务'],
    ['intakeBusinessModes','经营模式'],['intakeTransactionMethod','成交方式'],
    ['intakeTransactionCustomer','付款方'],['intakeCoreCustomer','核心客户'],
    ['intakeCustomerPain','客户痛点'],['intakeVerifiedValue','可验证价值'],
    ['intakeCoreAdvantage','核心优势'],['intakeServiceBoundary','服务边界']
  ]},
  {id:'operations',step:3,title:'获客与经营',fields:[
    ['intakeAcquisitionSources','客户来源'],['intakeBusinessStability','生意稳定程度'],
    ['intakeLeadOwner','跟进负责人'],['intakeImprovementPriority','当前改善重点']
  ],includeActiveModeControls:true},
  {id:'goals',step:4,title:'目标、资源与品牌',fields:[
    ['intakeGoalDirection','目标方向'],['intakeGoalHorizon','目标周期'],
    ['intakeGoalResult','目标结果'],['intakeBudgetPeriod','预算口径'],
    ['intakeExecutionOwner','主要负责人'],['intakeWeeklyTime','每周投入时间'],
    ['intakeExecutionTeamSize','参与人数'],['intakeCapabilities','已有能力'],
    ['intakeExecutionConstraint','执行困难'],['intakeLogoStatus','Logo 情况'],
    ['intakeBrandTone','品牌语气'],['intakeForbiddenClaims','禁止表达']
  ]}
];
```

- [ ] **Step 4: 实现标准化快照和纯模型函数**

实现：

```js
function collectEnterpriseIntakeSnapshot(){
  const snapshot={};
  KNOWLEDGE_OVERVIEW_SECTIONS.forEach(section=>section.fields.forEach(([key,label])=>{
    const controls=[...document.querySelectorAll('[name="'+key+'"]')];
    const control=$('#'+key);
    const selected=controls.filter(enterpriseIntakeControlFilled);
    const display=selected.length
      ? selected.map(item=>item.closest('label')?.textContent.trim()||item.value).join('、')
      : control?.tagName==='SELECT'
        ? control.selectedOptions?.[0]?.textContent.trim()||''
        : control?.value?.trim()||'';
    snapshot[key]={key,label,display,filled:Boolean(display)};
  }));
  return snapshot;
}
```

`buildKnowledgeOverviewModel({confirmed,snapshot,candidates,tasks})` 只读输入并返回：

- `sections[].fields[]`：`confirmed`、`draft`、`candidate`、`conflict`、`missing`。
- `sections[].confirmedCount`、`candidateCount`、`missingCount`。
- `sections[].summary`：只拼接 `confirmed` 字段。
- `totals`：确认、候选、冲突、缺失和资料任务状态计数。

该函数不得读取或写入 DOM、`localStorage` 或全局状态。

- [ ] **Step 5: 运行专项测试**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs`

Expected: PASS，且候选内容不会进入正式摘要。

- [ ] **Step 6: 提交视图模型**

```bash
git add prototype/index.html prototype/tests/knowledge-overview-intake-evidence.test.mjs
git commit -m "feat: derive knowledge overview from intake"
```

---

### Task 3: 持久化资料任务元数据和企业候选

**Files:**
- Modify: `prototype/tests/knowledge-overview-intake-evidence.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写本地状态存储失败测试**

在专项测试中构造内存版 `storage`，断言资料任务与候选可以保存、恢复、更新和取消：

```js
test('evidence metadata and candidates survive reload without file bodies', () => {
  const values=new Map();
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value))};
  const store=createKnowledgeOverviewStore(storage);
  store.saveTasks([{id:'task-1',name:'产品手册.pdf',kind:'业务资料',state:'parsing',candidateCount:0}]);
  store.saveCandidates([{id:'candidate-1',targetId:'intakeCustomerPain',value:'获客不稳定',source:'产品手册.pdf',status:'pending'}]);
  assert.deepEqual(store.loadTasks()[0].state,'parsing');
  assert.equal(store.loadCandidates()[0].status,'pending');
  assert.equal('file' in store.loadTasks()[0],false);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs`

Expected: FAIL，原因是 `createKnowledgeOverviewStore` 尚不存在。

- [ ] **Step 3: 实现独立状态存储**

新增：

```js
const KNOWLEDGE_EVIDENCE_TASKS_KEY='aiHuokeKnowledgeEvidenceTasksV1';
const KNOWLEDGE_CANDIDATES_KEY='aiHuokeKnowledgeCandidatesV1';
function createKnowledgeOverviewStore(storage){
  const load=key=>{try{const value=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch(_){return [];}};
  const save=(key,value)=>storage.setItem(key,JSON.stringify(value));
  return {
    loadTasks:()=>load(KNOWLEDGE_EVIDENCE_TASKS_KEY),
    saveTasks:value=>save(KNOWLEDGE_EVIDENCE_TASKS_KEY,value),
    loadCandidates:()=>load(KNOWLEDGE_CANDIDATES_KEY),
    saveCandidates:value=>save(KNOWLEDGE_CANDIDATES_KEY,value),
  };
}
```

状态对象只保存任务 ID、文件名或内容源地址、资料类型、状态、说明、候选数量和更新时间。禁止保存 `File`、Blob、文件正文或预览 URL。

- [ ] **Step 4: 改造资料任务函数以同步元数据**

让 `renderOnboardingAsyncTask` 接受稳定任务 ID；`setOnboardingTaskState` 同步更新存储；`queueOnboardingMaterial` 与 `queueOnboardingSource` 创建元数据；取消、授权、改为文章和重试均更新同一个任务。

页面初始化时调用 `restoreKnowledgeEvidenceTasks()` 重建任务行。恢复后的“解析中”任务显示上次状态和“原型任务已恢复”，不假装后台仍在真实运行。

- [ ] **Step 5: 改造候选采用与忽略**

`applyEnterpriseIntakeCandidate` 新增或更新持久候选。`adopt-enterprise-intake-candidate` 将状态改为 `adopted` 并写入表单草稿；新增 `dismiss-enterprise-intake-candidate` 分支将状态改为 `ignored`。如果正式值已存在且不同，候选状态改为 `conflict`，页面并列显示两值。

- [ ] **Step 6: 运行专项测试和引导回归**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS；四步引导、候选采用和诊断完整度契约不回退。

- [ ] **Step 7: 提交状态持久化**

```bash
git add prototype/index.html prototype/tests/knowledge-overview-intake-evidence.test.mjs
git commit -m "feat: persist enterprise evidence metadata"
```

---

### Task 4: 渲染总览并连接补充与治理入口

**Files:**
- Modify: `prototype/tests/knowledge-overview-intake-evidence.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写渲染与交互失败测试**

静态断言以下符号和动作存在：

```js
for (const fn of ['renderEnterpriseKnowledgeOverview','openEnterpriseOverviewStep','renderKnowledgeEvidenceSummary']) {
  assert.match(html,new RegExp(`function ${fn}\\(`));
}
for (const action of ['toggle-knowledge-overview-card','supplement-enterprise-overview','review-enterprise-candidates']) {
  assert.match(html,new RegExp(`case '${action}'`));
}
```

再断言 `saveEnterpriseIntakeDraft`、`restoreEnterpriseIntakeDraft`、`setOnboardingTaskState`、候选采用/忽略和 `showKbTab('overview')` 的路径最终会调用总览渲染。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs`

Expected: FAIL，原因是渲染和三个交互分支尚不存在。

- [ ] **Step 3: 实现单一渲染入口**

`renderEnterpriseKnowledgeOverview()` 执行：

1. 读取 `aiHuokeQuickProfileCompletedV1` 判断表单字段是 `confirmed` 还是 `draft`。
2. 调用 `collectEnterpriseIntakeSnapshot()`。
3. 从 store 读取候选和资料任务。
4. 调用纯 `buildKnowledgeOverviewModel()`。
5. 更新顶部真实汇总、四张卡、资料证据条和治理摘要。

`renderKnowledgeEvidenceSummary(model)` 只负责把 `model.totals` 渲染为已上传、解析中、待确认、失败和等待授权状态及三个操作入口，不读取或改写任务存储。

字段值全部使用 `safeText`；长文本默认截断并提供展开，不把候选值拼进正式摘要。

- [ ] **Step 4: 实现补充、展开和候选跳转**

- `toggle-knowledge-overview-card`：切换对应卡片详情。
- `supplement-enterprise-overview`：调用 `openEnterpriseOverviewStep(Number(el.dataset.step))`，恢复草稿并打开指定引导步骤。
- `review-enterprise-candidates`：调用 `showKbTab('review')`。
- 资料证据条的“查看资料”调用 `showKbTab('sources')`，“继续上传”复用 `open-kb-upload`。

- [ ] **Step 5: 在所有状态变化点刷新总览**

在以下位置调用 `renderEnterpriseKnowledgeOverview()`：

- 页面初始化与 `restoreEnterpriseIntakeDraft()` 后。
- `saveEnterpriseIntakeDraft()` 后。
- `confirm-modal-profile` 保存后。
- 资料任务创建、更新、取消后。
- 候选创建、采用、忽略和冲突处理后。
- `showKbTab('overview')` 时。

- [ ] **Step 6: 运行专项与企业引导回归**

Run: `node --test prototype/tests/knowledge-overview-intake-evidence.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: 全部 PASS；旧固定质量契约将在 Task 5 更新后再运行完整测试。

- [ ] **Step 7: 提交渲染和交互**

```bash
git add prototype/index.html prototype/tests/knowledge-overview-intake-evidence.test.mjs
git commit -m "feat: connect enterprise overview interactions"
```

---

### Task 5: 更新旧质检契约和能力边界

**Files:**
- Modify: `prototype/tests/backoffice-design-system.test.mjs`
- Modify: `prototype/tests/knowledge-overview-intake-evidence.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 把旧固定质量断言改为真实状态边界**

将 `enterprise knowledge exposes AI quality assurance and task regression signals` 测试改为断言：

```js
test('enterprise knowledge distinguishes real status from pending quality capabilities', () => {
  const section = html.match(/<section class="page" data-p="kb"([\s\S]*?)<section class="page" data-p="avatar"/)?.[1] ?? '';
  for (const label of ['已确认', '待确认', '待补充', '冲突', '资料收件箱', '维护中心']) {
    assert.match(section,new RegExp(label));
  }
  assert.match(section,/原型演示 · 待接入/);
  for (const fixed of ['已验证可用 241','低置信度 23','来源一致性 92%','黄金任务回归集.*94%']) {
    assert.doesNotMatch(section,new RegExp(fixed));
  }
});
```

- [ ] **Step 2: 运行旧测试并确认按新契约失败**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs`

Expected: FAIL，原因是生产 HTML 仍包含旧固定质量指标或旧测试仍要求它们。

- [ ] **Step 3: 清理旧固定质量渲染**

删除或停用 `KB_QUALITY`、`renderKbQuality()` 和固定黄金回归百分比弹窗。保留自动质检功能说明与“原型演示 · 待接入”边界；维护中心继续显示现有模拟治理事项，但不得与客户上传状态合并成真实统计。

- [ ] **Step 4: 运行知识库回归**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/unified-knowledge-onboarding.test.mjs prototype/tests/enterprise-brain-p0-gap.test.mjs`

Expected: PASS，三入口导航、资料收件箱、正式知识、待确认和维护中心仍然存在。

- [ ] **Step 5: 提交能力边界调整**

```bash
git add prototype/index.html prototype/tests/backoffice-design-system.test.mjs prototype/tests/knowledge-overview-intake-evidence.test.mjs
git commit -m "fix: remove simulated knowledge quality claims"
```

---

### Task 6: 真实浏览器验证桌面与手机布局

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Create: `validation/v1-prototype/knowledge-overview-empty-1440x900.png`
- Create: `validation/v1-prototype/knowledge-overview-confirmed-1440x900.png`
- Create: `validation/v1-prototype/knowledge-overview-candidate-1440x900.png`
- Create: `validation/v1-prototype-mobile/knowledge-overview-empty-390x844.png`
- Create: `validation/v1-prototype-mobile/knowledge-overview-confirmed-390x844.png`
- Create: `validation/v1-prototype-mobile/knowledge-overview-candidate-390x844.png`

- [ ] **Step 1: 扩展截图前的状态清理**

截图脚本开头除现有引导键外，再清理：

```js
localStorage.removeItem('aiHuokeKnowledgeEvidenceTasksV1');
localStorage.removeItem('aiHuokeKnowledgeCandidatesV1');
```

- [ ] **Step 2: 增加三种知识总览截图场景**

1. 空态：清空引导草稿、候选和任务，进入 `kb/overview`。
2. 已填写态：填写四步关键字段并完成初步设置，再进入知识总览。
3. 候选态：上传公司介绍和产品手册，等待候选生成但不采用，再进入知识总览。

每个场景记录：

```js
{
  visiblePage: document.querySelector('.page.show')?.dataset.p,
  cardCount: document.querySelectorAll('#knowledgeOverviewCards .knowledge-overview-card').length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  confirmedText: document.querySelector('#knowledgeOverviewSummary')?.textContent || '',
  candidateVisible: document.querySelector('#knowledgeOverviewCards')?.textContent.includes('待确认') || false
}
```

- [ ] **Step 3: 启动隔离的本地页面和调试浏览器**

Run: `python3 -m http.server 8010 --directory prototype`

Expected: 服务保持运行，`http://127.0.0.1:8010/index.html` 可访问。

Run: `open -na 'Google Chrome' --args --remote-debugging-port=9228 --user-data-dir=/private/tmp/ai-huoke-knowledge-overview-cdp --window-size=1440,900 http://127.0.0.1:8010/index.html`

Expected: 打开带独立用户目录的可见浏览器窗口，不使用 headless；`curl --max-time 5 -s http://127.0.0.1:9228/json` 返回包含原型页面的调试目标。不得直接执行 Chrome 二进制，也不得使用 `officecli view ... screenshot`。

- [ ] **Step 4: 生成桌面截图**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 1440 --height 900`

Expected: 三张知识总览桌面图生成；脚本报告 4 张认知卡、无横向溢出、无控制台异常。

- [ ] **Step 5: 生成手机截图**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype-mobile --width 390 --height 844`

Expected: 三张知识总览手机图生成；卡片单列、按钮可见、无横向溢出。

- [ ] **Step 6: 逐张查看真实渲染**

使用本地图片查看工具检查六张图片，确认：

- 第一屏优先显示企业认知，而不是固定健康分。
- 四张卡层级清楚，长文本未挤压按钮。
- 候选与已确认状态颜色和文案可区分。
- 390 像素宽度下无横向滚动，点击区不小于现有移动端规范。

- [ ] **Step 7: 提交截图脚本和验收图**

```bash
git add prototype/scripts/capture-v1-prototype.mjs validation/v1-prototype/knowledge-overview-*.png validation/v1-prototype-mobile/knowledge-overview-*.png
git commit -m "test: capture intake-linked knowledge overview"
```

---

### Task 7: 全量回归与交付收口

**Files:**
- Modify only if checks reveal scoped defects: `prototype/index.html`
- Modify only if checks reveal scoped defects: `prototype/tests/knowledge-overview-intake-evidence.test.mjs`
- Modify only if checks reveal scoped defects: `prototype/scripts/capture-v1-prototype.mjs`

- [ ] **Step 1: 运行 JavaScript 语法检查**

提取 `prototype/index.html` 的内联脚本到临时文件后运行：

Run: `node --check /private/tmp/ai-huoke-knowledge-overview-inline.js`

Expected: exit code 0，无语法错误。

- [ ] **Step 2: 运行完整自动测试**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 全部 PASS，无失败、跳过或未捕获异常。

- [ ] **Step 3: 检查差异质量**

Run: `git diff --check`

Expected: 无尾随空格或空白错误。

- [ ] **Step 4: 核对工作区边界**

Run: `git status --short`

Expected: 本任务提交只包含计划中列出的原型、测试、截图脚本和验收图；用户原有未提交改动仍被保留，未被本任务提交吸收。

- [ ] **Step 5: 最终提交必要修复**

仅当 Step 1–4 发现本任务范围内缺陷时提交：

```bash
git add prototype/index.html prototype/tests/knowledge-overview-intake-evidence.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/scripts/capture-v1-prototype.mjs
git commit -m "fix: close knowledge overview regressions"
```

- [ ] **Step 6: 交付汇报**

汇报必须分别说明：

- 改了什么：四步企业认知卡、资料证据汇总、候选与任务状态、治理边界。
- 验证了什么：专项测试、完整测试、JavaScript 语法、1440×900 和 390×844 真实渲染。
- 仍未接入什么：真实 OCR、文档解析、官网/公众号采集、后端持久化和自动质检。
