# Enterprise Backoffice Content Hierarchy Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `prototype/index.html` 的内容区域统一为清晰的页面标题、区块标题、内容面板和行级信息四级结构，并按已确认的 A「决策工作台型」重排关键页面。

**Architecture:** 保留现有单文件原型、路由、事件处理和演示数据，在现有 V1.0 migration layer 之后增加一组可复用的层级类，再逐页替换重复标题、零散卡片和顺序不清的板块。结构测试先锁定公共语法和关键页面顺序，页面迁移按“首页与关键工作台 → 企业大脑 → 其余业务页 → 响应式”分批完成。

**Tech Stack:** 自包含 HTML、CSS、原生 JavaScript、Node.js `node:test`、Open Design 静态导出。

---

## 文件责任图

### 修改

- `prototype/index.html`：公共层级 CSS、各路由页面结构、窄屏重排和既有交互绑定。
- `prototype/tests/backoffice-design-system.test.mjs`：四级层级、页面顺序、唯一主操作、响应式和业务边界的结构回归。
- `prototype/scripts/capture-v1-prototype.mjs`：如现有截图清单未覆盖关键页面，仅补充层级验收所需的路由与尺寸，不改变截图机制。

### 创建

- `prototype/tests/content-hierarchy.test.mjs`：专门验证公共层级语法和页面级结构，避免把所有断言继续堆入设计系统测试。
- `validation/v1-prototype/content-hierarchy-audit.md`：记录源码检查、自动测试、真实渲染和仍需人工判断的验收证据。

### 保留不改

- `prototype/mobile.html`：本轮只验证入口和边界，不把独立移动端体验并入后台层级迁移。
- `validation/content-hierarchy-options.html`：作为已确认方向的对照稿，不再修改。
- 一级导航、路由标识、业务对象、能力接入状态、人工确认门和现有本地演示数据。

---

### Task 1: 用失败测试锁定四级层级语法

**Files:**
- Create: `prototype/tests/content-hierarchy.test.mjs`
- Test: `prototype/tests/content-hierarchy.test.mjs`

- [ ] **Step 1: 创建测试文件并读取原型**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const page = route => html.match(new RegExp(`<section class="page[^\"]*" data-p="${route}"([\\s\\S]*?)(?=<section class="page|<\\/main>)`))?.[0] ?? '';
```

- [ ] **Step 2: 写入公共层级失败断言**

```js
test('routed pages expose the shared content hierarchy', () => {
  for (const cls of ['page-heading', 'section-heading', 'content-panel', 'content-row']) {
    assert.match(html, new RegExp(`\\.${cls}\\{`));
  }
  for (const route of ['home', 'enterprise-profile', 'brand-planning', 'marketing-materials', 'acquisition', 'kb', 'settings']) {
    assert.equal((page(route).match(/class="[^"]*page-heading/g) || []).length, 1, `${route} needs one page heading`);
  }
});
```

- [ ] **Step 3: 写入页面顺序和唯一主操作失败断言**

```js
test('decision pages follow focus queue workspace result order', () => {
  for (const route of ['home', 'acquisition', 'kb']) {
    const section = page(route);
    const positions = ['current-focus', 'pending-work', 'primary-workspace', 'recent-status'].map(id => section.indexOf(`data-hierarchy="${id}"`));
    assert.ok(positions.every(position => position >= 0), `${route} misses a hierarchy region`);
    assert.deepEqual([...positions].sort((a, b) => a - b), positions, `${route} hierarchy order is wrong`);
  }
});

test('each routed page exposes at most one page-level primary action', () => {
  for (const route of ['home', 'enterprise-profile', 'brand-planning', 'marketing-materials', 'acquisition', 'kb', 'settings']) {
    assert.ok((page(route).match(/data-page-primary/g) || []).length <= 1, `${route} has duplicate page primary actions`);
  }
});
```

- [ ] **Step 4: 运行测试并确认按预期失败**

Run: `node --test prototype/tests/content-hierarchy.test.mjs`

Expected: FAIL，提示缺少 `.page-heading`、层级区域或页面主操作标识。

- [ ] **Step 5: 保存测试检查点**

```bash
git add prototype/tests/content-hierarchy.test.mjs
git commit -m "test: define backoffice content hierarchy"
```

当前环境若仍无法写入 `.git`，记录该限制并继续执行文件改造，不声称已提交。

---

### Task 2: 建立公共层级样式与响应式基础

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/content-hierarchy.test.mjs`

- [ ] **Step 1: 在现有 V1.0 migration layer 后增加公共结构类**

