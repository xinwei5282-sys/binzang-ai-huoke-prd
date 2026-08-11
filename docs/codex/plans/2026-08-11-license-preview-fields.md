# License Preview and Field Echo Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有单页企业初始设置中，上传营业执照后回显真实本地预览，并与六个可编辑字段同屏核对。

**Architecture:** 继续使用 `prototype/index.html` 的单文件原型架构，在执照结果区增加预览面板，由 `setLicensePreview(file)` 单独管理图片/PDF 显示和对象 URL 生命周期，`setLicenseRecognitionState` 只管理识别状态与字段。现有文件选择器不变，更换和放大通过现有事件分发机制接入。

**Tech Stack:** 静态 HTML/CSS/JavaScript、File API、`URL.createObjectURL` / `URL.revokeObjectURL`、Node.js `node:test`、Chrome DevTools Protocol 真实渲染验收。

---

## 文件责任图

- Modify: `prototype/index.html`
  - 增加执照预览 DOM、桌面/手机响应式布局、放大层和预览资源生命周期。
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
  - 锁定预览节点、图片/PDF 分支、更换/放大操作和对象 URL 释放。
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
  - 用有效 PNG 测试文件触发回显，记录预览可见性、图片加载状态和布局尺寸。
- Output: `validation/v1-prototype/new-user-license-recognized-1440x900.png`
- Output: `validation/v1-prototype/new-user-license-recognized-390x844.png`
  - 真实浏览器视觉验收证据。

> 当前 `prototype/index.html` 在任务前已包含未提交改动。执行时只做局部补丁并保留现有改动；不为追求频繁提交而将无关工作区内容纳入实现提交。

### Task 1: 锁定回显合同

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 写失败测试**

在“new user onboarding is a single-page enterprise intake”附近增加断言，要求以下合同存在：

```js
for (const id of [
  'onboardingLicensePreview',
  'onboardingLicensePreviewImage',
  'onboardingLicensePreviewPdf',
  'onboardingLicenseFileName',
  'licensePreviewModal'
]) assert.match(html, new RegExp(`id="${id}"`));

assert.match(html, /function setLicensePreview\(file\)/);
assert.match(html, /function clearLicensePreview\(\)/);
assert.match(html, /URL\.createObjectURL\(file\)/);
assert.match(html, /URL\.revokeObjectURL\(activeLicensePreviewUrl\)/);
assert.match(html, /case 'view-onboarding-license'/);
assert.match(html, /case 'replace-onboarding-license'/);
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: FAIL，缺少 `onboardingLicensePreview` 或 `setLicensePreview(file)`。

### Task 2: 实现原图与字段同屏回显

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: 增加预览与放大 DOM**

在 `onboardingLicenseResult` 内使用一个左图右字段容器：

```html
<div class="license-echo-layout">
  <aside class="license-preview-card" id="onboardingLicensePreview" hidden>
    <button class="license-preview-button" data-act="view-onboarding-license" aria-label="放大查看营业执照">
      <img id="onboardingLicensePreviewImage" alt="已上传的营业执照预览" hidden>
      <span id="onboardingLicensePreviewPdf" hidden>PDF</span>
    </button>
    <b id="onboardingLicenseFileName"></b>
    <button class="btn sm" data-act="replace-onboarding-license">更换执照</button>
  </aside>
  <div class="license-result-grid">...</div>
</div>
```

在引导弹窗后增加 `licensePreviewModal`，内含大图、关闭按钮和遮罩点击关闭行为。

- [ ] **Step 2: 增加响应式样式**

桌面端使用：

```css
.license-echo-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:14px;align-items:start}
.license-preview-button{width:100%;aspect-ratio:4/3;overflow:hidden}
.license-preview-button img{width:100%;height:100%;object-fit:contain}
```

在现有 `@media(max-width:700px)` 中设置 `.license-echo-layout{grid-template-columns:1fr}`，并保证预览按钮和更换按钮满足触控高度。

- [ ] **Step 3: 实现预览资源管理**

在识别状态函数前定义：

```js
let activeLicensePreviewUrl='';
function clearLicensePreview(){
  if(activeLicensePreviewUrl) URL.revokeObjectURL(activeLicensePreviewUrl);
  activeLicensePreviewUrl='';
  // 清空 src、文件名和预览可见状态
}
function setLicensePreview(file){
  clearLicensePreview();
  activeLicensePreviewUrl=URL.createObjectURL(file);
  // 图片显示 img；PDF 显示文件占位卡
}
```

`beforeunload` 调用 `clearLicensePreview()`。格式错误和手动填写状态也清理预览。

- [ ] **Step 4: 将文件选择接入预览**

在 `onboardingLicenseFile` change 监听器通过格式校验后，先调用 `setLicensePreview(file)`，然后进入 `processing` 和 `done`。修改 `done` 分支，每次新上传都用演示值覆盖旧字段，不用 `if(!input.value)` 沿用上一份执照结果。

- [ ] **Step 5: 接入更换、放大和关闭操作**

在现有 action switch 中增加：

```js
case 'replace-onboarding-license': $('#onboardingLicenseFile')?.click(); break;
case 'view-onboarding-license': openLicensePreview(); break;
case 'close-license-preview': closeLicensePreview(); break;
```

键盘监听中增加 Escape 关闭放大层，不影响现有抽屉 Escape 逻辑。

- [ ] **Step 6: 运行定向测试并确认通过**

Run:

```bash
node --test prototype/tests/enterprise-diagnosis-v1.test.mjs
```

Expected: 12 tests PASS，0 FAIL。

### Task 3: 更新真实浏览器验收

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Output: `validation/v1-prototype/`

- [ ] **Step 1: 使用有效图片文件触发上传**

将当前无效图片字节替换为可加载的 PNG：

```js
const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='), c=>c.charCodeAt(0));
transfer.items.add(new File([bytes], '营业执照.png', {type:'image/png'}));
```

- [ ] **Step 2: 增加行为审计**

在 `onboardingFlow` 中记录并校验：

```js
previewVisible: !document.querySelector('#onboardingLicensePreview')?.hidden,
previewLoaded: document.querySelector('#onboardingLicensePreviewImage')?.naturalWidth > 0,
previewFileName: document.querySelector('#onboardingLicenseFileName')?.textContent,
echoLayoutColumns: getComputedStyle(document.querySelector('.license-echo-layout')).gridTemplateColumns
```

桌面端要求预览和字段为两列；手机端要求单列且无水平溢出。

- [ ] **Step 3: 运行全量自动测试**

Run:

```bash
node --test prototype/tests/*.test.mjs
git diff --check -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs
```

Expected: 全部测试 PASS，`git diff --check` 无输出。

- [ ] **Step 4: 运行桌面与手机渲染验收**

Run:

```bash
python3 -m http.server 8010 --directory prototype
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 1440 --height 900
node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype --width 390 --height 844
```

Expected: 两次均输出 `V1 prototype capture PASS`；审计 JSON 中无控制台错误、无水平溢出，预览图片已加载。

- [ ] **Step 5: 人工查看关键截图**

查看以下图片：

```text
validation/v1-prototype/new-user-license-recognized-1440x900.png
validation/v1-prototype/new-user-license-recognized-390x844.png
```

确认桌面端左图右字段、手机端上图下字段，文件名、更换入口和 OCR 能力边界可见，无遮挡或裁切。
