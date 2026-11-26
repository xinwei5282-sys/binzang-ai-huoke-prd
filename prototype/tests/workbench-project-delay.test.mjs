import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), 'prototype/index.html'), 'utf8');

function loadDelay() {
  const start = html.indexOf('function getWorkProjectDelay');
  assert.ok(start >= 0, 'index.html should expose getWorkProjectDelay');
  const end = html.indexOf('\nfunction ', start + 10);
  const source = html.slice(start, end < 0 ? html.length : end);
  return Function(`${source};return getWorkProjectDelay;`)();
}

test('returns delay from the earliest overdue project target or unfinished milestone', () => {
  const getDelay = loadDelay();
  const project = { name: '增长项目', targetDate: '2026-09-20', milestones: [
    { name: '方案', status: '进行中', dueDate: '2026-09-12' },
    { name: '交付', status: '未开始', dueDate: '2026-09-10' },
  ] };
  assert.deepEqual(getDelay(project, '2026-09-18'), { kind: 'milestone', name: '交付', dueDate: '2026-09-10', days: 8 });
  assert.deepEqual(getDelay({ name: '项目', targetDate: '2026-09-10', milestones: [] }, '2026-09-18'), { kind: 'project', name: '项目', dueDate: '2026-09-10', days: 8 });
});

test('excludes completed or archived projects and completed milestones', () => {
  const getDelay = loadDelay();
  assert.equal(getDelay({ name: '完成', status: '已完成', targetDate: '2026-09-01', milestones: [] }, '2026-09-18'), null);
  assert.equal(getDelay({ name: '归档', status: '已归档', targetDate: '2026-09-01', milestones: [] }, '2026-09-18'), null);
  assert.deepEqual(getDelay({ name: '项目', targetDate: '2026-09-10', milestones: [{ name: '已完成节点', status: '已完成', dueDate: '2026-09-01' }] }, '2026-09-18'), { kind: 'project', name: '项目', dueDate: '2026-09-10', days: 8 });
});

test('ignores missing or invalid dates, counts UTC natural days across months, and does not flag same-day dates', () => {
  const getDelay = loadDelay();
  const project = { name: '跨月项目', targetDate: 'invalid', milestones: [
    { name: '无日期', status: '进行中' },
    { name: '坏日期', status: '进行中', dueDate: '2026-02-30' },
    { name: '跨月节点', status: '进行中', dueDate: '2026-08-30' },
    { name: '同日节点', status: '进行中', dueDate: '2026-09-01' },
  ] };
  assert.deepEqual(getDelay(project, '2026-09-01'), { kind: 'milestone', name: '跨月节点', dueDate: '2026-08-30', days: 2 });
  assert.equal(getDelay({ name: '同日', targetDate: '2026-09-01', milestones: [] }, '2026-09-01'), null);
  assert.equal(getDelay(project, 'not-a-date'), null);
});
