# Operating Plan History and Gap Supplement Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在经营计划页中增加历史版本查看，并将缺失信息入口改为不重复提问的定向增量补充。

**Architecture:** 继续以 `prototype/index.html` 为唯一真源，用纯函数模型定义历史版本和缺口状态，用现有事件分发器处理页签、历史详情和定向补充。所有上传内容保持候选状态，不自动成为企业事实。

**Tech Stack:** 单文件 HTML/CSS/JavaScript、Node.js `node:test`、日常 Chrome 真实预览。

---

## 文件责任

- Modify: `prototype/index.html` — 历史版本模型、页签、历史列表、缺口状态和定向补充交互。
- Modify: `prototype/tests/company-operating-plan.test.mjs` — 历史不覆盖、状态分类、定向补充和页签交互回归。

### Task 1: 先写历史版本与缺口模型测试

- [x] 在 `prototype/tests/company-operating-plan.test.mjs` 断言历史计划包含周期、版本、审核人、生效时间和复盘结论。
- [x] 断言缺口支持 `insufficient`、`stale`、`candidate` 和 `conflict` 四种状态，且每项含责任人和已知信息。
- [x] 运行 `node --test prototype/tests/company-operating-plan.test.mjs`，预期新断言在实现前失败。

### Task 2: 实现历史计划工作区

- [x] 在 `prototype/index.html` 定义 `COMPANY_OPERATING_PLAN_HISTORY` 和只读历史记录字段。
- [x] 在当前计划顶部注入 `当前计划 / 历史计划` 页签，历史页展示三条演示版本。
- [x] 增加 `switch-company-plan-view` 和 `view-historical-operating-plan` 事件，查看详情时保持历史版本只读。
- [x] 运行专项测试，预期历史相关断言通过。

### Task 3: 实现不重复提问的定向补充

- [x] 定义 `COMPANY_OPERATING_PLAN_GAPS`，为每个缺口保存状态、已知信息、仍缺字段、原因和责任人。
- [x] 将缺口行改为状态标签 + 责任人 + `去补充`，不再使用通用上传入口。
- [x] 增加 `openCompanyPlanGapSupplement(gapId)`，先进入企业大脑诊断总览，再打开只包含缺失字段的表单，证据文件为可选。
- [x] 提交时显示“已进入待确认”，不直接更新已生效计划。

### Task 4: 回归和真实浏览器验收

- [ ] 运行 `node --test prototype/tests/*.test.mjs`，预期全部通过。
- [x] 运行 `git diff --check -- prototype/index.html prototype/tests/company-operating-plan.test.mjs`，预期无格式错误。
- [ ] 运行 `codex-preview --route operating-plan`，确认服务真源一致并在日常 Chrome 打开。
- [x] 检查页签切换、历史详情、定向补充表单、console 和横向溢出。

### Task 5: 历史计划同页详情与复盘

- [x] 在 `prototype/tests/company-operating-plan.test.mjs` 断言每个历史版本包含 3 项公司优先事项、8 个经营维度、复盘分类和资料快照。
- [x] 运行 `node --test prototype/tests/company-operating-plan.test.mjs`，确认新断言在详情模型实现前失败。
- [x] 在 `prototype/index.html` 定义 `buildHistoricalOperatingPlanDetail(plan)`，返回计划快照、优先事项、八维执行对比、复盘和依据快照。
- [x] 将 `viewHistoricalOperatingPlan(planId)` 从弹窗改为同页详情渲染，并增加 `back-to-operating-plan-history` 返回交互。
- [x] 详情中不展示编辑、重新生成或审核操作，只保留返回和下载。
- [x] 运行专项测试、`git diff --check`，并在日常 Chrome 检查进入详情、返回列表、console 和横向溢出。
