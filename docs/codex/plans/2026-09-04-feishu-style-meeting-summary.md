# Feishu-style Meeting Summary Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将会议详情改造成飞书妙记式结构化总结，并增加 AI 获客所需的意向、异议、下一步与证据回溯。

**Architecture:** 继续以 `prototype/index.html` 为唯一运行时真源，在现有 `WORK_HUB_MEETINGS` 演示对象中补充结构化字段，由单一会议详情函数渲染。时间戳按钮通过现有事件代理切换逐字稿并模拟定位；测试与浏览器脚本同时覆盖静态契约和真实交互。

**Tech Stack:** 单文件 HTML/CSS/JavaScript 原型、Node.js `node:test`、CDP 浏览器截图验收。

---

## 文件责任图

- 修改 `prototype/index.html`：演示数据、会议总结布局、时间戳回溯交互、响应式样式。
- 修改 `prototype/tests/enterprise-work-hub.test.mjs`：结构化总结和证据回溯静态契约。
- 修改 `prototype/scripts/capture-enterprise-work-hub.mjs`：桌面与手机真实交互及截图。
- 修改 `prd/pages/企业大脑-会议纪要.md`：页面模块、字段和验收口径。

### Task 1: 锁定结构化总结契约

**Files:**
- Test: `prototype/tests/enterprise-work-hub.test.mjs`

- [ ] **Step 1: 写失败测试**

增加断言，要求会议数据与详情包含 `chapters`、`needs`、`objections`、`nextSteps`、`openQuestions`，并出现“一句话结论、章节纪要、关键需求与异议、下一步建议、未决问题与风险”。

- [ ] **Step 2: 验证测试先失败**

Run: `node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs`

Expected: 新增结构化总结测试因字段或模块缺失而失败。

- [ ] **Step 3: 提交测试与后续实现一起完成**

本任务测试在 Task 2 变绿后与实现一并提交，避免仓库留下失败提交。

### Task 2: 实现飞书式总结与获客增强

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-work-hub.test.mjs`

- [ ] **Step 1: 补充结构化演示数据**

给 `meeting-aurora-01` 增加章节、需求、异议、下一步建议、未决问题，以及每项对应的 `evidenceTimestamp`；给通用上传完成态提供安全空数组，避免详情渲染异常。

- [ ] **Step 2: 重排 AI 总结面板**

按“一句话结论 → 客户意向 → 章节纪要 → 需求与异议 → 决策 → 待办 → 下一步 → 风险”顺序渲染，空数据使用“暂未识别”提示。待办继续复用 `data-meeting-action` 与原确认逻辑。

- [ ] **Step 3: 增加证据回溯**

所有总结时间戳使用 `data-act="open-meeting-evidence"` 和 `data-time`。点击后调用 `switchMeetingTab('transcript')`，给对应 `.meeting-transcript-row` 增加突出状态，并触发现有播放器定位提示。

- [ ] **Step 4: 完善样式和响应式**

新增总结重点区、章节列表、需求/异议双列、建议动作和风险区样式；在窄屏下改为单列并确保按钮可点击。

- [ ] **Step 5: 验证聚焦测试通过**

Run: `node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs`

Expected: 全部测试通过，0 failures。

### Task 3: 真实浏览器覆盖与 PRD 同步

**Files:**
- Modify: `prototype/scripts/capture-enterprise-work-hub.mjs`
- Modify: `prd/pages/企业大脑-会议纪要.md`

- [ ] **Step 1: 增加浏览器交互断言**

验证默认总结八类模块可见；点击章节证据后逐字稿可见且对应行高亮；再切回总结，行动项仍可确认并进入待办。

- [ ] **Step 2: 增加关键截图**

保存结构化 AI 总结、证据定位后的逐字稿两种状态，覆盖 1440×900 和 390×844。

- [ ] **Step 3: 更新页面 PRD**

写明参考的是信息架构而非视觉复制，补充结构化字段、证据回溯、人工确认与下游去向。

- [ ] **Step 4: 运行聚焦浏览器验证**

Run: `codex-verify --focus enterprise-work-hub --browser`

Expected: 静态测试、桌面与手机截图、console 和布局审计均 PASS。

- [ ] **Step 5: 运行全量交付验证**

Run: `codex-verify --full`

Expected: 全量测试、真源检查、1440×900 与 390×844 浏览器验收均 PASS。

- [ ] **Step 6: 提交**

```bash
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs prototype/scripts/capture-enterprise-work-hub.mjs prd/pages/企业大脑-会议纪要.md
git commit -m "feat: structure meeting summaries for follow-up"
```
