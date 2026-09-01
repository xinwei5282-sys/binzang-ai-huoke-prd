# Enterprise VI Preview and Download Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将企业大脑中的“企业认知”统一改为“企业 VI”，并实现方向展示抽屉与正式 VI 下载清单演示。

**Architecture:** 保留现有单文件原型和 `enterpriseViState` 状态模型，只在渲染层增加明确的预览、选择和下载动作。方向展示读取方向数据但不修改选择状态；正式下载入口只读取已启用版本，并通过现有对话框基础设施展示文件清单和演示反馈。

**Tech Stack:** 单文件 HTML/CSS/JavaScript、Node.js `node:test`、Chrome DevTools Protocol 截图验收。

---

## 文件责任图

- Modify: `prototype/index.html` — 统一可见命名，渲染方向卡片、方向展示抽屉、正式 VI 下载清单及事件处理。
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs` — 覆盖预览不选中、草案不可下载、正式版本可下载等 VI 状态边界。
- Modify: `prototype/tests/backoffice-design-system.test.mjs` — 更新企业大脑导航名称断言。
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs` — 更新企业大脑入口名称断言。
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs` — 更新五入口名称与顺序断言。
- Create: `prototype/scripts/capture-enterprise-vi-flow.mjs` — 验证桌面和手机端方向展示、选择、启用及下载清单。

### Task 1: 锁定企业 VI 命名和交互合同

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/tests/backoffice-design-system.test.mjs`
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

- [ ] **Step 1: 更新导航命名断言**

将企业大脑五入口的期望值统一为：

```js
['诊断总览', '企业 VI', '企业知识', '外部情报', '进化与治理']
```

- [ ] **Step 2: 写方向展示与下载的失败测试**

在 `enterprise-cognition-vi-v1.test.mjs` 中断言：

```js
for (const action of [
  'preview-enterprise-vi-direction',
  'select-enterprise-vi-direction',
  'download-enterprise-vi',
  'confirm-enterprise-vi-download'
]) assert.match(html, new RegExp(action));

assert.match(html, /方案预览 · 尚未选择/);
assert.match(html, /下载全套 VI/);
assert.match(html, /能力演示 · 本次不会生成真实压缩包/);
```

同时断言方向卡片使用非按钮容器，内部有独立的“查看展示”和“选择方向”按钮。

- [ ] **Step 3: 运行定向测试并确认失败**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs
```

Expected: FAIL，原因是旧名称“企业认知”仍存在，且预览和下载动作尚未实现。

### Task 2: 实现统一命名与方向展示抽屉

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`

- [ ] **Step 1: 统一可见命名**

将左侧导航、企业大脑二级导航、顶部路径和页面说明中的“企业认知”替换为“企业 VI”；内部 `cognition` 数据键和函数名保持不变。

- [ ] **Step 2: 重构方向卡片结构**

将整张 `<button class="vi-direction-card">` 改为：

```html
<article class="vi-direction-card" data-direction-id="...">
  <div class="vi-direction-preview">...</div>
  <div class="vi-direction-body">...</div>
  <div class="vi-direction-card-actions">
    <button data-act="preview-enterprise-vi-direction">查看展示</button>
    <button data-act="select-enterprise-vi-direction" aria-pressed="false">选择方向</button>
  </div>
</article>
```

- [ ] **Step 3: 增加方向展示函数**

实现：

```js
function previewEnterpriseViDirection(id) {
  const direction = enterpriseViState.directions.find(item => item.id === id);
  if (!direction) return null;
  // 使用现有抽屉基础设施展示主张、Logo 原则、颜色、字体、图片和四类应用示例。
  // 本函数不得调用 selectEnterpriseViDirection。
  return direction;
}
```

抽屉底部“选择此方向”使用 `data-act="select-enterprise-vi-direction-from-preview"`，选中后关闭抽屉并刷新 VI 页面。

- [ ] **Step 4: 增加响应式样式与可访问性**

桌面端抽屉使用现有右侧面板宽度；390px 下改为全宽，四类应用示例两列排列。方向卡片选中状态同时包含边框、状态文本和按钮 `aria-pressed`。

- [ ] **Step 5: 运行定向测试**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs
```

Expected: PASS。

### Task 3: 实现正式 VI 下载清单演示

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`

- [ ] **Step 1: 仅在正式版本渲染下载入口**

在 `renderEnterpriseViDraft()` 的 `active` 分支加入：

```html
<button class="btn pri" data-act="download-enterprise-vi" data-vi-id="...">下载全套 VI</button>
```

草案分支继续只有“确认并启用”。

- [ ] **Step 2: 实现下载文件清单**

新增 `openEnterpriseViDownload(id)`，确认 `getActiveEnterpriseVi().id === id` 后，通过现有对话框展示：

```js
[
  ['PDF', '企业 VI 使用手册', '1 份'],
  ['SVG', 'Logo 与图形资产', '8 项'],
  ['ASE', '品牌色与字体规范', '2 项'],
  ['PNG', '应用效果图', '4 类'],
  ['TXT', '品牌语气与禁用表达', '1 份']
]
```

面板必须显示“能力演示 · 本次不会生成真实压缩包”。

- [ ] **Step 3: 实现演示下载反馈**

主按钮文案为“开始下载（演示）”，确认回调只执行：

```js
closeModal();
toast('全套 VI 下载任务已创建（演示）', 'ok');
```

不得调用 `Blob`、`URL.createObjectURL` 或真实下载链接。

- [ ] **Step 4: 运行 VI 定向测试**

Run:

```bash
node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs
```

Expected: PASS。

### Task 4: 真实浏览器闭环与回归

**Files:**
- Create: `prototype/scripts/capture-enterprise-vi-flow.mjs`
- Verify: `prototype/index.html`

- [ ] **Step 1: 编写浏览器闭环脚本**

脚本依次执行：

1. 打开企业大脑的企业 VI 页。
2. 初始化三套 VI 方向。
3. 点击“查看展示”，确认选中方向未改变。
4. 从展示面板选择方向。
5. 生成完整 VI 并确认启用。
6. 打开“下载全套 VI”，检查五类清单和演示边界。
7. 点击“开始下载（演示）”，检查提示且没有浏览器下载事件。

- [ ] **Step 2: 执行标准验证**

Run:

```bash
node prototype/scripts/verify-prototype.mjs --capture prototype/scripts/capture-enterprise-vi-flow.mjs
```

Expected: 全量 `node:test` 通过，目标差异检查通过，本地真源校验通过，桌面和手机截图验收通过。

- [ ] **Step 3: 人工查看关键截图**

检查 1440×900 和 390×844：

- 方向卡片按钮层级明确。
- 展示面板完整且无横向溢出。
- 正式 VI 的下载入口可见。
- 下载清单五类内容完整。
- 控制台错误、元素越界和布局审计均为空。

- [ ] **Step 4: 最终差异检查**

Run:

```bash
git diff --check -- prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/scripts/capture-enterprise-vi-flow.mjs
```

Expected: 无输出，退出码 0。
