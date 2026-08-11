# Enterprise Profile Two-Level Diagnosis Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 不改现有引导页，将企业档案收口为“诊断结果 + 品牌视觉”，并实现 40% 自动基础诊断、80% 且六维均达 60% 后手动触发深度诊断的原型交互。

**Architecture:** 继续以 `prototype/index.html` 作为单文件原型真源；用声明式的六维字段映射计算完整度，用一个小型诊断状态对象统一驱动页面文案、按钮和生成状态。“补充企业信息”复用现有引导表单弹窗作为编辑器，只新增打开、定位和返回逻辑，不修改其四步结构。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js `node:test`、现有 CDP 真实浏览器截图脚本。

---

## 文件责任图

- **Modify:** `prototype/index.html`
  - 收口企业档案二级导航。
  - 提供诊断结果页标记、样式、完整度计算、状态机、自动/手动触发与补充入口。
  - 保留品牌视觉面板和引导表单现有结构。
- **Modify:** `prototype/tests/enterprise-diagnosis-v1.test.mjs`
  - 将旧的四菜单、手动完成六维诊断断言更新为双菜单和两层门槛断言。
  - 保留对引导页四步表单的回归检查。
- **Modify:** `prototype/scripts/capture-v1-prototype.mjs`
  - 增加诊断结果页的低完整度、基础诊断、深度解锁和补充资料回跳交互验收。
- **Generated:** `validation/v1-prototype/enterprise-profile-*.png`
  - 1440×900 和 390×844 真实渲染证据，不作为业务真源。

### Task 1: 用失败测试锁定双菜单与引导不变

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 写双菜单失败测试**

在测试文件中新增明确断言：

```js
test('enterprise profile keeps only diagnosis results and brand visual menus', () => {
  const nav = html.match(/data-nav-sub="enterprise-profile"[\s\S]*?<\/div>/)?.[0] || '';
  const subnav = html.match(/data-subnav="enterprise-profile"[\s\S]*?<\/div>/)?.[0] || '';
  for (const source of [nav, subnav]) {
    assert.match(source, />诊断结果</);
    assert.match(source, />品牌视觉</);
    assert.doesNotMatch(source, />快速画像|>六维诊断|>企业资料/);
  }
});
```

- [ ] **Step 2: 写“引导页不变”回归断言**

保留并强化现有四步入口测试：

```js
for (const label of ['企业身份', '业务、产品与客户', '获客与经营', '目标、资源与品牌']) {
  assert.match(html, new RegExp(label));
}
assert.match(html, /Math\.max\(1,Math\.min\(4,step\)\)/);
```

- [ ] **Step 3: 运行定向测试并确认失败**

