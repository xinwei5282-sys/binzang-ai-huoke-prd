# AI Growth Operating Agent MVP Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 AI 获客单文件原型收敛为老板与运营共用的“AI 获客经营代理”，跑通周目标、三层视频生产、轻量方向确认和结果复盘闭环。

**Architecture:** 继续复用 `prototype/index.html` 的单文件页面、`data-p` 页面路由、`data-act` 事件分发和 `?review=` 验收状态，不引入后端、账号权限或复杂审批系统。新增老板/运营角色视图、方向建议卡、统一视频任务板和三层生产状态；原营销生成、数字人混剪和专业配置能力保留为底层演示能力，但从老板主导航下沉。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js 内置测试模块、系统 Chrome 无头渲染。

---

## 文件责任图

- Modify: `prototype/index.html` — 信息架构、角色视图、周计划、方向建议卡、统一视频任务板、视频详情、结果复盘与演示交互。
- Create: `prototype/tests/ai-growth-operating-agent.test.mjs` — 新定位、角色边界、预算边界、轻确认、三层视频生产和结果追溯契约。
- Modify: `prototype/tests/enterprise-agent-operating-loop.test.mjs` — 移除与新规格冲突的完整审批中心断言，保留经营闭环、数据缺失和受控学习断言。
- Modify: `prototype/tests/commercial-workflows.test.mjs` — 将老板端双视频入口断言改为“统一视频任务入口 + 底层能力仍存在”。
- Modify: `prototype/tests/pc-ui-system.test.mjs` — 锁定老板/运营视图、紧凑主导航和连续工作区布局。
- Create: `validation/growth-agent-mvp/*.png` — 老板首页、运营首页、周计划、视频任务板、视频详情、结果复盘的真实渲染证据。
- Create: `validation/growth-agent-mvp/layout-audit.json` — 视口尺寸、页面宽度、横向溢出、控制台错误和关键状态检查结果。

## 实施前共享文件门禁

`prototype/index.html` 当前已有未提交改动。执行前必须先运行：

```bash
git status --short
git diff -- prototype/index.html
```

把现有差异保存为只读基线并在每个任务后复查。不得还原、覆盖或把无关文件纳入提交。若无法将本轮 `prototype/index.html` 改动与既有改动可靠区分，只提交独立测试/计划文件，原型共享文件留待用户确认后再提交。

### Task 1: 建立新产品契约

**Files:**
- Create: `prototype/tests/ai-growth-operating-agent.test.mjs`
- Modify: `prototype/tests/enterprise-agent-operating-loop.test.mjs`
- Modify: `prototype/tests/commercial-workflows.test.mjs`
- Test: `prototype/index.html`

- [ ] **Step 1: 写新定位和角色契约**

创建测试并写入以下核心断言：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const page = name => html.match(new RegExp(`<section class="[^"]*page[^"]*" data-p="${name}">([\\s\\S]*?)<\\/section>`))?.[1] ?? '';

