# Enterprise Intake Single-Page Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“3 分钟了解企业”改为单页上传与确认流程，营业执照选择后原地展示模拟识别结果，其他文件和官网 / 公众号链接以可见的异步任务处理。

**Architecture:** 保持 `prototype/index.html` 的单文件原型架构，用两个隐藏文件输入、一个可编辑执照结果区和一个异步任务列表组成单页状态机。原型只模拟 OCR、文档解析和链接采集；所有模拟状态显示能力边界，任务结果仍为待确认候选。

**Tech Stack:** HTML5、CSS、原生 JavaScript、Node.js `node:test`、Chrome DevTools Protocol 截图脚本

---

## 文件责任图

- Modify: `prototype/index.html`
  - 首次引导弹窗的单页结构、样式、文件选择、执照识别状态和异步任务模拟。
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
  - 首次引导的单页结构、真实文件入口、资料分组、异步状态和能力边界回归断言。
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
  - 在浏览器内模拟文件选择，验证执照原地识别、补充资料异步任务和公众号授权状态，并生成桌面端与手机端截图。
- Generated during verification: `validation/v1-prototype/new-user-login-guide-1440x900.png`
- Generated during verification: `validation/v1-prototype/new-user-license-recognized-1440x900.png`
- Generated during verification: `validation/v1-prototype/new-user-async-sources-1440x900.png`
- Generated during verification: `validation/v1-prototype/new-user-login-guide-390x844.png`
- Generated during verification: `validation/v1-prototype/new-user-license-recognized-390x844.png`
- Generated during verification: `validation/v1-prototype/new-user-async-sources-390x844.png`

### Task 1: 用失败测试锁定单页契约

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 把旧四步引导断言改为单页结构断言**

```js
test('new user onboarding is a single-page enterprise intake', () => {
  for (const removed of ['01 提供资料', '02 确认识别', '03 补充缺口', '04 查看成果']) {
    assert.doesNotMatch(html, new RegExp(removed));
  }
  for (const id of ['onboardingLicenseFile', 'onboardingMaterialFile', 'onboardingLicenseResult', 'onboardingAsyncTasks']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /case 'pick-onboarding-license':[\s\S]*onboardingLicenseFile/);
  assert.match(html, /function setLicenseRecognitionState\(/);
});
```

同时把 `quick profile feeds a separate six-dimension deep diagnosis` 中的 `showModalDiagnosisStep` 断言替换为 `setLicenseRecognitionState`；把 `login lands on home and resumes the unfinished layer` 中的 `modal-wizard-next` 断言移除，保留 `confirm-modal-profile` 写入完成状态并进入六维诊断的断言。

- [ ] **Step 2: 增加细分资料、异步任务和公众号边界断言**

```js
test('initial intake names the useful source groups and async states', () => {
  for (const phrase of [
    '企业与产品', '客户与成交', '品牌与内容', '经营与渠道',
    '公司介绍', '产品手册', '报价表', '成功案例', '销售话术', '历史 PPT',
    '已排队', '采集中', '解析中', '待确认', '部分成功', '失败', '等待授权'
  ]) assert.match(html, new RegExp(phrase));
  assert.match(html, /公众号单篇文章/);
  assert.match(html, /公众号账号.*授权/s);
  assert.match(html, /原型演示.*OCR 待接入/s);
  assert.match(html, /公众号采集.*待接入/s);
});
```

- [ ] **Step 3: 运行定向测试并确认失败**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，原因包含旧四步文案仍存在，且 `onboardingLicenseFile`、`onboardingMaterialFile`、`onboardingLicenseResult` 和 `onboardingAsyncTasks` 不存在。

- [ ] **Step 4: 提交失败测试**

```bash
git add prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "test: define single-page enterprise intake"
```

### Task 2: 实现营业执照原地识别流程

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 用单页标记替换旧 `newUserGuideModal` 四步容器**

```html
<input id="onboardingLicenseFile" type="file" hidden accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf">
<input id="onboardingMaterialFile" type="file" hidden multiple accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.pdf,image/*,audio/*,video/*">
<div class="onboarding-license-zone" data-act="pick-onboarding-license">
  <b>上传 / 拍照营业执照</b>
  <span>JPG、PNG、PDF</span>
</div>
<div id="onboardingLicenseStatus" role="status" aria-live="polite"></div>
<div id="onboardingLicenseResult" hidden>...</div>
```