```css
.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:0 0 20px;padding:0;background:transparent}
.page-heading-copy{min-width:0}.page-heading-title{margin:0;font-size:20px;line-height:1.4;font-weight:600}.page-heading-description{margin-top:4px;color:var(--ink-2);font-size:12.5px;line-height:1.55}
.section-block{margin-top:22px}.section-block:first-child{margin-top:0}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:8px}.section-heading h2{margin:0;font-size:15px;line-height:1.45;font-weight:600}.section-heading p{margin-top:3px;color:var(--ink-3);font-size:11.5px}
.content-panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--panel-radius);overflow:hidden}.content-row{min-height:var(--row-h);padding:12px 16px;border-bottom:1px solid var(--line)}.content-row:last-child{border-bottom:0}
.decision-layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(320px,1fr);gap:var(--workspace-gap);align-items:start}
```

- [ ] **Step 2: 将既有 `.lead`、`.workspace-header` 与新语法兼容**

保留旧选择器供尚未迁移页面使用，但新页面结构只使用 `.page-heading`。不要修改 Token 值、侧栏、顶栏或按钮体系。

- [ ] **Step 3: 增加 1024、920、760 和 560px 重排规则**

```css
@media(max-width:1023px){.decision-layout{grid-template-columns:1fr}.page-heading{align-items:flex-start}}
@media(max-width:760px){.page-heading{flex-direction:column}.page-heading-actions{width:100%}.section-block{margin-top:20px}}
@media(max-width:560px){.page-heading-actions .btn{width:100%;min-height:44px}.content-row{padding:12px 14px}}
```

- [ ] **Step 4: 运行层级测试**

Run: `node --test prototype/tests/content-hierarchy.test.mjs`

Expected: 公共类断言 PASS；页面结构断言仍 FAIL。

- [ ] **Step 5: 运行原设计系统回归**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs`

Expected: PASS，现有 Token、路由、能力边界和无障碍断言不回退。

---

### Task 3: 迁移首页、企业档案与 AI 获客

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/content-hierarchy.test.mjs`
- Test: `prototype/tests/backoffice-design-system.test.mjs`

- [ ] **Step 1: 将首页标题改为唯一 `.page-heading`**

保留“企业经营工作台”和原用途说明；将页面级状态放入 `.page-heading-actions`，不给状态使用主按钮样式。

- [ ] **Step 2: 重排首页为四个语义区域**

```html
<section class="section-block" data-hierarchy="current-focus">…当前最重要…</section>
<section class="section-block" data-hierarchy="pending-work">…待确认与异常任务…</section>
<section class="section-block" data-hierarchy="primary-workspace">…下一步工作区…</section>
<section class="section-block" data-hierarchy="recent-status">…最近成果与本月用量…</section>
```

合并重复的“下一步”说明和入口；保留 `data-od-id="home-primary-decision"` 及现有 `data-act`。

- [ ] **Step 3: 统一企业档案四个子视图的标题与内容板块**

页面只保留一个 `.page-heading`；快速画像、六维诊断、品牌视觉和企业资料内部统一为“当前状态 → 当前任务 → 证据或资料 → 最近版本”。保留现有子视图切换、表单字段、诊断弹窗和数据标识。

- [ ] **Step 4: 重排 AI 获客为重点、待处理、工作区、运行状态**

将最需关注任务放入 `current-focus`；将原右侧“今天需要关注”迁入 `pending-work`；任务筛选与表格作为 `primary-workspace`；加载、错误和能力边界作为 `recent-status` 或工作区就近状态。`data-page-primary` 只标记“新建获客任务”。

- [ ] **Step 5: 更新关键页面结构断言**

断言首页、企业档案和 AI 获客各有一个 `.page-heading`，且原有 `data-act`、`data-od-id`、加载和错误状态仍存在。

- [ ] **Step 6: 运行本批测试**

Run: `node --test prototype/tests/content-hierarchy.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

---

### Task 4: 迁移企业大脑的知识治理层级

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/content-hierarchy.test.mjs`
- Test: `prototype/tests/backoffice-design-system.test.mjs`
- Test: `prototype/tests/unified-knowledge-onboarding.test.mjs`
- Test: `prototype/tests/consumer-protection-knowledge.test.mjs`

- [ ] **Step 1: 建立企业大脑唯一页面标题**

标题区保留“企业大脑”、用途说明和连接/上传的唯一页面级主动作；知识总览、知识库、维护中心继续作为现有三入口。

- [ ] **Step 2: 将知识总览重排为四个区域**

按“当前知识缺口 → 待处理事项 → 正式知识与来源 → Agent 授权与运行状态”排序，并分别标记 `current-focus`、`pending-work`、`primary-workspace`、`recent-status`。

- [ ] **Step 3: 合并连续指标与重复入口**

知识健康、来源可追溯、待确认和授权 Agent 使用同一 `.content-panel` 与内部隔线；资料收件箱、知识库、待确认保留在 `#kbDataView`，不在页头或标签页后重复连接数据源、上传资料。

- [ ] **Step 4: 保留治理和证据边界**

