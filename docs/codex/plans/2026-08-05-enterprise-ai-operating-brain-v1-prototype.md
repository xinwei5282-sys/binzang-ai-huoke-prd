# Enterprise AI Operating Brain V1.0 Prototype Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 `prototype/index.html` 上完成企业 AI 经营大脑 V1.0 原型收口，让手动建档、六维诊断、品牌报告、经营计划、PPT、海报、公众号文章和 PC 测试型 AI 获客形成可演示、无重复列表的完整链路。

**Architecture:** 保留单文件静态原型的现有运行方式，不新建应用或后端。通过七个客户级一级菜单和页内二级菜单组织已有页面；新增诊断和标准物料页，复用已有爆款、内容、视频、知识、成员和用量深层页面。每类成果在原模块管理，删除客户级作品库/成果中心入口。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript、Node.js `node:test`、Chrome DevTools Protocol 真实渲染截图。

---

## 文件责任图

- Modify: `prototype/index.html` — 七个一级菜单、页内二级导航、快速画像、六维诊断、品牌视觉、报告/计划/物料列表、PC 测试能力和格优配置。
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs` — V1.0 定位、菜单、范围、命名和不实状态的总契约。
- Create: `prototype/tests/enterprise-diagnosis-v1.test.mjs` — 手动建档、快速画像、六维诊断、证据分层和诊断报告契约。
- Create: `prototype/tests/business-artifacts-v1.test.mjs` — 品牌报告、经营计划、PPT、海报、公众号文章的模块内列表与状态契约。
- Modify: `prototype/tests/commercial-workflows.test.mjs` — 保留已有内容和视频流程，明确其为 PC 测试能力。
- Modify: `prototype/tests/pc-ui-system.test.mjs` — 将导航契约改为七个一级菜单和页内二级菜单。
- Create: `prototype/scripts/capture-v1-prototype.mjs` — 通过本机 Chrome DevTools Protocol 点击页面、切换客户模式、检查溢出/控制台并导出关键页截图。
- Create: `validation/v1-prototype/` — 保存快速画像、六维诊断、品牌与经营、营销物料、AI 获客和格优模式截图与布局审计 JSON。

## 证据规则

- 原型页面可操作只能标注为“原型可演示”。
- 未证实的文件生成、公众号发布、爆款数据和视频 Provider 显示“能力演示 · 待接入”。
- 自动测试 PASS 与真实渲染 PASS 分开汇报。
- 本计划不修改后端、线上 `merchant-ui` 或外部平台。
- 当前 `prototype/index.html` 和 `prototype/tests/` 已有未提交改动；执行时只能增量编辑，不重置用户改动。

### Task 1: 冻结 V1.0 菜单与命名契约

**Files:**
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Modify: `prototype/tests/pc-ui-system.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 将总契约改为七个一级菜单**

测试明确断言：

```js
const customerNav = ['首页', '企业档案', '品牌与经营', '营销物料', 'AI 获客', '企业知识', '设置'];
assert.equal((nav.match(/<a data-v=/g) || []).length, 7);
for (const entry of customerNav) assert.match(nav, new RegExp(`>${entry}<`));
for (const removed of ['成果中心', '作品库', 'Agent 中心', '本地工作台']) {
  assert.doesNotMatch(nav, new RegExp(`>${removed}<`));
}
```

- [ ] **Step 2: 写二级菜单契约**

断言以下文字只出现在对应页内导航：

```js
const sections = {
  'enterprise-profile': ['快速画像', '六维诊断', '品牌视觉', '企业资料'],
  'brand-planning': ['品牌报告', '经营计划'],
  'marketing-materials': ['PPT', '海报', '公众号文章'],
  acquisition: ['获客计划', '爆款追踪', '内容创作', 'AI 视频'],
  kb: ['知识库', '素材库', '数据源', '待确认'],
  settings: ['企业设置', '成员与权限', '平台账号', '用量与套餐', '帮助与服务']
};
```

- [ ] **Step 3: 运行测试并确认失败**

Run:

```bash
node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/pc-ui-system.test.mjs
```

Expected: FAIL，原因是导航仍包含“成果中心”，页内二级导航不完整。

- [ ] **Step 4: 收口客户导航**

