import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const html = readFileSync(resolve(import.meta.dirname, '..', 'index.html'), 'utf8');

// RED contract: production should expose one small, deterministic boundary for
// deriving/synchronizing workbench tasks from a project item.
function loadProjectItemTaskApi() {
  const start = html.indexOf('function deriveProjectItemTask(');
  const end = html.indexOf('function syncProjectItemTaskStatus(', start);
  assert.ok(start >= 0 && end > start, 'project-item task derivation API should be present');
  const syncEnd = html.indexOf('\n}', end) + 2;
  const context = {};
  vm.runInNewContext(`${html.slice(start, syncEnd)};globalThis.api={deriveProjectItemTask,syncProjectItemTaskStatus};`, context);
  return context.api;
}

function item(type, extra = {}) {
  return {
    id: 'item-1', tenantId: 'tenant-1', projectId: 'project-1', customerId: 'customer-1',
    type, title: `${type}：需要处理`, impact: '影响项目推进', ...extra,
  };
}

function loadDemoProjects() {
  const start = html.indexOf('const WORK_HUB_PROJECTS=');
  const end = html.indexOf('const WORK_HUB_PROJECT_MEMBERS=', start);
  assert.ok(start >= 0 && end > start, 'project demo data should be present');
  const context = {};
  vm.runInNewContext(`${html.slice(start, end)};globalThis.projects=WORK_HUB_PROJECTS;`, context);
  return context.projects;
}

function loadDemoTasks() {
  const start = html.indexOf('const WORK_HUB_TASKS=');
  const end = html.indexOf('const WORK_HUB_CONFLICTS=', start);
  assert.ok(start >= 0 && end > start, 'task demo data should be present');
  const context = {};
  vm.runInNewContext(`${html.slice(start, end)};globalThis.tasks=WORK_HUB_TASKS;`, context);
  return context.tasks;
}

test('默认项目数据可派生风险问题变更决策四类待办', () => {
  const { deriveProjectItemTask } = loadProjectItemTaskApi();
  const project = loadDemoProjects().find(entry => entry.id === 'proj-growth');
  const types = project.items.map(entry => entry.type).sort();
  assert.deepEqual([...types], ['change', 'decision', 'issue', 'risk']);
  const tasks = project.items.map(entry => deriveProjectItemTask(entry));
  assert.equal(tasks.filter(Boolean).length, 4);
  assert.deepEqual([...tasks.map(task => task.kind).sort()], ['change', 'decision', 'issue', 'risk']);
  assert.equal(new Set(tasks.map(task => task.sourceProjectItemId)).size, 4);
  assert.equal(tasks.every(task => /^2026-09-\d{2}$/.test(task.scheduledDate) && task.scheduledTime === '18:00'), true);
  const seededTasks = loadDemoTasks().filter(task => task.projectId === project.id && task.sourceProjectItemId);
  assert.equal(seededTasks.length, 4);
  assert.deepEqual([...seededTasks.map(task => task.kind).sort()], ['change', 'decision', 'issue', 'risk']);
  assert.deepEqual([...seededTasks.map(task => task.sourceProjectItemId).sort()], [...project.items.map(entry => entry.id).sort()]);
});

test('问题创建即生成一条项目待办', () => {
  const { deriveProjectItemTask } = loadProjectItemTaskApi();
  const task = deriveProjectItemTask(item('issue'));
  assert.equal(task.projectId, 'project-1');
  assert.equal(task.sourceProjectItemId, 'item-1');
  assert.equal(task.kind, 'issue');
  assert.equal(task.status, 'pending');
});

