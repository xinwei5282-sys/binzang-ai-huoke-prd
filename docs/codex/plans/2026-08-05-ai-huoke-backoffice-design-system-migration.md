# AI Huoke Backoffice Design System Migration Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `prototype/index.html` 按已确认的完整后台设计规范统一为“微伴式后台骨架 + 星云有客式经营闭环”，并以自动测试和多尺寸真实渲染证明关键页面、状态与响应式行为没有回退。

**Architecture:** 保留当前单文件 HTML 原型、`data-p` 页面路由和 `data-act` 交互契约，在文件内先收口语义 Token 与公共组件，再按首页、列表/详情、任务/审批和响应式四个层次增量迁移。测试使用 Node 内置测试框架检查静态契约，现有 CDP 截图脚本扩展为多视口布局审计；不新增组件展示后台，不复制微伴或星云有客的品牌资产。

**Tech Stack:** HTML5、CSS（OKLCH、自定义属性、媒体查询）、原生 JavaScript、Node.js `node:test`、Chrome DevTools Protocol 截图审计。

---

## 文件责任图

### 创建

- `prototype/tests/backoffice-design-system.test.mjs`：设计 Token、页面骨架、组件状态、唯一主操作和能力边界的静态契约。
- `validation/design-system/`：执行期生成的多视口截图与 `layout-audit.json`；只保存验证证据，不作为设计真源。

### 修改

- `prototype/index.html`：唯一原型实现；收口 Token、公共组件、首页、AI 获客、任务审批、抽屉和响应式行为。
- `prototype/tests/pc-ui-system.test.mjs`：将旧的固定最小宽度断言替换为真实响应式与公共骨架断言。
- `prototype/tests/enterprise-agent-operating-loop.test.mjs`：保留经营闭环、任务责任和人工审批，移除“首页必须是对话驾驶舱”的过时契约。
- `prototype/scripts/capture-v1-prototype.mjs`：增加视口矩阵、抽屉/弹窗/错误状态检查和统一输出目录参数。

### 只读真源

- `docs/superpowers/specs/2026-08-05-ai-huoke-backoffice-design-system.md`：视觉与交互规范。
- `docs/superpowers/specs/2026-08-05-enterprise-ai-operating-brain-v1-product-design.md`：产品范围和信息架构。

---

### Task 1: 建立后台设计系统静态契约

**Files:**
- Create: `prototype/tests/backoffice-design-system.test.mjs`
- Test: `prototype/tests/backoffice-design-system.test.mjs`

- [ ] **Step 1: 写 Token 与骨架失败测试**

创建测试并先约束现有稳定值及准备新增的语义契约：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('backoffice shell uses the approved semantic tokens and dimensions', () => {
  for (const token of [
    '--sidebar-w:228px', '--topbar-h:56px', '--page-pad:28px',
    '--panel-radius:6px', '--control-h:36px', '--row-h:44px',
    '--bg:', '--surface:', '--surface-2:', '--rail:', '--ink:',
    '--brand:', '--ok:', '--warn:', '--danger:'
  ]) assert.ok(html.includes(token), `missing ${token}`);
  assert.match(html, /class="app"/);
  assert.match(html, /class="rail"/);
  assert.match(html, /class="top"/);
});