test('AI growth operating agent supports boss and operator views', () => {
  assert.match(html, /AI 获客经营代理/);
  assert.match(html, /data-role-view="boss"/);
  assert.match(html, /data-role-view="operator"/);
  assert.match(html, /data-act="switch-role"/);
  assert.match(html, /老板定方向与看结果/);
  assert.match(html, /运营补素材、质检与执行/);
});
```

- [ ] **Step 2: 写轻确认和预算边界契约**

```js
test('direction changes use one lightweight confirmation card', () => {
  const home = page('home');
  const plan = page('plan');
  assert.match(`${home}${plan}`, /data-direction-proposal/);
  assert.match(`${home}${plan}`, /待老板确认/);
  assert.match(`${home}${plan}`, /data-act="accept-direction"/);
  assert.match(`${home}${plan}`, /data-act="reject-direction"/);
  assert.doesNotMatch(`${home}${plan}`, /经营预算录入/);
  assert.doesNotMatch(`${home}${plan}`, /预算审批/);
});
```

- [ ] **Step 3: 写三层视频和结果契约**

```js
test('video production uses a three-level funnel', () => {
  for (const level of ['测试型', '潜力型', '重点精制']) {
    assert.match(html, new RegExp(level));
  }
  for (const state of ['待补素材', '待运营确认', '视频生成中', '待发布', '已发布', '待复盘', '受阻']) {
    assert.match(html, new RegExp(state));
  }
  assert.match(html, /只重做失败镜头/);
  assert.match(html, /生成消耗仅运营可见/);
  assert.match(html, /有效线索/);
  assert.match(html, /数据来源/);
});
```

- [ ] **Step 4: 调整旧测试的冲突断言**

将 `enterprise-agent-operating-loop.test.mjs` 中“完整高风险审批中心”断言改为方向建议卡断言；保留数据未连接、人工补录、不得自动修改企业事实等安全边界。将 `commercial-workflows.test.mjs` 的首个测试改为同时断言：老板端存在 `data-p="video-tasks"` 统一入口，底层仍保留 `data-p="create"` 和 `data-p="remix"` 页面。

- [ ] **Step 5: 运行测试并确认按预期失败**

Run:

```bash
node --test prototype/tests/ai-growth-operating-agent.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs prototype/tests/commercial-workflows.test.mjs
```

Expected: FAIL；首个失败原因应是 `AI 获客经营代理`、`data-role-view="boss"` 或 `data-p="video-tasks"` 尚不存在，而不是语法或文件读取错误。

- [ ] **Step 6: 提交独立测试变更**

```bash
git add prototype/tests/ai-growth-operating-agent.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs prototype/tests/commercial-workflows.test.mjs
git diff --cached --check
git commit -m "test: define AI growth operating agent contracts"
```

### Task 2: 收敛主导航并建立双角色首页

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/pc-ui-system.test.mjs`
- Test: `prototype/tests/ai-growth-operating-agent.test.mjs`

- [ ] **Step 1: 将主导航收敛为经营闭环**

老板/运营主导航只突出：`AI 经营`、`周获客计划`、`视频任务`、`结果复盘`。知识、素材、平台等入口放入“运营配置”；`本地 Codex`、`Agent 中心`、`提示词管理` 不再作为老板主导航可见项。底层页面节点保留，避免删除既有演示能力。

新增标题路由：

```js
'video-tasks': ['视频任务', '测试 → 潜力 → 重点精制'],
'video-detail': ['视频详情', '依据 · 素材 · 分镜 · 结果']
```

- [ ] **Step 2: 增加角色视图切换**

在首页头部增加轻量切换控件：

```html
<div class="role-switch" aria-label="当前工作视图">
  <button class="on" data-act="switch-role" data-role="boss">老板视图</button>
  <button data-act="switch-role" data-role="operator">运营视图</button>
</div>
```

页面内容使用 `data-role-view="boss"` 和 `data-role-view="operator"` 分组。角色切换只改变页面重点，不实现真实账号权限。

- [ ] **Step 3: 重写老板首页第一屏**

老板视图依次呈现：对话目标输入、本周已确认方向、计划摘要、结果、异常和方向建议卡。移除预算数字和“完整审批中心”入口。对话示例改为“这周重点推真丝七件套，面向为父母提前准备的家庭，安排一周获客计划”。

- [ ] **Step 4: 增加运营首页第一屏**

运营视图依次呈现：今日任务、待补素材、待质检视频、发布状态、数据补录。明确文案“运营补素材、质检与执行”，不展示预算审批。

- [ ] **Step 5: 实现角色切换事件**

在现有 `data-act` 分发中增加：

```js
case 'switch-role': {
  const role = el.dataset.role === 'operator' ? 'operator' : 'boss';
  document.body.dataset.role = role;
  $$('.role-switch button').forEach(button => button.classList.toggle('on', button.dataset.role === role));
  $$('#home [data-role-view]').forEach(panel => panel.hidden = panel.dataset.roleView !== role);
  break;
}
```

实现时给首页 section 增加稳定 id `home`，并保证默认老板视图可见。

- [ ] **Step 6: 运行聚焦测试**

Run:

```bash
node --test prototype/tests/ai-growth-operating-agent.test.mjs prototype/tests/pc-ui-system.test.mjs
```