在 `#nav` 中仅保留七个 `<a data-v>`；删除 `data-v="artifacts"` 客户导航，保留已有深层页面的兼容路由和 `go(v)` 能力。

- [ ] **Step 5: 新增通用页内二级导航组件**

使用一组 `.subnav` / `.subnav-item` 样式，通过 `data-act="switch-subview"` 和 `data-subview` 切换同一一级页面内的面板。切换时更新选中态，不新建第二层侧边栏。

- [ ] **Step 6: 重跑菜单测试**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/pc-ui-system.test.mjs`

Expected: PASS。

- [ ] **Step 7: 仅提交 Task 1 文件**

```bash
git add prototype/index.html prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/pc-ui-system.test.mjs
git diff --cached --check
git commit -m "feat: align v1 prototype navigation"
```

### Task 2: 实现手动建档和快速画像

**Files:**
- Create: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写快速画像失败测试**

断言：

- 不存在“企查查”、“自动工商补全”、“公开信息候选”。
- 存在 12 类必填信息的页面表达。
- 存在“保存草稿”、“暂不清楚”、“上一步”、“下一步”和完成度。
- 信息状态包含“未填写、草稿、待确认、已确认”。

- [ ] **Step 2: 运行新测试并确认失败**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，原因是现有企业档案仍以公开候选信息确认为主。

- [ ] **Step 3: 将企业档案默认面板改为快速画像**

用 `.diagnosis-wizard` 展示四个步骤：

```text
企业与产品 → 客户与价值 → 经营与漏斗 → 目标与资源
```

每步使用单选、多选、数值区间和带示例的短文本输入；不使用一页长表单。

- [ ] **Step 4: 实现快速画像交互**

增加 `showDiagnosisStep(step)`，保证步骤索引始终在有效范围。“保存草稿”仅更新原型内状态和提示；“确认企业画像”将页面状态切换为已确认。

- [ ] **Step 5: 重跑建档测试**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交快速画像**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git diff --cached --check
git commit -m "feat: add guided enterprise profile"
```

### Task 3: 实现六维诊断和证据分层

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 扩展六维诊断失败测试**

断言六个维度的标题、完成度、问题示例和以下证据类型：

```js
for (const dimension of ['定位与战略', '客户与市场', '产品与客户价值', '商业模式与增长', '品牌与营销', '组织与执行']) {
  assert.match(html, new RegExp(dimension));
}
for (const evidence of ['用户确认事实', '上传资料证据', 'AI 分析判断', '信息缺口']) {
  assert.match(html, new RegExp(evidence));
}
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，缺少六维诊断面板和证据分层。

- [ ] **Step 3: 实现六维诊断页面**

使用左侧维度目录和右侧当前问题的不对称布局，避免六张相同卡片。每个维度展示完成度、最少两个引导问题、填写示例和“暂不清楚”。

- [ ] **Step 4: 实现诊断摘要和置信度**

原型摘要显示核心优势、核心问题、优先级、信息完整度和置信度。每条结论展示一个证据类型标记，并允许跳回对应问题补充信息。

- [ ] **Step 5: 重跑诊断测试**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交六维诊断**

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git diff --cached --check
git commit -m "feat: add six-dimension enterprise diagnosis"
```

### Task 4: 补齐品牌视觉和企业资料

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写品牌视觉和资料失败测试**

断言 `Logo`、主色、辅助色、字体、图片风格、PPT 版式、海报模板、公众号封面规范、禁用词和禁止承诺。断言产品手册、报价表、企业介绍、成功案例、客户评价和历史物料上传入口。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，当前品牌视觉与企业资料尚未成为企业档案内的完整子页。

- [ ] **Step 3: 实现品牌视觉面板**

显示一个实时品牌预览区，在一张模拟封面上展示 Logo、颜色、标题、图片风格和 CTA；编辑区按“标识、颜色、排版、图片、语气”分组，不堆叠模板卡。

- [ ] **Step 4: 实现企业资料面板**

复用现有知识上传的文件类型判定和状态样式，但不在原型内伪造文件解析结果。上传后标记“待确认”，资料详情显示类型、上传人、时间和授权范围。

- [ ] **Step 5: 重跑诊断测试并提交**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS。

```bash
git add prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs
git diff --cached --check
git commit -m "feat: add enterprise brand and evidence intake"
```