维护中心继续包含版本冲突、即将到期、负责人、版权和知识缺口；AI 自动质检继续显示“原型演示 · 待接入”、来源一致性和黄金任务回归集。

- [ ] **Step 5: 增加企业大脑顺序断言**

验证四个 `data-hierarchy` 顺序、三入口导航、数据视图去重、来源操作可用以及 Agent 授权位于运行状态区域。

- [ ] **Step 6: 运行知识治理回归**

Run: `node --test prototype/tests/content-hierarchy.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/tests/unified-knowledge-onboarding.test.mjs prototype/tests/consumer-protection-knowledge.test.mjs`

Expected: PASS。

---

### Task 5: 迁移品牌与经营、营销物料和设置

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/content-hierarchy.test.mjs`
- Test: `prototype/tests/marketing-material-generation.test.mjs`
- Test: `prototype/tests/commercial-workflows.test.mjs`

- [ ] **Step 1: 整合品牌与经营工作区**

品牌报告与经营计划继续分开；每个子视图采用“当前状态 → 创建或编辑工作区 → 历史版本”。把报告状态、来源与下载放回对象行，删除重复成果摘要。

- [ ] **Step 2: 整合营销物料发布层级**

PPT、海报和公众号文章继续作为子视图；先显示发布准备状态，再显示生成或编辑工作区，最后显示历史物料。能力边界和发布确认合并为一个工作区状态栏，保留人工发布说明。

- [ ] **Step 3: 简化设置页结构**

页面标题后直接进入分组导航和当前设置组；企业设置、成员与权限、平台账号、Agent 中心、用量与套餐、帮助与服务沿用现有入口。每个设置组最多一个 `data-page-primary` 保存或提交动作，危险设置和权限审计置于末尾。

- [ ] **Step 4: 清理已迁移页面的重复结构**

删除同义标题、空壳摘要卡、重复主操作和卡片嵌套；不得删除现有 `data-act`、字段 `id`、ARIA 属性或测试依赖的业务文案。

- [ ] **Step 5: 增加页面语义断言**

验证三个页面的唯一标题、主要工作区、发布边界、历史列表和唯一页面主操作。

- [ ] **Step 6: 运行商业工作流回归**

Run: `node --test prototype/tests/content-hierarchy.test.mjs prototype/tests/marketing-material-generation.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: PASS。

---

### Task 6: 全量验证与交付证据

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`（仅在截图清单缺页时）
- Create: `validation/v1-prototype/content-hierarchy-audit.md`
- Test: `prototype/tests/*.test.mjs`

- [ ] **Step 1: 扫描代码完整性和禁用模式**

Run: `rg -n 'TODO|TBD|\{\{|\[REPLACE\]|scrollIntoView|min-width:\s*1024px|#[0-9a-fA-F]{3,8}\b' prototype/index.html`

Expected: 无占位符、无 `scrollIntoView`、无整页固定 1024px、V1.0 样式层无原始十六进制颜色。

- [ ] **Step 2: 运行全量自动测试**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 全部 PASS；如已有与本次无关的失败，记录测试名和既有原因，不掩盖失败。

- [ ] **Step 3: 使用现有截图脚本检查关键路由**

Run: `node prototype/scripts/capture-v1-prototype.mjs`

Expected: 生成或更新首页、企业档案、品牌与经营、营销物料、AI 获客、企业大脑和设置的 1440×900 与 390×844 截图；如果脚本依赖缺失，保留错误原文并转入 Open Design 单次导出。

- [ ] **Step 4: 必要时执行一次 Open Design 静态导出**

Run: `"$OD_NODE_BIN" "$OD_BIN" export prototype/index.html --project "$OD_PROJECT_ID" --format image --out validation/v1-prototype/content-hierarchy-final.png`

Expected: 成功输出最终图；本命令只在静态审查无法确定溢出或碰撞时使用一次。

- [ ] **Step 5: 人工检查六个验收宽度**

检查 1920×1080、1440×900、1366×768、1024×768、820×1180、390×844：标题与操作不重叠，区块间距大于内部间距，表格仅容器横向滚动，窄屏主操作至少 44px，当前重点和主要工作区顺序清楚。

- [ ] **Step 6: 写入交付证据**

在 `validation/v1-prototype/content-hierarchy-audit.md` 分开记录：源码检查、自动测试、真实渲染、人工未关闭项。明确原型演示与待接入能力仍不是生产交付证明。

- [ ] **Step 7: 保存最终检查点**

```bash
git add prototype/index.html prototype/tests/content-hierarchy.test.mjs prototype/tests/backoffice-design-system.test.mjs prototype/scripts/capture-v1-prototype.mjs validation/v1-prototype/content-hierarchy-audit.md
git commit -m "feat: unify backoffice content hierarchy"
```

当前环境若仍无法写入 `.git`，只汇报文件改造和验证结果，并给出建议提交命令。