Run: `node --test --test-name-pattern="enterprise profile keeps only|enterprise intake uses four" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: 双菜单测试 FAIL，原因是页面仍含四个菜单；四步引导测试 PASS。

- [ ] **Step 4: 提交测试锁定**

```bash
git add prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "test: define enterprise profile diagnosis navigation"
```

### Task 2: 收口导航并搭建诊断结果页

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 将侧边导航和页内导航改为两项**

将两处 `enterprise-profile` 导航改为：

```html
<button class="on" data-act="nav-subview" data-parent="enterprise-profile" data-subview="profile-diagnosis">诊断结果</button>
<button data-act="nav-subview" data-parent="enterprise-profile" data-subview="profile-brand">品牌视觉</button>
```

页内 `subnav` 使用同样的子页 ID，并让 `profile-diagnosis` 成为默认 `.show` 面板。移除 `profile-quick` 与 `profile-files` 子页标记，但不删除引导弹窗中的表单字段。

- [ ] **Step 2: 将诊断面板替换为四区域骨架**

添加稳定 DOM ID：

```html
<div id="diagnosisOverallProgress" class="diagnosis-progress-card">...</div>
<div id="diagnosisDimensionGrid" class="diagnosis-dimension-grid"></div>
<div id="diagnosisMissingList" class="diagnosis-missing-list"></div>
<div id="diagnosisResultPanel" class="diagnosis-result-panel"></div>
<button class="btn pri" data-act="supplement-enterprise-profile">补充企业信息</button>
<button class="btn pri" id="startDeepDiagnosisBtn" data-act="start-deep-diagnosis" disabled>开始深度诊断</button>
```

- [ ] **Step 3: 添加布局样式**

为整体进度、六维卡片、补充清单和诊断结果增加独立 class，并保持现有 `card` / `bdg` / `btn` 设计语言。桌面端六维使用 3 列，不将长文案塞入进度条内。

- [ ] **Step 4: 运行导航测试**

Run: `node --test --test-name-pattern="enterprise profile keeps only|enterprise intake uses four" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交导航与页面骨架**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "feat: consolidate enterprise profile navigation"
```

### Task 3: 实现总完整度、六维完整度和 AI 补充清单

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 先写计算口径失败测试**

```js
test('diagnosis completeness is derived from confirmed six-dimension fields', () => {
  for (const fn of ['getEnterpriseDiagnosisCompleteness', 'renderEnterpriseDiagnosis', 'buildDiagnosisMissingItems']) {
    assert.match(html, new RegExp(`function ${fn}\\(`));
  }
  assert.match(html, /overall\s*>=\s*40/);
  assert.match(html, /overall\s*>=\s*80/);
  assert.match(html, /every\([^)]*score\s*>=\s*60/);
  assert.match(html, /未确认的 AI 候选不计入/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test --test-name-pattern="diagnosis completeness" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，缺少完整度函数。

- [ ] **Step 3: 定义六维字段映射**

在引导字段定义后增加：

```js
const enterpriseDiagnosisDimensions = [
  {id:'strategy', name:'定位与战略', fields:['intakeIndustry','intakeBusinessStage','intakeMainBusiness','intakeGoalDirection','intakeGoalHorizon','intakeGoalResult']},
  {id:'market', name:'客户与市场', fields:['intakeCoreCustomer','intakeTransactionCustomer','intakeCustomerPain','intakeCoreAdvantage']},
  {id:'value', name:'产品与客户价值', fields:['intakeCoreProduct','intakeVerifiedValue','intakeBusinessModes']},
  {id:'growth', name:'商业模式与增长', fields:['intakeTransactionMethod','intakeAcquisitionSources','intakeBusinessStability','intakeImprovementPriority']},
  {id:'brand', name:'品牌与营销', fields:['intakeLogoStatus','intakeBrandTone','intakeForbiddenClaims','onboardingBrandFile']},
  {id:'execution', name:'组织与执行', fields:['intakeBudgetPeriod','intakeExecutionOwner','intakeWeeklyTime','intakeExecutionTeamSize','intakeCapabilities','intakeExecutionConstraint']}
];
```

执行时先核对每个 ID 确实存在；复选/单选组通过 `name` 取值，文本/下拉框通过 ID 取值。如某个计划字段在当前 DOM 中名称不同，必须以真实 ID 替换，不得创建无用隐藏字段。

- [ ] **Step 4: 实现稳定计分函数**

```js
function getEnterpriseDiagnosisCompleteness(){
  const dimensions = enterpriseDiagnosisDimensions.map(dimension => {
    const completed = dimension.fields.filter(isEnterpriseDiagnosisFieldConfirmed).length;
    return {...dimension, score: Math.round(completed / dimension.fields.length * 100)};
  });
  const overall = Math.round(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length);
  return {overall, dimensions};
}
```

`isEnterpriseDiagnosisFieldConfirmed` 只计入已保存的手动值、已确认 OCR 值和已提交证据；异步解析中的推导字段不计入。

- [ ] **Step 5: 实现补充清单与六维渲染**

`buildDiagnosisMissingItems()` 按下列顺序排序：当前最低分维度、会跨过 40%/80% 门槛的字段、其他字段。默认渲染 3 项，并为每项输出 `data-target-field` 和“去补充”按钮。

- [ ] **Step 6: 运行定向测试**

Run: `node --test --test-name-pattern="diagnosis completeness" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交完整度能力**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "feat: calculate enterprise diagnosis completeness"
```

### Task 4: 实现 40% 自动基础诊断和 80%/60% 手动深度诊断

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 写状态机失败测试**

```js
test('basic diagnosis auto-starts at 40 and deep diagnosis stays manual', () => {
  for (const fn of ['getEnterpriseDiagnosisStage', 'maybeStartBasicDiagnosis', 'startDeepDiagnosis']) {
    assert.match(html, new RegExp(`function ${fn}\\(`));
  }
  assert.match(html, /overall\s*>=\s*40[\s\S]*maybeStartBasicDiagnosis/);
  assert.match(html, /overall\s*>=\s*80[\s\S]*every\([^)]*score\s*>=\s*60/);
  assert.match(html, /case 'start-deep-diagnosis':[\s\S]*startDeepDiagnosis\(\)/);
  assert.doesNotMatch(html, /overall\s*>=\s*80[\s\S]{0,160}startDeepDiagnosis\(\)/);
});
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `node --test --test-name-pattern="basic diagnosis auto-starts" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，缺少状态函数。

- [ ] **Step 3: 定义持久化状态**

```js
const enterpriseDiagnosisStateKey = 'aiHuokeEnterpriseDiagnosisV1';
const defaultEnterpriseDiagnosisState = {
  basicStatus: 'idle',
  basicGeneratedAt: '',
  deepStatus: 'idle',
  deepGeneratedAt: '',
  snapshotOverall: 0
};
```

允许状态为 `idle | running | success | failed | stale`，恢复时对非法 JSON 回退默认值。

- [ ] **Step 4: 实现阶段判定**

```js
function getEnterpriseDiagnosisStage(completeness){
  if (completeness.overall < 40) return 'supplement';
  const deepReady = completeness.overall >= 80 && completeness.dimensions.every(item => item.score >= 60);
  if (enterpriseDiagnosisState.deepStatus === 'success') return 'deep-complete';
  if (deepReady) return 'deep-ready';
  return 'basic';
}
```

- [ ] **Step 5: 在两个时机自动触发基础诊断**

- `confirm-modal-profile` 完成后：计算完整度，达 40% 则调用 `maybeStartBasicDiagnosis()`。
- 档案补充保存后：重新计算，如从低于 40% 跨过门槛则调用同一函数。

原型用可见的 `running` 状态和短延时模拟异步生成；重入时不重复发起。

- [ ] **Step 6: 实现手动深度诊断**

`startDeepDiagnosis()` 内部重新校验总完整度和六维门槛；未达标只提醒缺失维度，达标才进入 `running` 并最终写入 `success`。不得在达到 80% 时自动调用。

- [ ] **Step 7: 将旧动作路由到新诊断结果页**

替换 `confirm-profile`、`confirm-modal-profile`、`continue-deep-diagnosis` 中的 `switchSubview('profile-diagnosis')` 后续状态调用；将旧 `complete-deep-diagnosis` 交互改为 `start-deep-diagnosis`。保留旧 `aiHuokeDeepDiagnosisGeneratedV1` 的兼容读取，如为 `1` 则迁移为 `deepStatus: 'success'`。

- [ ] **Step 8: 运行测试**

Run: `node --test --test-name-pattern="basic diagnosis auto-starts|login lands on home" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

- [ ] **Step 9: 提交两层诊断状态机**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "feat: add two-level enterprise diagnosis states"
```

### Task 5: 复用引导表单实现补充企业信息入口

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 写补充入口失败测试**

```js
test('diagnosis supplement entry reuses the unchanged intake form', () => {
  assert.match(html, /function openEnterpriseProfileSupplement\(targetField/);
  assert.match(html, /case 'supplement-enterprise-profile':[\s\S]*openEnterpriseProfileSupplement/);
  assert.match(html, /data-target-field=/);
  assert.match(html, /function showEnterpriseIntakeStep\(step\)/);
  assert.match(html, /Math\.max\(1,Math\.min\(4,step\)\)/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test --test-name-pattern="diagnosis supplement entry" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，缺少补充入口函数。

- [ ] **Step 3: 实现目标字段到引导步骤的映射**

```js
const enterpriseIntakeStepByField = {
  licenseCompanyName: 1,
  intakeIndustry: 1,
  intakeMainBusiness: 2,
  intakeCoreProduct: 2,
  intakeCoreCustomer: 2,
  intakeAcquisitionSources: 3,
  intakeBusinessStability: 3,
  intakeGoalDirection: 4,
  intakeExecutionOwner: 4,
  intakeBrandTone: 4
};
```

实际实施时覆盖所有会被 AI 推荐的字段，不留无映射的“去补充”按钮。

- [ ] **Step 4: 实现打开、定位和返回**

`openEnterpriseProfileSupplement(targetField='')` 执行：恢复引导草稿、切换到目标步骤、打开 `newUserGuideModal`、更新编辑场景提示，并在模态框可见后滚动到目标字段。不修改四步标题、字段和布局。

`confirm-modal-profile` 依据当前是首次引导还是档案编辑，分别显示“完成初步设置”或“保存补充”；两种场景均返回 `profile-diagnosis` 并刷新进度。

- [ ] **Step 5: 接入 AI 补充条目按钮**

`data-act="supplement-enterprise-profile"` 从 `button.dataset.targetField` 取定位目标；顶部主按钮没有目标时，选取 `buildDiagnosisMissingItems()[0]` 的字段。

- [ ] **Step 6: 运行定向测试**

Run: `node --test --test-name-pattern="diagnosis supplement entry|enterprise intake uses four" prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交补充入口**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "feat: connect diagnosis gaps to enterprise intake"
```

### Task 6: 真实浏览器交互与响应式验收

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Modify: `prototype/index.html`
- Generated: `validation/v1-prototype/enterprise-profile-*.png`

- [ ] **Step 1: 在截图脚本增加四组诊断场景**

脚本使用页面真实交互和状态函数建立：

1. 低于 40%：显示无诊断空态和 3 条 AI 补充建议。
2. 达到 40%：自动开始并完成基础诊断。
3. 总完整度达 80% 但有维度低于 60%：深度按钮禁用且指出该维度。
4. 总体与六维同时达标：深度按钮可用，但加载页面时不自动开始。

- [ ] **Step 2: 验证补充入口真实可用**

点击某个“去补充”，检查：

```js
const supplementAudit = await evaluate(`(() => ({
  modalOpen: document.querySelector('#newUserGuideModal')?.classList.contains('show'),
  visibleStep: document.querySelector('[data-intake-step]:not([hidden])')?.dataset.intakeStep,
  fourStepCount: document.querySelectorAll('[data-intake-step]').length
}))()`);
```

Expected: `modalOpen === true`，`fourStepCount === 4`，`visibleStep` 与目标字段映射一致。

- [ ] **Step 3: 分别在桌面端和手机端截图**

Run: `node prototype/scripts/capture-v1-prototype.mjs`

Expected:

- 1440×900：总进度、三列六维卡片、补充建议和诊断结果层级清楚。
- 390×844：六维卡片收为单列，按钮可见可点，无水平滚动。
- 脚本终端摘要中上述状态布尔值全为 `true`。

- [ ] **Step 4: 根据真实渲染修复响应式问题**

在 `@media(max-width:700px)` 中至少保证：

```css
.diagnosis-dimension-grid{grid-template-columns:1fr}
.diagnosis-progress-head,.diagnosis-action-row{align-items:stretch;flex-direction:column}
.diagnosis-action-row .btn{width:100%}
```

每次修改后重跑截图，直到两个尺寸均无溢出、遮挡和导航丢失。

- [ ] **Step 5: 提交浏览器验收脚本与样式修正**

```bash
git add prototype/index.html prototype/scripts/capture-v1-prototype.mjs
git commit -m "test: verify enterprise diagnosis responsive flow"
```

### Task 7: 全量回归与收口

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Modify: `prototype/scripts/capture-v1-prototype.mjs`

- [ ] **Step 1: 扫描旧导航和旧诊断动作残留**

Run: `rg -n "profile-quick|profile-files|>快速画像|>六维诊断|>企业资料|complete-deep-diagnosis" prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: 不再出现企业档案旧菜单和旧深度诊断动作；“企业资料”可仅作为引导表单中的上传文案存在。

- [ ] **Step 2: 运行全部 Node 测试**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 所有测试 PASS，无 skip 或未处理异常。

- [ ] **Step 3: 运行差异检查**

Run: `git diff --check`

Expected: 无行尾空格、冲突标记或格式错误。

- [ ] **Step 4: 复查改动边界**

Run: `git diff --stat && git status --short`

Expected: 只将本功能相关的 `prototype/index.html`、诊断测试和截图脚本纳入实施提交；用户既有其他改动保持原状。

- [ ] **Step 5: 完成最终提交**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
git commit -m "feat: deliver enterprise profile two-level diagnosis"
```

如实施前上述文件已含用户未提交改动，不得整文件盲目提交；应使用精确 hunk 分离本功能，或仅保留本次已提交的规格/计划文档并在交付中明确说明。
