---
title: "AI获客商业工作流原型实施计划"
tags: ["type/设计", "domain/ai获客", "kw/商业工作流", "kw/企业Agent", "kw/原型实施"]
keywords: ["商业工作流", "企业Agent", "原型实施"]
project: "AI获客产品"
date: 2026-07-23
---

# AI Huoke Commercial Workflows Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [x]`) syntax for tracking.

**Goal:** 补齐企业 Agent 主闭环下的六类商业化业务场景，使现有原型能完整演示内容生产、销售、办公内容、本地执行、自动运营和 Agent 治理。

**Architecture:** 继续使用 `prototype/index.html` 的单文件静态结构，新增 `remix`、`automation`、`local-codex`、`agent-center` 页面，并扩展现有 `create`、`sales-agent`、`studio` 页面。所有页面复用现有导航、风险等级、审批和结果回传模型，通过统一 `data-act` 分发演示关键状态。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js 内置测试模块、Chrome + `puppeteer-core`。

---

## 文件责任图

- Modify: `prototype/index.html` — 六类业务场景、导航、交互和响应式布局。
- Create: `prototype/tests/commercial-workflows.test.mjs` — 商业化能力与安全边界契约。
- Create: `docs/codex/plans/2026-07-23-commercial-workflows-prototype.md` — 实施步骤和验证结果。
- Verify only: `/private/tmp/ai-huoke-commercial-workflows/*.png` — 桌面与移动端渲染证据。

### Task 1: 建立剩余能力契约

**Files:**
- Create: `prototype/tests/commercial-workflows.test.mjs`
- Read: `prototype/index.html`

- [x] **Step 1: 锁定页面和导航**

断言营销场景生成、数字人混剪、自动化运营、本地 Codex、Agent 中心均有独立导航和页面。

- [x] **Step 2: 锁定业务闭环**

断言内容输出包含封面、标题、正文或字幕；自动化包含追踪、生成、审核、发布和结果回收；销售包含线索分层、跟进、报价审批和结果回传。

- [x] **Step 3: 运行失败测试**

Run: `node --test prototype/tests/commercial-workflows.test.mjs`
Expected: FAIL，首个失败原因是 `data-p="remix"` 或新增页面不存在。

### Task 2: 拆分内容工作流并补齐自动化

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/commercial-workflows.test.mjs`

- [x] **Step 1: 将现有 create 明确为营销场景生成**

增加场景、目标客户、卖点、平台、封面、标题、正文和 CTA 的完整产物说明，保留爆款参考与知识回检。

- [x] **Step 2: 新增数字人混剪页面**

展示素材上传、脚本拆段、数字人和声音、自动素材匹配、封面与字幕、两级确认门和成片结果。

- [x] **Step 3: 新增自动化运营页面**

展示追踪规则、运行流水线、当前候选、人工审核、发布授权和结果回收，自动化不越过高风险审批。

### Task 3: 补齐销售、办公内容、本地设备和 Agent 治理

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/commercial-workflows.test.mjs`

- [x] **Step 1: 扩展 AI 销售页面**

加入线索池、意向分层、跟进建议、报价审批、人工接管、跟进时间线和结果回传。

- [x] **Step 2: 扩展 PPT / 朋友圈页面**

支持两类任务切换，展示知识和经营数据来源、完整产物预览、本地 Codex 状态及审核节点。

- [x] **Step 3: 新增本地 Codex 工作台**

展示硬件在线状态、企业绑定、模型和版本、任务队列、数据边界、日志和断连降级。

- [x] **Step 4: 新增 Agent 中心**

展示企业 Agent 与业务 Agent 的目标、负责人、知识范围、数据范围、动作权限、审批规则和结果回传配置。

### Task 4: 验证与收口

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/*.test.mjs`

- [x] **Step 1: 运行全部契约测试**

Run: `node --test prototype/tests/*.test.mjs`
Expected: 所有测试 PASS。

- [x] **Step 2: 验证关键点击**

实际点击数字人混剪提交、自动化候选审批、本地任务执行、销售人工接管和 Agent 权限保存，验证状态反馈。

- [x] **Step 3: 渲染桌面与移动端**

渲染 `create`、`remix`、`automation`、`sales-agent`、`studio`、`local-codex`、`agent-center` 到 `/private/tmp/ai-huoke-commercial-workflows/`。

- [x] **Step 4: 完成自检**

运行 `git diff --check`，扫描计划占位词，记录测试、截图和浏览器错误结果。

## 执行记录

- 契约测试：`node --test prototype/tests/*.test.mjs`，16/16 通过。
- 点击验证：混剪提交、自动化审核、销售接管、朋友圈切换、本地任务入队、Agent 配置保存均通过；浏览器错误 0。
- 渲染验证：7 个关键页面分别完成桌面端和 390px 移动端渲染，共 14 个状态；页面横向溢出 0，浏览器错误 0。
- 静态自检：计划和新增测试未发现未完成占位标记；目标目录不属于 Git 工作树，因此无法使用仓库级 `git diff --check`，改用单文件 `git diff --no-index --check` 检查新增文件，未报告空白错误。
- 能力边界：当前为可交互产品原型，本地 Codex、硬件、平台发布和业务数据均为界面演示，尚未接入真实服务。