test('决策生成待判断待办，只有记录结论才能完成', () => {
  const { deriveProjectItemTask, syncProjectItemTaskStatus } = loadProjectItemTaskApi();
  const projectItem = item('decision');
  const task = deriveProjectItemTask(projectItem);
  assert.equal(task.kind, 'decision');
  assert.equal(task.status, 'pending');
  const missingResult = syncProjectItemTaskStatus({ projectItem, task, source: 'task', status: 'ready' });
  assert.equal(missingResult.ok, false);
  assert.equal(missingResult.reason, '请填写处理结果');
  const missingReason = syncProjectItemTaskStatus({ projectItem, task, source: 'task', status: 'ready', resolution: '采用方案 A' });
  assert.equal(missingReason.ok, false);
  assert.equal(missingReason.reason, '请填写决策原因');
  assert.deepEqual(syncProjectItemTaskStatus({ projectItem, task, source: 'task', status: 'ready', resolution: '采用方案 A', reason: '客户更重视交付时效' }).ok, true);
  assert.equal(task.status, 'ready');
  assert.equal(projectItem.status, 'resolved');
  assert.equal(projectItem.resolution, '采用方案 A');
  assert.equal(projectItem.resolutionReason, '客户更重视交付时效');
});

test('变更先生成影响评估待办', () => {
  const { deriveProjectItemTask } = loadProjectItemTaskApi();
  const task = deriveProjectItemTask(item('change', { impactAssessment: null }));
  assert.equal(task.kind, 'change');
  assert.match(task.title, /影响评估/);
  assert.equal(task.status, 'pending');
});

test('风险只有明确负责人和应对动作/截止时间或升级时才生成待办', () => {
  const { deriveProjectItemTask } = loadProjectItemTaskApi();
  assert.equal(deriveProjectItemTask(item('risk', { ownerAccountId: 'u1', responseAction: '调整排期' })).kind, 'risk');
  assert.equal(deriveProjectItemTask(item('risk', { ownerAccountId: 'u1', dueAt: '2026-09-12' })).kind, 'risk');
  assert.equal(deriveProjectItemTask(item('risk', { escalated: true, projectOwnerAccountId: 'u1' })).kind, 'risk');
  assert.equal(deriveProjectItemTask(item('risk', { note: '已记录，观察中' })), null, '纯记录风险不应生成待办');
});

test('同一项目事项幂等生成且任务保留来源字段', () => {
  const { deriveProjectItemTask } = loadProjectItemTaskApi();
  const first = deriveProjectItemTask(item('issue'));
  const second = deriveProjectItemTask(item('issue'));
  assert.deepEqual(second, first);
  assert.deepEqual({ projectId: first.projectId, sourceProjectItemId: first.sourceProjectItemId, kind: first.kind }, {
    projectId: 'project-1', sourceProjectItemId: 'item-1', kind: 'issue',
  });
});

test('借调批复不能关闭风险，结案依据必须已签认且属于同一项目', () => {
  const { deriveProjectItemTask, syncProjectItemTaskStatus } = loadProjectItemTaskApi();
  const risk = item('risk', { status:'open', ownerAccountId:'u1', responseAction:'安排复测' });
  const task = deriveProjectItemTask(risk);
  const close = verification => syncProjectItemTaskStatus({ projectItem:risk, task, source:'task', status:'ready', resolution:'记录处理结论', verification });
  assert.equal(close(null).ok,false);
  assert.equal(close({ref:'QA',projectId:'project-2',confirmed:true}).ok,false);
  assert.equal(close({ref:'QA',projectId:'project-1',confirmed:false}).ok,false);
  assert.equal(task.status,'pending');
  assert.equal(risk.status,'open');
  assert.equal(close({ref:'QA',projectId:'project-1',confirmed:true}).ok,true);
  assert.equal(risk.verification.ref,'QA');
  assert.equal(risk.status,'resolved');
});

test('项目事项与待办双向状态联动', () => {
  const { syncProjectItemTaskStatus } = loadProjectItemTaskApi();
  const projectItem = item('issue', { status: 'open' });
  const task = { projectId: 'project-1', sourceProjectItemId: 'item-1', kind: 'issue', status: 'pending' };
  syncProjectItemTaskStatus({ projectItem, task, source: 'task', status: 'ready', resolution: '已协调资源并恢复排期' });
  assert.equal(projectItem.status, 'resolved');
  assert.equal(task.status, 'ready');

  projectItem.status = 'open';
  task.status = 'pending';
  syncProjectItemTaskStatus({ projectItem, task, source: 'project_item', status: 'resolved', resolution: '项目页直接记录完成' });
  assert.equal(projectItem.status, 'resolved');
  assert.equal(task.status, 'ready');
});
