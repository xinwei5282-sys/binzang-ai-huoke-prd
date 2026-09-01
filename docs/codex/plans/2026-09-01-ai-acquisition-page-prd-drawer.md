# AI Acquisition Page PRD Drawer Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一 AI 获客 PRD 口径，并在六个 AI 获客页面中提供与当前路由对应的字段级页面 PRD 抽屉。

**Architecture:** `prototype/index.html` 保持单文件原型真源，在现有任务详情抽屉之外新增独立的页面 PRD 入口、抽屉 DOM、路由映射和开关逻辑。Markdown 页面 PRD 采用与 2026-08-31 沉香项目一致的字段级章节顺序；结构测试检查文档与原型映射完整性，项目验收器负责桌面和手机真实浏览器验证。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js `node:test`、项目 `codex-verify` 验收器。

---

## File Responsibility Map

### Create

- `prd/pages/AI获客-总览.md`：AI 获客任务总览的独立页面契约。
- `prototype/tests/page-prd-drawer.test.mjs`：页面 PRD 映射、结构、交互契约和文档一致性测试。
- `docs/codex/plans/2026-09-01-ai-acquisition-page-prd-drawer.md`：本实施计划。

### Rename

- `prd/pages/AI获客-短视频创作.md` → `prd/pages/AI获客-营销视频.md`：将旧页面名升级为现行“营销视频”口径。

### Modify

- `prd/PRD_企业AI经营大脑_当前开发基线.md`：升级版本与日期，修正 AI 获客菜单。
- `prd/PRD_提示词.md`：升级版本与日期，将 P-042、P-043、P-044 纳入当前基线说明。
- `prd/PRD_视频模板化生成与换人换产品.md`：保留历史参考定位，修正现行入口名称。
- `prd/PRD_AI获客.md`：补齐六个页面级 PRD 链接和页面 PRD 展示规则。
- `prd/PRD索引.md`：同步 AI 获客总览、营销视频和 AI 混剪索引。
- `prd/pages/AI获客-获客计划.md`：按统一字段级页面 PRD 顺序补齐章节。
- `prd/pages/AI获客-爆款追踪.md`：按统一字段级页面 PRD 顺序补齐章节。
- `prd/pages/AI获客-AI混剪.md`：按统一字段级页面 PRD 顺序补齐章节。
- `prd/pages/AI获客-营销视频.md`：按统一字段级页面 PRD 顺序补齐章节。
- `prd/pages/AI获客-数字人.md`：按统一字段级页面 PRD 顺序补齐章节。
- `prd/pages/README.md`：升级版本与日期并更新六页索引。
- `prototype/index.html`：增加路由感知入口、独立 PRD 抽屉、六页内容映射、焦点管理和响应式样式。

### Delete

- `prd/pages/AI获客-AI视频.md`：删除已被 AI 混剪取代的旧页面 PRD。

## Task 1: Add Failing Page PRD Contract Tests

**Files:**
- Create: `prototype/tests/page-prd-drawer.test.mjs`
- Test: `prototype/index.html`
- Test: `prd/pages/*.md`

- [ ] **Step 1: Write the route and drawer structure test**

创建 `page-prd-drawer.test.mjs`，读取 `prototype/index.html` 并断言：

