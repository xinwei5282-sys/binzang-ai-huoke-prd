---
title: "企业 Agent 经营闭环原型实施计划"
tags: ["type/设计", "domain/ai获客", "kw/企业Agent", "kw/经营闭环", "kw/原型实施"]
keywords: ["企业Agent", "经营闭环", "原型实施"]
project: "AI获客产品"
date: 2026-07-23
---

# Enterprise Agent Operating Loop Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [x]`) syntax for tracking.

**Goal:** 将现有 AI 获客静态原型从内容工具首页升级为企业 Agent 经营驾驶舱，并补齐计划、任务审批、结果复盘和受控学习闭环。

**Architecture:** 保留 `prototype/index.html` 单文件原型与现有知识库、内容生成页面，通过新增页面状态和统一 `data-act` 事件扩展企业 Agent 闭环。导航按经营、业务 Agent、大脑与复盘、管理四层重组；所有新交互均为本地演示状态，不宣称接入真实模型、发布和经营数据接口。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js 内置测试模块、系统 Chrome 与 `puppeteer-core`。

---

## 文件责任图

- Create: `docs/superpowers/specs/2026-07-23-enterprise-agent-operating-loop-design.md` — 产品定位、信息架构、闭环、审批、权限和异常真源。
- Create: `docs/codex/plans/2026-07-23-enterprise-agent-operating-loop-prototype.md` — 本轮实施步骤和验证记录。
- Modify: `prototype/index.html` — 导航、企业 Agent 驾驶舱、运营计划、任务审批、结果复盘、交互与响应式样式。
- Create: `prototype/tests/enterprise-agent-operating-loop.test.mjs` — 锁定页面、主链路、风险分级和受控学习边界。
- Verify only: `/private/tmp/ai-huoke-enterprise-agent/*.png` — 桌面与移动端渲染证据。

### Task 1: 建立企业 Agent 闭环契约

**Files:**
- Create: `prototype/tests/enterprise-agent-operating-loop.test.mjs`
- Read: `prototype/index.html`

- [x] **Step 1: 写失败测试**

测试必须匹配 `data-p="home"`、`data-p="plan"`、`data-p="tasks"`、`data-p="review"` 四个页面，并断言导航包含“企业 Agent”“运营计划”“任务与审批”“结果复盘”。

- [x] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-agent-operating-loop.test.mjs`
Expected: FAIL，失败原因是新增导航或页面尚不存在。

- [x] **Step 3: 增加治理边界断言**

断言页面包含低/中/高风险、人工审批、数据未连接、知识候选、不得自动修改企业事实，以及 `data-act="agent-send"`、`data-act="approve-task"`、`data-act="confirm-learning"` 三类动作。

### Task 2: 重组导航并升级首页驾驶舱

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-agent-operating-loop.test.mjs`

- [x] **Step 1: 重组左侧导航**

把现有入口归入经营、业务 Agent、大脑与复盘、管理四组；保留原页面的 `data-v`，新增 `plan`、`tasks`、`review`。

- [x] **Step 2: 将首页替换为企业 Agent 驾驶舱**

首页依次呈现对话入口、周期目标、经营诊断、已确认计划摘要、业务 Agent 运行状态、待审批动作、结果摘要和学习建议。

- [x] **Step 3: 增加对话演示状态**

`agent-send` 读取 `#agentPrompt`，插入老板消息，显示分析状态，再返回带数据范围、建议任务和“生成计划”动作的 Agent 响应。

- [x] **Step 4: 运行闭环测试**

Run: `node --test prototype/tests/enterprise-agent-operating-loop.test.mjs`
Expected: PASS。

### Task 3: 增加计划、任务审批与结果复盘页面

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-agent-operating-loop.test.mjs`

- [x] **Step 1: 增加运营计划页面**

展示周期目标、策略、任务、业务 Agent、负责人、时间、风险等级和预期结果；提供确认计划、逐项调整和暂停动作。

- [x] **Step 2: 增加任务与审批页面**

展示统一任务状态和审批队列；高风险任务显示风险原因、知识依据和影响范围，支持批准、退回和拒绝演示。

- [x] **Step 3: 增加结果复盘页面**

展示结果数据来源、渠道表现、复盘结论、策略建议和知识候选；`confirm-learning` 只把候选标记为“已提交知识治理”，不直接修改正式知识。

- [x] **Step 4: 增加异常降级状态**

在诊断或任务区明确展示数据未连接、知识不足、执行受阻和结果人工补录入口。

### Task 4: 响应式与交互验证

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-agent-operating-loop.test.mjs`
- Test: `prototype/tests/unified-knowledge-onboarding.test.mjs`

- [x] **Step 1: 补充响应式规则**

桌面端驾驶舱采用不对称双列；880px 以下改为单列并保留全部关键动作；表格在移动端横向滚动，按钮触控高度不低于 44px。

- [x] **Step 2: 运行全部静态契约测试**

Run: `node --test prototype/tests/*.test.mjs`
Expected: 所有测试 PASS，既有知识库首用流程无回归。

- [x] **Step 3: 渲染关键状态**

使用 `?review=home`、`?review=plan`、`?review=tasks`、`?review=review` 和 `?review=kb-onboarding-upload-sales` 渲染桌面与移动端截图到 `/private/tmp/ai-huoke-enterprise-agent/`。

- [x] **Step 4: 检查真实渲染**

核对无文字溢出、无元素遮挡、移动端关键动作未隐藏、审批与学习边界可见，并记录截图尺寸和浏览器控制台错误。

## 执行记录

- 静态契约：`node --test prototype/tests/*.test.mjs`，10 项全部通过。
- 页面状态：企业 Agent、运营计划、任务与审批、结果复盘、知识初始化均在 1440px 和 390px 正确切换。
- 布局检查：10 个关键截图均无页面级横向溢出；审批、对话发送、人工补录和知识候选动作在移动端保留。
- 点击检查：企业 Agent 对话、批准高风险任务、确认知识候选三条链路全部通过，浏览器脚本运行时错误为 0。
- 渲染证据：`/private/tmp/ai-huoke-enterprise-agent/`。隐藏的旧演示页面会预加载外部示例图片，自动化控制台记录到跨域资源拦截；不影响本轮新增页面和交互。