### Task 5: 收口首页为诊断优先工作台

**Files:**
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Modify: `prototype/tests/enterprise-agent-operating-loop.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写首页失败测试**

断言首页有诊断完成度、下一步、待确认、最近成果、用量和异常任务；断言首页不再以“企业 Agent 经营驾驶舱”为主标题。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs`

Expected: FAIL，首页仍是 Agent 驾驶舱。

- [ ] **Step 3: 重组首页**

将原 Agent 对话下沉为非首要辅助入口；首屏展示企业诊断进度、主要缺口和“继续诊断”主行动。中部展示待确认事项与最近成果，底部展示用量和异常任务。

- [ ] **Step 4: 保留已有运营闭环能力**

保留 `plan`、`tasks`、`review` 深层页面和 `sendAgentMessage()`，但不在一级菜单或首屏展示技术型 Agent 概念。更新旧运营闭环测试，只检查深层流程仍可达，不再要求它为首页主体。

- [ ] **Step 5: 重跑首页测试并提交**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs`

Expected: PASS。

```bash
git add prototype/index.html prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/enterprise-agent-operating-loop.test.mjs
git diff --cached --check
git commit -m "feat: make diagnosis the v1 home entry"
```

### Task 6: 实现品牌报告和经营计划模块内列表

**Files:**
- Create: `prototype/tests/business-artifacts-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写品牌与经营失败测试**

断言品牌报告和经营计划各自包含列表、新建、预览、版本、下载、重新生成和失败状态；经营周期仅包含月度、季度、年度和自定义，格优模式可显示 90 天试点模板。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: FAIL，现有页面只有四张成果入口卡片，没有模块内列表。

- [ ] **Step 3: 实现品牌报告列表与详情预览**

列表显示报告名称、版本、信息完整度、置信度、更新时间和状态。点击预览展示六维摘要、依据和信息缺口。

- [ ] **Step 4: 实现经营计划列表和周期创建**

新建表单显示周期、重点目标、可用资源和验收指标。详情显示目标、策略、任务、负责人、预算、风险和复盘节点。

- [ ] **Step 5: 重跑成果测试并提交**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: PASS。

```bash
git add prototype/index.html prototype/tests/business-artifacts-v1.test.mjs
git diff --cached --check
git commit -m "feat: add brand and operating artifact lists"
```

### Task 7: 实现营销物料模块内列表

**Files:**
- Modify: `prototype/tests/business-artifacts-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 扩展 PPT、海报和公众号文章失败测试**

断言每类物料都有自己的“新建 + 列表 + 详情操作”；不存在将成果复制到作品库的操作；海报显示“赠送 10 次”、生成前预计消耗和系统失败不扣额度。

公众号文章状态断言：

```text
草稿、生成中、待审核、待发布、已导出、已发布、发布失败
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: FAIL，现有营销物料页只有入口卡片。

- [ ] **Step 3: 实现 PPT 页面**

表单包含用途、关联报告/计划、页数、品牌视觉和使用场景。列表显示可编辑源文件、PDF 预览、缩略图和质检状态的预期出口，未真实接入时标注待接入。

- [ ] **Step 4: 实现海报页面**

创建表单包含用途、尺寸、产品、主标题、CTA 和品牌视觉。用量提示放在提交按钮前，不藏在设置页。

- [ ] **Step 5: 实现公众号文章页面**

创建表单包含主题、目标读者、文章目标、参考资料、品牌语气和 CTA。详情显示标题、摘要、正文、封面、配图、合规和发布包导出。官方接口未验证时不显示“已自动发布”。

- [ ] **Step 6: 重跑物料测试并提交**

Run: `node --test prototype/tests/business-artifacts-v1.test.mjs`

Expected: PASS。

```bash
git add prototype/index.html prototype/tests/business-artifacts-v1.test.mjs
git diff --cached --check
git commit -m "feat: add v1 marketing material workspaces"
```

### Task 8: 收口 AI 获客为 PC 测试能力