Expected: 角色与首页测试 PASS；三层视频和建议卡测试仍可因后续页面尚未实现而 FAIL。

- [ ] **Step 7: 检查共享文件提交边界**

运行 `git diff -- prototype/index.html`，确认没有丢失既有企业知识、数字人混剪、Codex 和 PC UI 改动。只有能够明确确认共享文件所有差异时，才与 `pc-ui-system.test.mjs` 一起提交。

### Task 3: 将周计划改为内容获客计划并加入轻确认

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/ai-growth-operating-agent.test.mjs`

- [ ] **Step 1: 收敛周计划内容**

保留 `data-p="plan"`，将任务集中为内容获客：主推产品、目标客户、选题、视频生产层级、负责人、状态和预计发布时间。移除经营预算、AI 销售自动外发和报价审批任务。

- [ ] **Step 2: 增加方向调整建议卡**

```html
<article class="direction-proposal" data-direction-proposal>
  <div><span class="bdg warn proposal-status">待老板确认</span><b>建议增加“子女提前准备”内容方向</b></div>
  <p>提出人：王运营 · 原因：本周相关咨询增加 · 影响：下周替换 2 条普通科普选题</p>
  <button class="btn pri" data-act="accept-direction">采纳</button>
  <button class="btn" data-act="reject-direction">退回</button>
</article>
```

建议卡不包含预算字段，也不直接修改本周正在执行的任务。

- [ ] **Step 3: 实现建议卡状态变化**

`accept-direction` 将状态改为“已采纳 · 进入下周计划”，`reject-direction` 将状态改为“已退回 · 等待运营调整”；两者记录演示操作人和当前日期文案，并禁用重复操作。

- [ ] **Step 4: 更新计划确认动作**

将 `confirm-plan` 的 Toast 从“高风险动作等待人工审批”改为“计划已确认，已创建内容与视频任务”；不得出现预算审批或完整审批中心暗示。

- [ ] **Step 5: 运行聚焦测试**

Run:

```bash
node --test prototype/tests/ai-growth-operating-agent.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs
```

Expected: 轻确认、预算边界和经营闭环测试 PASS。

### Task 4: 建立统一视频任务板与三层生产状态

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/commercial-workflows.test.mjs`
- Test: `prototype/tests/ai-growth-operating-agent.test.mjs`

- [ ] **Step 1: 新增统一视频任务页**

新增 `data-p="video-tasks"`，按状态分组展示任务：待补素材、脚本生成中、待运营确认、视频生成中、待发布、已发布、待复盘和受阻。每张任务卡必须展示生产层级、选题、负责人、当前节点和下一步操作。

- [ ] **Step 2: 增加三层标识和升级动作**

```html
<span class="production-level test">测试型</span>
<span class="production-level potential">潜力型</span>
<span class="production-level premium">重点精制</span>
```

测试型任务提供“升级为潜力型”，潜力型任务提供“建议重点精制”。升级动作只改变演示状态并记录“数据表现”或“运营判断”来源，不写死业务阈值。

- [ ] **Step 3: 新增视频详情页**

新增 `data-p="video-detail"`，展示制作原因、目标客户、钩子、引用知识、真实素材、素材缺口、镜头列表、生产方式、状态、发布记录和结果数据。镜头操作包含“替换真实素材”和“只重做失败镜头”。

- [ ] **Step 4: 下沉原双视频入口**

将老板端“营销场景生成”和“数字人混剪”合并为“视频任务”。保留 `data-p="create"` 和 `data-p="remix"` 作为运营配置或详情内的底层能力入口，保证既有生成、脚本确认和分镜确认交互不被删除。

- [ ] **Step 5: 增加成本可见性边界**

运营视图显示“预计生成消耗”和“实际生成消耗”，并明确“生成消耗仅运营可见”。老板视图和方向建议卡不得展示预算、预算审批或模型费用确认。

- [ ] **Step 6: 实现状态交互**

增加 `upgrade-video-level`、`open-video-detail`、`retry-failed-shot` 和 `mark-video-published` 事件。失败镜头重做只能改变当前镜头状态，不重置整条视频任务。

