import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), 'prototype/index.html'), 'utf8');

function loadBuilder() {
  const start = html.indexOf('function buildWorkProjectProgress');
  assert.ok(start >= 0, 'index.html should expose buildWorkProjectProgress');
  const end = html.indexOf('\nfunction ', start + 10);
  const source = html.slice(start, end < 0 ? html.length : end);
  return Function('canCurrentAccountAccessProject', 'canCurrentAccountSeeWorkItem', `${source};return buildWorkProjectProgress;`)(
    project => project.allowed !== false,
    item => item.allowed !== false,
  );
}

test('builds milestone progress, next milestone, open items and unfinished tasks', () => {
  const build = loadBuilder();
  const project = { id: 'p1', name: '增长项目', status: '执行中', health: '健康', targetDate: '2026-09-30', milestones: [
    { id: 'm1', name: '方案', status: '已完成', dueDate: '2026-09-01' },
    { id: 'm2', name: '交付', status: '进行中', dueDate: '2026-09-20' },
    { id: 'm3', name: '复盘', status: '未开始', dueDate: '2026-10-01' },
  ], items: [{ id: 'i1', projectId: 'p1', status: 'open' }, { id: 'i2', projectId: 'p1', status: 'resolved' }] };
  const tasks = [{ id: 't1', projectId: 'p1', status: 'pending' }, { id: 't2', projectId: 'p1', status: 'ready' }];
  const [row] = build([project], tasks, { today: '2026-09-18' });
  assert.equal(row.milestoneTotal, 3);
  assert.equal(row.milestoneCompleted, 1);
  assert.equal(row.percent, 33);
  assert.equal(row.nextMilestone.id, 'm2');
  assert.deepEqual(row.openItems.map(x => x.id), ['i1']);
  assert.deepEqual(row.unfinishedTasks.map(x => x.id), ['t1']);
  assert.equal(row.overdue, false);
  assert.equal(row.attention, true);
});

test('handles no milestones, overdue dates and closed projects', () => {
  const build = loadBuilder();
  const [active] = build([{ id: 'p1', status: '执行中', health: '健康', targetDate: '2026-09-17', milestones: [] }], [], { today: '2026-09-18' });
  assert.equal(active.percent, null);
  assert.equal(active.nextMilestone, null);
  assert.equal(active.overdue, true);
  assert.equal(active.attention, true);

  const [closed] = build([{ id: 'p2', status: '已完成', health: '有风险', targetDate: '2026-01-01', milestones: [{ name: 'x', status: '进行中', dueDate: '2026-01-02' }] }], [], { today: '2026-09-18' });
  assert.equal(closed.closed, true);
  assert.equal(closed.overdue, false);
  assert.equal(closed.attention, false);
});

test('applies project and task permissions, and sorts attention then active then closed', () => {
  const build = loadBuilder();
  const projects = [
    { id: 'closed', status: '已归档', targetDate: '2026-01-01', milestones: [] },
    { id: 'quiet', status: '执行中', health: '健康', targetDate: '2026-10-01', milestones: [] },
    { id: 'attention', status: '执行中', health: '有风险', targetDate: '2026-10-02', milestones: [] },
    { id: 'hidden', status: '执行中', targetDate: '2026-09-01', milestones: [], allowed: false },
  ];
  const tasks = [{ id: 'visible', projectId: 'attention', status: 'pending' }, { id: 'secret', projectId: 'attention', status: 'pending', allowed: false }];
  const rows = build(projects, tasks, { today: '2026-09-18', canAccessProject: p => p.allowed !== false, canSeeTask: t => t.allowed !== false });
  assert.deepEqual(rows.map(row => row.project.id), ['attention', 'quiet', 'closed']);
  assert.deepEqual(rows[0].unfinishedTasks.map(task => task.id), ['visible']);
  assert.equal(rows[0].attention, true);
  assert.equal(rows[2].closed, true);
});

test('uses earliest unfinished milestone and target date ordering with missing dates last', () => {
  const build = loadBuilder();
  const rows = build([
    { id: 'late', status: '执行中', targetDate: '', milestones: [{ id: 'm-late', status: '进行中', dueDate: '2026-10-01' }] },
    { id: 'early', status: '执行中', targetDate: '2026-09-20', milestones: [{ id: 'm-early', status: '进行中', dueDate: '2026-09-19' }, { id: 'm-none', status: '未开始' }] },
  ], [], { today: '2026-09-18' });
  assert.equal(rows[0].project.id, 'early');
  assert.equal(rows[0].nextMilestone.id, 'm-early');
  assert.equal(rows[1].nextMilestone.id, 'm-late');
});

test('recomputes updated source state without mutating input project order', () => {
  const build = loadBuilder();
  const projects = [
    { id: 'p1', status: '执行中', health: '健康', targetDate: '2026-09-30', milestones: [{ id: 'm1', status: '进行中', dueDate: '2026-09-20' }], items: [{ id: 'i1', status: 'open' }] },
    { id: 'p2', status: '执行中', health: '有风险', targetDate: '2026-09-25', milestones: [], items: [] },
  ];
  const originalOrder = projects.map(project => project.id);
  const tasks = [{ id: 't1', projectId: 'p1', status: 'pending' }];
  const first = build(projects, tasks, { today: '2026-09-18' });
  assert.equal(first.find(row => row.project.id === 'p1').percent, 0);
  projects[0].milestones[0].status = '已完成';
  projects[0].items[0].status = 'resolved';
  tasks[0].status = 'ready';
  const second = build(projects, tasks, { today: '2026-09-18' });
  const updated = second.find(row => row.project.id === 'p1');
  assert.equal(updated.percent, 100);
  assert.equal(updated.openItems.length, 0);
  assert.equal(updated.unfinishedTasks.length, 0);
  assert.deepEqual(projects.map(project => project.id), originalOrder);
});
