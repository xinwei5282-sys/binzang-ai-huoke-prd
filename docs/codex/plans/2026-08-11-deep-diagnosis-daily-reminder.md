# Deep Diagnosis Daily Reminder Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让未完成深度诊断的已建档企业，每个当地自然日只在首次登录时收到一次深度诊断提醒。

**Architecture:** 在现有 `startKnowledgeOnboarding()` 登录分流中增加一个可独立测试的当地日期与提醒判定层。提醒展示时立即把 `YYYY-MM-DD` 写入 `localStorage`，深度诊断完成状态仍保持最高优先级。浏览器存储异常时用页面会话内存标记防止本次重复展示。

**Tech Stack:** 单文件 HTML/CSS/JavaScript 原型、Node.js `node:test`、Chrome DevTools Protocol 真实浏览器验收。

---

## 文件责任图

- Modify: `prototype/index.html` — 定义日期键、当地日期函数、每日提醒判定，并接入现有登录流程与提示文案。
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs` — 覆盖首次展示、当天抑制、次日再提醒、已完成深度诊断不提醒。
- Modify: `prototype/scripts/capture-v1-prototype.mjs` — 在真实登录流程中审计同日重登和次日首登状态。
- Reuse: `validation/v1-prototype/` — 保存桌面与手机尺寸的最新截图和布局审计 JSON。

### Task 1: 用回归测试定义每日提醒契约

**Files:**
- Modify: `prototype/tests/enterprise-diagnosis-v1.test.mjs`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Write the failing test**

新增测试，要求源码提供以下契约：

```js
test('deep diagnosis reminder appears only on the first login of each local day', () => {
  assert.match(html, /const deepDiagnosisReminderDateKey='aiHuokeDeepDiagnosisReminderDateV1'/);
  assert.match(html, /function getLocalDateKey\(date=new Date\(\)\)/);
  assert.match(html, /function shouldShowDeepDiagnosisReminder\(/);
  assert.match(html, /function markDeepDiagnosisReminderShown\(/);
  assert.match(html, /shouldShowDeepDiagnosisReminder\(completed,profileCompleted/);
  assert.match(html, /markDeepDiagnosisReminderShown\(today\)/);
});
```

同时断言“稍后处理”文案包含“今天不再提醒，明天首次登录”。

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: FAIL，失败原因为日期状态键和判定函数尚未定义。

### Task 2: 实现当地自然日提醒状态

**Files:**
- Modify: `prototype/index.html`
- Test: `prototype/tests/enterprise-diagnosis-v1.test.mjs`

- [ ] **Step 1: Add the minimal date and persistence helpers**

在诊断状态定义附近新增：

```js
const deepDiagnosisReminderDateKey='aiHuokeDeepDiagnosisReminderDateV1';
let deepDiagnosisReminderShownInSession=false;
function getLocalDateKey(date=new Date()) {
  const offsetDate=new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return offsetDate.toISOString().slice(0,10);
}
function shouldShowDeepDiagnosisReminder(completed,profileCompleted,today=getLocalDateKey()) {
  if(completed||!profileCompleted)return false;
  try{return localStorage.getItem(deepDiagnosisReminderDateKey)!==today;}catch(_){return !deepDiagnosisReminderShownInSession;}
}
function markDeepDiagnosisReminderShown(today=getLocalDateKey()) {
  deepDiagnosisReminderShownInSession=true;
  try{localStorage.setItem(deepDiagnosisReminderDateKey,today);}catch(_){}
}
```

- [ ] **Step 2: Wire the helper into login**

在 `startKnowledgeOnboarding()` 中只当 `shouldShowDeepDiagnosisReminder(...)` 返回 `true` 时展示弹窗，并在展示的同一次调用中立即执行 `markDeepDiagnosisReminderShown(today)`。

- [ ] **Step 3: Update the dismiss copy**

将关闭后的 toast 改为：

```text
已留在首页；今天不再提醒，明天首次登录会再次提醒
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test prototype/tests/enterprise-diagnosis-v1.test.mjs`

Expected: PASS，日期契约、登录分流和文案断言均通过。

### Task 3: 在真实浏览器中验证登录频率

**Files:**
- Modify: `prototype/scripts/capture-v1-prototype.mjs`
- Output: `validation/v1-prototype/layout-audit-1440x900.json`
- Output: `validation/v1-prototype/layout-audit-390x844.json`

- [ ] **Step 1: Add browser-state assertions**

在已建档、未完成深度诊断的状态下顺序执行：

1. 清除提醒日期后登录，断言弹窗显示且已写入今天。
2. 关闭后在同一天再次登录，断言弹窗不显示。
3. 把已提醒日期改为昨天并模拟新页面会话，再次登录，断言弹窗显示。
4. 把深度诊断标记为已完成，断言弹窗不显示。

- [ ] **Step 2: Run desktop capture**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9229 --width 1440 --height 900 --out-dir validation/v1-prototype`

Expected: `V1 prototype capture PASS: 23 screenshots`，新增的每日提醒审计全部为真。

- [ ] **Step 3: Run mobile capture**

Run: `node prototype/scripts/capture-v1-prototype.mjs --port 9229 --width 390 --height 844 --out-dir validation/v1-prototype`

Expected: `V1 prototype capture PASS: 23 screenshots`，无横向溢出、控制台错误或未捕获异常。

### Task 4: 完整回归与交付检查

**Files:**
- Verify: `prototype/index.html`
- Verify: `prototype/tests/*.test.mjs`
- Verify: `prototype/scripts/capture-v1-prototype.mjs`

- [ ] **Step 1: Run the complete test suite**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 0 failures。

- [ ] **Step 2: Check patch formatting**

Run: `git diff --check -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs`

Expected: exit code 0，无空白错误。

- [ ] **Step 3: Preserve the dirty shared source**

Run: `git status --short -- prototype/index.html prototype/tests/enterprise-diagnosis-v1.test.mjs prototype/scripts/capture-v1-prototype.mjs validation/v1-prototype`

Expected: 只报告任务范围内的本地改动。由于 `prototype/index.html` 已包含用户先前的未提交改动，本次不整体提交实现文件，避免把无关内容混入新提交。