test('shared interaction components expose keyboard and reduced-motion states', () => {
  assert.match(html, /:focus-visible/);
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(html, /class="drawer/);
  assert.match(html, /data-act="close-drawer"/);
});
```

- [ ] **Step 2: 写页面层级与能力边界失败测试**

追加：

```js
test('home is result-first and does not contain the legacy chat cockpit', () => {
  const home = html.match(/<section class="page show" data-p="home">([\s\S]*?)<section class="page" data-p="plan">/)?.[1] ?? '';
  for (const label of ['当前最重要', '下一步', '待确认', '最近成果', '本月用量', '异常任务']) {
    assert.match(home, new RegExp(label));
  }
  assert.doesNotMatch(home, /id="agentPrompt"|agent-command-bar|企业 Agent 学习建议/);
});

test('customer-facing prototype distinguishes demo and connected capabilities', () => {
  assert.match(html, /能力演示 · 待接入/);
  assert.doesNotMatch(html, /自动发布成功|设备在线|本地 Codex 已连接/);
});
```

- [ ] **Step 3: 运行测试并确认它因缺少抽屉、减弱动效和旧首页残留而失败**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs`

Expected: FAIL；失败信息至少包含 `prefers-reduced-motion`、`drawer` 或旧首页驾驶舱残留之一，而不是语法错误。

- [ ] **Step 4: 提交测试契约**

```bash
git add prototype/tests/backoffice-design-system.test.mjs
git commit -m "test: define backoffice design system contract"
```

---

### Task 2: 收口 Token、公共组件和交互状态

**Files:**
- Modify: `prototype/index.html:13-360`
- Test: `prototype/tests/backoffice-design-system.test.mjs`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: 扩展公共组件失败断言**

在 `backoffice-design-system.test.mjs` 中增加：

```js
test('buttons, fields, rows, overlays and statuses use one shared hierarchy', () => {
  for (const selector of [
    '.btn{', '.btn.pri{', '.btn.gho{', '.inp{', '.card{',
    '.status-row{', '.bdg.ok{', '.bdg.warn{', '.bdg.dng{',
    '.drawer{', '.drawer-mask{'
  ]) assert.ok(html.includes(selector), `missing ${selector}`);
  assert.match(html, /\.btn:focus-visible[^}]*outline/);
  assert.match(html, /\.inp:focus-visible[^}]*border-color:var\(--brand\)/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs`

Expected: FAIL，提示缺少 `.drawer`、`.drawer-mask` 或 `.inp:focus-visible`。

- [ ] **Step 3: 在 `:root` 后补齐语义尺寸，不改变现有品牌颜色**

在现有布局 Token 后增加：

```css
--drawer-w:560px;
--motion-fast:140ms;
--motion-base:220ms;
--focus-ring:0 0 0 3px var(--brand-sft);
```

不得新增第二套蓝色、圆角或阴影系统。

- [ ] **Step 4: 统一 focus、disabled、loading 和 reduced-motion**

加入公共规则：

```css
.btn:focus-visible,.nav a:focus-visible,.subnav-item:focus-visible,.inp:focus-visible,[tabindex]:focus-visible{
  outline:2px solid var(--brand);outline-offset:2px
}
.inp:focus-visible{border-color:var(--brand);box-shadow:var(--focus-ring)}
.btn:disabled,.inp:disabled{cursor:not-allowed;opacity:.55}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
```

- [ ] **Step 5: 将普通弹窗圆角从 16px 收口到 8px**

把 `.modal` 的 `border-radius:16px` 改为 `border-radius:var(--r-l)`；保留媒体卡片等内容资产自身的合理圆角，不做无关重写。

- [ ] **Step 6: 运行契约测试**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/pc-ui-system.test.mjs`

Expected: 公共组件相关断言 PASS；首页旧内容相关断言仍 FAIL。

- [ ] **Step 7: 提交公共样式收口**

```bash
git add prototype/index.html prototype/tests/backoffice-design-system.test.mjs
git commit -m "style: unify backoffice tokens and component states"
```

---

### Task 3: 将首页收口为结果优先工作台

**Files:**
- Modify: `prototype/index.html:442-489`
- Modify: `prototype/tests/enterprise-agent-operating-loop.test.mjs`
- Test: `prototype/tests/backoffice-design-system.test.mjs`
- Test: `prototype/tests/pc-ui-system.test.mjs`

- [ ] **Step 1: 改写过时的 Agent 首页测试**

将 `the cockpit supports conversational delegation and agent accountability` 替换为：

```js
test('operating loop remains reachable without making chat the home page', () => {
  for (const page of ['plan', 'tasks', 'review']) {
    assert.match(html, new RegExp(`data-p="${page}"`));
  }
  for (const phrase of ['任务目标', '结果回传', '知识依据', '影响范围']) {
    assert.match(html, new RegExp(phrase));
  }
  const home = html.match(/<section class="page show" data-p="home">([\s\S]*?)<section class="page" data-p="plan">/)?.[1] ?? '';
  assert.doesNotMatch(home, /id="agentPrompt"|agent-command-bar/);
});
```

- [ ] **Step 2: 运行首页与闭环测试并确认失败**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/pc-ui-system.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs`

Expected: FAIL，原因是 `data-p="home"` 内仍包含旧对话驾驶舱和重复经营模块。

- [ ] **Step 3: 只删除首页中的旧驾驶舱段落**

在 `data-p="home"` 中保留：

- 企业经营工作台标题区。
- 当前最重要事项。
- 下一步。
- 待确认。
- 最近成果。
- 本月用量。
- 异常任务。

删除同一 section 后半段的 `.loop-strip`、`.cockpit-grid`、`#agentPrompt`、企业 Agent 学习建议等重复内容。`plan`、`tasks`、`review` 页面及其路由保留。

- [ ] **Step 4: 确认首页唯一主操作**

首页只保留“继续诊断”为实心按钮；“去补充”“查看”“查看明细”“查看原因”全部保持次按钮或文字动作。

- [ ] **Step 5: 运行首页相关测试**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/pc-ui-system.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交首页迁移**

```bash
git add prototype/index.html prototype/tests/enterprise-agent-operating-loop.test.mjs
git commit -m "refactor: make backoffice home result first"
```

---

### Task 4: 建立标准右侧抽屉并用于详情与审核

**Files:**
- Modify: `prototype/index.html`（公共 CSS、`</main>` 后的浮层结构、公共 JavaScript）
- Test: `prototype/tests/backoffice-design-system.test.mjs`

- [ ] **Step 1: 写抽屉结构与行为失败测试**

追加：

```js
test('standard drawer preserves list context and exposes accessible controls', () => {
  assert.match(html, /id="detailDrawer"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /function openDrawer\(/);
  assert.match(html, /function closeDrawer\(/);
  assert.match(html, /Escape/);
  assert.match(html, /data-act="open-drawer"/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs`

Expected: FAIL，提示缺少 `detailDrawer`、`openDrawer` 和 `data-act="open-drawer"`。

- [ ] **Step 3: 增加抽屉公共样式**

```css
.drawer-mask{position:fixed;inset:0;background:oklch(0.2 0.02 220/.38);z-index:100;opacity:0;pointer-events:none;transition:opacity var(--motion-base)}
.drawer{position:fixed;top:0;right:0;z-index:101;width:min(var(--drawer-w),94vw);height:100vh;background:var(--surface);border-left:1px solid var(--line);box-shadow:var(--sh-2);transform:translateX(100%);transition:transform var(--motion-base);display:flex;flex-direction:column}
.drawer-mask.show{opacity:1;pointer-events:auto}
.drawer.show{transform:none}
.drawer-head,.drawer-foot{padding:16px 20px;border-bottom:1px solid var(--line)}
.drawer-foot{border-top:1px solid var(--line);border-bottom:0;display:flex;justify-content:flex-end;gap:8px}
.drawer-body{padding:20px;overflow:auto;flex:1}
```

- [ ] **Step 4: 增加抽屉语义结构**

在全局浮层区域增加 `#drawerMask` 和 `#detailDrawer`。抽屉包含标题、关闭按钮、正文容器和操作区；使用 `role="dialog" aria-modal="true" aria-labelledby="drawerTitle"`。

- [ ] **Step 5: 实现打开、关闭和焦点返回**

```js
let drawerTrigger=null;
function openDrawer(title,body,actions='',trigger=document.activeElement){
  drawerTrigger=trigger;
  $('#drawerTitle').textContent=title;
  $('#drawerBody').innerHTML=body;
  $('#drawerFoot').innerHTML=actions;
  $('#drawerMask').classList.add('show');
  $('#detailDrawer').classList.add('show');
  $('#detailDrawer').setAttribute('aria-hidden','false');
  $('#drawerClose').focus();
}
function closeDrawer(){
  $('#drawerMask').classList.remove('show');
  $('#detailDrawer').classList.remove('show');
  $('#detailDrawer').setAttribute('aria-hidden','true');
  if(drawerTrigger) drawerTrigger.focus();
}
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer()});
```

- [ ] **Step 6: 将首页“查看原因”和任务列表“查看详情”接入抽屉**

为触发按钮添加 `data-act="open-drawer"` 与明确的 `data-drawer-kind`；在现有 `data-act` 分发器中按类型组装内容。抽屉内容必须显示状态、来源、影响范围和下一步，不只显示一段说明。

- [ ] **Step 7: 运行抽屉契约测试**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs`

Expected: PASS。

- [ ] **Step 8: 提交抽屉组件**

```bash
git add prototype/index.html prototype/tests/backoffice-design-system.test.mjs
git commit -m "feat: add standard backoffice detail drawer"
```

---

### Task 5: 将 AI 获客入口从卡片宫格改为任务工作区

**Files:**
- Modify: `prototype/index.html:437-438`
- Test: `prototype/tests/backoffice-design-system.test.mjs`
- Test: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

- [ ] **Step 1: 写 AI 获客工作区失败测试**

追加：

```js
test('AI acquisition uses a task workspace instead of a feature-card launcher', () => {
  const section = html.match(/<section class="page" data-p="acquisition">([\s\S]*?)<section class="page" data-p="settings">/)?.[1] ?? '';
  assert.match(section, /class="workspace-toolbar"/);
  assert.match(section, /class="workspace-surface"/);
  assert.match(section, /任务名称/);
  assert.match(section, /当前阶段/);
  assert.match(section, /人工确认/);
  assert.doesNotMatch(section, /class="outcome-grid"/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`

Expected: FAIL，原因是 AI 获客页面仍使用 `.outcome-grid` 功能卡片宫格。

- [ ] **Step 3: 保留页内四个业务标签页**

继续使用“获客计划、爆款追踪、内容创作、AI 视频”作为子导航，不增加一级导航。

- [ ] **Step 4: 用工具栏和任务表替换四张入口卡**

工具栏包含状态筛选、类型筛选和唯一主操作“新建获客任务”。任务表列固定为：任务名称、类型、使用知识、当前阶段、负责人、更新时间、状态、操作。

示例行必须明确为“原型演示”，并至少覆盖执行中、待人工确认和失败三种状态。

- [ ] **Step 5: 将行详情接入标准抽屉**

行尾只保留“查看”和“更多”；“查看”打开任务详情抽屉，展示输入、知识依据、执行时间线、结果和恢复动作。

- [ ] **Step 6: 运行 AI 获客测试**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交 AI 获客工作区**

```bash
git add prototype/index.html prototype/tests/backoffice-design-system.test.mjs
git commit -m "refactor: turn acquisition launcher into task workspace"
```

---

### Task 6: 统一任务、审批、状态和失败恢复

**Files:**
- Modify: `prototype/index.html` 中 `data-p="tasks"`、任务详情抽屉内容和公共状态组件
- Modify: `prototype/tests/enterprise-agent-operating-loop.test.mjs`
- Test: `prototype/tests/backoffice-design-system.test.mjs`

- [ ] **Step 1: 写状态词与审批信息失败测试**

```js
test('task and approval states use the approved lifecycle vocabulary', () => {
  for (const state of ['草稿', '执行中', '待补充', '待确认', '待审核', '已完成', '部分成功', '生成失败']) {
    assert.match(html, new RegExp(state));
  }
  for (const field of ['审批对象', '为什么需要审批', '知识依据', '影响范围', '批准后']) {
    assert.match(html, new RegExp(field));
  }
  assert.match(html, /只重试失败步骤/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs`

Expected: FAIL；至少缺少“部分成功”“为什么需要审批”或“只重试失败步骤”。

- [ ] **Step 3: 将任务页改为统一状态列表**

保持现有 `data-p="tasks"`，将任务按“待我处理、执行中、已结束”分组或筛选；相同状态统一使用 `.bdg` 语义类和规范文案。

- [ ] **Step 4: 增加部分成功与局部重试示例**

增加一条明确标注原型演示的 AI 视频任务：5 个镜头中 4 个成功、1 个失败；操作提供“查看原因”和“只重试失败镜头”，不得显示整任务已完成。

- [ ] **Step 5: 标准化审批抽屉**

审批详情依次呈现审批对象、触发原因、知识依据、影响范围、批准后动作和历史记录；底部仅一个实心“批准并执行”，另有“退回修改”次按钮。

- [ ] **Step 6: 运行任务与审批测试**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交任务状态迁移**

```bash
git add prototype/index.html prototype/tests/enterprise-agent-operating-loop.test.mjs prototype/tests/backoffice-design-system.test.mjs
git commit -m "refactor: standardize task and approval lifecycle"
```

---

### Task 7: 实现真实响应式重排并更新旧契约

**Files:**
- Modify: `prototype/index.html:29-31,328-356`
- Modify: `prototype/tests/pc-ui-system.test.mjs`
- Test: `prototype/tests/backoffice-design-system.test.mjs`

- [ ] **Step 1: 更新 PC UI 测试，移除固定整页最小宽度要求**

将：

```js
assert.match(html, /min-width:\s*1024px/);
```

替换为：

```js
assert.doesNotMatch(html, /html\{[^}]*min-width:\s*1024px/);
assert.doesNotMatch(html, /body\{[^}]*min-width:\s*1024px/);
assert.match(html, /@media\(max-width:880px\)/);
assert.match(html, /\.rail\{[^}]*transform:translateX\(-100%\)/s);
assert.match(html, /\.drawer\{[^}]*width:min\(var\(--drawer-w\),94vw\)/s);
```

- [ ] **Step 2: 写窄屏交互目标断言**

在 `backoffice-design-system.test.mjs` 中增加：

```js
test('narrow layouts remove page-wide minimum width and raise touch targets', () => {
  assert.doesNotMatch(html, /(?:html|body)\{[^}]*min-width:1024px/);
  assert.match(html, /@media\(max-width:560px\)[\s\S]*min-height:44px/);
  assert.match(html, /overflow-x:auto/);
});
```

- [ ] **Step 3: 运行响应式契约并确认失败**

Run: `node --test prototype/tests/pc-ui-system.test.mjs prototype/tests/backoffice-design-system.test.mjs`

Expected: FAIL，原因是 `html`、`body` 或 `.app` 仍固定 `min-width:1024px`。

- [ ] **Step 4: 移除整页固定最小宽度**

删除 `html`、`body` 和 `.app` 的 `min-width:1024px`。桌面布局由栅格和媒体查询控制；表格仅在自身容器 `.task-table-wrap` 或 `.card>table` 内横向滚动。

- [ ] **Step 5: 补齐 1024px 与 768px 行为**

- 1024–1365px：保留侧栏，页面间距降至 20px，次级列宽缩小。
- 768–1023px：侧栏变抽屉，主次两栏变单列，固定预览取消 sticky。
- 560px 以下：按钮和主要控件至少 44px，操作组纵向排列，表格提供局部滚动。

- [ ] **Step 6: 运行静态测试**

Run: `node --test prototype/tests/pc-ui-system.test.mjs prototype/tests/backoffice-design-system.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交响应式迁移**

```bash
git add prototype/index.html prototype/tests/pc-ui-system.test.mjs prototype/tests/backoffice-design-system.test.mjs
git commit -m "feat: add responsive backoffice reflow"
```

---

### Task 8: 扩展多视口真实渲染审计

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Create: `validation/design-system/`（脚本生成）
- Test: `prototype/scripts/capture-v1-prototype.mjs`

- [ ] **Step 1: 将单一视口改为视口矩阵**

在脚本中定义：

```js
const viewports = [
  { name: '1920x1080', width: 1920, height: 1080, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '1366x768', width: 1366, height: 768, mobile: false },
  { name: '1024x768', width: 1024, height: 768, mobile: false },
  { name: '820x1180', width: 820, height: 1180, mobile: false },
  { name: '390x844', width: 390, height: 844, mobile: true }
];
```

- [ ] **Step 2: 让截图名称包含视口**

将 `screenshot(name)` 改为 `screenshot(name, viewport.name)`，输出 `${name}-${viewport.name}.png`，默认目录改为 `validation/design-system`。

- [ ] **Step 3: 扩展布局审计字段**

每个页面、每个视口记录：

```js
{
  viewport: viewport.name,
  name,
  visiblePages,
  scrollWidth,
  clientWidth,
  outside,
  clippedText,
  primaryActions,
  drawerWithinViewport
}
```

`primaryActions` 只统计当前可见页面标题区和主要内容区的 `.btn.pri`；首页目标值为 1。`clippedText` 检查 `scrollWidth > clientWidth + 2` 且非明确横向滚动容器的文字元素。

- [ ] **Step 4: 增加抽屉和审批状态截图**

在 1440×900 与 390×844 下打开一次任务详情抽屉；在 1440×900 下打开审批抽屉，截图后关闭，确认焦点返回和页面仍只有一个可见 section。

- [ ] **Step 5: 运行现有全部静态测试**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 全部 PASS；不得通过删除产品范围测试来换取通过。

- [ ] **Step 6: 通过现有 Chrome 调试端口运行截图脚本**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/design-system`

Expected: 输出多视口截图和 `validation/design-system/layout-audit.json`；终端显示 PASS，且 `consoleErrors`、`uncaughtErrors`、`horizontalOverflowPages`、`duplicateVisiblePages`、`outsideElements`、`clippedText` 均为空。

- [ ] **Step 7: 检查关键渲染图**

人工查看：

- `validation/design-system/home-1440x900.png`
- `validation/design-system/home-390x844.png`
- `validation/design-system/acquisition-1440x900.png`
- `validation/design-system/task-drawer-1440x900.png`
- `validation/design-system/task-drawer-390x844.png`
- `validation/design-system/approval-drawer-1440x900.png`

确认无重叠、裁切、异常短尾行、重复主操作和对比度倒退。

- [ ] **Step 8: 提交验证脚本与证据**

```bash
git add prototype/scripts/capture-v1-prototype.mjs validation/design-system
git commit -m "test: add multi-viewport backoffice visual audit"
```

---

### Task 9: 全量回归与交付收口

**Files:**
- Modify: `prototype/index.html`（仅修复回归发现的问题）
- Modify: `prototype/tests/*.test.mjs`（仅补充真实缺口，不削弱既有范围）
- Modify: `validation/design-system/`（重新生成受影响页面）

- [ ] **Step 1: 运行全部测试**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 全部 PASS，0 failed。

- [ ] **Step 2: 运行 HTML 完整性扫描**

Run: `rg -n "T[O]DO|T[B]D|\{\{[^}]+\}\}|scrollIntoView|自动发布成功|设备在线|本地 Codex 已连接" prototype/index.html`

Expected: 无输出。若命中未完成标记，改为明确业务状态；不得仅为通过扫描隐藏文本。

- [ ] **Step 3: 检查唯一主操作和状态词**

Run: `node --test prototype/tests/backoffice-design-system.test.mjs`

Expected: PASS。

- [ ] **Step 4: 重跑受影响页面的视觉审计**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/design-system`

Expected: PASS；只重新人工检查上一步发生代码变化的页面和状态。

- [ ] **Step 5: 查看最终变更范围**

Run: `git diff --stat && git diff --check`

Expected: 只包含计划内的原型、测试、截图脚本和验证证据；`git diff --check` 无输出。

- [ ] **Step 6: 最终提交**

```bash
git add prototype/index.html prototype/tests prototype/scripts/capture-v1-prototype.mjs validation/design-system
git commit -m "feat: apply AI acquisition backoffice design system"
```

- [ ] **Step 7: 交付报告**

分别汇报：

1. 规范和页面迁移结果。
2. 自动测试数量与终态。
3. 已检查的真实渲染尺寸和页面。
4. 仍为“能力演示 · 待接入”的外部能力。
5. 未在本轮扩张的 CRM、自动外发、Agent 配置和格优独立分支。

---

## 执行边界

- 现有工作区包含未提交改动；执行每个 Task 前先运行 `git diff -- prototype/index.html`，只修改当前任务对应区域。
- 若 `.git` 仍为只读，跳过提交命令但保留每个 Task 的文件边界和验证证据，不得声称已提交。
- 不修改产品范围真源来迁就页面实现。
- 不将候选截图、结构测试通过或模拟 Toast 说成真实服务已接入。
- 任何外部发布、客户消息外发、正式知识修改和价格承诺仍需人工确认。

## 执行方式

1. **Inline Execution**：在当前会话连续执行 Task 1–9，每完成一个 Task 更新计划状态并继续；适合希望一次完成迁移。
2. **Checkpoint Execution**：每完成一个 Task 或一组相关 Task 后停下汇报并等待复核；适合先审首页与公共组件，再扩展到全原型。