**Files:**
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Modify: `prototype/tests/commercial-workflows.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写 AI 获客命名和能力边界失败测试**

断言以下内容：

- 模块名必须是“爆款追踪”，不是“爆款抓取”。
- AI 获客页面标注“PC 测试能力”。
- 爆款追踪、内容创作和 AI 视频都有直接入口。
- AI 视频保留确认脚本、确认分镜、只重做失败镜头和 MP4 成片。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: FAIL，原型仍存在“爆款搜索与追踪”或其他不统一命名，且未标准化 PC 测试属性。

- [ ] **Step 3: 统一命名和入口**

将页面标题、二级菜单和入口卡统一为“爆款追踪”。内部按钮可使用“搜索抓取”。

- [ ] **Step 4: 复用已有深层页面**

二级菜单分别跳转或切换到 `plan`、`burst`、`create`、`remix` 已有页面；不再创建第二套爆款列表、内容创作表单或视频任务列表。

- [ ] **Step 5: 收口外部能力状态**

爆款数据源、AI 生成、数字人和平台发布只显示已能被现有证据支持的状态。未确认的发布和 Provider 显示待接入或仅导出。

- [ ] **Step 6: 重跑获客测试并提交**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/commercial-workflows.test.mjs`

Expected: PASS。

```bash
git add prototype/index.html prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/commercial-workflows.test.mjs
git diff --cached --check
git commit -m "feat: align acquisition prototype with v1 scope"
```

### Task 9: 收口企业知识、设置和格优配置

**Files:**
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Modify: `prototype/tests/unified-knowledge-onboarding.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写配置边界失败测试**

断言：

- 企业知识页有知识库、素材库、数据源和待确认四个子视图。
- 设置页有企业设置、成员与权限、平台账号、用量与套餐、帮助与服务。
- 格优只通过“殡葬行业配置包”和“格优大客户模式”出现。
- 通用模式下不显示寿衣、骨灰盒、福恩等客户数据。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/unified-knowledge-onboarding.test.mjs`

Expected: FAIL，设置与知识页仍是入口卡片，通用首页或深层页存在殡葬默认数据。

- [ ] **Step 3: 将企业知识变为页内四子视图**

复用已有知识列表、素材列表、来源和审核面板；调整页内导航和标题，不复制数据。

- [ ] **Step 4: 将设置卡片改为可切换子视图**

成员、平台账号和用量分别复用 `member`、`bind`、`usage` 深层页面。高级技术配置改为平台内部入口，客户设置中只显示可理解的业务配置。

- [ ] **Step 5: 实现通用/格优显示数据切换**

扩展现有 `switch-customer` 操作，使用 `data-general-text`、`data-geyou-text` 和 `.geyou-only` 切换客户显示层。通用模式默认使用中性企业示例；格优模式显示行业字段、强制审核和 90 天试点模板。

- [ ] **Step 6: 重跑配置测试并提交**

Run: `node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/unified-knowledge-onboarding.test.mjs`

Expected: PASS。

```bash
git add prototype/index.html prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/unified-knowledge-onboarding.test.mjs
git diff --cached --check
git commit -m "feat: finish v1 knowledge and customer configuration"
```

### Task 10: 全量自动测试和旧契约清理

**Files:**
- Modify: `prototype/tests/*.test.mjs` only where an assertion conflicts with the approved V1.0 design
- Modify: `prototype/index.html` only for defects exposed by tests

- [ ] **Step 1: 运行全量原型测试**

Run:

```bash
node --test prototype/tests/*.test.mjs
```

Expected: 所有属于 AI 获客产品的契约 PASS。若 `consumer-protection-knowledge.test.mjs` 仍要求另一套消保委独立租户原型，不通过伪造字符或混入当前原型修复；单独标记为他项目契约冲突。

