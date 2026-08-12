# Enterprise VI Logo Selection Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在三套企业 VI 方向选择卡和展示抽屉中直接呈现 Logo，并让方向确认同时锁定对应 Logo 方案。

**Architecture:** 沿用 `prototype/index.html` 中的 `enterpriseViState` 和三阶段流程，仅为每个方向增加 `logoProposal` 数据，并把选择、草案和正式版本串起来。原型以可访问的 HTML/CSS Logo 标志展示方案，不接入真实生成、商标检索或文件导出服务。

**Tech Stack:** 单文件 HTML/CSS/JavaScript、Node.js `node:test`、Chrome DevTools Protocol 截图验收。

---

## 文件责任图

- Modify: `prototype/index.html` — Logo 方案数据、方向卡、展示抽屉、草案继承、响应式样式和交互文案。
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs` — Logo 数据、确认边界和正式版本复用回归。
- Modify: `prototype/scripts/capture-enterprise-cognition-vi.mjs` — 桌面/手机端 Logo 首屏、抽屉和确认流程的真实渲染验收。
- Existing config: `prototype/verification-manifest.json` — 继续使用 `enterprise-vi` 定向验证，无需改变映射。

### Task 1: 锁定 Logo 数据与确认合同

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写方向数据与草案继承的失败测试**

测试三套方向均包含 `logoProposal`，已有 Logo 输入时模式为 `optimize_existing`，且选中方向的 Logo 进入草案和正式版本。

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL，原因是方向数据没有 `logoProposal`，草案未继承 Logo。

- [ ] **Step 3: 增加最小 Logo 数据模型**

在三个方向中加入：

```js
logoProposal: {
  mode: 'optimize_existing',
  name: '稳健识别优化',
  mark: '蔚',
  wordmark: '企业名称',
  variants: ['standard', 'icon', 'reverse'],
  rationale: '保留原识别核心，提升正式场景清晰度',
  changes: ['优化图文比例', '扩大安全留白', '提升小尺寸识别']
}
```

`completeEnterpriseViDraftGeneration()` 将所选方向的 `logoProposal` 深拷贝到草案；激活时沿用现有整份草案复制机制。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS。

### Task 2: 实现 Logo 主视觉方向卡

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写方向卡行为失败测试**

断言页面存在 Logo 主视觉语义、Logo 模式标签、优化摘要和统一按钮文案“确认此方向与 Logo”；选中态保留 `aria-pressed`。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL，原因是当前卡片仍以品牌语句为主视觉，按钮仍为“选择方向”。

- [ ] **Step 3: 增加 Logo 卡片渲染与样式**

新增 `renderEnterpriseViLogo()` 小函数，输出标志、企业字标和可读 `aria-label`。方向卡首屏依次展示 Logo 主视觉、优化类型、优化摘要、色彩、字体、图片风格和操作按钮。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS。

### Task 3: 完善展示抽屉与完整 VI

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写抽屉不误选与 Logo 变体失败测试**

断言抽屉显示标准版、图标版、反白版、设计含义/优化点和四类应用效果；预览函数不得直接调用 `selectEnterpriseViDirection()`。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL，原因是抽屉只有 Logo 使用原则文字，没有 Logo 变体展示。

- [ ] **Step 3: 实现抽屉和完整 VI Logo 展示**

抽屉加入三种 Logo 变体和优化说明；底部按钮改为“确认此方向与 Logo”。完整 VI 区读取草案中的 `logoProposal`，显示已确认方向对应 Logo，不再只显示“未上传 Logo”占位。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS。

### Task 4: 真实浏览器验收

**Files:**
- Modify: `prototype/scripts/capture-enterprise-cognition-vi.mjs`

- [ ] **Step 1: 增加截图审计字段**

记录三张卡的 Logo 数量、模式标签、确认按钮、抽屉变体数、选中方向、草案 Logo 和横向溢出。

- [ ] **Step 2: 运行企业 VI 定向测试**

Run: `codex-verify --focus enterprise-vi`

Expected: PASS；结构测试与真源校验通过。

- [ ] **Step 3: 运行桌面与手机浏览器验收**

Run: `codex-verify --focus enterprise-vi --browser`

Expected: PASS；1440×900 与 390×844 均展示三套 Logo，抽屉和确认按钮可操作，无 console、overflow 或遮挡错误。

- [ ] **Step 4: 检查变更格式**

Run: `git diff --check -- prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs prototype/scripts/capture-enterprise-cognition-vi.mjs`

Expected: exit 0。

### Task 5: 交付收口

- [ ] **Step 1: 对照规格逐项复核**

确认已有 Logo 三套均为优化提案、方向与 Logo 同时确认、未确认不可生成、草案不进入内容上下文、原型能力边界仍清楚。

- [ ] **Step 2: 汇报验证证据与剩余边界**

明确真实浏览器尺寸、截图数量、测试结果，以及真实 Logo 生成/商标检索/文件下载仍未接入。
