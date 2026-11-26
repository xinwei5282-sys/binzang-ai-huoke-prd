import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const prd = readFileSync(resolve(root, '../prd/pages/工作中枢-项目.md'), 'utf8');

function loadLifecycleApi() {
  const start = html.indexOf('const PROJECT_LIFECYCLE=');
  const end = html.indexOf('const PROJECT_TABS=', start);
  assert.ok(start >= 0 && end > start, 'lifecycle source should be present');
  const context = {};
  vm.runInNewContext(`${html.slice(start, end)};globalThis.api={canCompleteProject,canArchiveProject,advanceProjectLifecycle,deriveProjectLifecycle,completeProjectMilestone,resolveProjectItem,acceptProjectDeliverable,confirmProjectRetrospective};`, context);
  return context.api;
}

function renderLifecycleSections(project) {
  const start = html.indexOf('function renderProjectLifecycleSections(');
  const end = html.indexOf('function projectMaterialType(', start);
  assert.ok(start >= 0 && end > start, 'project overview renderer should be present');
  const context = {
    WORK_HUB_TASKS: [],
    WORK_HUB_MEETINGS: [],
    WORK_HUB_CUSTOMERS: [],
    AI_HUOKE_MEMBERS: [],
    visibleProjectMaterials: () => [],
    canCurrentAccountSeeWorkItem: () => true,
    workTaskStatusLabel: value => value,
    renderProjectConflict: () => '<p>暂无待处理阻塞</p>',
    safeText: value => String(value ?? ''),
    canManageProjectLifecycle: () => true,
    getCurrentWorkAccount: () => ({id: 'owner'}),
    projectKnowledgeRecord: () => null,
    PROJECT_LIFECYCLE: ['待立项','待启动','执行中','待客户确认','待验收','已完成','已归档'],
  };
  vm.runInNewContext(`${html.slice(start, end)};globalThis.renderOverview=renderProjectLifecycleSections;`, context);
  return context.renderOverview(project);
}

test('项目数据声明完整生命周期与立项字段', () => {
  for (const token of ['待立项','待启动','执行中','待客户确认','待验收','已完成','已归档','目标','预期成果','范围边界','成功标准','startDate','targetDate']) {
    assert.match(html, new RegExp(token));
  }
});

