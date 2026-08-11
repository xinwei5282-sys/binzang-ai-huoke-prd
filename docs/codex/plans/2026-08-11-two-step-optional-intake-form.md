# Two-step Optional Intake Form Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将企业初步设置改为两步可选表单，第一步单独处理企业身份，第二步合并多文件资料与官网/公众号链接。

**Architecture:** 在现有 `newUserGuideModal` 内增加两个 `data-intake-step` 表单面板，由 `showEnterpriseIntakeStep(step)` 切换显示和底部操作。营业执照回显逻辑保持独立；第二步用一个 `multiple` 文件选择器和一个链接表单，共用异步任务列表。

**Tech Stack:** HTML/CSS/JavaScript、File API、Node.js `node:test`、Chrome DevTools Protocol。

---

## 文件责任图

- Modify: `prototype/index.html` — 两步 DOM、统一表单样式、切换与可选完成逻辑。
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs` — 两步结构、可选门槛、多文件格式与旧卡片移除的回归测试。
- Modify: `prototype/scripts/capture-v1-prototype.mjs` — 真实点击下一步/上一步，空资料完成，一次提交两个文件。
- Output: `validation/v1-prototype/` — 桌面和手机真实渲染证据。

> `prototype/index.html` 已有任务前未提交改动，只做局部补丁，不将无关内容纳入实现提交。

### Task 1: 锁定两步可选表单合同

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
test('enterprise intake uses two optional form steps', () => {
  for (const id of ['enterpriseIntakeSteps','enterpriseIntakeIdentity','enterpriseIntakeMaterials']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /function showEnterpriseIntakeStep\(step\)/);
  assert.match(html, /case 'next-enterprise-intake'/);
  assert.match(html, /case 'prev-enterprise-intake'/);
  assert.match(html, /上传企业资料（可选）/);
  assert.match(html, /官网 \/ 公众号链接（可选）/);
  assert.doesNotMatch(html, /class="material-group-card"/);
});

test('optional material upload accepts multiple document files', () => {
  const input=html.match(/<input id="onboardingMaterialFile"[^>]+>/)?.[0]||'';
  assert.match(input,/\smultiple(?:\s|>)/);
  for(const ext of ['.doc','.docx','.txt','.pdf','.ppt','.pptx']) assert.match(input,new RegExp(ext.replace('.', '\\.')));
  assert.doesNotMatch(input,/\.xls|\.xlsx|\.csv|image\/\*|audio\/\*|video\/\*/);
  assert.match(html,/id="confirmModalProfileBtn"(?![^>]*disabled)[^>]*>完成初步设置/);
});
```

- [ ] **Step 2: 确认红灯**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，缺少 `enterpriseIntakeSteps` 或仍存在 `material-group-card`。

### Task 2: 实现两步表单与可选完成

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 重组引导 DOM**

增加两步步骤条和面板：

```html
<div class="enterprise-intake-steps" id="enterpriseIntakeSteps">
  <span data-intake-step-indicator="1" class="on"><i>1</i><b>企业身份</b><small>可选</small></span>
  <span data-intake-step-indicator="2"><i>2</i><b>补充企业资料</b><small>可选</small></span>
</div>
<section id="enterpriseIntakeIdentity" data-intake-step="1">...</section>
<section id="enterpriseIntakeMaterials" data-intake-step="2" hidden>...</section>
```

第二步移除四张 `material-group-card`，改为一个文件表单组、一个链接表单组和一个异步任务列表。

- [ ] **Step 2: 更新文件选择器**

```html
<input id="onboardingMaterialFile" type="file" hidden multiple
  accept=".doc,.docx,.txt,.pdf,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation">
```

统一使用 `data-act="pick-onboarding-material"` 按钮，将任务分类固定为“企业补充资料”。

- [ ] **Step 3: 实现步骤切换**

```js
let enterpriseIntakeStep=1;
function showEnterpriseIntakeStep(step){
  enterpriseIntakeStep=Math.max(1,Math.min(2,step));
  $$('[data-intake-step]').forEach(panel=>panel.hidden=Number(panel.dataset.intakeStep)!==enterpriseIntakeStep);
  $$('[data-intake-step-indicator]').forEach(item=>{
    const index=Number(item.dataset.intakeStepIndicator);
    item.classList.toggle('on',index===enterpriseIntakeStep);
    item.classList.toggle('done',index<enterpriseIntakeStep);
  });
  $('#enterpriseIntakeStepOneActions').hidden=enterpriseIntakeStep!==1;
  $('#enterpriseIntakeStepTwoActions').hidden=enterpriseIntakeStep!==2;
}
```

`startKnowledgeOnboarding()` 每次打开时调用 `showEnterpriseIntakeStep(1)`。

- [ ] **Step 4: 移除必填门槛**

营业执照字段标签去掉星号和 `required`。`syncLicenseConfirmButton()` 不再禁用主按钮。`confirm-modal-profile` 始终允许进入六维诊断；只在用户有主动填写值时调用 `markProfileConfirmed()`。

- [ ] **Step 5: 增加统一表单样式**

添加 `.enterprise-intake-form`、`.intake-form-section`、`.intake-upload-row`和 `.enterprise-intake-steps` 样式；桌面端字段两列，手机端单列。页面不再出现大卡片嵌套四张资料卡片。

- [ ] **Step 6: 确认绿灯**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: 14 tests PASS，0 FAIL。

### Task 3: 验证真实两步交互

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Output: `validation/v1-prototype/`

- [ ] **Step 1: 验证第一步可留空**

首次引导中记录第一步可见、第二步隐藏，点击 `next-enterprise-intake` 后断言反转。点击 `prev-enterprise-intake` 后断言营业执照预览仍保留。

- [ ] **Step 2: 验证一次多文件**

在同一个 `DataTransfer` 中加入 `公司介绍.docx` 和 `产品手册.pdf`，派发一次 `change`，断言出现两个文件名和两条任务行。

- [ ] **Step 3: 验证无资料完成**

重置引导后不上传或填写任何内容，点击下一步再点击“完成初步设置”，断言进入 `profile-diagnosis`、完成标记为 `1`且企业画像仍为 `draft`。

- [ ] **Step 4: 全量检查**

Run:

```bash
node --test prototype/tests/*.test.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
```

Expected: 全部测试 PASS，差异检查无输出。

- [ ] **Step 5: 真实浏览器验收**

Run:

```bash
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 1440 --height 900
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 390 --height 844
```

Expected: 两次均输出 `V1 prototype capture PASS`，并且审计 JSON 无控制台错误、无水平溢出。

- [ ] **Step 6: 人工看图**

查看第一步、第二步以及营业执照回显的桌面/手机截图，确认步骤条、表单对齐、底部操作和滚动行为可用。
