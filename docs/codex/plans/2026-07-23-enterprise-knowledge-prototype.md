---
title: "企业知识中心原型实施计划"
tags: ["type/设计", "domain/ai获客", "kw/企业知识库", "kw/知识治理", "kw/原型实施"]
keywords: ["企业知识库", "知识治理", "原型实施"]
project: "AI获客产品"
date: 2026-07-23
---

# Enterprise Knowledge Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将商户端现有个人文件式知识库改成可演示的企业知识中心，并把人员、知识、Agent 与审批权限体现到真实交互中。

**Architecture:** 保持现有单文件静态原型架构，在 `kb` 页面内部增加六个工作区标签，通过统一事件分发切换视图和触发演示操作。沿用当前视觉变量与组件，不增加依赖；上传资料先进入企业收件箱，知识发布与 Agent 调用均显示权限和审批状态。

**Tech Stack:** HTML、CSS、原生 JavaScript、Puppeteer/Chrome 截图验证。

---

## 文件责任图

- Create: `docs/codex/plans/2026-07-23-enterprise-knowledge-prototype.md` — 本次实施范围、步骤和验证命令。
- Modify: `prototype/index.html` — 企业知识库信息架构、权限展示、演示交互与响应式样式。
- Verify: `/private/tmp/ai-huoke-kb-*.png` — 桌面、移动端及关键子状态渲染证据，不进入仓库。

### Task 1: 企业知识中心信息架构

**Files:**
- Modify: `prototype/index.html`

- [x] **Step 1: 建立六个工作区标签**

在知识库页增加 `overview`、`sources`、`domains`、`review`、`governance`、`agents` 六个视图，并让标签、标题和内容状态同步。

- [x] **Step 2: 实现知识概览**

展示初始化进度、治理待办、知识健康度、来源状态、知识域覆盖和 Agent 使用摘要，所有指标带明确业务含义。

- [x] **Step 3: 实现数据源与知识域**

资料上传先进入企业收件箱并显示“解析中/待确认/已发布”等状态；默认知识域改为企业固定业务域，知识条目显示来源、负责人、安全等级和 Agent 范围。

- [x] **Step 4: 实现待审核与治理中心**

展示关键事实确认、冲突处理、过期复核、负责人和复核周期，并提供可点击的批准、处理和配置反馈。

### Task 2: 权限与 Agent 授权交互

**Files:**
- Modify: `prototype/index.html`

- [x] **Step 1: 增加权限摘要组件**

知识条目显示“人员范围｜Agent 范围｜对外输出规则｜有效期”，受限知识使用明确安全等级标识。

- [x] **Step 2: 增加 Agent 授权视图**

展示内容、销售、PPT、企业和自动发布 Agent 的服务身份、知识范围、动作范围与审批节点，并支持编辑授权演示。

- [x] **Step 3: 调整上传与成员配置**

上传不要求员工选择最终知识域，只收集来源部门和敏感信息提示；成员管理补充知识角色和数据范围，使人员权限与知识权限形成闭环。

- [x] **Step 4: 补充权限拦截和人工审批反馈**

对机密调用、跨部门访问和自动发布使用审批提示，不暴露无权访问的知识内容。

### Task 3: 响应式与真实渲染验证

**Files:**
- Modify: `prototype/index.html`
- Verify: `/private/tmp/ai-huoke-kb-*.png`

- [x] **Step 1: 静态检查**

Run: `git diff --check -- prototype/index.html`

Expected: 无空白错误。

- [x] **Step 2: 桌面端渲染**

Run: `node ~/.agents/skills/role-ui/assets/render-review.js prototype/index.html --state reviewState:kb-overview`

Expected: 知识概览完整显示，无登录遮挡、溢出或骨架态。

- [x] **Step 3: 关键子状态渲染**

分别渲染 `kb-domains`、`kb-review` 和 `kb-agents`，检查权限摘要、表格横向空间和交互主次。

- [x] **Step 4: 移动端渲染与点击检查**

使用本地 Chrome/Puppeteer 以移动端视口打开原型，检查知识标签横向滚动、列表重排、按钮热区，以及上传、审核、Agent 授权等点击反馈。

- [x] **Step 5: 提交**

```bash
git add docs/codex/plans/2026-07-23-enterprise-knowledge-prototype.md prototype/index.html
git commit -m "feat: redesign enterprise knowledge prototype"
```