结果区使用稳定 ID：`licenseCompanyName`、`licenseCreditCode`、`licenseLegalRepresentative`、`licenseEstablishedDate`、`licenseRegisteredAddress` 和 `licenseBusinessScope`。企业名称与统一社会信用代码保留 `required`。

- [ ] **Step 2: 增加执照状态函数与文件变更处理**

```js
function setLicenseRecognitionState(state, fileName = '') {
  const status = $('#onboardingLicenseStatus');
  const result = $('#onboardingLicenseResult');
  status.dataset.state = state;
  if (state === 'processing') {
    status.textContent = `正在识别营业执照：${fileName}`;
    result.hidden = true;
  }
  if (state === 'done') {
    status.textContent = `已识别：${fileName} · 请核对 6 项信息`;
    result.hidden = false;
  }
}

$('#onboardingLicenseFile').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  setLicenseRecognitionState('processing', file.name);
  window.setTimeout(() => setLicenseRecognitionState('done', file.name), 650);
});
```

- [ ] **Step 3: 绑定真实文件选择器并收口确认动作**

`case 'pick-onboarding-license'` 调用 `$('#onboardingLicenseFile').click()`，而不是 `toast()`。保留 `confirm-modal-profile` 作为稳定动作名：先检查 `licenseCompanyName` 和 `licenseCreditCode`，再写入 `aiHuokeQuickProfileCompletedV1` 并进入六维诊断。移除 `modal-wizard-prev`、`modal-wizard-next`、`onboardingFieldSets` 和 `showModalDiagnosisStep`。

- [ ] **Step 4: 增加单页和结果区响应式样式**

```css
.enterprise-intake{display:grid;gap:14px}
.onboarding-license-zone{border:2px dashed var(--brand);border-radius:12px;padding:22px;text-align:center;cursor:pointer}
.license-result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media(max-width:700px){.license-result-grid{grid-template-columns:1fr}.new-user-guide-card{max-height:calc(100dvh - 24px);overflow:auto}}
```

- [ ] **Step 5: 运行定向测试**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: 单页、文件入口和执照状态断言 PASS；异步资料与公众号断言仍 FAIL。

- [ ] **Step 6: 提交执照单页流程**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "feat: add inline license recognition flow"
```

### Task 3: 实现细分资料和异步内容源状态

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 在执照结果下方增加四组补充资料卡片**

```html
<button data-act="pick-onboarding-material" data-material-kind="企业与产品">...</button>
<button data-act="pick-onboarding-material" data-material-kind="客户与成交">...</button>
<button data-act="pick-onboarding-material" data-material-kind="品牌与内容">...</button>
<button data-act="pick-onboarding-material" data-material-kind="经营与渠道">...</button>
```

每张卡片常驻显示 3–4 个典型资料名，并标记“核心 / 推荐 / 可选”，不将四组拆成新页。

- [ ] **Step 2: 增加官网 / 公众号来源输入**

```html
<select id="onboardingSourceType">
  <option value="website">官网</option>
  <option value="wechat-article">公众号单篇文章</option>
  <option value="wechat-account">公众号账号 / 历史内容</option>