- [ ] **Step 2: 检查脚本语法**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('prototype/index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]);
for (const source of scripts) new Function(source);
console.log(`inline scripts syntax ok: ${scripts.length}`);
NODE
```

Expected: `inline scripts syntax ok: 2`。

- [ ] **Step 3: 检查客户文案和假状态**

Run:

```bash
rg -n "成果中心|爆款抓取|本地 Codex 已连接|设备在线|企查查|自动发布成功" prototype/index.html
```

Expected: 无结果，或只出现在明确的否定/待接入说明中。

- [ ] **Step 4: 检查变更边界**

Run:

```bash
git diff --check -- prototype/index.html prototype/tests prototype/scripts
git status --short -- prototype/index.html prototype/tests prototype/scripts validation/v1-prototype
```

Expected: 无新增空白错误；只显示计划列出的原型、测试、截图脚本和验证产物。

### Task 11: 真实渲染与交互验收

**Files:**
- Create: `prototype/scripts/capture-v1-prototype.mjs`
- Create: `validation/v1-prototype/*.png`
- Create: `validation/v1-prototype/layout-audit.json`
- Modify: `prototype/index.html` only if visual defects are found

- [ ] **Step 1: 实现 Chrome DevTools Protocol 验证脚本**

脚本接收 `--port` 和 `--out-dir`，并执行：

1. 隐藏登录演示层或触发登录。
2. 依次进入首页、企业档案、品牌与经营、营销物料和 AI 获客。
3. 切换每个页面的二级视图。
4. 切换到格优大客户模式并返回通用企业。
5. 捕获 `console.error`、未处理异常、水平溢出、主要元素超出视口和重复可见页面。
6. 输出截图和 JSON 审计结果。

- [ ] **Step 2: 启动本地 Chrome 并运行截图**

Run:

```bash
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new \
  --remote-debugging-port=9228 \
  --user-data-dir=/private/tmp/ai-huoke-v1-chrome \
  --window-size=1440,900 \
  'file:///Users/xinwei/weiran-env/knowledge-hub/10-%E9%A1%B9%E7%9B%AE/AI%E8%8E%B7%E5%AE%A2%E4%BA%A7%E5%93%81/prototype/index.html'

node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype
```

Expected: 脚本退出码 0，`layout-audit.json` 中 `consoleErrors`、`uncaughtErrors` 和 `horizontalOverflowPages` 为空数组。

- [ ] **Step 3: 人工查看关键页截图**

必看：

- `home-1440x900.png`
- `enterprise-profile-quick-1440x900.png`
- `enterprise-profile-diagnosis-1440x900.png`
- `brand-planning-1440x900.png`
- `marketing-materials-wechat-1440x900.png`
- `acquisition-1440x900.png`
- `geyou-mode-1440x900.png`

检查菜单层级、主次行动、文字截断、表格溢出、卡片堆叠、通用与格优内容混用和“AI 模板感”。

- [ ] **Step 4: 修复发现的视觉问题并重跑所有验证**

Run:

```bash
node --test prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs \
  prototype/tests/enterprise-diagnosis-v1.test.mjs \
  prototype/tests/business-artifacts-v1.test.mjs \
  prototype/tests/commercial-workflows.test.mjs \
  prototype/tests/enterprise-agent-operating-loop.test.mjs \
  prototype/tests/pc-ui-system.test.mjs \
  prototype/tests/unified-knowledge-onboarding.test.mjs

node prototype/scripts/capture-v1-prototype.mjs --port 9228 --out-dir validation/v1-prototype
git diff --check -- prototype/index.html prototype/tests prototype/scripts
```

Expected: 相关自动测试全部 PASS；真实渲染审计全部 PASS；新截图已人工检查。

- [ ] **Step 5: 提交验证脚本和最终修复**

```bash
git add prototype/index.html prototype/tests prototype/scripts/capture-v1-prototype.mjs
git diff --cached --check
git commit -m "test: verify enterprise v1 prototype"
```

`validation/v1-prototype/` 只在当前仓库约定允许提交渲染产物时才加入 Git；否则作为本地验收证据保留并在交付汇报中给出路径。

## 最终验收门禁

实施完成时必须同时满足：

1. 客户一级菜单为七项，无成果中心/作品库重复入口。
2. 企业一期建档完全由用户手动填写，无公开企业信息自动补全。
3. 快速画像、六维诊断、品牌视觉和企业资料形成连续建档链路。
4. 品牌报告、经营计划、PPT、海报和公众号文章各自拥有模块内列表。
5. 模块名统一为“爆款追踪”，AI 获客标注为 PC 测试能力。
6. AI 视频保留脚本/分镜两道确认门和失败镜头独立重做。
7. 通用模式不显示殡葬或福恩数据；格优模式通过配置显示行业包和 90 天试点模板。
8. 相关 Node 契约测试通过，内联脚本语法通过。
9. 1440×900 真实渲染无水平溢出、无未处理异常，关键页已人工检查。
10. 未验证的生成、发布和 Provider 能力不显示为真实已连接。
