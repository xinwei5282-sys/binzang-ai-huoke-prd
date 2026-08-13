# AI Huoke Prototype Distillation Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AI 获客原型压缩为六个业务主入口，删除重复、内部演示和无闭环页面，并保证所有保留动作有明确终态。

**Architecture:** 继续以 `prototype/index.html` 作为唯一真源，不引入新框架。先用结构测试冻结保留/删除边界，再依次清理导航、页面、动作路由和孤立样式，最后通过项目适配器完成桌面与手机真实浏览器验收。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript、Node.js `node:test`、项目 `codex-verify` 验证适配器。

---

## 文件责任图

- Modify: `prototype/index.html` — 导航、页面内容、事件路由与样式唯一实现。
- Create: `prototype/tests/prototype-distillation.test.mjs` — 冻结六入口信息架构、删除对象和渠道边界。
- Modify: `prototype/tests/*.test.mjs` — 仅调整与已确认删除对象冲突的旧断言，不削弱保留能力测试。
- Modify: `prototype/verification-manifest.json` — 若现有焦点捕获引用已删除路由，则改到最近的保留路由。
- Create: `validation/distillation/` — 验收脚本产生的桌面、手机截图和审计结果。

### Task 1: 冻结六入口与删除边界

**Files:**
- Create: `prototype/tests/prototype-distillation.test.mjs`
- Test: `prototype/tests/prototype-distillation.test.mjs`

- [ ] **Step 1: 写失败结构测试**

测试读取 `prototype/index.html`，断言一级导航只有 `home`、`brand-planning`、`marketing-materials`、`acquisition`、`kb`、`settings`；断言不存在 `enterprise-profile`、`mobile-experience`、`tasks`、`sales-agent`、`review`、`automation`、`local-codex` 页面；断言不存在 `统一内容底座`、`Content Factory V1`、`生成二维码（原型占位）`。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/prototype-distillation.test.mjs`

Expected: FAIL，原因是当前仍存在待删除页面或宣传内容。

- [ ] **Step 3: 暂不修改实现，记录失败对象清单**

用失败断言作为后续每个删除批次的验收边界，避免凭视觉误删核心能力。

### Task 2: 精简导航与首页

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/prototype-distillation.test.mjs`

- [ ] **Step 1: 收口主导航**

保留六个一级按钮；将 AI 获客中的“内容创作”改为“短视频创作”；设置子项仅保留企业设置、成员与权限、平台账号、用量与套餐、Agent 权限、帮助与服务，移除移动端入口。

- [ ] **Step 2: 将首页压缩为三个区块**

保留当前重点、需要老板审批、本周期结果；删除 Agent 执行流水、经营学习宣传区和演示数据解释；原 `tasks`、`review` 链接分别改到对应保留业务模块。

- [ ] **Step 3: 验证结构**

Run: `node --test prototype/tests/prototype-distillation.test.mjs`

Expected: 导航与首页断言通过；页面删除断言仍失败。

### Task 3: 精简品牌经营与营销物料

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/prototype-distillation.test.mjs`
- Test: `prototype/tests/commercial-workflows.test.mjs`
- Test: `prototype/tests/marketing-material-generation.test.mjs`

- [ ] **Step 1: 去除重复标题和无终态动作**

品牌报告与经营计划各保留一个标题区、一个主操作和成果列表；列表行最多显示两个常用操作。

- [ ] **Step 2: 删除营销物料宣传区**

移除 `content-factory-contract` 卡片以及生成弹窗中的重复能力标签、重复“生成前检查”和宣传性说明，只保留输入、参考资料、必要审核边界。

- [ ] **Step 3: 保持渠道终态**

朋友圈保留预览、编辑、导出；海报保留预览、编辑、下载；公众号保留预览、编辑、审核发布、授权状态与数据回收；PPT 保留创建、预览和文件导出。

- [ ] **Step 4: 验证渠道边界**

Run: `node --test prototype/tests/commercial-workflows.test.mjs prototype/tests/marketing-material-generation.test.mjs prototype/tests/prototype-distillation.test.mjs`

Expected: PASS。

### Task 4: 删除重复和内部演示页面

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/commercial-workflows.test.mjs`
- Test: `prototype/tests/prototype-distillation.test.mjs`

- [ ] **Step 1: 断开旧入口和动作引用**

将旧 `tasks`、`sales-agent`、`review`、`automation` 链接改到首页、AI 获客或企业大脑中的最近业务入口；删除移动端和本地 Codex 入口。

- [ ] **Step 2: 删除页面结构**

删除 `enterprise-profile`、`mobile-experience`、`tasks`、`sales-agent`、`review`、`automation`、`local-codex` 页面。保留 PPT、视频和数字人的核心创作工作区，避免破坏已有生成链路。

- [ ] **Step 3: 清理孤立事件与样式**

删除只服务于上述页面的 `case` 分支、函数、选择器和响应式规则；旧路由统一回退到对应保留模块或首页。

- [ ] **Step 4: 更新冲突测试并验证**

Run: `node --test prototype/tests/commercial-workflows.test.mjs prototype/tests/prototype-distillation.test.mjs`

Expected: PASS，且旧页面不存在。

### Task 5: 设置与高级治理收口

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/prototype-distillation.test.mjs`

- [ ] **Step 1: 合并 Agent 权限**

把独立 Agent 中心缩为设置内的高级治理视图，只保留权限原则、人工审批范围和结果回传规则，不再展示大量内部 Agent 卡片。

- [ ] **Step 2: 删除占位操作**

移除假二维码、假设备检测和只表示“已打开配置”的无内容按钮；平台未接入状态保持只读边界。

- [ ] **Step 3: 验证所有保留设置入口**

Run: `node --test prototype/tests/prototype-distillation.test.mjs`

Expected: PASS。

### Task 6: 全量验证与真实浏览器验收

**Files:**
- Modify: `prototype/verification-manifest.json`（仅在现有捕获引用删除路由时）
- Create: `validation/distillation/*`

- [ ] **Step 1: 全量自动测试**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 2: 差异检查**

Run: `git diff --check -- prototype/index.html prototype/tests prototype/verification-manifest.json`

Expected: 无输出，退出码 0。

- [ ] **Step 3: 项目完整验证**

Run: `codex-verify --full`

Expected: 真源一致、桌面 1440×900 与手机 390×844 捕获成功，console、overflow、layout audit 无错误。

- [ ] **Step 4: 人工查看关键截图**

检查首页、营销物料、AI 获客、企业大脑、设置在桌面和手机视口的真实截图，确认三秒内能识别页面目的、首要动作和核心状态。

- [ ] **Step 5: 复用已有预览页**

刷新当前 `127.0.0.1:8010` 页面，不新增日常 Chrome 窗口；最终页面停留在首页供用户验收。