</select>
<input id="onboardingSourceUrl" type="url" placeholder="粘贴官网或公众号链接">
<button data-act="add-onboarding-source">添加内容源</button>
<div id="onboardingAsyncTasks" aria-live="polite"></div>
```

- [ ] **Step 3: 实现统一异步任务行渲染**

```js
function renderOnboardingAsyncTask({ id, name, kind, state, detail, action = '' }) {
  const labels = {
    queued: '已排队', collecting: '采集中', parsing: '解析中',
    review: '待确认', partial: '部分成功', failed: '失败', authorization: '等待授权'
  };
  const row = document.createElement('div');
  row.className = 'onboarding-task-row';
  row.dataset.taskId = id;
  row.dataset.state = state;
  row.innerHTML = `<div><b>${name}</b><small>${kind} · ${detail}</small></div><span class="bdg">${labels[state]}</span>${action}`;
  $('#onboardingAsyncTasks').prepend(row);
  return row;
}
```

- [ ] **Step 4: 把文件和链接映射为非阻塞模拟任务**

`pick-onboarding-material` 记录 `data-material-kind` 并打开 `onboardingMaterialFile`。文件选择后创建“已排队”任务，再模拟切换到“解析中”与“待确认”。官网和单篇公众号文章创建“采集中”任务；公众号账号创建“等待授权”任务，显示“去授权”和“改为粘贴文章链接”。

- [ ] **Step 5: 对失败与部分成功保留局部操作**

`retry-onboarding-task` 只重置当前任务行；`cancel-onboarding-task` 不影响其他任务。原型常驻显示一行“部分成功”示例和一行“失败”示例，用于验收恢复动作。

- [ ] **Step 6: 运行定向和全量结构测试**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

Run: `node --test prototype/tests/*.test.mjs`

Expected: 所有现有测试 PASS，且不再有测试依赖 `onboardingFieldSets`、`showModalDiagnosisStep`、`modal-wizard-next` 或旧四步文案。

- [ ] **Step 7: 提交异步资料流程**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git commit -m "feat: add async enterprise source intake"
```

### Task 4: 更新真实浏览器验收并关闭交付门禁

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Verify: `prototype/index.html`
- Generate: `validation/v1-prototype/*.png`
- Generate: `validation/v1-prototype/layout-audit*.json`

- [ ] **Step 1: 用新单页动作替换旧 wizard 点击脚本**

```js
await evaluate(`(() => {
  const input = document.querySelector('#onboardingLicenseFile');
  const transfer = new DataTransfer();
  transfer.items.add(new File(['prototype-license'], '营业执照.png', {type:'image/png'}));
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', {bubbles:true}));
})()`);
await new Promise(ok => setTimeout(ok, 900));
await screenshot('new-user-license-recognized');
```

再为 `onboardingMaterialFile` 注入“产品手册.pdf”，并把 `onboardingSourceType` 设为 `wechat-account`，填写示例链接后点击 `add-onboarding-source`，截取 `new-user-async-sources`。

- [ ] **Step 2: 更新 onboarding 行为审计**

`onboardingFlow` 改为检查：

```js
{
  afterLogin: 'home',
  reminderVisible: true,
  licenseState: 'done',
  licenseResultVisible: true,
  asyncTaskCount: 2,
  authorizationVisible: true,
  profileStored: '1',
  diagnosisStored: '1'
}
```

- [ ] **Step 3: 运行 1440 × 900 桌面端截图与布局审计**

Run: `python3 -m http.server 8010 --directory prototype`

Expected: 本地 HTTP 服务在 `127.0.0.1:8010` 可访问。

Run: `mkdir -p /private/tmp/ai-huoke-v1-cdp`

Run: `open -na 'Google Chrome' --args --remote-debugging-port=9228 --user-data-dir=/private/tmp/ai-huoke-v1-cdp --window-size=1440,900 http://127.0.0.1:8010/index.html`

Expected: 通过 macOS `open` 启动隔离的可见 Chrome 会话，不直接调用 Chrome 可执行文件、不使用 headless 模式。

Run: `curl --max-time 5 -s http://127.0.0.1:9228/json`

Expected: 返回至少一个 `type: page` 的调试目标，其 URL 为 `http://127.0.0.1:8010/index.html`。

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 1440 --height 900`

Expected: `V1 prototype capture PASS`，`layout-audit-1440x900.json` 中 `consoleErrors`、`uncaughtErrors`、`horizontalOverflowPages`、`duplicateVisiblePages` 和 `outsideElements` 均为空。

- [ ] **Step 4: 运行 390 × 844 手机端截图与布局审计**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 390 --height 844`

Expected: `V1 prototype capture PASS`，`layout-audit-390x844.json` 的五类错误数组均为空。

- [ ] **Step 5: 人工检查六张关键截图**

使用图像查看工具逐张确认：

- 初始单页不再显示四步导航。
- 执照结果六个字段可见，原型能力标识可见。
- 四组资料清单在桌面端层级清晰，手机端单列不挤压。
- 公众号账号显示“等待授权”，不显示采集成功。
- 异步任务状态不只依赖颜色，操作按钮未被遮挡。

- [ ] **Step 6: 运行最终回归和工作区检查**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 全量 PASS。

Run: `git diff --check`

Expected: 无输出，退出码为 0。

Run: `git status --short`

Expected: 本次范围只包含 `prototype/index.html`、`prototype/tests/enterprise-diagnosis-v1.test.mjs`、`prototype/scripts/capture-v1-prototype.mjs` 和新生成的相关验收产物；其他既有改动保持不变。

- [ ] **Step 7: 提交浏览器验收更新**

```bash
git add prototype/scripts/capture-v1-prototype.mjs validation/v1-prototype/new-user-*.png validation/v1-prototype/layout-audit*.json
git commit -m "test: verify single-page enterprise intake"
```
