import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  assert.fail(`${name} has an unterminated function body`);
}

function loadSelector() {
  const selector = Function(
    'canCurrentAccountSeeWorkItem',
    `${extractFunction('selectWorkExecutiveActions')}; return selectWorkExecutiveActions;`,
  );
  return selector(item => item.allowed !== false);
}

test('老板待确认只保留当前账号负责且有权看的待决策与待审批任务', () => {
  const select = loadSelector();
  const tasks = [
    { id: 'decision-me', ownerAccountId: 'acct-me', kind: 'decision', status: 'pending', allowed: true },
    { id: 'approval-me', ownerAccountId: 'acct-me', kind: 'approval', status: 'pending', allowed: true },
    { id: 'decision-other', ownerAccountId: 'acct-other', kind: 'decision', status: 'pending', allowed: true },
    { id: 'approval-hidden', ownerAccountId: 'acct-me', kind: 'approval', status: 'pending', allowed: false },
    { id: 'ordinary', ownerAccountId: 'acct-me', kind: 'follow_up', status: 'pending', allowed: true },
  ];
  assert.deepEqual(select(tasks, { accountId: 'acct-me' }).map(task => task.id), ['decision-me', 'approval-me']);
});

test('ready/running/confirmed/failed 等状态不进入等我确认，并按决策、审批和排期排序', () => {
  const select = loadSelector();
  const tasks = [
    { id: 'approval-late', ownerAccountId: 'acct-me', kind: 'approval', status: 'pending', scheduledDate: '2026-09-20', scheduledTime: '09:00' },
    { id: 'decision-no-date', ownerAccountId: 'acct-me', kind: 'decision', status: 'pending' },
    { id: 'decision-late', ownerAccountId: 'acct-me', kind: 'decision', status: 'pending', scheduledDate: '2026-09-20', scheduledTime: '10:00' },
    { id: 'decision-early', ownerAccountId: 'acct-me', kind: 'decision', status: 'pending', scheduledDate: '2026-09-19', scheduledTime: '10:00' },
    ...['ready', 'running', 'confirmed', 'failed'].map(status => ({ id: status, ownerAccountId: 'acct-me', kind: 'decision', status })),
  ];
  assert.deepEqual(select(tasks, { accountId: 'acct-me' }).map(task => task.id), ['decision-early', 'decision-late', 'decision-no-date', 'approval-late']);
});

test('选择不修改原数组，任务状态更新后重新计算结果', () => {
  const select = loadSelector();
  const tasks = [
    { id: 'decision', ownerAccountId: 'acct-me', kind: 'decision', status: 'pending' },
    { id: 'approval', ownerAccountId: 'acct-me', kind: 'approval', status: 'pending' },
  ];
  const originalOrder = tasks.map(task => task.id);
  const first = select(tasks, { accountId: 'acct-me' });
  tasks[0].status = 'confirmed';
  const second = select(tasks, { accountId: 'acct-me' });
  assert.deepEqual(first.map(task => task.id), ['decision', 'approval']);
  assert.deepEqual(second.map(task => task.id), ['approval']);
  assert.deepEqual(tasks.map(task => task.id), originalOrder);
});
