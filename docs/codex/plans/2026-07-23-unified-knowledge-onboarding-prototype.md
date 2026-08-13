---
title: "统一知识库首用引导原型实施计划"
tags: ["type/设计", "domain/ai获客", "kw/知识库引导", "kw/行业蓝图", "kw/原型实施"]
keywords: ["知识库引导", "行业蓝图", "原型实施"]
project: "AI获客产品"
date: 2026-07-23
---

# Unified Knowledge Onboarding Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 AI 获客静态原型中加入新企业首次知识补充流程，并用同一套页面和状态模型演示 AI 获客、杭小消两种行业知识蓝图。

**Architecture:** 保留 `prototype/index.html` 的单文件静态原型结构，在现有六个企业知识管理视图之前增加一个无导航入口的三阶段初始化页面。使用统一的 `KB_BLUEPRINTS` 配置驱动行业名称、知识域、关键确认项和治理示例；采集、审核、权限、治理和 Agent 授权继续复用现有公共页面。原型只模拟处理状态，不宣称已接入真实 OCR、ASR、采集、检索或审核服务。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js 内置测试模块、系统 Chrome + `puppeteer-core` 渲染检查。

---

## 文件责任图

- Modify: `prototype/index.html` — 新用户初始化页面、行业蓝图配置、状态切换、治理中心衔接、响应式样式。
- Create: `prototype/tests/unified-knowledge-onboarding.test.mjs` — 用静态契约测试锁定三步引导、统一底座、两套行业蓝图和治理中心入口。
- Modify: `docs/codex/plans/2026-07-23-unified-knowledge-onboarding-prototype.md` — 执行过程中勾选步骤并记录验证结果。
- Verify only: `/private/tmp/ai-huoke-kb-onboarding/*.png` — 桌面与移动端真实渲染证据，不写入项目目录。

## 状态与页面边界

```text
新企业管理员登录
  → kb-onboarding / upload   交资料
  → kb-onboarding / analyze  AI 分析 + 确认行业蓝图
  → kb-onboarding / confirm  只确认高风险关键项
  → kb / overview            激活首个工作流
  → kb / governance          后续补充与治理待办
```

`KB_BLUEPRINTS` 只保存行业差异：知识域、关键确认项、关系链和示例文案。上传、处理阶段、审核状态、权限摘要、治理入口和 Agent 授权不进入行业配置，确保原型结构能够表达“同一底座”。

## Task 1: 建立可回归的原型契约

**Files:**
- Create: `prototype/tests/unified-knowledge-onboarding.test.mjs`
- Read: `prototype/index.html`

- [ ] **Step 1: 写三步引导的失败测试**

创建测试文件，先锁定页面与状态名称：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('new tenant sees one three-stage knowledge onboarding flow', () => {
  assert.match(html, /data-p="kb-onboarding"/);
  assert.match(html, /data-kbstep="upload"/);
  assert.match(html, /data-kbstep="analyze"/);
  assert.match(html, /data-kbstep="confirm"/);
  assert.match(html, /id="kbInitFile"/);
  assert.match(html, /没有资料.*AI.*对话补充/s);
});

