# Marketing Video Types Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在营销视频模块内实现「AI 生成视频」与「商品营销视频」两种成片路径。

**Architecture:** 继续使用 `prototype/index.html` 作为原型真源，在创建页顶部用类型切换控制专属表单。AI 生成视频复用现有两步流程并增加模型选择；商品营销视频使用独立单步面板，素材检查通过后直接创建统一列表任务。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js `node:test`、项目浏览器验收脚本。

---

## 文件责任图

- Modify: `prototype/index.html` — 页面结构、类型切换、模型卡片、商品素材上传、动态任务写入。
- Modify: `prototype/tests/commercial-workflows.test.mjs` — 双类型结构、显隐边界、单步/两步流程断言。
- Modify: `prd/pages/AI获客-短视频创作.md` — 产品规则、字段、流程、状态和验收标准。
- Reference: `docs/superpowers/specs/2026-08-17-marketing-video-types-design.md` — 已确认设计真源。

### Task 1: 双类型回归测试

**Files:**
- Modify: `prototype/tests/commercial-workflows.test.mjs`

- [ ] **Step 1: 写失败测试**

增加断言：创建页含 `videoTypeSeg`、`aiVideoPanel`、`productMarketingPanel`、`aiVideoModelSelect`、AI 封面确认与替换入口、商品主图与模特图上传入口；商品面板含「立即生成」，且双类型任务在同一 `marketingTaskBody`。

- [ ] **Step 2: 验证测试失败**

Run: `node --test prototype/tests/commercial-workflows.test.mjs`
Expected: FAIL，缺少双类型结构标识。

### Task 2: 创建页类型切换与专属字段

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/commercial-workflows.test.mjs`

- [ ] **Step 1: 增加类型选择和 AI 模型卡片**

在创建页顶部增加 `data-act="create-video-type"` 按钮；将现有设置归入 `aiVideoPanel`；加入 Seedance、可灵、海螺、通义万相国产模型下拉单选，明确标注「能力演示 · 待接入」；第二步增加自动生成封面的实际预览、重新生成和本地替换入口。

- [ ] **Step 2: 增加商品营销单步面板**

新增商品主图、模特图文件入口，商品名称、平台、比例、素材检查与 `data-act="generate-product-video"` 立即生成按钮。

- [ ] **Step 3: 实现显隐和任务写入**

新增 `setCreateVideoType(type)`：AI 类型显示步骤导航和 AI 面板；商品类型隐藏步骤导航与第二步。商品立即生成时向 `marketingTaskBody` 插入 `商品营销` 类型任务并返回列表。

- [ ] **Step 4: 列表增加视频类型列**

所有示例任务与动态任务补充 `AI 生成` 或 `商品营销` 类型；保持生成中、待确认、草稿和已完成统一展示。

- [ ] **Step 5: 验证相关测试通过**

Run: `node --test prototype/tests/commercial-workflows.test.mjs prototype/tests/prototype-distillation.test.mjs`
Expected: PASS。

### Task 3: PRD 同步

**Files:**
- Modify: `prd/pages/AI获客-短视频创作.md`

- [ ] **Step 1: 更新信息架构与流程**

写明模块内两种视频类型、AI 两步流程、商品营销单步流程、模型选择规则和统一任务列表。

- [ ] **Step 2: 更新字段、状态和验收口径**

补充 `videoType`、`modelId`、商品图、模特图、素材阻断和待接入边界。

### Task 4: 完整验证

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/*.test.mjs`

- [ ] **Step 1: 运行全量验收**

Run: `/Users/xinwei/.local/bin/codex-verify --full`
Expected: 全量测试、真源校验、1440×900 和 390×844 浏览器验收全部 PASS。

- [ ] **Step 2: 检查差异完整性**

Run: `git diff --check`
Expected: 无空白错误；不恢复统计卡和独立生成任务区；不修改 AI 混剪流程。