test('创建项目向导收集完整立项信息', () => {
  for (const id of ['newProjectGoal','newProjectOutcomes','newProjectScope','newProjectSuccessCriteria','newProjectStartDate','newProjectTargetDate']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('项目详情包含里程碑事项验收复盘且待办回到工作台', () => {
  for (const token of ['里程碑','风险','问题','变更','决策','成果验收','结项复盘','open-project-task-list','projectId']) assert.match(html, new RegExp(token));
});

test('完成与归档存在门槛校验', () => {
  for (const token of ['canCompleteProject','canArchiveProject','必需成果已验收','关键事项','复盘记录','状态不得跳过']) assert.match(html, new RegExp(token));
});

test('没有必需成果时不能把项目标记为完成', () => {
  const { canCompleteProject } = loadLifecycleApi();
  assert.equal(canCompleteProject({ lifecycleStage: '待验收', acceptances: [], items: [] }), false);
});

test('项目生命周期操作会修改真实项目状态并保留完成门槛', () => {
  const api = loadLifecycleApi();
  const project = {
    lifecycleStage: '执行中',
    status: '执行中',
    milestones: [{ name: '方案确认', completionCriteria: '客户书面确认', status: '进行中' }],
    items: [{ type: 'issue', title: '交付范围未定', status: 'open' }],
    acceptances: [{ title: '方案', required: true, status: '待客户确认' }],
    retrospective: null,
  };

  assert.equal(api.completeProjectMilestone(project, 0).ok, true);
  assert.equal(project.milestones[0].status, '已完成');
  assert.equal(api.resolveProjectItem(project, 0, { resolution: '已确认交付范围' }).ok, true);
  assert.equal(project.items[0].status, 'resolved');
  assert.equal(api.acceptProjectDeliverable(project, 0).ok, true);
  assert.equal(project.acceptances[0].status, '已验收');
  assert.equal(api.advanceProjectLifecycle(project, '待验收').ok, false, '不能跳过待客户确认');
  assert.equal(project.lifecycleStage, '执行中');
  assert.equal(api.confirmProjectRetrospective(project, '目标已完成，沉淀增长方案模板').ok, false, '执行中的项目不能提前确认结项复盘');
  project.lifecycleStage = '已完成';
  project.status = '已完成';
  assert.equal(api.confirmProjectRetrospective(project, '目标已完成，沉淀增长方案模板').ok, true);
  assert.equal(project.retrospective.confirmed, true);
});

test('项目详情各页签提供阶段、里程碑、事项、验收和复盘的可操作入口', () => {
  const output = renderLifecycleSections({
    id: 'p1', lifecycleStage: '执行中', status: '执行中', health: '有风险',
    goal: '完成方案', outcomes: '方案文档', scope: '咨询范围', successCriteria: '客户确认',
    startDate: '2026-09-01', targetDate: '2026-10-01',
    milestones: [{ name: '确认方案', dueDate: '2026-09-10', completionCriteria: '客户书面确认', status: '进行中' }],
    items: [{ type: 'issue', title: '范围未确认', status: 'open', impact: '影响排期' }],
    acceptances: [{ title: '方案文档', required: true, status: '待客户确认' }],
    retrospective: null,
  });
  const actionsBySection = {

    milestones: ['create-project-milestone', 'complete-project-milestone'],
    items: ['create-project-item', 'resolve-project-item'],
    acceptance: ['create-project-acceptance', 'accept-project-deliverable', 'open-project-retrospective'],
  };
  for (const [section, actions] of Object.entries(actionsBySection)) {
    for (const action of actions) assert.match(output[section], new RegExp(`data-act="${action}"`));
  }
  assert.doesNotMatch(Object.values(output).join(""), /开票|回款|应收|到账/);
});

test('项目状态由阶段交接、全部验收和复盘记录驱动', () => {
  const {deriveProjectLifecycle}=loadLifecycleApi();
  const project={lifecycleStage:'执行中',acceptances:[{required:true,status:'待客户确认'}],items:[]};
  const state={steps:Array(8).fill({})};
  assert.equal(deriveProjectLifecycle(project,{index:7,step:{status:'handoff'},state}),'待客户确认');
  assert.equal(deriveProjectLifecycle(project,{index:7,step:{status:'active'},state}),'待验收');
  assert.equal(deriveProjectLifecycle(project,{index:-1,state}),'待验收');
  project.acceptances[0].status='已验收';
  assert.equal(deriveProjectLifecycle(project,{index:-1,state}),'已完成');
  project.lifecycleStage='已完成';project.retrospective={confirmed:true};
  assert.equal(deriveProjectLifecycle(project,{index:-1,state}),'已归档');
});

test('并行项目的末阶段依据不能代替必需成果验收', () => {
  const {deriveProjectLifecycle}=loadLifecycleApi();
  const project={stageOwners:['owner'],lifecycleStage:'执行中',acceptances:[],items:[]};
  const progress={index:-1,state:{steps:[{status:'done',evidence:'客户验收记录'}]}};
  assert.equal(deriveProjectLifecycle(project,progress),'待验收');
  project.acceptances.push({required:true,status:'待验收'});
  assert.equal(deriveProjectLifecycle(project,progress),'待验收');
  project.acceptances[0].status='已验收';
  assert.equal(deriveProjectLifecycle(project,progress),'已完成');
});

test('项目指标的移动端两列规则位于基础四列规则之后', () => {
  const baseRule = html.lastIndexOf('.project-metrics{display:grid;grid-template-columns:repeat(4');
  const mobileRule = html.lastIndexOf('@media(max-width:560px){.project-metrics{grid-template-columns:1fr 1fr}');
  assert.ok(baseRule >= 0, 'project metric base rule should exist');
  assert.ok(mobileRule > baseRule, 'mobile override must follow the base rule so it wins the cascade');
});

test('项目 PRD 明确财务边界', () => {
  for (const token of ['不维护开票','不维护回款','不维护应收','不维护到账']) assert.match(prd, new RegExp(token));
  const projectArea = html.slice(html.indexOf('data-subview-panel="work-projects"'), html.indexOf('<!-- KB -->'));
  assert.doesNotMatch(projectArea, /开票回款|应收账款|到账维护/);
});
