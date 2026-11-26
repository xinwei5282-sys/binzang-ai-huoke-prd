import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist in the prototype`);
  let bodyStart = -1;
  let parenDepth = 0;
  for (let i = html.indexOf('(', start); i < html.length; i += 1) {
    if (html[i] === '(') parenDepth += 1;
    else if (html[i] === ')') parenDepth -= 1;
    else if (html[i] === '{' && parenDepth === 0) { bodyStart = i; break; }
  }
  assert.notEqual(bodyStart, -1, `${name} should have a function body`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < html.length; i += 1) {
    const char = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  assert.fail(`${name} has an unterminated function body`);
}

test('selectWorkTasks filters by scope and sorts status priority then schedule', () => {
  const select = Function(`${extractFunction('selectWorkTasks')}; return selectWorkTasks;`)();
  const tasks = [
    { id: 'ready-late', status: 'ready', ownerAccountId: 'acct-me', customerId: 'cust-a', projectId: 'proj-a', scheduledDate: '2026-09-07', scheduledTime: '09:00' },
    { id: 'failed', status: 'failed', ownerAccountId: 'acct-other', customerId: 'cust-b', projectId: 'proj-b', scheduledDate: '2026-09-12', scheduledTime: '09:00' },
    { id: 'pending', status: 'pending', ownerAccountId: 'acct-me', customerId: 'cust-a', projectId: 'proj-a', scheduledDate: '2026-09-10', scheduledTime: '10:00' },
    { id: 'confirmed', status: 'confirmed', ownerAccountId: 'acct-me', customerId: 'cust-a', projectId: 'proj-a', scheduledDate: '2026-09-08', scheduledTime: '08:00' },
    { id: 'running', status: 'running', ownerAccountId: 'acct-me', customerId: 'cust-a', projectId: 'proj-a', scheduledDate: '2026-09-07', scheduledTime: '08:00' },
  ];
  assert.deepEqual(select(tasks, { accountId: 'acct-me', scope: 'mine' }).map(task => task.id), ['pending', 'confirmed', 'running', 'ready-late']);
  assert.deepEqual(select(tasks, { accountId: 'acct-me', scope: 'customer', customerId: 'cust-a' }).map(task => task.id), ['pending', 'confirmed', 'running', 'ready-late']);
  assert.deepEqual(select(tasks, { accountId: 'acct-me', scope: 'project', projectId: 'proj-a', status: 'confirmed' }).map(task => task.id), ['confirmed']);
  assert.deepEqual(select(tasks, { accountId: 'acct-me', scope: 'team' }).map(task => task.id), ['failed', 'pending', 'confirmed', 'running', 'ready-late']);
  assert.deepEqual(tasks.map(task => task.id), ['ready-late', 'failed', 'pending', 'confirmed', 'running'], 'selection must be pure');
});

test('workTaskPrimaryAction exposes one state-specific main action', () => {
  const primary = Function('linkedMilestonePreparation',`${extractFunction('workTaskPrimaryAction')}; return workTaskPrimaryAction;`)(()=>null);
  assert.deepEqual(primary({ status: 'pending' }), { action: 'confirm-work-task', label: '查看并确认' });
  assert.deepEqual(primary({ status: 'confirmed' }), { action: 'run-work-agent-task', label: '开始执行' });
  assert.deepEqual(primary({ status: 'running' }), { action: 'open-work-task-detail', label: '查看进度' });
  assert.deepEqual(primary({ status: 'failed' }), { action: 'open-work-task-detail', label: '查看原因' });
  assert.deepEqual(primary({ status: 'ready', deliverableType: 'ppt' }), { action: 'open-work-task-deliverable', label: '查看交付物' });
  assert.deepEqual(primary({ status: 'ready', deliverableType: null }), { action: 'open-work-task-detail', label: '查看详情' });
});

test('rescheduleWorkTask accepts cross-week dates and any valid HH:mm, rejects invalid input without mutation', () => {
  const tasks = [{ id: 'task-1', scheduledDate: '2026-09-07', scheduledTime: '09:00', dueAt: '9月7日 09:00' }];
  const renders = [];
  const source=['formatWorkTaskDueAt','workTaskScheduleKey','applyWorkTaskSchedule','rescheduleWorkTask'].map(extractFunction).join('\n');
  const reschedule = Function('WORK_HUB_TASKS','renderWorkTaskCenter','toast','canEditWorkTaskSchedule','localStorage','getCurrentWorkAccount','$',
    source+'; return rescheduleWorkTask;')(tasks,() => renders.push('render'),()=>{},()=>true,{setItem(){}},()=>({tenantId:'tenant-test'}),()=>null);
  const updated = reschedule('task-1', '2026-09-21', '23:59');
  assert.equal(updated.scheduledDate, '2026-09-21');
  assert.equal(updated.scheduledTime, '23:59');
  assert.equal(renders.length, 1);
  const before = { ...tasks[0] };
  assert.equal(reschedule('task-1', '2026-02-30', '10:00'), null);
  assert.deepEqual(tasks[0], before);
  assert.equal(reschedule('task-1', '2026-09-22', '24:00'), null);
  assert.deepEqual(tasks[0], before);
});

test('renderWorkTaskCalendar includes custom weekly times and flags tasks outside the current week', () => {
  const days = [
    { date: '2026-09-07', weekday: '周一', label: '9月7日' },
    { date: '2026-09-08', weekday: '周二', label: '9月8日' },
  ];
  const times = ['09:00', '18:00'];
  const render = Function('WORK_TASK_CALENDAR_TIMES','safeText','workTaskCalendarAction','workTaskDragAttributes','canEditWorkTaskSchedule',
    `${extractFunction('renderWorkTaskWeek')}; return renderWorkTaskWeek;`)(times,String,()=>'',()=>'',()=>true);
  const output = render([
    { id: 'custom-time', title: '临时任务', status: 'pending', scheduledDate: '2026-09-07', scheduledTime: '10:30' },
    { id: 'outside-week', title: '下周任务', status: 'pending', scheduledDate: '2026-09-14', scheduledTime: '09:00' },
  ],days);
  assert.match(output, /10:30/);
  assert.match(output, /临时任务/);
  assert.match(output, /不在所选周/);
  assert.doesNotMatch(output, /data-task-id="outside-week"/);
});

test('getWorkKnowledgeReminder prioritizes conflicts, then pending, then missing profile gaps', () => {
  const getReminder = Function(`${extractFunction('getWorkKnowledgeReminder')}; return getWorkKnowledgeReminder;`)();
  const conflict = getReminder({
    missing: [{ field: 'intakeGoals', label: '经营目标' }],
    candidates: [{ status: 'conflict', targetId: 'intakeGoals' }],
    workItems: [{ candidates: [{ state: 'conflict' }] }],
  });
  assert.equal(conflict.mode, 'profile');
  assert.equal(conflict.targetField, 'intakeGoals');
  assert.ok(conflict.title && conflict.detail && conflict.button);

  const pending = getReminder({
    missing: [{ field: 'intakeGoals', label: '经营目标' }],
    candidates: [],
    workItems: [{ candidates: [{ state: 'pending' }] }],
  });
  assert.equal(pending.mode, 'profile');
  assert.equal(pending.button, '完善资料');
  assert.ok(pending.title && pending.detail && pending.button);

  const formPending = getReminder({ missing: [], candidates: [{ status: 'pending', targetId: 'intakeGoals' }], workItems: [] });
  assert.equal(formPending.mode, 'profile');
  assert.equal(formPending.targetField, 'intakeGoals');

  const missing = getReminder({ missing: [{ field: 'intakeGoals', label: '经营目标' }], candidates: [], workItems: [] });
  assert.equal(missing.mode, 'profile');
  assert.equal(missing.targetField, 'intakeGoals');
  assert.ok(missing.title && missing.detail && missing.button);

  assert.equal(getReminder({
    missing: [],
    candidates: [{ status: 'confirmed', targetId: 'intakeGoals' }],
    workItems: [{ candidates: [{ state: 'confirmed' }] }],
  }), null);
});

test('getWorkTaskStatistics counts every visible task by status', () => {
  const statistics = Function(`${extractFunction('getWorkTaskStatistics')}; return getWorkTaskStatistics;`)();
  assert.deepEqual(statistics([
    { status: 'pending' }, { status: 'pending' }, { status: 'confirmed' },
    { status: 'running' }, { status: 'ready' }, { status: 'failed' }, { status: 'unknown' },
  ]), { all: 7, pending: 2, confirmed: 1, running: 1, ready: 1, failed: 1 });
  assert.deepEqual(statistics([]), { all: 0, pending: 0, confirmed: 0, running: 0, ready: 0, failed: 0 });
});

test('task details use the linked meeting action and its evidence without leaking inaccessible sources', () => {
  const getContext = Function(`${extractFunction('getWorkTaskDetailContext')}; return getWorkTaskDetailContext;`)();
  const meetings = [{ id: 'meeting', name: '需求沟通', actionItems: [{ id: 'action', title: '整理方案大纲', evidenceTimestamp: '00:12:34' }], transcript: [{ start: '00:12:34', speaker: '客户', text: '收到大纲后安排评审' }, { start: '00:01:00', text: '无关内容' }] }];
  const task = { title: '已调整的任务名称', sourceMeetingId: 'meeting', sourceActionId: 'action', evidenceTimestamp: '00:01:00', expectedOutcome: '供内部评审的大纲' };
  const context = getContext(task, { meetings, canSeeMeeting: () => true });
  assert.equal(context.action, '整理方案大纲');
  assert.equal(context.expectedOutcome, '供内部评审的大纲');
  assert.equal(context.evidence.text, '收到大纲后安排评审');
  assert.equal(context.evidenceTime, '00:12:34');
  const hidden = getContext(task, { meetings, canSeeMeeting: () => false });
  assert.equal(hidden.meetingName, '');
  assert.equal(hidden.evidence, null);
  assert.equal(hidden.action, task.title);
  const missing = getContext({ title: '临时待办' });
  assert.equal(missing.expectedOutcome, '');
  assert.equal(missing.evidence, null);
});
