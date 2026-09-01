# Marketing Storyboard Remix Style Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AI 生成营销视频的封面、脚本与分镜确认页改为 AI 混剪同类素材卡，并增加仅 AI 生成视频可用的可选 CTA。

**Architecture:** 继续以 `prototype/index.html` 为原型真源，复用现有 `remix-material-card`、质量问题和素材操作样式，但使用营销视频自己的 DOM 标识与状态函数，避免修改 AI 混剪。CTA 在第一步配置，第二步按开关动态显示 CTA 分镜。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js `node:test`、项目浏览器验收脚本。

---

## 文件责任图

- Modify: `prototype/index.html` — 营销封面/分镜卡、CTA、质量门禁、素材操作和只读详情。
- Modify: `prototype/tests/commercial-workflows.test.mjs` — 卡片字段、CTA 显隐、阻断与只读详情断言。
- Modify: `prd/pages/AI获客-短视频创作.md` — 确认页、质量门禁和 CTA 产品规则。
- Modify: `docs/superpowers/specs/2026-08-17-marketing-storyboard-remix-style-design.md` — 实现状态。

### Task 1: 写失败测试

**Files:**
- Modify: `prototype/tests/commercial-workflows.test.mjs`

- [ ] **Step 1: 增加结构断言**

断言营销视频包含 `marketingCoverCard`、`marketingStoryboardList`、`marketing-material-card`、对应口播、所需/可用时长、来源、授权、首尾帧、质量问题和查看/替换/重新生成操作。

- [ ] **Step 2: 增加 CTA 与门禁断言**

断言存在 `marketingCtaToggle`、`marketingCtaInput`、`marketingCtaScene`、`toggle-marketing-cta` 和 `refreshMarketingQualityState`；商品面板不包含 CTA。

- [ ] **Step 3: 验证失败**

Run: `node --test prototype/tests/commercial-workflows.test.mjs`
Expected: FAIL，缺少新卡片和 CTA 标识。

### Task 2: 实现封面与分镜素材卡

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/commercial-workflows.test.mjs`

- [ ] **Step 1: 替换确认页结构**

封面和三个分镜使用与 `remix-material-card` 相同的横向缩略图/内容结构；分镜口播使用可编辑 textarea，并增加区间、时长、来源、授权和首尾帧元数据。

- [ ] **Step 2: 增加分镜级问题与操作**

在问题卡片中展示 warning/blocker；查看打开素材弹窗，替换调用独立文件输入，重新生成更新缩略图和状态，不提供裁剪。

- [ ] **Step 3: 增加统一质量门禁**

实现 `refreshMarketingQualityState()`，存在 blocker 或 warning 时禁用 `marketingConfirmButton`；自动处理或替换后重新计算状态。

### Task 3: 实现可选 CTA

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/commercial-workflows.test.mjs`

- [ ] **Step 1: 第一增加 CTA 开关**

默认关闭并隐藏 `marketingCtaInput`；开启后允许填写文案。

- [ ] **Step 2: 第二步联动 CTA 分镜**

关闭时隐藏 `marketingCtaScene`，开启时显示并同步 CTA 文案；商品营销面板保持无 CTA。

### Task 4: 文档和完整验证

**Files:**
- Modify: `prd/pages/AI获客-短视频创作.md`
- Modify: `docs/superpowers/specs/2026-08-17-marketing-storyboard-remix-style-design.md`

- [ ] **Step 1: 更新 PRD**

写明同款卡片字段、统一质量门禁、可选 CTA、只读详情和商品营销边界。

- [ ] **Step 2: 运行全量验收**

Run: `/Users/xinwei/.local/bin/codex-verify --full`
Expected: 全量测试、真源校验、1440×900 和 390×844 浏览器验收全部 PASS。

- [ ] **Step 3: 检查差异**

Run: `git diff --check`
Expected: 无空白错误；AI 混剪原有 DOM、预览和行为不受影响。
