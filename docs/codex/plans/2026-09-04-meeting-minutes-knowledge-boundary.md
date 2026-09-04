# Meeting Minutes and Enterprise Knowledge Boundary Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“企业记忆”改为只处理会议音视频的“会议纪要”，并把聊天记录、图片和普通文件统一归入企业知识上传与候选确认流程。

**Architecture:** 保留现有 `kb-memory` 路由键以避免破坏原型导航和页面 PRD 映射，只更改用户可见名称与业务契约。会议纪要使用独立会议对象演示音视频上传、分阶段处理、说话人转写、总结与行动项；企业知识继续使用现有资料队列接收非音视频来源，两个入口通过格式校验和正确入口提示互相分流。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Node.js `node:test`、Chrome DevTools Protocol、项目内 `codex-verify` 和 `codex-preview`。

---

## File structure map

### Create

- `prd/pages/企业大脑-会议纪要.md` — 会议音视频、转写、总结、行动项和权限的页面执行契约。

### Rename/remove

- `prd/pages/企业大脑-企业记忆.md` → `prd/pages/企业大脑-会议纪要.md` — 保留页面 key `kb-memory`，更新用户可见名称和职责。

### Modify

- `prototype/index.html` — 导航、标题、上传格式、会议状态、详情、企业知识分流、内嵌页面 PRD。
- `prototype/tests/enterprise-work-hub.test.mjs` — 会议纪要与企业知识边界契约。
- `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs` — 企业大脑导航名称。
- `prototype/tests/secondary-navigation-heading.test.mjs` — `memory` / `kb-memory` 标题契约。
- `prototype/scripts/capture-enterprise-work-hub.mjs` — 会议列表、转写详情和错误分流的浏览器验收。
- `prototype/scripts/capture-v1-prototype.mjs` — 全量导航标签与会议纪要代表状态。
- `prd/pages/README.md`、`prd/PRD索引.md`、`prd/PRD_企业AI经营大脑_当前开发基线.md` — 更新信息架构和术语。

### Explicitly unchanged

- `kb-memory` 内部页面键和 `data-kbpanel="memory"` — 只作为稳定技术标识，不再代表产品概念“企业记忆”。
- 真实 ASR、LLM、对象存储、计费和会议机器人 — 本轮不接入。
- 工作中枢任务、客户、项目和营销物料归属 — 保持现有闭环。

## Shared contracts

会议对象使用：

```js
const WORK_HUB_MEETINGS = [{
  id: 'meeting-aurora-01',
  mediaType: 'video',
  name: '客户需求沟通会议.mp4',
  status: 'ready',
  stage: 'summarizing',
  ownerAccountId: 'acct-boss',
  visibility: 'enterprise',
  customerId: 'cust-aurora',
  projectId: 'proj-growth',
  duration: '38:24',
  transcript: [{ start: '00:12:34', speaker: '客户方·周琳', text: '本季度希望完成增长方案评审。' }],
  summary: '客户希望本季度完成增长方案评审。',
  decisions: ['先确认增长方案评审节点'],
  actionItems: [{ id: 'action-1', title: '整理增长方案大纲', confirmed: false }],
  intent: { level: 'high', confidence: 0.82, evidenceTimestamp: '00:12:34' }
}];
```

固定状态：

```text
uploaded → extracting_audio → transcribing → diarizing → summarizing → ready | failed
```

任务来源字段统一使用 `sourceMeetingId`；原有 `sourceMemoryId` 在本轮原型数据中迁移，不新建第二套来源含义。

---

### Task 1: Lock the new navigation and upload boundary

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs`
- Modify: `prototype/tests/secondary-navigation-heading.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: Write failing terminology and format assertions**

```js
test('meeting minutes owns audio and video while enterprise knowledge owns other sources', () => {
  assert.match(html, /data-kbtab="memory">会议纪要</);
  assert.match(html, /id="workMeetingUpload"[^>]+accept="audio\/\*,video\/\*"/);
  assert.doesNotMatch(html, /id="workMeetingUpload"[^>]+image\/\*|\.pdf|\.doc|\.txt/);
  assert.match(html, /聊天记录/);
  assert.match(html, /PDF、Word、TXT/);
});
```

更新导航期望值为：

```text
诊断总览|企业 VI|企业知识|会议纪要|外部情报|进化与治理
```

- [ ] **Step 2: Confirm red**