- [ ] **Step 7: 运行视频回归测试**

Run:

```bash
node --test prototype/tests/ai-growth-operating-agent.test.mjs prototype/tests/commercial-workflows.test.mjs
```

Expected: 统一入口、底层能力保留、三层生产、镜头级重做和运营成本可见性测试全部 PASS。

### Task 5: 将结果复盘收敛为分阶段验收

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/ai-growth-operating-agent.test.mjs`

- [ ] **Step 1: 重组结果复盘指标**

结果页按四层展示：产能、降本、内容效果、获客结果。指标至少包括可发布视频数、三层视频占比、模板/真实素材/生成镜头占比、单条可用视频消耗、完播/互动/咨询和有效线索。

- [ ] **Step 2: 给每个结果标记来源**

保留“平台已连接”“人工补录”“未连接”三种来源。有效线索必须能指向对应视频和选题；缺少来源时显示“数据未连接”，不得显示确定性增长归因。

- [ ] **Step 3: 增加继续、升级、调整、停止建议**

每条复盘建议展示判断依据和来源。建议只进入下一周计划草案，不自动升级生产层级或修改正式企业知识。

- [ ] **Step 4: 运行结果与数据边界测试**

Run:

```bash
node --test prototype/tests/ai-growth-operating-agent.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs
```

Expected: 分阶段结果、数据来源、有效线索追溯和受控学习测试 PASS。

### Task 6: 全量回归、真实渲染和交互验收

**Files:**
- Modify if needed: `prototype/index.html`
- Test: `prototype/tests/*.test.mjs`
- Create: `validation/growth-agent-mvp/*.png`
- Create: `validation/growth-agent-mvp/layout-audit.json`

- [ ] **Step 1: 运行全部静态契约**

Run:

```bash
node --test prototype/tests/*.test.mjs
```

Expected: 全部测试 PASS，零失败；既有企业知识初始化、知识治理、PC 连续工作区和底层商业工作流无回归。

- [ ] **Step 2: 运行语法和空白检查**

Run:

```bash
git diff --check -- prototype/index.html prototype/tests
```

Expected: 无输出。

- [ ] **Step 3: 启动本地静态服务**

Run:

```bash
python3 -m http.server 4173 --directory prototype
```

Expected: `http://127.0.0.1:4173/index.html?review=home` 可打开，页面脚本无启动错误。

- [ ] **Step 4: 渲染六个关键状态**

使用系统 Chrome 在 1440×900 和 1920×1080 下渲染：老板首页、运营首页、周计划、视频任务板、视频详情和结果复盘。截图保存到 `validation/growth-agent-mvp/`，文件名包含状态和视口，例如 `boss-home-1440x900.png`。

- [ ] **Step 5: 实际点击核心链路**

依次验证：老板/运营视图切换；运营建议卡采纳和退回；计划确认；测试型升级潜力型；打开视频详情；只重做失败镜头；标记已发布；人工补录结果。每个动作必须出现明确状态反馈且不得产生新的控制台错误。

- [ ] **Step 6: 写入布局审计结果**

`layout-audit.json` 至少记录：URL、视口、`document.documentElement.scrollWidth`、`clientWidth`、控制台错误数量、关键按钮存在性和点击结果。Expected: 1024px 及以上无页面级非预期横向溢出，关键动作未被遮挡，控制台新增错误为 0。

- [ ] **Step 7: 人工检查产品边界**

确认老板视图没有经营预算、预算审批、独立 Codex 工作台或复杂 Agent 配置；运营视图可以看到视频生成消耗；建议卡只有采纳/退回；数据缺失时没有虚构归因；底层原营销和混剪能力仍可从运营路径进入。

- [ ] **Step 8: 提交最终实现的安全门禁**

先运行：

```bash
git status --short
git diff --cached --name-status
```

只暂存本计划列出的测试、验证产物和经确认可提交的 `prototype/index.html`。如果共享原型文件仍混有无法可靠归属的既有改动，停止提交并向用户报告；不得将其他 PRD、README、飞书同步、知识卡片或临时可视化目录纳入提交。