test('industry differences are blueprint configuration, not duplicate pages', () => {
  assert.match(html, /const KB_BLUEPRINTS\s*=/);
  assert.match(html, /sales:\s*\{/);
  assert.match(html, /consumer:\s*\{/);
  assert.match(html, /AI 获客/);
  assert.match(html, /杭小消/);
  assert.equal((html.match(/data-p="kb-onboarding"/g) || []).length, 1);
});

test('the shared workflow exposes governance and agent authorization', () => {
  for (const panel of ['sources', 'domains', 'review', 'governance', 'agents']) {
    assert.match(html, new RegExp(`data-kbpanel="${panel}"`));
  }
  assert.match(html, /data-act="continue-kb-governance"/);
  assert.match(html, /人工审核/);
});
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run:

```bash
node --test prototype/tests/unified-knowledge-onboarding.test.mjs
```

Expected: FAIL，首个失败原因是 `data-p="kb-onboarding"` 尚不存在，而不是测试文件语法错误。

- [ ] **Step 3: 增加行业示例和范围声明测试**

在同一文件追加：

```js
test('consumer blueprint covers Hangxiaoxiao knowledge and feedback loop', () => {
  for (const phrase of ['法律法规', '日常问答', '典型案例', '消费警示', '维权任务链', '多模态资产']) {
    assert.match(html, new RegExp(phrase));
  }
  assert.match(html, /未命中.*治理待办/s);
  assert.match(html, /原型演示.*不代表.*真实/s);
});
```

- [ ] **Step 4: 保存测试基线**

Run:

```bash
shasum -a 256 prototype/index.html prototype/tests/unified-knowledge-onboarding.test.mjs
```

Expected: 输出两个文件的 SHA-256，作为非 Git 目录中的实施前基线。

## Task 2: 增加轻量首次补充页面

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/unified-knowledge-onboarding.test.mjs`

- [ ] **Step 1: 在现有知识库页面前加入独立初始化页面**

新增且只新增一个顶层页面：

```html
<section class="page kb-onboarding-page" data-p="kb-onboarding">
  <div class="kb-onboarding-head">
    <div><div class="ey">企业知识初始化</div><h1>先把已有资料交给 AI</h1></div>
    <span class="kb-scope-note">共 3 步，可随时退出后继续</span>
  </div>
  <div class="kb-onboarding-steps" aria-label="企业知识初始化进度">
    <span class="on">1 交资料</span><span>2 AI 分析</span><span>3 确认并启用</span>
  </div>
  <div class="kb-onboarding-stage show" data-kbstep="upload"></div>
  <div class="kb-onboarding-stage" data-kbstep="analyze"></div>
  <div class="kb-onboarding-stage" data-kbstep="confirm"></div>
</section>
```

页面不加入左侧常驻导航，避免把首次任务误解为日常一级模块。

- [ ] **Step 2: 首屏只呈现资料入口，不出现六类表单**

在 `upload` 阶段提供四个主入口和一个次入口：

```html
<input type="file" id="kbInitFile" hidden multiple
  accept=".doc,.docx,.txt,.xls,.xlsx,.csv,.pdf,image/*,audio/*,video/*">
<button data-act="pick-kb-init-files">上传文件</button>
<button data-act="paste-kb-init-link">粘贴链接</button>
<button data-act="connect-kb-init-drive">连接云盘</button>
<button data-act="bind-kb-init-source">绑定内容源</button>
<button class="btn gho" data-act="chat-kb-init">没有资料？和 AI 对话补充</button>
```

首屏说明明确写出“无需整理、无需先选知识分类”，不显示企业、产品、客户等逐项输入框。

- [ ] **Step 3: 增加公共处理流水线说明**

用一条简化流程表达底层一致性：

```html
<div class="kb-common-pipeline">
  <span>解析 / OCR / ASR</span><i>→</i>
  <span>分类 / 标签</span><i>→</i>
  <span>去重 / 冲突</span><i>→</i>
  <span>来源 / 版权</span><i>→</i>
  <span>人工审核</span>
</div>
<p class="mini">原型演示处理状态，不代表已接入真实采集、解析或审核服务。</p>
```

- [ ] **Step 4: 添加初始化页面专用样式**

在 `/* enterprise knowledge center */` 下集中新增 `.kb-onboarding-*`、`.kb-intake-*`、`.kb-common-pipeline` 样式；复用现有颜色变量、`.card`、`.btn`、`.bdg`，不新增字体、图标库或远程依赖。

- [ ] **Step 5: 运行契约测试**

Run:

```bash
node --test prototype/tests/unified-knowledge-onboarding.test.mjs
```

Expected: 三步页面相关断言通过；行业蓝图配置相关断言仍失败。

## Task 3: 用一个配置模型驱动两套行业知识蓝图

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/unified-knowledge-onboarding.test.mjs`

- [ ] **Step 1: 定义统一的行业蓝图数据结构**

在通用选择器声明后加入：

```js
const KB_BLUEPRINTS = {
  sales: {
    label: 'AI 获客',
    subtitle: '企业获客知识蓝图',
    domains: [
      ['企业与组织', '企业介绍、团队、门店、资质'],
      ['产品与服务', '产品、价格、规格、服务边界'],
      ['客户与场景', '目标客户、痛点、购买场景'],
      ['品牌与内容', '品牌口径、素材、案例、禁用词'],
      ['销售与服务', '话术、承诺、跟进、售后政策'],
      ['经营与审批', '流程、角色、审核和发布规则']
    ],
    critical: ['产品价格与有效期', '对外服务承诺', '审批与发布规则']
  },
  consumer: {
    label: '杭小消',
    subtitle: '消费维权知识蓝图',
    domains: [
      ['法律法规', '效力层级、生效时间、发布机构'],
      ['日常问答', '标准答复、适用场景、相关依据'],
      ['典型案例', '案情、处理依据、处置结果'],
      ['消费警示', '风险类型、时效、发布机构'],
      ['维权任务链', '场景 → 法规 → 步骤 → 案例 → 主体'],
      ['多模态资产', '原件、描述、标签、版权和关联知识']
    ],
    critical: ['法律效力与适用地区', '消费警示有效期', '多模态内容版权']
  }
};
```

- [ ] **Step 2: 实现蓝图渲染函数**

```js
let activeKbBlueprint = 'sales';

function renderKbBlueprint(kind) {
  const next = KB_BLUEPRINTS[kind] ? kind : 'sales';
  activeKbBlueprint = next;
  const bp = KB_BLUEPRINTS[next];
  $('#kbBlueprintLabel').textContent = bp.label;
  $('#kbBlueprintGrid').innerHTML = bp.domains.map(([name, desc]) =>
    `<button class="kb-blueprint-card" data-act="review-blueprint-domain" data-domain="${name}">
      <b>${name}</b><span>${desc}</span>
    </button>`
  ).join('');
  $('#kbCriticalList').innerHTML = bp.critical.map((item, index) =>
    `<label class="kb-confirm-row"><input type="checkbox" ${index ? '' : 'checked'}>
      <span><b>${item}</b><small>需负责人确认来源、范围和有效期</small></span>
    </label>`
  ).join('');
}
```

蓝图卡片只描述行业差异；页面底部始终显示同一条公共处理流水线。

- [ ] **Step 3: 实现“AI 推荐、管理员确认”的切换交互**

分析结果默认显示“AI 推荐：AI 获客”，同时提供两个可切换按钮：

```html
<button class="on" data-act="switch-kb-blueprint" data-blueprint="sales">AI 获客</button>
<button data-act="switch-kb-blueprint" data-blueprint="consumer">杭小消</button>
```

切换时只调用 `renderKbBlueprint()`，不得创建第二套初始化页面或第二组治理标签。

- [ ] **Step 4: 加入分析结果和质量提示**

分析阶段展示：已识别内容数、待人工确认数、冲突数、来源或版权风险；点击“确认此蓝图”进入第三阶段。演示数据固定并标注为示例，不从上传文件内容伪造真实结论。

- [ ] **Step 5: 运行契约测试**

Run:

```bash
node --test prototype/tests/unified-knowledge-onboarding.test.mjs
```

Expected: 所有行业蓝图、杭小消知识范围与单页面复用断言通过。

## Task 4: 打通上传、分析、确认和激活状态

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/unified-knowledge-onboarding.test.mjs`

- [ ] **Step 1: 实现三阶段切换函数**

```js
function showKnowledgeOnboardingStep(step) {
  const order = ['upload', 'analyze', 'confirm'];
  const next = order.includes(step) ? step : 'upload';
  $$('.kb-onboarding-stage').forEach(panel =>
    panel.classList.toggle('show', panel.dataset.kbstep === next));
  $$('.kb-onboarding-steps span').forEach((item, index) => {
    const current = order.indexOf(next);
    item.classList.toggle('on', index === current);
    item.classList.toggle('done', index < current);
  });
  window.scrollTo(0, 0);
}

function startKnowledgeOnboarding() {
  $('#login').style.display = 'none';
  go('kb-onboarding');
  showKnowledgeOnboardingStep('upload');
}
```

给 `titles` 增加 `kb-onboarding`，避免顶部标题访问未定义键。

- [ ] **Step 2: 接入首次资料入口**

`pick-kb-init-files` 触发 `#kbInitFile`；文件选择后把文件名和数量显示在上传卡片中，再调用 `showKnowledgeOnboardingStep('analyze')`。链接、云盘和内容源通过现有 `modal()` 收集最少信息，确认后同样进入分析阶段。

不得复用当前 `#kbFile` 的日常上传处理器，因为该处理器会直接跳转数据源中心。

- [ ] **Step 3: 为对话补充提供轻量入口**

`chat-kb-init` 打开对话弹窗，只问企业主要业务并允许添加资料；提交后形成“对话记录知识候选”，继续进入分析阶段，不另建一套对话知识库。

- [ ] **Step 4: 完成关键确认并激活**

实现：

```js
function activateKnowledgeWorkspace() {
  applyKnowledgeBlueprint(activeKbBlueprint);
  go('kb');
  showKbTab('overview');
  toast('基础知识已启用，未完成事项已进入治理中心', 'ok');
}
```

确认页主按钮必须写“确认关键内容并启用”，次按钮写“稍后处理，先进入工作台”；次按钮进入工作台时保持依赖关键事实的自动发布和对外承诺为受限状态。

- [ ] **Step 5: 把新企业登录演示接到初始化流程**

将 `case 'do-login'` 的原型演示行为改为调用 `startKnowledgeOnboarding()`。保留 `reviewState()`，让渲染检查可以直接跳过登录进入任意知识状态。

- [ ] **Step 6: 测试状态函数存在且命名一致**

在契约测试追加对 `showKnowledgeOnboardingStep`、`startKnowledgeOnboarding`、`activateKnowledgeWorkspace`、`applyKnowledgeBlueprint` 的断言，然后运行：

```bash
node --test prototype/tests/unified-knowledge-onboarding.test.mjs
```

Expected: PASS。

## Task 5: 让日常知识中心继承行业蓝图并进入治理中心

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/unified-knowledge-onboarding.test.mjs`

- [ ] **Step 1: 给日常概览增加可更新锚点**

为蓝图名称、知识覆盖区域、治理待办和知识域列表加入稳定 ID：`kbActiveBlueprint`、`kbCoverageStrip`、`groupList`、`reviewList`。现有六个 `data-kbpanel` 不增不减。

- [ ] **Step 2: 实现日常页面的蓝图应用函数**

```js
function applyKnowledgeBlueprint(kind) {
  const bp = KB_BLUEPRINTS[kind] || KB_BLUEPRINTS.sales;
  $('#kbActiveBlueprint').textContent = `${bp.label} · ${bp.subtitle}`;
  $('#kbCoverageStrip').innerHTML = bp.domains.slice(0, 4).map(([name], index) =>
    `<div class="domain-cell"><div class="dc"><span>${name}</span><span>${[92, 76, 68, 44][index]}%</span></div>
      <div class="db">${[86, 54, 41, 18][index]} 条 · ${index === 3 ? '待补负责人' : '已指定负责人'}</div>
      <div class="bar"><i style="width:${[92, 76, 68, 44][index]}%"></i></div></div>`
  ).join('');
  renderKnowledgeDomainNav(bp);
  renderKnowledgeReviewExamples(kind);
}
```

`renderKnowledgeDomainNav()` 和 `renderKnowledgeReviewExamples()` 各自只负责一个区域，避免把所有 DOM 更新塞进一个大函数。

- [ ] **Step 3: 加入杭小消治理示例**

杭小消待审核区域至少显示：

- 新法规与现有版本的生效时间冲突。
- 公众号新增文章等待人工审核。
- 视频缺少明确版权授权，暂不能对外注入。
- 高频未命中问题已形成知识补充任务。

这些状态复用现有“待确认、冲突、已失效、人工审批”徽标和操作，不新增行业专用审核流程。

- [ ] **Step 4: 统一“继续补充”到治理中心**

给概览中的继续补充按钮使用 `data-act="continue-kb-governance"`，点击后 `showKbTab('governance')` 并滚动到新增的 `#kbGovernanceBacklog`。待办区包含：初始化缺口、自动采集候选、问答未命中、冲突版本、过期复核和来源版权。

- [ ] **Step 5: 保持 Agent 授权为公共能力**

Agent 授权页保留同一权限模型，只根据行业蓝图更新 Agent 示例名称和知识范围：AI 获客展示内容、销售、PPT、企业 Agent；杭小消展示问答、数字人、内容审核、知识维护 Agent。所有 Agent 继续使用人员范围、知识域、安全等级、任务目的和审批节点的交集权限。

- [ ] **Step 6: 运行完整契约测试**

Run:

```bash
node --test prototype/tests/unified-knowledge-onboarding.test.mjs
```

Expected: 全部 PASS，且六个日常管理面板仍各存在一份。

## Task 6: 响应式、交互与真实渲染验证

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/unified-knowledge-onboarding.test.mjs`
- Verify: `/private/tmp/ai-huoke-kb-onboarding/*.png`

- [ ] **Step 1: 补齐移动端布局**

在现有 `@media(max-width:880px)` 中让资料入口卡、行业蓝图卡和确认项改为单列；在 `@media(max-width:560px)` 中保证主按钮宽度 100%、三步进度文字不截断、点击热区至少 44px。公共处理流水线允许横向滚动，不压缩成不可读小字。

- [ ] **Step 2: 增加渲染状态入口**

扩展 `reviewState(state)` 支持：

```text
kb-onboarding-upload
kb-onboarding-analyze-sales
kb-onboarding-analyze-consumer
kb-onboarding-confirm-consumer
kb-overview-consumer
kb-governance-consumer
```

状态函数只用于演示与截图，不使用 URL 查询参数，不影响正常点击路径。

- [ ] **Step 3: 运行桌面端真实渲染**

Run:

```bash
mkdir -p /private/tmp/ai-huoke-kb-onboarding
node /Users/xinwei/.agents/skills/role-ui/assets/render-review.js prototype/index.html \
  --out /private/tmp/ai-huoke-kb-onboarding --w 1440 --h 1000 \
  --state reviewState:kb-onboarding-upload
node /Users/xinwei/.agents/skills/role-ui/assets/render-review.js prototype/index.html \
  --out /private/tmp/ai-huoke-kb-onboarding --w 1440 --h 1000 \
  --state reviewState:kb-onboarding-analyze-consumer
node /Users/xinwei/.agents/skills/role-ui/assets/render-review.js prototype/index.html \
  --out /private/tmp/ai-huoke-kb-onboarding --w 1440 --h 1000 \
  --state reviewState:kb-governance-consumer
```

Expected: 生成 `kb-onboarding-upload.png`、`kb-onboarding-analyze-consumer.png`、`kb-governance-consumer.png`；无登录遮挡、横向溢出或空白状态。

- [ ] **Step 4: 运行移动端真实渲染**

Run:

```bash
node /Users/xinwei/.agents/skills/role-ui/assets/render-review.js prototype/index.html \
  --out /private/tmp/ai-huoke-kb-onboarding/mobile --w 390 --h 844 \
  --state reviewState:kb-onboarding-upload
node /Users/xinwei/.agents/skills/role-ui/assets/render-review.js prototype/index.html \
  --out /private/tmp/ai-huoke-kb-onboarding/mobile --w 390 --h 844 \
  --state reviewState:kb-onboarding-confirm-consumer
```

Expected: 上传入口、蓝图卡、关键确认项和按钮均在视口内；页面允许纵向滚动，操作区不被遮挡。

- [ ] **Step 5: 视觉检查实际截图**

逐张打开生成图片，检查：

- 首屏主任务是否只有“交资料”。
- “AI 获客 / 杭小消”切换是否看起来像蓝图确认，不像两套知识库入口。
- 公共底座说明是否存在但不抢占主任务。
- 高风险人工确认是否明显。
- “继续补充”是否明确指向治理中心。

- [ ] **Step 6: 最终自动检查**

Run:

```bash
node --test prototype/tests/unified-knowledge-onboarding.test.mjs
rg -n "[T]ODO|[T]BD|[F]IXME|[X]XX" prototype/index.html prototype/tests/unified-knowledge-onboarding.test.mjs
shasum -a 256 prototype/index.html prototype/tests/unified-knowledge-onboarding.test.mjs
```

Expected: 测试全部 PASS；占位扫描无输出；生成最终 SHA-256。

## 非 Git 目录的交付说明

`/Users/xinwei/knowledge-hub` 当前没有 `.git`，不能执行真实提交。实施时每完成一个 Task，记录测试结果和文件 SHA-256；不得声称已经 commit。若后续将该目录纳入 Git，再按 Task 1–6 的边界分别提交测试、引导页、蓝图模型、治理衔接和渲染修复。

## 计划自检映射

| 设计要求 | 对应任务 |
|---|---|
| 首次只展示交资料、AI 分析、确认启用三步 | Task 2、Task 4 |
| 上传前不要求填写六类企业信息 | Task 2 |
| AI 获客和杭小消复用同一底座 | Task 3、Task 5 |
| 杭小消法规、问答、案例、警示、任务链、多模态 | Task 3、Task 5 |
| 自动采集后人工审核 | Task 2、Task 5 |
| 继续补充进入治理中心 | Task 5 |
| 权限与 Agent 授权保持同一逻辑 | Task 5 |
| 原型不能冒充真实后端能力 | Task 2、Task 6 |
| 桌面和移动端真实渲染验收 | Task 6 |