```js
const routes = ['acquisition', 'plan', 'burst', 'remix', 'create', 'avatar'];
for (const route of routes) {
  assert.match(html, new RegExp(`${route}:\\s*\\{`));
}
assert.match(html, /id="pagePrdTrigger"/);
assert.match(html, /id="pagePrdDrawer"/);
assert.match(html, /id="pagePrdMask"/);
assert.match(html, /function openPagePrd/);
assert.match(html, /function closePagePrd/);
```

- [ ] **Step 2: Write the required-section test**

断言原型映射与六份页面文档均包含：页面概述、页面级业务规则、页面字段、操作与结果、产品边界、状态与跳转、通知与日志、异常与空状态、页面验收标准、技术评估项。

- [ ] **Step 3: Write the terminology and isolation test**

断言现行索引不再链接 `AI获客-短视频创作` 或 `AI获客-AI视频`，并断言页面 PRD 抽屉与 `detailDrawer` 使用不同 ID、遮罩和开关函数。

- [ ] **Step 4: Run the focused test and verify it fails**

Run: `node --test prototype/tests/page-prd-drawer.test.mjs`

Expected: FAIL because the new drawer, six-route map and renamed Markdown pages do not exist yet.

## Task 2: Normalize the Markdown PRD Set

**Files:**
- Create: `prd/pages/AI获客-总览.md`
- Rename: `prd/pages/AI获客-短视频创作.md` → `prd/pages/AI获客-营销视频.md`
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md`
- Modify: `prd/PRD_提示词.md`
- Modify: `prd/PRD_视频模板化生成与换人换产品.md`
- Modify: `prd/PRD_AI获客.md`
- Modify: `prd/PRD索引.md`
- Modify: `prd/pages/AI获客-获客计划.md`
- Modify: `prd/pages/AI获客-爆款追踪.md`
- Modify: `prd/pages/AI获客-AI混剪.md`
- Modify: `prd/pages/AI获客-营销视频.md`
- Modify: `prd/pages/AI获客-数字人.md`
- Modify: `prd/pages/README.md`
- Delete: `prd/pages/AI获客-AI视频.md`
- Test: `prototype/tests/page-prd-drawer.test.mjs`

- [ ] **Step 1: Rename the marketing-video page and create the overview page**

保留已更新的营销视频正文，将文件名和页面标题改为“营销视频”。新增总览页，页面 ID 使用 `acquisition`，版本使用 `v1.0`，日期使用 `2026-09-01`。

- [ ] **Step 2: Apply the common field-level section order**

六个页面均按以下固定顺序组织：

```text
页面概述
页面级业务规则
页面字段
操作与结果
产品边界
状态与跳转
通知与日志
异常与空状态
页面验收标准
技术评估项
```

保留各页面已有业务规则，不用通用占位文案覆盖页面特有字段、状态或人工门。

- [ ] **Step 3: Synchronize versions, dates and links**

将本次实际更新的当前基线文档升级到 `2026-09-01`，版本增加一个小版本；历史参考文档仅更新其口径修订说明。所有现行链接改为 `AI获客-营销视频` 和 `AI获客-AI混剪`。

- [ ] **Step 4: Run the focused test**

Run: `node --test prototype/tests/page-prd-drawer.test.mjs`

Expected: Markdown section and terminology assertions PASS; drawer assertions still FAIL.

## Task 3: Implement the Route-Aware Page PRD Drawer

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/page-prd-drawer.test.mjs`

- [ ] **Step 1: Add the isolated drawer shell**

在现有 `detailDrawer` 之外增加：

```html
<button id="pagePrdTrigger" data-act="open-page-prd" aria-controls="pagePrdDrawer">
  <span>页面</span><b>PRD</b>
</button>
<div id="pagePrdMask" data-act="close-page-prd"></div>
<aside id="pagePrdDrawer" role="dialog" aria-modal="true" aria-labelledby="pagePrdTitle" aria-hidden="true">
  <header class="page-prd-head">
    <div><span>产品需求文档</span><h2 id="pagePrdTitle"></h2></div>
    <button data-act="close-page-prd" aria-label="关闭页面 PRD">关闭</button>
  </header>
  <div id="pagePrdBody" class="page-prd-body"></div>
  <footer class="page-prd-foot">
    <span id="pagePrdContext"></span>
    <button data-act="close-page-prd">关闭 PRD</button>
  </footer>
</aside>
```

- [ ] **Step 2: Add the six-page data map**

实现 `PAGE_PRD_CONTENT`，六个键均包含 `label/status/version/route/updatedAt/overview/rules/fields/actions/boundary/flows/logs/exceptions/acceptance/tech`。

- [ ] **Step 3: Add semantic render helpers**

实现转义、列表、表格、状态流和完整正文渲染函数。所有内容来自静态受控映射；渲染文本前统一转义，不接受用户输入 HTML。

- [ ] **Step 4: Add open, close and route-sync behavior**

实现：

```js
function syncPagePrdEntry(route) {
  const data = PAGE_PRD_CONTENT[route];
  pagePrdTrigger.hidden = !data;
  if (!data) return;
  pagePrdTrigger.dataset.pagePrdRoute = route;
  pagePrdTrigger.setAttribute('aria-label', `查看${data.label} · 页面 PRD`);
}

function openPagePrd(trigger) {
  const route = trigger.dataset.pagePrdRoute;
  const data = PAGE_PRD_CONTENT[route];
  if (!data) return;
  pagePrdTriggerBeforeOpen = trigger;
  renderPagePrd(data);
  pagePrdDrawer.classList.add('show');
  pagePrdMask.classList.add('show');
  pagePrdDrawer.setAttribute('aria-hidden', 'false');
  trigger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  pagePrdDrawer.querySelector('[data-act="close-page-prd"]').focus();
}

function closePagePrd() {
  pagePrdDrawer.classList.remove('show');
  pagePrdMask.classList.remove('show');
  pagePrdDrawer.setAttribute('aria-hidden', 'true');
  pagePrdTrigger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  pagePrdTriggerBeforeOpen?.focus();
  pagePrdTriggerBeforeOpen = null;
}
```

在 `go(v)` 完成路由切换后调用 `syncPagePrdEntry(v)`；若抽屉已打开则先关闭。点击代理增加 `open-page-prd` 和 `close-page-prd` 分支。

- [ ] **Step 5: Add keyboard containment**

Esc 关闭；Tab 和 Shift+Tab 在页面 PRD 抽屉内循环。保留任务详情抽屉的现有键盘逻辑，两个抽屉分别判断自身打开状态。

- [ ] **Step 6: Add desktop, mobile and reduced-motion styles**

实现 44×92px 右侧入口、720px 全高抽屉、固定头尾、独立滚动正文、章节卡、表格局部横向滚动和 390px 窄屏适配；复用当前蓝灰令牌。

- [ ] **Step 7: Run the focused test and verify it passes**

Run: `node --test prototype/tests/page-prd-drawer.test.mjs`

Expected: PASS with six mapped routes, complete sections, isolated drawer and current terminology.

## Task 4: Run Focused and Full Automated Verification

**Files:**
- Test: `prototype/tests/*.test.mjs`
- Test: `prototype/index.html`
- Test: `prd/**/*.md`

- [ ] **Step 1: Run PRD and commercial workflow tests**

Run:

```bash
node --test prototype/tests/page-prd-drawer.test.mjs prototype/tests/business-artifacts-v1.test.mjs prototype/tests/commercial-workflows.test.mjs prototype/tests/remotion-video-workflow.test.mjs prototype/tests/prototype-distillation.test.mjs
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run the complete Node test suite**

Run: `node --test --test-reporter=dot prototype/tests/*.test.mjs`

Expected: all tests PASS with zero failures.

- [ ] **Step 3: Run whitespace validation**

Run: `git diff --check`

Expected: no output and exit code 0 for the working-tree diff.

## Task 5: Run Full Browser Verification

**Files:**
- Verify: `prototype/index.html`
- Verify: generated screenshots and audit output under the verifier's temporary output directory

- [ ] **Step 1: Run the project full verifier**

Run: `codex-verify --full`

Fallback: `node prototype/scripts/verify-prototype.mjs`

Expected: source truth check, 1440×900 browser pass, 390×844 browser pass, console audit, overflow audit and layout audit all PASS.

- [ ] **Step 2: Inspect the key screenshots**

人工查看 AI 获客总览、AI 混剪和营销视频的桌面截图，以及至少一张 390×844 抽屉截图。确认入口不遮挡主操作、抽屉头尾可见、章节层级清楚、表格仅局部滚动。

- [ ] **Step 3: Re-run focused verification after any visual fix**

任何视觉修正后重新运行 `node --test prototype/tests/page-prd-drawer.test.mjs` 和受影响的浏览器验收，不用旧截图替代最终结果。

## Task 6: Stage and Commit the Verified Implementation

**Files:**
- Stage only the PRD, prototype, tests and plan files listed above plus the previously selected related AI 获客 files.

- [ ] **Step 1: Review repository state**

Run: `git status --short` and `git diff --cached --stat`.

Expected: unrelated 飞书镜像、图片、Remotion 输出、知识卡片和其他工作区文件 remain unstaged.

- [ ] **Step 2: Stage exact paths**

使用显式路径执行 `git add`；不使用 `git add .` 或宽泛 glob。

- [ ] **Step 3: Validate the staged patch**

Run: `git diff --cached --check` and `git diff --cached --name-status`.

Expected: no whitespace errors; only in-scope files appear.

- [ ] **Step 4: Create the local implementation commit**

Run: `git commit -m "feat: 展示 AI 获客页面级 PRD"`

Expected: commit succeeds on `codex/rewrite-all-affected-prds`.

- [ ] **Step 5: Verify the commit and remote state**

Run: `git log -2 --oneline --decorate` and `git status --short`.

Expected: design and implementation commits are local; unrelated working-tree changes remain; no remote push is performed.