Run:

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/secondary-navigation-heading.test.mjs
```

Expected: FAIL，因为页面仍显示“企业记忆”，上传控件仍允许图片和文档。

- [ ] **Step 3: Apply the minimal navigation change**

在 `prototype/index.html` 中保持 `data-kbtab="memory"`，但改为：

```html
<button data-act="nav-kb" data-parent="kb" data-kbtab="memory">会议纪要</button>
```

标题契约改为：

```js
memory: ['会议纪要', '音视频 · 转写 · 总结 · 行动项'],
'kb-memory': ['会议纪要', '音视频 · 转写 · 总结 · 行动项']
```

上传控件改为：

```html
<input id="workMeetingUpload" type="file" hidden accept="audio/*,video/*">
```

- [ ] **Step 4: Run green and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/secondary-navigation-heading.test.mjs
git diff --check
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs prototype/tests/enterprise-ai-operating-brain-prototype.test.mjs prototype/tests/secondary-navigation-heading.test.mjs
git commit -m "refactor: separate meeting minutes from enterprise knowledge"
```

### Task 2: Build the meeting transcription and summary presentation

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`

- [ ] **Step 1: Write failing meeting-detail assertions**

要求源文件出现 `WORK_HUB_MEETINGS`、`sourceMeetingId` 和以下用户可见区块：

```text
音视频来源
说话人转写
会议总结
关键决策
行动项
客户意向
```

并要求状态包含 `extracting_audio`、`transcribing`、`diarizing`、`summarizing`、`ready`、`failed`。

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec --test-name-pattern="meeting|会议|transcript" prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL，因为当前详情仍使用通用记忆摘要。

- [ ] **Step 3: Replace memory fixtures with meeting fixtures**

将 `WORK_HUB_MEMORIES` 改为 `WORK_HUB_MEETINGS`，只保留音频/视频样例。列表渲染函数输出会议时长、处理阶段、摘要和行动项数量。

新增：

```js
function isMeetingMedia(file) {
  return Boolean(file && (/^(audio|video)\//.test(file.type) || /\.(mp3|wav|m4a|aac|flac|ogg|mp4|mov|mkv|webm)$/i.test(file.name)));
}
```

- [ ] **Step 4: Implement the detail hierarchy**

`openEnterpriseMeetingDetail(meetingId)` 展示播放器占位、说话人标签、时间戳文本、总结、决策、行动项和意向证据。时间戳按钮只演示跳转并提示“已定位到 00:12:34”。

- [ ] **Step 5: Connect action-item confirmation**

`confirmMeetingActionItems(meetingId)` 仅克隆已选行动项到 `WORK_HUB_TASKS`，写入：

```js
{
  sourceMeetingId: meeting.id,
  evidenceTimestamp: meeting.intent.evidenceTimestamp,
  customerId: meeting.customerId,
  projectId: meeting.projectId
}
```

重复点击不得重复创建任务。

- [ ] **Step 6: Run green and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
git diff --check
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: add meeting transcription and summary workflow"
```

### Task 3: Route chat records and documents into enterprise knowledge

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`

- [ ] **Step 1: Write failing knowledge-ingestion assertions**

要求企业知识显示 `knowledgeSourceUpload`，其接受：

```html
accept="image/*,.pdf,.doc,.docx,.txt"
```

并存在“上传聊天记录”“上传文件资料”“粘贴文本”三个入口，以及 `routeUnsupportedMeetingFile` 和 `routeUnsupportedKnowledgeFile`。

- [ ] **Step 2: Confirm red**

```bash
node --test --test-reporter=spec --test-name-pattern="knowledge|upload|boundary" prototype/tests/enterprise-work-hub.test.mjs
```

- [ ] **Step 3: Add visible knowledge source actions**

在企业知识页首屏增加来源选择区，不新建独立一级页面：

```html
<button data-act="pick-knowledge-chat">上传聊天记录</button>
<button data-act="pick-knowledge-file">上传文件资料</button>
<button data-act="paste-knowledge-text">粘贴文本</button>
<input id="knowledgeSourceUpload" type="file" hidden multiple accept="image/*,.pdf,.doc,.docx,.txt">
```

- [ ] **Step 4: Add cross-entry validation**

- 会议纪要接收到非音视频：弹窗提示“该资料请上传到企业知识”，提供“前往企业知识”。
- 企业知识接收到音视频：弹窗提示“会议音视频请前往会议纪要”，提供“前往会议纪要”。
- 合法企业知识文件调用现有 `submitKnowledgeSourceFile(file)`，进入资料与待处理队列。

- [ ] **Step 5: Run green and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/knowledge-workspace-wechat-scheduling.test.mjs
git diff --check
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: route documents and chats to enterprise knowledge"
```

### Task 4: Update page PRDs and product baseline

**Files:**
- Rename: `prd/pages/企业大脑-企业记忆.md` → `prd/pages/企业大脑-会议纪要.md`
- Modify: `prd/pages/企业大脑-会议纪要.md`
- Modify: `prd/pages/企业大脑-企业知识.md`
- Modify: `prd/pages/README.md`
- Modify: `prd/PRD索引.md`
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md`
- Modify: `prototype/index.html`
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`

- [ ] **Step 1: Change the PRD filename and references**

```bash
mv prd/pages/企业大脑-企业记忆.md prd/pages/企业大脑-会议纪要.md
```

保留文档内页面 key `kb-memory`，避免运行时映射变化。

- [ ] **Step 2: Rewrite the two page contracts**

- `企业大脑-会议纪要.md`：只接受音视频，定义处理阶段、转写、总结、行动项、错误恢复和账号权限。
- `企业大脑-企业知识.md`：明确聊天截图、图片、PDF、Word、TXT和粘贴文本的上传、候选、确认与冲突流程。

- [ ] **Step 3: Update inline PRD content and indexes**

将 `PAGE_PRD_CONTENT['kb-memory']` 和 `pagePrdContexts['kb-memory']` 的标题、目标、字段、动作、流程、异常和验收全部改为会议纪要语义；更新 README、PRD 索引和 IA-002 基线。

- [ ] **Step 4: Scan and verify**

```bash
rg -n "企业记忆|会议聊天归档" prototype/index.html prd prototype/tests prototype/scripts
rg -n "TODO|TBD|FIXME" prd/pages/企业大脑-会议纪要.md prd/pages/企业大脑-企业知识.md
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/page-prd-drawer.test.mjs
```

Expected: “企业记忆”只允许出现在历史变更说明或本设计文档；占位符扫描无输出；测试 PASS。

- [ ] **Step 5: Commit**

```bash
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs prd/pages/企业大脑-会议纪要.md prd/pages/企业大脑-企业知识.md prd/pages/README.md prd/PRD索引.md prd/PRD_企业AI经营大脑_当前开发基线.md
git commit -m "docs: define meeting minutes and knowledge intake contracts"
```

### Task 5: Close browser and regression verification

**Files:**
- Modify: `prototype/scripts/capture-enterprise-work-hub.mjs`
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`

- [ ] **Step 1: Extend browser assertions**

聚焦脚本必须通过真实点击验证：

- 导航显示“会议纪要”；
- 列表只有音频/视频会议；
- 详情显示说话人转写、总结、决策和行动项；
- 确认行动项后，工作中枢出现带 `sourceMeetingId` 的任务；
- 企业知识显示聊天记录、文件和粘贴文本入口；
- 390px 下播放器、转写行和操作按钮不横向溢出。

- [ ] **Step 2: Update full navigation capture**

将全量脚本中的导航期望和截图标签由企业记忆语义更新为会议纪要，仍使用稳定状态名 `kb-memory` 以保持历史截图目录兼容。

- [ ] **Step 3: Run focused tests and browser gate**

```bash
codex-verify --focus enterprise-work-hub --browser
```

Expected: 聚焦测试、served/source SHA、1440×900、390×844、console、runtime 和 overflow 全部 PASS。

- [ ] **Step 4: Inspect key screenshots**

人工查看：会议列表桌面端、会议详情桌面端、会议详情移动端、企业知识上传移动端。确认无错误归属、无裁切、状态和原型边界清晰。

- [ ] **Step 5: Run the full gate**

```bash
node --test --test-reporter=dot prototype/tests/*.test.mjs
codex-verify --full
git diff --check
```

Expected: 全量测试和双视口浏览器验收 PASS。

- [ ] **Step 6: Commit verification changes**

```bash
git add prototype/scripts/capture-enterprise-work-hub.mjs prototype/scripts/capture-v1-prototype.mjs prototype/tests/enterprise-work-hub.test.mjs
git commit -m "test: verify meeting minutes knowledge boundary"
```

## Completion criteria

- “会议纪要”只处理音频和视频，不再承担聊天记录和普通文件。
- 音视频可演示转写、说话人、时间戳、总结、决策、行动项和意向证据。
- 聊天截图、图片、PDF、Word、TXT和粘贴文本在企业知识中有明确入口。
- 错误入口提供可理解的提示和跳转，不静默接受错误类型。
- 确认会议行动项后，任务进入工作中枢并可追溯到会议和时间戳。
- 原型、页面 PRD、导航测试和截图脚本术语一致。
- 双视口浏览器验收无 console/runtime 错误和页面横向溢出。
