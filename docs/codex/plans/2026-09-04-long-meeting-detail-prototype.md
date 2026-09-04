# Long Meeting Detail Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在会议纪要原型中明确找到 AI 总结和逐字稿，并看到长会议分段处理状态。

**Architecture:** 保留现有 `WORK_HUB_MEETINGS`、`kb-memory` 路由和会议详情弹层，只在会议对象上增加演示进度字段，并把详情内容重组为两个可切换面板。所有处理和播放仍由前端演示数据与本地事件模拟，不新增外部依赖。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Node.js `node:test`、Chrome DevTools Protocol、项目内 `codex-verify`。

---

## File structure map

### Create

- `docs/superpowers/specs/2026-09-04-long-meeting-detail-prototype-design.md` — 冻结长会议与详情标签设计。
- `docs/codex/plans/2026-09-04-long-meeting-detail-prototype.md` — 实施和验证步骤。

### Modify

- `prototype/index.html` — 长会议样例、分段进度、AI 总结/逐字稿标签及切换交互。
- `prototype/tests/enterprise-work-hub.test.mjs` — 静态契约和事件入口测试。
- `prototype/scripts/capture-enterprise-work-hub.mjs` — 浏览器中验证两个详情标签与长会议进度。
- `prd/pages/企业大脑-会议纪要.md` — 补充原型信息位置和长会议演示说明。

### Explicitly unchanged

- 真实 ASR、LLM、对象存储和任务队列。
- `kb-memory` 内部稳定路由键。
- 工作中枢、客户档案和营销物料的现有任务归属。

### Task 1: Lock the detail information architecture

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing assertions**

断言源码包含 `data-meeting-detail-tab="summary"`、`data-meeting-detail-tab="transcript"`、`data-meeting-detail-panel="summary"`、`data-meeting-detail-panel="transcript"`、`AI 总结`、`逐字稿` 和 `switchMeetingDetailTab`。

- [ ] **Step 2: Run the focused test and confirm red**

Run: `node --test --test-reporter=spec --test-name-pattern="meeting detail|long meeting" prototype/tests/enterprise-work-hub.test.mjs`

Expected: FAIL because the current detail stacks transcript and summary vertically without named tabs.

- [ ] **Step 3: Implement the two-panel detail**

在 `openEnterpriseMeetingDetail(id)` 中先渲染来源区，再渲染：

```html
<div class="meeting-detail-tabs">
  <button class="on" data-act="switch-meeting-detail-tab" data-meeting-detail-tab="summary">AI 总结</button>
  <button data-act="switch-meeting-detail-tab" data-meeting-detail-tab="transcript">逐字稿</button>
</div>
<section class="show" data-meeting-detail-panel="summary">...</section>
<section data-meeting-detail-panel="transcript">...</section>
```

新增 `switchMeetingDetailTab(tab)`，只切换当前会议详情内的按钮和面板，并在事件分发中接入 `switch-meeting-detail-tab`。

- [ ] **Step 4: Run green**

Run: `node --test --test-reporter=spec --test-name-pattern="meeting detail|long meeting" prototype/tests/enterprise-work-hub.test.mjs`

Expected: PASS.

### Task 2: Add the long-meeting processing demonstration

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/index.html`
- Modify: `prd/pages/企业大脑-会议纪要.md`

- [ ] **Step 1: Add a failing long-meeting contract**

断言存在 `segmentProgress`、`总时长 02:36:18`、`4 个分段`、`已完成 3 个` 和“原型演示”说明。

- [ ] **Step 2: Run red**

Run: `node --test --test-reporter=spec --test-name-pattern="long meeting" prototype/tests/enterprise-work-hub.test.mjs`

Expected: FAIL because no long-meeting fixture or progress UI exists.

- [ ] **Step 3: Add the processing fixture and progress UI**

在 `WORK_HUB_MEETINGS` 增加一条企业可见、`summarizing` 状态的 2:36:18 视频会议，使用：

```js
segmentProgress: { total: 4, completed: 3, current: '正在生成第 4 段总结' }
```

列表卡片在非 `ready` 状态显示细进度、分段数和“结果生成后可查看 AI 总结与逐字稿”，按钮保持禁用。

- [ ] **Step 4: Update the page contract and run green**

Run: `node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs`

Expected: PASS.

### Task 3: Verify runtime behavior and responsive rendering

**Files:**
- Modify: `prototype/scripts/capture-enterprise-work-hub.mjs`

- [ ] **Step 1: Extend browser assertions**

浏览器脚本验证：详情默认 `summary` 面板可见、`transcript` 隐藏；点击逐字稿后状态反转且至少存在一条时间戳转写；返回 AI 总结后行动项仍可确认。列表验证长会议分段进度可见。

- [ ] **Step 2: Run focused browser verification**

Run: `codex-verify --focus enterprise-work-hub --browser`

Expected: focused tests and desktop/mobile captures PASS.

- [ ] **Step 3: Run full delivery gate**

Run: `codex-verify --full`

Expected: all tests, source SHA, desktop/mobile browser captures, console and overflow audits PASS.

- [ ] **Step 4: Inspect key screenshots**

人工查看会议列表、AI 总结和逐字稿在 1440×900 与 390×844 下的截图，确认标签可见、正文可读、主操作不被裁切。

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-04-long-meeting-detail-prototype-design.md docs/codex/plans/2026-09-04-long-meeting-detail-prototype.md prototype/index.html prototype/tests/enterprise-work-hub.test.mjs prototype/scripts/capture-enterprise-work-hub.mjs prd/pages/企业大脑-会议纪要.md
git commit -m "feat: clarify long meeting minutes prototype"
```

## Plan self-review

- Spec coverage: long-meeting progress, AI summary location, transcript location, task confirmation and prototype-only boundary are mapped to Tasks 1–3.
- Placeholder scan: no placeholder text or undefined implementation step remains.
- Type consistency: detail tabs use `summary` and `transcript`; the long-meeting fixture uses `segmentProgress` consistently.
- Scope: limited to the existing meeting-minutes prototype and its focused verification files.
