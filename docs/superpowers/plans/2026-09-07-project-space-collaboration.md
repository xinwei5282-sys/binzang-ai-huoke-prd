# Project Space Collaboration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing work-hub project prototype into an A1 action-first project workspace that creates projects, manages members and scoped materials, links meeting minutes bidirectionally, and routes tasks and deliverables to their existing sources of truth.

**Architecture:** Keep `prototype/index.html` as the only runtime source and extend its current in-memory fixtures, renderers, delegated actions, modals, and account switcher. Project-member and project-material records store relations and permissions only; meetings, tasks, PPTs, quotations, contracts, and scripts remain in their current source collections. Authorization runs in two stages: system RBAC/data scope grants project access, then the material ACL grants content access.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, `node:test`, Chrome DevTools Protocol capture scripts, existing Codex prototype verifier.

**Spec:** `docs/superpowers/specs/2026-09-07-project-space-collaboration-design.md`

## Global Constraints

- The only runtime source is `prototype/index.html`.
- This is a clickable prototype; do not connect real storage, authorization services, ASR, queues, model APIs, messaging, signing, or payments.
- Keep simulated upload, processing, AI analysis, and generation clearly labeled.
- Do not promote uploaded material or AI inference into confirmed enterprise knowledge or project facts without human confirmation.
- Do not duplicate meeting transcripts/summaries, task bodies, PPT bodies, commercial-document bodies, or communication-script bodies inside projects.
- Preserve existing meeting-summary, task-tree, customer-profile, quotation-conflict, PPT-routing, system-management, and account-switching flows.
- Unauthorized accounts must not receive restricted material titles, summaries, bodies, or restricted counts.
- Add no production dependencies.
- Pass 1440×900 and 390×844 browser audits without horizontal overflow or runtime errors.
- Before each task, inspect `git status --short` and the target-file diff; stage only the files named by that task so existing user work is never swept into a commit.

---

## File Structure

- `prototype/index.html` — all runtime fixtures, styles, workspace renderers, permission checks, modal flows, deep links, and delegated actions.
- `prototype/tests/enterprise-work-hub.test.mjs` — project, material, meeting, task, source-boundary, and capture contracts.
- `prototype/tests/ai-huoke-system-management.test.mjs` — RBAC registry contract for the work-hub module.
- `prototype/scripts/capture-enterprise-work-hub.mjs` — desktop/mobile interaction, console, bounds, and overflow evidence.
- `prd/pages/工作中枢-项目.md` — project workspace page contract.
- `prd/pages/企业大脑-会议纪要.md` — project association and return-navigation contract.
- `prd/pages/设置-权限管理.md` — work-hub actions and project interpretation of existing data scopes.
- `prd/PRD_企业AI经营大脑_当前开发基线.md` — concise IA baseline update.

---

### Task 1: Define project relations and two-stage authorization

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/tests/ai-huoke-system-management.test.mjs`
- Modify: `prototype/index.html:1589-1594`
- Modify: `prototype/index.html:1664-1677`

**Interfaces:**
- Consumes: `WORK_HUB_ACCOUNT_TEMPLATES`, `AI_HUOKE_PERMISSION_MODULES`, `AI_HUOKE_ROLE_GRANTS`, `getCurrentWorkAccount()`.
- Produces: `WORK_HUB_PROJECT_MEMBERS`, `WORK_HUB_PROJECT_MATERIALS`, `currentSystemActions(moduleKey)`, `hasSystemAction(moduleKey, action)`, `currentWorkDataScope()`, `currentWorkHubActions()`, `hasWorkHubAction(action)`, `canCurrentAccountAccessProject(project)`, `canCurrentAccountSeeProjectMaterial(material)`, `visibleProjectMaterials(projectId)`.

- [ ] **Step 1: Write failing authorization contracts**

```js
// ai-huoke-system-management.test.mjs
test('system RBAC registers work hub project actions',()=>{
  const source=html.match(/const AI_HUOKE_PERMISSION_MODULES=\[[\s\S]*?\];/)?.[0]||'';
  assert.match(source,/key:'workhub'/);
  for(const action of ['查看项目','创建项目','管理项目成员','上传资料','设置材料权限','删除资料']) {
    assert.match(source,new RegExp(action));
  }
});

// enterprise-work-hub.test.mjs
test('project access and material ACL are separate contracts',()=>{
  for(const token of ['WORK_HUB_PROJECT_MEMBERS','WORK_HUB_PROJECT_MATERIALS','currentSystemActions','hasSystemAction','currentWorkDataScope','currentWorkHubActions','hasWorkHubAction','canCurrentAccountAccessProject','canCurrentAccountSeeProjectMaterial','visibleProjectMaterials','selectedMemberIds','createdByAccountId','role.dataScope']) {
    assert.match(html,new RegExp(token));
  }
  for(const visibility of ['project','selected_members','private']) {
    assert.match(html,new RegExp(`visibility:'${visibility}'`));
  }
});
```

- [ ] **Step 2: Run the tests and confirm failure**

```bash
node --test --test-reporter=spec \
  --test-name-pattern="work hub project actions|project access and material ACL" \
  prototype/tests/ai-huoke-system-management.test.mjs \
  prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL because the work-hub permission module and relation functions do not exist.

- [ ] **Step 3: Extend RBAC and account fixtures**

```js
const AI_HUOKE_PERMISSION_MODULES=[
  {key:'knowledge',label:'企业大脑',buttons:['查看','上传资料','编辑','归档']},
  {key:'workhub',label:'工作中枢',buttons:['查看项目','创建项目','管理项目成员','上传资料','设置材料权限','删除资料']},
  {key:'content',label:'营销物料',buttons:['查看','创作','编辑','发布']},
  {key:'acquisition',label:'AI 获客',buttons:['查看','创建任务','确认','发布']},
  {key:'prompts',label:'提示词管理',buttons:['查看','编辑','测试','发布']},
  {key:'system',label:'系统管理',buttons:['查看','成员管理','权限管理','导出日志']}
];
const WORK_HUB_ACCOUNT_TEMPLATES={
  boss:{id:'acct-boss',tenantId:'tenant-weiran',name:'蔚然',roleLabel:'老板账号',systemRoles:['管理员']},
  employee:{id:'acct-employee-lin',tenantId:'tenant-weiran',name:'林晓',roleLabel:'员工账号',systemRoles:['运营编辑']}
};
const AI_HUOKE_MEMBERS=[
  {id:'member-boss',accountId:'acct-boss',tenantId:'tenant-weiran',name:'蔚然',account:'owner@example.com',roles:['管理员'],summary:'全部模块 · 全部数据 · 全部按钮',status:'启用',createdAt:'2026-06-18 09:00'},
  {id:'member-001',accountId:'acct-employee-lin',tenantId:'tenant-weiran',name:'林晓',account:'138****0000',roles:['运营编辑'],summary:'项目协作、营销物料与 AI 获客',status:'启用',createdAt:'2026-06-18 09:20'},
  {id:'member-002',accountId:'acct-employee-zhou',tenantId:'tenant-weiran',name:'周宁',account:'zhou.ning@example.com',roles:['运营编辑','Prompt 测试员'],summary:'营销物料、AI 获客 · Prompt 查看/测试',status:'启用',createdAt:'2026-07-02 14:10'},
  {id:'member-003',accountId:'acct-observer-chen',tenantId:'tenant-weiran',name:'陈默',account:'chen.mo@example.com',roles:['观察员'],summary:'企业大脑与系统管理只读',status:'停用',createdAt:'2026-07-22 11:35'}
];
```

Update `openAddSystemMember()` to assign `tenantId:getCurrentWorkAccount().tenantId` and a stable in-memory `accountId:'acct-'+Date.now()` to newly created members, so the project picker never uses a display-row ID as an account ID.

Add a `workhub` grant to every existing role so the registry has a stable shape:

```js
// inside AI_HUOKE_ROLE_GRANTS[*].grants
管理员: {workhub:['查看项目','创建项目','管理项目成员','上传资料','设置材料权限','删除资料']}
运营编辑: {workhub:['查看项目','上传资料']}
'Prompt 测试员': {workhub:[]}
观察员: {workhub:['查看项目']}
```

Merge these arrays into the existing `grants` objects; do not replace their `knowledge/content/acquisition/prompts/system` grants. Add `上传资料` to the existing `运营编辑.grants.knowledge` array so an employee allowed to upload project material can route audio/video into meeting processing. Also add `dataScope:'all'` to `管理员`, `dataScope:'team_self'` to `运营编辑` and `Prompt 测试员`, and `dataScope:'self'` to `观察员`. Change `renderPermissionMatrix()` and `saveSystemRole()` so the existing Chinese selector values round-trip to these stable enum values rather than inferring scope from the role name.

```js
const WORK_DATA_SCOPE_OPTIONS=[['all','全部数据'],['team_self','所属团队与本人数据'],['self','仅本人数据']];
// renderPermissionMatrix():
WORK_DATA_SCOPE_OPTIONS.map(([value,label])=>'<option value="'+value+'" '+(role.dataScope===value?'selected':'')+'>'+label+'</option>').join('');
// saveSystemRole(), before summary is rebuilt:
role.dataScope=$('#systemRoleDataScope')?.value||'self';
```

- [ ] **Step 4: Add project-member and material-link fixtures**

```js
const WORK_HUB_PROJECT_MEMBERS=[
  {projectId:'proj-growth',accountId:'acct-boss',joinedAt:'2026-09-01'},
  {projectId:'proj-growth',accountId:'acct-employee-lin',joinedAt:'2026-09-02'},
  {projectId:'proj-ops',accountId:'acct-boss',joinedAt:'2026-09-03'}
];
const WORK_HUB_PROJECT_MATERIALS=[
  {id:'material-meeting-aurora',tenantId:'tenant-weiran',projectId:'proj-growth',sourceType:'meeting',sourceId:'meeting-aurora-01',title:'客户需求沟通会议.mp4',ownerAccountId:'acct-boss',visibility:'project',selectedMemberIds:[],status:'ready',sourceAvailable:true,updatedAt:'9月4日 10:20'},
  {id:'material-growth-outline',tenantId:'tenant-weiran',projectId:'proj-growth',sourceType:'ppt',sourceId:'ppt-demo-ready',title:'增长方案大纲.pptx',ownerAccountId:'acct-boss',visibility:'project',selectedMemberIds:[],status:'ready',sourceAvailable:true,updatedAt:'9月4日 09:30'},
  {id:'material-quote-sheet',tenantId:'tenant-weiran',projectId:'proj-growth',sourceType:'document',sourceId:'quote-sheet-v3',title:'报价测算表.xlsx',ownerAccountId:'acct-employee-lin',visibility:'selected_members',selectedMemberIds:['acct-boss'],status:'ready',sourceAvailable:true,updatedAt:'9月3日 17:40'},
  {id:'material-private-note',tenantId:'tenant-weiran',projectId:'proj-growth',sourceType:'document',sourceId:'private-note-lin',title:'内部跟进草稿.docx',ownerAccountId:'acct-employee-lin',visibility:'private',selectedMemberIds:[],status:'ready',sourceAvailable:true,updatedAt:'9月3日 16:10'},
  {id:'material-boss-selected',tenantId:'tenant-weiran',projectId:'proj-growth',sourceType:'document',sourceId:'budget-floor-boss',title:'客户预算底稿.xlsx',ownerAccountId:'acct-boss',visibility:'selected_members',selectedMemberIds:['acct-boss'],status:'ready',sourceAvailable:true,updatedAt:'9月3日 15:20'},
  {id:'material-boss-private',tenantId:'tenant-weiran',projectId:'proj-growth',sourceType:'document',sourceId:'pricing-floor-boss',title:'老板内部报价底线.docx',ownerAccountId:'acct-boss',visibility:'private',selectedMemberIds:[],status:'ready',sourceAvailable:true,updatedAt:'9月3日 15:00'}
];
```

Extend each project with `tenantId`, `ownerAccountId`, `memberIds`, `updatedAt`, and `aiInsight`.

```js
const WORK_HUB_PROJECTS=[
  {id:'proj-growth',tenantId:'tenant-weiran',name:'极光科技增长项目',customerId:'cust-aurora',status:'推进中',createdByAccountId:'acct-boss',ownerAccountId:'acct-boss',memberIds:['acct-boss','acct-employee-lin'],requirements:'老板会议要求：报价 32 万，交付周期 6 周',commercialDocuments:['quote-v3 · 员工报价 28 万'],conflictId:'conflict-quote-01',updatedAt:'9月4日 10:20',aiInsight:'客户评审意愿明确，当前应优先确认方案大纲与交付边界。'},
  {id:'proj-ops',tenantId:'tenant-weiran',name:'Lumen 经营诊断',customerId:'cust-lumen',status:'待启动',createdByAccountId:'acct-boss',ownerAccountId:'acct-boss',memberIds:['acct-boss'],requirements:'待补充项目要求',commercialDocuments:[],conflictId:null,updatedAt:'9月3日 14:00',aiInsight:'资料不足，请补充客户沟通或项目文件。'}
];
```

Add `tenantId:'tenant-weiran'` and a `dueAt` display value to the existing project-linked task fixtures. Do not create project-local task copies; these remain the task-center records.

Add `tenantId:'tenant-weiran'` to the existing meeting fixtures as well, so meeting list checks and project deep links use the same tenant boundary as newly uploaded meetings.

- [ ] **Step 5: Implement two-stage access**

```js
function canCurrentAccountAccessProject(project){
  const account=getCurrentWorkAccount();
  if(!project||project.tenantId!==account.tenantId||!hasWorkHubAction('查看项目'))return false;
  const dataScope=currentWorkDataScope();
  if(dataScope==='all')return true;
  if(dataScope==='self')return project.createdByAccountId===account.id;
  return project.createdByAccountId===account.id||project.memberIds?.includes(account.id);
}
function getCurrentWorkAccount(){
  const base=Object.values(WORK_HUB_ACCOUNT_TEMPLATES).find(item=>item.id===workHubState.currentAccountId)||WORK_HUB_ACCOUNT_TEMPLATES.boss;
  const member=AI_HUOKE_MEMBERS.find(item=>item.accountId===base.id&&item.tenantId===base.tenantId);
  return {...base,systemRoles:member?.roles||base.systemRoles};
}
function currentSystemActions(moduleKey){
  const account=getCurrentWorkAccount();
  return [...new Set((account.systemRoles||[]).flatMap(role=>AI_HUOKE_ROLE_GRANTS[role]?.grants?.[moduleKey]||[]))];
}
function hasSystemAction(moduleKey,action){return currentSystemActions(moduleKey).includes(action);}
function currentWorkDataScope(){
  const rank={self:1,team_self:2,all:3},account=getCurrentWorkAccount();
  return (account.systemRoles||[]).map(role=>AI_HUOKE_ROLE_GRANTS[role]?.dataScope||'self').sort((left,right)=>rank[right]-rank[left])[0]||'self';
}
function currentWorkHubActions(){return currentSystemActions('workhub');}
function hasWorkHubAction(action){return hasSystemAction('workhub',action);}
function canCurrentAccountSeeProjectMaterial(material){
  const account=getCurrentWorkAccount();
  const project=WORK_HUB_PROJECTS.find(item=>item.id===material?.projectId);
  if(!material||material.tenantId!==account.tenantId||!canCurrentAccountAccessProject(project))return false;
  if(material.visibility==='private')return material.ownerAccountId===account.id;
  if(material.visibility==='selected_members')return material.ownerAccountId===account.id||material.selectedMemberIds?.includes(account.id);
  return material.visibility==='project';
}
function visibleProjectMaterials(projectId){
  return WORK_HUB_PROJECT_MATERIALS.filter(item=>item.projectId===projectId&&canCurrentAccountSeeProjectMaterial(item));
}
```

Update `canCurrentAccountSeeWorkItem()` to use `all | team_self | self` while preserving private meetings, selected-member meetings, and shared-project tasks:

```js
function canCurrentAccountSeeWorkItem(item){
  const account=getCurrentWorkAccount();
  if(item.tenantId&&item.tenantId!==account.tenantId)return false;
  if(item.visibility==='private'||(!item.visibility&&!item.projectId))return item.ownerAccountId===account.id;
  if(item.visibility==='selected_members')return item.ownerAccountId===account.id||item.selectedMemberIds?.includes(account.id);
  if(item.projectId){
    const project=WORK_HUB_PROJECTS.find(project=>project.id===item.projectId);
    return canCurrentAccountAccessProject(project);
  }
  return currentWorkDataScope()==='all';
}
```

- [ ] **Step 6: Run affected test suites**

```bash
node --test --test-reporter=spec \
  prototype/tests/enterprise-work-hub.test.mjs \
  prototype/tests/ai-huoke-system-management.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add prototype/index.html \
  prototype/tests/enterprise-work-hub.test.mjs \
  prototype/tests/ai-huoke-system-management.test.mjs
git commit -m "feat: define project workspace authorization"
```

---

### Task 2: Build project creation and the A1 cockpit

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/index.html:601-603`
- Modify: `prototype/index.html:1224`
- Modify: `prototype/index.html:1687-1716`
- Modify: `prototype/index.html:3235-3285`

**Interfaces:**
- Consumes: Task 1 fixtures and `canCurrentAccountAccessProject()`.
- Produces: `openCreateWorkProject()`, `showProjectCreateStep(step)`, `advanceProjectCreate(step)`, `saveWorkProject()`, `openWorkProject(projectId, tab)`, `switchWorkProjectTab(tab)`, `renderWorkProjectDetail()`, `renderProjectOverview(project)`, `renderProjectMembers(project)`.

- [ ] **Step 1: Write the failing cockpit contract**

```js
test('project workspace creates projects and exposes the A1 cockpit',()=>{
  for(const token of [
    'openCreateWorkProject','showProjectCreateStep','advanceProjectCreate','saveWorkProject','renderWorkProjectDetail','switchWorkProjectTab','openAddWorkProjectMember','saveWorkProjectMembers',
    'data-project-create-step="1"','data-project-create-step="2"','data-project-create-step="3"',
    'data-project-tab="overview"','data-project-tab="materials"','data-project-tab="meetings"',
    'data-project-tab="tasks"','data-project-tab="deliverables"','data-project-tab="members"',
    '下一步工作','项目阻塞','最新会议','AI 项目判断','最近资料'
  ]) assert.match(html,new RegExp(token));
  assert.match(html,/data-act="create-work-project"/);
  assert.match(html,/data-act="add-work-project-member"/);
});
```

- [ ] **Step 2: Confirm the test fails**

```bash
node --test --test-reporter=spec \
  --test-name-pattern="A1 cockpit" \
  prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL because the current detail is only a commercial-document/conflict card.

- [ ] **Step 3: Add stable markup and responsive styles**

```html
<div class="subview" data-subview-panel="work-projects">
  <div class="section-note">项目统一汇总资料、会议、待办与成果；页面内容按当前账号权限过滤。</div>
  <div class="workspace-toolbar"><button class="btn pri" data-act="create-work-project">创建项目</button></div>
  <div id="workProjectList" class="grid"></div>
</div>
```

```css
.project-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.project-tabs{display:flex;gap:20px;border-bottom:1px solid var(--line);overflow:auto}
.project-tab{border:0;border-bottom:2px solid transparent;background:none;padding:11px 2px;white-space:nowrap}
.project-tab.on{border-bottom-color:var(--brand-d);color:var(--brand-d)}
.project-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.project-cockpit{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:14px}
.project-panel{border:1px solid var(--line);border-radius:var(--panel-radius);padding:14px;background:var(--surface)}
@media(max-width:760px){.project-head,.project-cockpit{display:grid;grid-template-columns:1fr}.project-metrics{grid-template-columns:1fr 1fr}}
```

- [ ] **Step 4: Implement project creation from enabled system members**

```js
function openCreateWorkProject(){
  if(!hasWorkHubAction('创建项目')){toast('当前账号没有创建项目权限','warn');return;}
  const account=getCurrentWorkAccount(),members=AI_HUOKE_MEMBERS.filter(member=>member.tenantId===account.tenantId&&member.status==='启用');
  const memberOptions=members.map(member=>'<option value="'+member.accountId+'">'+safeText(member.name)+'</option>').join('');
  const body='<div class="project-create-progress"><span>1 项目信息</span><span>2 项目成员</span><span>3 确认创建</span></div><section data-project-create-step="1"><div class="field"><label>项目名称 *</label><input class="inp" id="newProjectName"></div><div class="split"><div class="field"><label>关联客户</label><select class="inp" id="newProjectCustomer"><option value="">暂不关联</option>'+WORK_HUB_CUSTOMERS.map(item=>'<option value="'+item.id+'">'+safeText(item.name)+'</option>').join('')+'</select></div><div class="field"><label>项目状态</label><select class="inp" id="newProjectStatus"><option>待启动</option><option>推进中</option><option>已完成</option></select></div></div><div class="field"><label>项目负责人 *</label><select class="inp" id="newProjectOwner">'+memberOptions+'</select></div><button class="btn pri" data-act="advance-project-create" data-step="2">下一步：选择成员</button></section><section data-project-create-step="2" hidden><div class="field"><label>项目成员</label>'+members.map(member=>'<label><input type="checkbox" data-new-project-member value="'+member.accountId+'"> '+safeText(member.name)+'</label>').join('')+'</div><div class="rowact"><button class="btn" data-act="advance-project-create" data-step="1">上一步</button><button class="btn pri" data-act="advance-project-create" data-step="3">下一步：确认</button></div></section><section data-project-create-step="3" hidden><div class="state-callout">确认后将创建项目空间，并把创建人、负责人和所选成员加入项目范围。</div><button class="btn" data-act="advance-project-create" data-step="2">上一步</button></section>';
  modal('创建项目',body,'创建并进入',saveWorkProject,true);showProjectCreateStep(1);
}
function showProjectCreateStep(step){
  $$('[data-project-create-step]').forEach(panel=>panel.hidden=Number(panel.dataset.projectCreateStep)!==step);
  const submit=$('#modal [data-mo]');if(submit)submit.hidden=step!==3;
}
function advanceProjectCreate(step){
  if(step>1&&!$('#newProjectName')?.value.trim()){toast('请输入项目名称','warn');return;}
  if(step>1&&!$('#newProjectOwner')?.value){toast('请选择项目负责人','warn');return;}
  showProjectCreateStep(step);
}
function saveWorkProject(){
  const name=$('#newProjectName')?.value.trim();
  if(!name){toast('请输入项目名称','warn');return;}
  const account=getCurrentWorkAccount(),id='proj-'+Date.now(),ownerAccountId=$('#newProjectOwner')?.value;
  if(!ownerAccountId){toast('请选择项目负责人','warn');return;}
  const memberIds=[account.id,ownerAccountId,...$$('[data-new-project-member]:checked').map(input=>input.value)].filter((value,index,list)=>list.indexOf(value)===index);
  WORK_HUB_PROJECTS.unshift({id,tenantId:account.tenantId,name,customerId:$('#newProjectCustomer')?.value||null,status:$('#newProjectStatus')?.value||'待启动',createdByAccountId:account.id,ownerAccountId,memberIds,requirements:'待补充项目要求',commercialDocuments:[],conflictId:null,updatedAt:'刚刚',aiInsight:'资料不足，请先上传项目资料或会议。'});
  memberIds.forEach(accountId=>WORK_HUB_PROJECT_MEMBERS.push({projectId:id,accountId,joinedAt:'刚刚'}));
  closeModal();openWorkProject(id,'overview');toast('项目空间已创建','ok');
}
function openAddWorkProjectMember(projectId){
  if(!hasWorkHubAction('管理项目成员')){toast('当前账号没有项目成员管理权限','warn');return;}
  const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);
  if(!canCurrentAccountAccessProject(project)){toast('当前账号无权访问该项目','warn');return;}
  const members=AI_HUOKE_MEMBERS.filter(member=>member.tenantId===project.tenantId&&member.status==='启用');
  modal('项目成员 · '+safeText(project.name),'<div id="editProjectMembers">'+members.map(member=>'<label><input type="checkbox" value="'+member.accountId+'" '+(project.memberIds.includes(member.accountId)?'checked':'')+'> '+safeText(member.name)+' · '+safeText(member.roles.join('、'))+'</label>').join('')+'</div><div class="note">项目成员只控制数据范围，不替代系统角色权限。</div>','保存成员',()=>saveWorkProjectMembers(projectId),true);
}
function saveWorkProjectMembers(projectId){
  if(!hasWorkHubAction('管理项目成员')){toast('当前账号没有项目成员管理权限','warn');return;}
  const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId),selected=$$('#editProjectMembers input:checked').map(input=>input.value);
  if(!canCurrentAccountAccessProject(project))return;
  project.memberIds=[project.ownerAccountId,...selected].filter((value,index,list)=>list.indexOf(value)===index);
  const keep=WORK_HUB_PROJECT_MEMBERS.filter(link=>link.projectId!==projectId);
  WORK_HUB_PROJECT_MEMBERS.splice(0,WORK_HUB_PROJECT_MEMBERS.length,...keep,...project.memberIds.map(accountId=>({projectId,accountId,joinedAt:'刚刚'})));
  closeModal();renderWorkProjectDetail();toast('项目成员已更新','ok');
}
```

- [ ] **Step 5: Render six tabs and the A1 overview**

```js
const PROJECT_TABS=[['overview','项目总览'],['materials','全部资料'],['meetings','会议'],['tasks','待办'],['deliverables','成果'],['members','成员']];
function switchWorkProjectTab(tab){
  workHubState.activeProjectTab=tab;
  $$('[data-project-tab]').forEach(button=>button.classList.toggle('on',button.dataset.projectTab===tab));
  $$('[data-project-panel]').forEach(panel=>panel.hidden=panel.dataset.projectPanel!==tab);
}
function renderProjectOverview(project){
  const materials=visibleProjectMaterials(project.id);
  const tasks=WORK_HUB_TASKS.filter(task=>task.projectId===project.id&&canCurrentAccountSeeWorkItem(task));
  const meetings=WORK_HUB_MEETINGS.filter(meeting=>meeting.projectId===project.id&&canCurrentAccountSeeWorkItem(meeting));
  const unfinished=tasks.filter(task=>task.status!=='ready');
  const taskRows=unfinished.slice(0,3).map(task=>{const owner=AI_HUOKE_MEMBERS.find(member=>member.accountId===task.ownerAccountId);return '<div class="project-row"><b>'+safeText(task.title)+'</b><small>负责人 '+safeText(owner?.name||'待分配')+' · 截止 '+safeText(task.dueAt||'待确认')+' · 来源 '+safeText(task.sourceMeetingId||task.sourceConflictId||'人工创建')+' · '+safeText(task.status)+'</small></div>';}).join('')||'<p class="mini">暂无待办</p>';
  const blocker=project.conflictId?'<div class="project-row"><b>报价口径冲突</b><small>员工自主判断 · 保留两个版本</small></div>':'<p class="mini">暂无待处理阻塞</p>';
  const meetingRows=meetings.slice(0,1).map(meeting=>'<div class="project-row"><b>'+safeText(meeting.name)+'</b><small>'+safeText(meeting.summary)+' · '+safeText(meeting.intent?.level||'待分析')+' · '+(meeting.actionItems?.length||0)+' 个行动项</small><button class="btn sm" data-act="open-project-meeting" data-meeting-id="'+meeting.id+'" data-project-id="'+project.id+'">查看完整纪要</button></div>').join('')||'<p class="mini">暂无关联会议</p>';
  const visibilityLabel={project:'全项目可见',selected_members:'指定成员',private:'仅自己'};
  const materialRows=materials.slice(0,3).map(material=>{const uploader=AI_HUOKE_MEMBERS.find(member=>member.accountId===material.ownerAccountId);return '<div class="project-row"><b>'+safeText(material.title)+'</b><small>'+safeText(material.sourceType)+' · '+safeText(uploader?.name||'未知上传者')+' · '+safeText(material.updatedAt)+' · '+safeText(visibilityLabel[material.visibility]||material.visibility)+'</small></div>';}).join('')||'<p class="mini">暂无可见资料</p>';
  return '<div class="project-metrics"><div><span>客户意向</span><b>'+safeText(WORK_HUB_CUSTOMERS.find(item=>item.id===project.customerId)?.intent||'待判断')+'</b></div><div><span>未完成待办</span><b>'+unfinished.length+'</b></div><div><span>资料</span><b>'+materials.length+'</b></div><div><span>项目成员</span><b>'+project.memberIds.length+'</b></div></div><div class="project-cockpit"><div><section class="project-panel"><h3>下一步工作</h3>'+taskRows+'</section><section class="project-panel"><h3>项目阻塞</h3>'+blocker+'</section><section class="project-panel"><h3>最新会议</h3>'+meetingRows+'</section></div><aside><section class="project-panel"><h3>AI 项目判断</h3><p>'+safeText(project.aiInsight)+'</p><span class="bdg warn">AI 推断 · 待人工判断</span></section><section class="project-panel"><h3>最近资料</h3>'+materialRows+'</section></aside></div>';
}
function renderProjectMaterials(project){return visibleProjectMaterials(project.id).map(item=>'<div class="project-row"><b>'+safeText(item.title)+'</b><small>'+safeText(item.sourceType)+' · '+safeText(item.updatedAt)+'</small></div>').join('')||'<div class="card pad">暂无可见资料。</div>';}
function renderProjectMeetings(project){return WORK_HUB_MEETINGS.filter(item=>item.projectId===project.id&&canCurrentAccountSeeWorkItem(item)).map(item=>'<div class="project-row"><b>'+safeText(item.name)+'</b><small>'+safeText(item.summary)+'</small></div>').join('')||'<div class="card pad">暂无关联会议。</div>';}
function renderProjectTasks(project){return WORK_HUB_TASKS.filter(item=>item.projectId===project.id&&canCurrentAccountSeeWorkItem(item)).map(item=>'<div class="project-row"><b>'+safeText(item.title)+'</b><small>'+safeText(item.status)+'</small></div>').join('')||'<div class="card pad">暂无项目待办。</div>';}
function renderProjectDeliverables(project){return '<div class="work-commercial-document"><b>'+safeText(project.commercialDocuments.join('、')||'暂无商业文件')+'</b></div>';}
function renderProjectMembers(project){return project.memberIds.map(accountId=>{const member=AI_HUOKE_MEMBERS.find(item=>item.accountId===accountId);return member?'<div class="project-row"><b>'+safeText(member.name)+'</b><small>'+safeText(member.roles.join('、'))+'</small></div>':'';}).join('');}
function renderWorkProjectDetail(){
  const project=WORK_HUB_PROJECTS.find(item=>item.id===workHubState.selectedProjectId),host=$('#workProjectList');
  if(!host)return;
  if(!project||!canCurrentAccountAccessProject(project)){workHubState.selectedProjectId=null;host.innerHTML='<div class="card pad">当前账号暂无可见项目。</div>';return;}
  const owner=AI_HUOKE_MEMBERS.find(member=>member.accountId===project.ownerAccountId);
  const memberAction=hasWorkHubAction('管理项目成员')?'<button class="btn sm" data-act="add-work-project-member" data-project-id="'+project.id+'">添加成员</button>':'';
  host.innerHTML='<article class="card pad"><div class="project-head"><div><button class="btn sm" data-act="switch-subview" data-subview="work-projects">← 项目列表</button><h2>'+safeText(project.name)+'</h2><p>'+safeText(project.status)+' · '+safeText(WORK_HUB_CUSTOMERS.find(item=>item.id===project.customerId)?.name||'未关联客户')+' · 负责人 '+safeText(owner?.name||'待指定')+' · '+project.memberIds.length+' 名成员</p></div><div class="rowact" data-project-head-actions>'+memberAction+'</div></div><div class="project-tabs">'+PROJECT_TABS.map(([key,label])=>'<button class="project-tab" data-act="switch-work-project-tab" data-project-tab="'+key+'">'+label+'</button>').join('')+'</div><section data-project-panel="overview">'+renderProjectOverview(project)+'</section><section data-project-panel="materials">'+renderProjectMaterials(project)+'</section><section data-project-panel="meetings">'+renderProjectMeetings(project)+'</section><section data-project-panel="tasks">'+renderProjectTasks(project)+'</section><section data-project-panel="deliverables">'+renderProjectDeliverables(project)+'</section><section data-project-panel="members">'+renderProjectMembers(project)+'</section></article>';
  switchWorkProjectTab(workHubState.activeProjectTab||'overview');
}
function openWorkProject(id,tab='overview'){
  const project=WORK_HUB_PROJECTS.find(item=>item.id===id);
  if(!canCurrentAccountAccessProject(project)){toast('当前账号无权查看该项目','warn');return;}
  workHubState.selectedProjectId=id;workHubState.activeProjectTab=tab;go('workhub');switchSubview('work-projects');renderWorkProjectDetail();
}
```

Replace the project-list branch in `renderWorkHub()` so inaccessible projects never render and the creation action only appears when granted:

```js
const projectHost=document.querySelector('#workProjectList');
if(projectHost&&!workHubState.selectedProjectId){
  const projects=WORK_HUB_PROJECTS.filter(canCurrentAccountAccessProject);
  projectHost.innerHTML=projects.map(project=>{const owner=AI_HUOKE_MEMBERS.find(member=>member.accountId===project.ownerAccountId),pending=WORK_HUB_TASKS.filter(task=>task.projectId===project.id&&task.status!=='ready'&&canCurrentAccountSeeWorkItem(task)).length;return '<article class="card pad"><div class="head"><h3>'+safeText(project.name)+'</h3><span class="bdg warn">'+safeText(project.status)+'</span></div><p>'+safeText(WORK_HUB_CUSTOMERS.find(item=>item.id===project.customerId)?.name||'未关联客户')+'</p><div class="mini">负责人 '+safeText(owner?.name||'待指定')+' · '+project.memberIds.length+' 名成员 · '+pending+' 个待办 · 更新 '+safeText(project.updatedAt)+'</div><button class="btn sm" data-act="open-work-project" data-project-id="'+project.id+'">查看项目空间</button></article>';}).join('')||'<div class="card pad">当前账号暂无可见项目。</div>';
}
const createButton=document.querySelector('[data-act="create-work-project"]');
if(createButton)createButton.hidden=!hasWorkHubAction('创建项目');
```

When returning to the list via `switch-subview`, clear `workHubState.selectedProjectId` before `renderWorkHub()`; otherwise the list branch above would retain stale detail state.

`openWorkProject()` must reject inaccessible projects, render header/actions plus six panels, preserve the commercial-file/conflict UI inside overview/deliverables, and activate `overview` by default.

- [ ] **Step 6: Wire delegated actions**

```js
case 'create-work-project':openCreateWorkProject();break;
case 'advance-project-create':advanceProjectCreate(Number(el.dataset.step));break;
case 'switch-work-project-tab':switchWorkProjectTab(el.dataset.projectTab);break;
case 'add-work-project-member':openAddWorkProjectMember(el.dataset.projectId);break;
```

- [ ] **Step 7: Run tests and commit**

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: build action-first project cockpit"
```

Expected: all existing and new work-hub tests PASS.

---

### Task 3: Add material upload, processing, and ACL editing

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/index.html:601-603`
- Modify: `prototype/index.html:1687-1745`
- Modify: `prototype/index.html:3235-3285`

**Interfaces:**
- Consumes: `WORK_HUB_PROJECT_MATERIALS`, `visibleProjectMaterials(projectId)`, project renderers.
- Produces: `projectMaterialType(file)`, `setProjectMaterialFilter(kind, value)`, `openProjectMaterialUpload(projectId)`, `submitProjectMaterialUpload(projectId)`, `projectMaterialStatusLabel(material)`, enhanced `renderProjectMaterials(project)`, `openProjectMaterialPermissions(materialId)`, `saveProjectMaterialPermissions(materialId)`, `openProjectMaterialSource(materialId)`.

- [ ] **Step 1: Write a failing material workflow test**

```js
test('project materials support processing and scoped visibility',()=>{
  for(const token of ['openProjectMaterialUpload','submitProjectMaterialUpload','openProjectMaterialPermissions','saveProjectMaterialPermissions','renderProjectMaterials','projectMaterialType','projectMaterialStatusLabel','setProjectMaterialFilter','全项目可见','指定成员','仅自己','上传中','处理失败','项目理解候选','待人工确认','聊天记录']) {
    assert.match(html,new RegExp(token));
  }
  assert.match(html,/id="projectMaterialUpload"[^>]+accept="[^"]*(?:\.ppt|\.pptx)/);
  assert.match(html,/data-act="edit-project-material-permissions"/);
});
```

- [ ] **Step 2: Confirm the test fails**

```bash
node --test --test-reporter=spec \
  --test-name-pattern="project materials support" \
  prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL because upload and ACL editing do not exist.

- [ ] **Step 3: Add classification and upload UI**

```js
function projectMaterialType(file){
  const name=(file?.name||'').toLowerCase(),type=file?.type||'';
  if(isMeetingMedia(file))return 'meeting';
  if(/\.(ppt|pptx)$/.test(name))return 'ppt';
  if(/(聊天|微信|钉钉|飞书|chat)/i.test(name)||/\.(json|html)$/.test(name))return 'chat';
  if(/合同/.test(name))return 'contract';
  if(/报价/.test(name))return 'quote';
  if(/\.(png|jpe?g|webp|gif)$/.test(name)||type.startsWith('image/'))return 'image';
  if(/\.(pdf|docx?|xlsx?|csv|txt)$/.test(name))return 'document';
  return 'other';
}
function openProjectMaterialUpload(projectId){
  if(!hasWorkHubAction('上传资料')){toast('当前账号没有项目资料上传权限','warn');return;}
  const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);
  if(!canCurrentAccountAccessProject(project)){toast('当前账号无权访问该项目','warn');return;}
  const picker=(project.memberIds||[]).filter(accountId=>accountId!==getCurrentWorkAccount().id).map(accountId=>{const member=AI_HUOKE_MEMBERS.find(item=>item.accountId===accountId);return member?'<label><input type="checkbox" value="'+member.accountId+'"> '+safeText(member.name)+'</label>':'';}).join('');
  modal('上传项目资料 · '+safeText(project.name),'<input id="projectMaterialUpload" type="file" class="inp" accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.html,image/*,audio/*,video/*"><div class="field"><label>查看范围</label><select class="inp" id="projectMaterialVisibility"><option value="project">全项目可见</option><option value="selected_members">指定成员</option><option value="private">仅自己</option></select></div><div class="field"><label>指定成员</label><div id="projectMaterialMemberPicker">'+picker+'</div></div><div class="note">原型演示 · 文件不会上传到真实服务器。</div>','开始处理',()=>submitProjectMaterialUpload(projectId),true);
}
```

- [ ] **Step 4: Route media to meetings and simulate ordinary processing**

```js
function submitProjectMaterialUpload(projectId){
  const file=$('#projectMaterialUpload')?.files?.[0];
  if(!file){toast('请选择项目资料','warn');return;}
  const visibility=$('#projectMaterialVisibility')?.value||'project';
  const selectedMemberIds=$$('#projectMaterialMemberPicker input:checked').map(input=>input.value);
  if(visibility==='selected_members'&&!selectedMemberIds.length){toast('请选择至少一名成员','warn');return;}
  if(projectMaterialType(file)==='meeting'){
    if(!hasSystemAction('knowledge','上传资料')){toast('当前账号没有会议纪要上传权限','warn');return;}
    closeModal();submitWorkMeetingUpload(file,{projectId,visibility,selectedMemberIds});return;
  }
  const sourceType=projectMaterialType(file),material={id:'material-'+Date.now(),tenantId:getCurrentWorkAccount().tenantId,projectId,sourceType,sourceId:'source-'+Date.now(),title:file.name,ownerAccountId:getCurrentWorkAccount().id,visibility,selectedMemberIds,status:'processing',sourceAvailable:true,contextCandidate:null,updatedAt:'刚刚'};
  WORK_HUB_PROJECT_MATERIALS.unshift(material);closeModal();renderWorkProjectDetail();
  setTimeout(()=>{material.status=file.name.includes('失败')?'failed':'ready';material.contextCandidate=material.status==='ready'?{summary:'AI 已提取文件摘要，可用于项目判断。',status:'待人工确认'}:null;const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);if(project&&material.status==='ready'){project.aiInsight='已新增项目理解候选，请结合来源资料人工判断。';if(['quote','contract'].includes(sourceType)&&!project.commercialDocuments.includes(file.name))project.commercialDocuments.unshift(file.name);}renderWorkProjectDetail();},500);
}
```

- [ ] **Step 5: Render only authorized rows and save ACL changes**

```js
function renderProjectMaterials(project){
  const typeFilter=workHubState.projectMaterialTypeFilter||'all',statusFilter=workHubState.projectMaterialStatusFilter||'all';
  const authorized=visibleProjectMaterials(project.id);
  const rows=authorized.filter(item=>(typeFilter==='all'||item.sourceType===typeFilter)&&(statusFilter==='all'||item.status===statusFilter));
  const option=(value,label,current)=>'<option value="'+value+'" '+(value===current?'selected':'')+'>'+label+'</option>';
  const toolbar='<div class="workspace-toolbar"><select class="inp" onchange="setProjectMaterialFilter(\'type\',this.value)">'+option('all','全部类型',typeFilter)+option('document','文档',typeFilter)+option('ppt','PPT',typeFilter)+option('image','图片',typeFilter)+option('chat','聊天记录',typeFilter)+option('meeting','会议',typeFilter)+'</select><select class="inp" onchange="setProjectMaterialFilter(\'status\',this.value)">'+option('all','全部状态',statusFilter)+option('processing','上传中',statusFilter)+option('ready','已完成',statusFilter)+option('failed','处理失败',statusFilter)+'</select></div>';
  return toolbar+(rows.length?rows.map(material=>'<article class="project-material-row" data-material-id="'+material.id+'"><div><b>'+safeText(material.title)+'</b><small>'+safeText(material.sourceType)+' · '+safeText(material.updatedAt)+'</small>'+(material.contextCandidate?'<small>项目理解候选 · '+safeText(material.contextCandidate.status)+'</small>':'')+'</div><span class="bdg">'+projectMaterialStatusLabel(material)+'</span><div class="rowact"><button class="btn sm" data-act="open-project-material-source" data-material-id="'+material.id+'">查看</button>'+((material.ownerAccountId===getCurrentWorkAccount().id||hasWorkHubAction('设置材料权限'))?'<button class="btn sm" data-act="edit-project-material-permissions" data-material-id="'+material.id+'">查看权限</button>':'')+'</div></article>').join(''):'<div class="card pad">当前筛选下暂无可见项目资料。</div>');
}
function setProjectMaterialFilter(kind,value){
  if(kind==='type')workHubState.projectMaterialTypeFilter=value;
  if(kind==='status')workHubState.projectMaterialStatusFilter=value;
  renderWorkProjectDetail();
}
function projectMaterialStatusLabel(material){return ({processing:'上传中',ready:'已完成',failed:'处理失败'})[material.status]||'待处理';}
function saveProjectMaterialPermissions(materialId){
  const material=WORK_HUB_PROJECT_MATERIALS.find(item=>item.id===materialId);
  if(!material)return;
  const visibility=$('#editMaterialVisibility')?.value||material.visibility;
  const selectedMemberIds=$$('#editMaterialMembers input:checked').map(input=>input.value);
  if(visibility==='selected_members'&&!selectedMemberIds.length){toast('请选择至少一名成员','warn');return;}
  material.visibility=visibility;
  material.selectedMemberIds=selectedMemberIds;
  closeModal();renderWorkProjectDetail();toast('材料查看范围已更新','ok');
}
function openProjectMaterialPermissions(materialId){
  const material=WORK_HUB_PROJECT_MATERIALS.find(item=>item.id===materialId),project=WORK_HUB_PROJECTS.find(item=>item.id===material?.projectId);
  if(!material||!project)return;
  if(material.ownerAccountId!==getCurrentWorkAccount().id&&!hasWorkHubAction('设置材料权限')){toast('当前账号没有材料权限设置权限','warn');return;}
  const picker=project.memberIds.filter(accountId=>accountId!==material.ownerAccountId).map(accountId=>{const member=AI_HUOKE_MEMBERS.find(item=>item.accountId===accountId);return member?'<label><input type="checkbox" value="'+accountId+'" '+(material.selectedMemberIds.includes(accountId)?'checked':'')+'> '+safeText(member.name)+'</label>':'';}).join('');
  modal('材料查看权限 · '+safeText(material.title),'<select class="inp" id="editMaterialVisibility"><option value="project" '+(material.visibility==='project'?'selected':'')+'>全项目可见</option><option value="selected_members" '+(material.visibility==='selected_members'?'selected':'')+'>指定成员</option><option value="private" '+(material.visibility==='private'?'selected':'')+'>仅自己</option></select><div id="editMaterialMembers">'+picker+'</div>','保存权限',()=>saveProjectMaterialPermissions(materialId),true);
}
function openProjectMaterialSource(materialId){
  const material=WORK_HUB_PROJECT_MATERIALS.find(item=>item.id===materialId);
  if(!canCurrentAccountSeeProjectMaterial(material)){toast('当前账号无权查看该资料','warn');return;}
  if(!material?.sourceAvailable){toast('来源不可用，已保留项目操作记录','warn');return;}
  if(material.sourceType==='meeting'){openEnterpriseMeetingDetail(material.sourceId);return;}
  toast('项目资料预览为原型演示','ok');
}
```

Only the uploader or an account with `设置材料权限` sees the edit action. Hidden materials do not produce placeholders or counts.

Append this upload action to `[data-project-head-actions]` inside `renderWorkProjectDetail()` when `hasWorkHubAction('上传资料')` is true:

```js
const uploadAction=hasWorkHubAction('上传资料')?'<button class="btn pri" data-act="open-project-material-upload" data-project-id="'+project.id+'">上传资料</button>':'';
host.querySelector('[data-project-head-actions]')?.insertAdjacentHTML('beforeend',uploadAction);
```

- [ ] **Step 6: Wire actions, test, and commit**

```js
case 'open-project-material-upload':openProjectMaterialUpload(el.dataset.projectId);break;
case 'edit-project-material-permissions':openProjectMaterialPermissions(el.dataset.materialId);break;
case 'open-project-material-source':openProjectMaterialSource(el.dataset.materialId);break;
```

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: add scoped project materials"
```

Expected: PASS.

---

### Task 4: Link meeting minutes and projects in both directions

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/index.html:1235`
- Modify: `prototype/index.html:1667-1714`
- Modify: `prototype/index.html:3232-3265`

**Interfaces:**
- Consumes: existing meeting processing/detail and Tasks 2–3 project/material APIs.
- Produces: `openWorkMeetingUpload()`, `recommendMeetingProject(meeting)`, `confirmMeetingProjectLink(meetingId, projectId)`, `ensureMeetingProjectMaterialLink(meeting)`, `renderMeetingProjectLink(meeting)`, `renderProjectMeetings(project)`, `openProjectMeeting(meetingId, projectId)`, `returnToMeetingProject(projectId)`.

- [ ] **Step 1: Write failing bidirectional-link tests**

```js
test('meeting minutes select or recommend a project and deep link both ways',()=>{
  for(const token of ['openWorkMeetingUpload','recommendMeetingProject','confirmMeetingProjectLink','renderProjectMeetings','openProjectMeeting','returnToMeetingProject','待关联','AI 推荐项目','查看完整纪要','返回项目']) {
    assert.match(html,new RegExp(token));
  }
  assert.match(html,/data-act="confirm-meeting-project-link"/);
  assert.match(html,/data-act="return-to-meeting-project"/);
});
test('project meeting cards reference the meeting source',()=>{
  const links=html.match(/const WORK_HUB_PROJECT_MATERIALS=\[[\s\S]*?\];/)?.[0]||'';
  assert.match(links,/sourceType:'meeting'/);
  assert.match(links,/sourceId:'meeting-aurora-01'/);
  assert.doesNotMatch(links,/\b(?:transcript|chapters|actionItems):/);
});
```

- [ ] **Step 2: Confirm failure**

```bash
node --test --test-reporter=spec \
  --test-name-pattern="meeting minutes select|project meeting cards" \
  prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL because meeting upload has no project selection/recommendation and detail has no return action.

- [ ] **Step 3: Add the meeting upload dialog**

```js
function openWorkMeetingUpload(){
  if(!hasSystemAction('knowledge','上传资料')){toast('当前账号没有会议纪要上传权限','warn');return;}
  modal('上传会议音频 / 视频','<div class="field"><label>会议文件</label><input id="workMeetingUploadDialog" type="file" class="inp" accept="audio/*,video/*"></div><div class="field"><label>关联项目（可选）</label><select class="inp" id="workMeetingProject"><option value="">暂不选择，由 AI 推荐</option>'+WORK_HUB_PROJECTS.filter(canCurrentAccountAccessProject).map(project=>'<option value="'+project.id+'">'+safeText(project.name)+'</option>').join('')+'</select></div><div class="note">原型演示 · AI 推荐需人工确认。</div>','开始生成纪要',()=>{const file=$('#workMeetingUploadDialog')?.files?.[0];if(!file){toast('请选择会议音频或视频','warn');return;}const projectId=$('#workMeetingProject')?.value||null;closeModal();submitWorkMeetingUpload(file,{projectId,visibility:projectId?'project':'private'});},true);
}
```

Change `open-work-meeting-upload` to call `openWorkMeetingUpload()` rather than click the old hidden input.

- [ ] **Step 4: Extend processing with a pending recommendation**

```js
function createWorkMeetingItem(file,options={}){
  return {id:'meeting-'+Date.now(),tenantId:getCurrentWorkAccount().tenantId,mediaType:(file.type||'').startsWith('video/')?'video':'audio',name:file.name,status:'processing',stage:'uploaded',ownerAccountId:workHubState.currentAccountId,visibility:options.visibility||'private',selectedMemberIds:options.selectedMemberIds||[],customerId:null,projectId:options.projectId||null,projectLinkStatus:options.projectId?'linked':'pending',recommendedProjectId:null,duration:'等待识别',headline:'',summary:'文件已接收，等待提取音轨 · 原型演示',chapters:[],needs:[],objections:[],decisions:[],transcript:[],actionItems:[],nextSteps:[],openQuestions:[],intent:{level:'待分析',confidence:0,evidenceTimestamp:'',evidence:'等待生成'}};
}
function finalizeMeetingProjectLink(item){
  if(!item.projectId){
    item.recommendedProjectId=recommendMeetingProject(item)?.id||null;
    item.projectLinkStatus=item.recommendedProjectId?'recommended':'pending';
    return;
  }
  ensureMeetingProjectMaterialLink(item);
}
function recommendMeetingProject(meeting){
  const visible=WORK_HUB_PROJECTS.filter(canCurrentAccountAccessProject);
  const normalized=(meeting.name||'').toLowerCase();
  const customerMatch=visible.find(project=>project.customerId&&project.customerId===meeting.customerId);
  const titleMatch=visible.find(project=>{const customer=WORK_HUB_CUSTOMERS.find(item=>item.id===project.customerId),customerName=(customer?.name||'').toLowerCase(),projectKey=project.name.replace(/项目|经营诊断/g,'').toLowerCase();return Boolean(customerName&&normalized.includes(customerName))||Boolean(projectKey&&normalized.includes(projectKey));});
  return customerMatch||titleMatch||(visible.length===1?visible[0]:null);
}
```

Change the existing function signature to `submitWorkMeetingUpload(file,options={})`, replace its current inline meeting object with `const item=createWorkMeetingItem(file,options)`, and call `finalizeMeetingProjectLink(item)` at the end of the existing `ready` branch after summary/action fixtures are assigned.

The recommendation must not set `projectId`.

- [ ] **Step 5: Create one link only after selection/confirmation**

```js
function ensureMeetingProjectMaterialLink(meeting){
  if(!meeting.projectId||WORK_HUB_PROJECT_MATERIALS.some(item=>item.sourceType==='meeting'&&item.sourceId===meeting.id&&item.projectId===meeting.projectId))return;
  const project=WORK_HUB_PROJECTS.find(item=>item.id===meeting.projectId);
  if(!project)return;
  WORK_HUB_PROJECT_MATERIALS.unshift({id:'material-'+meeting.id,tenantId:project.tenantId,projectId:meeting.projectId,sourceType:'meeting',sourceId:meeting.id,title:meeting.name,ownerAccountId:meeting.ownerAccountId,visibility:['private','selected_members'].includes(meeting.visibility)?meeting.visibility:'project',selectedMemberIds:meeting.selectedMemberIds||[],status:meeting.stage==='ready'?'ready':'processing',sourceAvailable:true,updatedAt:'刚刚'});
}
function confirmMeetingProjectLink(meetingId,projectId){
  const meeting=WORK_HUB_MEETINGS.find(item=>item.id===meetingId);
  const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);
  if(!meeting||!canCurrentAccountSeeWorkItem(meeting)||!canCurrentAccountAccessProject(project)){toast('当前账号无法完成该项目关联','warn');return;}
  meeting.projectId=projectId;meeting.projectLinkStatus='linked';meeting.visibility='project';meeting.selectedMemberIds=[];
  ensureMeetingProjectMaterialLink(meeting);renderWorkHub();
  toast('会议纪要已同步到 '+project.name,'ok');
}
```

- [ ] **Step 6: Render meeting cards and bidirectional navigation**

```js
function renderProjectMeetings(project){
  const meetings=WORK_HUB_MEETINGS.filter(item=>item.projectId===project.id&&canCurrentAccountSeeWorkItem(item));
  return meetings.map(meeting=>'<article class="project-meeting-row"><div><b>'+safeText(meeting.name)+'</b><small>'+safeText(meeting.summary)+' · '+safeText(meeting.intent?.level||'待分析')+' · '+(meeting.actionItems?.length||0)+' 个行动项</small></div><button class="btn sm" data-act="open-project-meeting" data-meeting-id="'+meeting.id+'" data-project-id="'+project.id+'">查看完整纪要</button></article>').join('')||'<div class="card pad">暂无关联会议。</div>';
}
function openProjectMeeting(meetingId,projectId){
  const meeting=WORK_HUB_MEETINGS.find(item=>item.id===meetingId),project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);
  if(!hasSystemAction('knowledge','查看')||!canCurrentAccountSeeWorkItem(meeting)||!canCurrentAccountAccessProject(project)){toast('当前账号无权打开该会议纪要','warn');return;}
  workHubState.meetingReturnProjectId=projectId;openEnterpriseMeetingDetail(meetingId);
}
function returnToMeetingProject(projectId){
  closeModal();openWorkProject(projectId,'meetings');
}
function renderMeetingProjectLink(meeting){
  if(meeting.projectId){
    const project=WORK_HUB_PROJECTS.find(item=>item.id===meeting.projectId);
    return canCurrentAccountAccessProject(project)?'<div class="meeting-project-link"><span>已关联 '+safeText(project.name)+'</span><button class="btn sm" data-act="return-to-meeting-project" data-project-id="'+project.id+'">返回项目</button></div>':'';
  }
  if(meeting.projectLinkStatus==='recommended'&&meeting.recommendedProjectId){
    const project=WORK_HUB_PROJECTS.find(item=>item.id===meeting.recommendedProjectId);
    return project&&canCurrentAccountAccessProject(project)?'<div class="meeting-project-link"><span>AI 推荐项目 · '+safeText(project.name)+'（待确认）</span><button class="btn sm pri" data-act="confirm-meeting-project-link" data-meeting-id="'+meeting.id+'" data-project-id="'+project.id+'">确认关联</button></div>':'<div class="meeting-project-link">项目待关联</div>';
  }
  return '<div class="meeting-project-link">项目待关联</div>';
}
```

Inject `renderMeetingProjectLink(meeting)` into `openEnterpriseMeetingDetail()`. This makes a linked project navigable, shows an AI recommendation as a pending candidate with an explicit confirmation button, and keeps an unlinked meeting in `项目待关联`. Preserve summary/transcript tabs and evidence jumps.

Also change the meeting branch in `openProjectMaterialSource()` from `openEnterpriseMeetingDetail(material.sourceId)` to `openProjectMeeting(material.sourceId,material.projectId)` so the return context is retained.

- [ ] **Step 7: Wire actions, test, and commit**

```js
case 'confirm-meeting-project-link':confirmMeetingProjectLink(el.dataset.meetingId,el.dataset.projectId);break;
case 'open-project-meeting':openProjectMeeting(el.dataset.meetingId,el.dataset.projectId);break;
case 'return-to-meeting-project':returnToMeetingProject(el.dataset.projectId);break;
```

```bash
node --test --test-reporter=spec \
  --test-name-pattern="meeting|project" \
  prototype/tests/enterprise-work-hub.test.mjs
git add prototype/index.html prototype/tests/enterprise-work-hub.test.mjs
git commit -m "feat: link meeting minutes to projects"
```

Expected: existing structured-summary and long-meeting tests plus new link tests PASS.

---

### Task 5: Complete source routing, error states, and PRDs

**Files:**
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`
- Modify: `prototype/index.html:1687-1745`
- Modify: `prototype/index.html:2478-2479`
- Modify: `prototype/index.html:3235-3285`
- Modify: `prd/pages/工作中枢-项目.md`
- Modify: `prd/pages/企业大脑-会议纪要.md`
- Modify: `prd/pages/设置-权限管理.md`
- Modify: `prd/PRD_企业AI经营大脑_当前开发基线.md`

**Interfaces:**
- Consumes: Tasks 1–4 and existing `openWorkTaskDeliverable()`, `createProjectCommercialDocument()`, `openWorkCustomerProfile()`.
- Produces: `openProjectTaskList(projectId)`, `openProjectDeliverable(type, sourceId)`, enhanced `projectMaterialStatusLabel(material)`, `retryProjectMaterial(materialId)`.

- [ ] **Step 1: Write failing ownership/error tests**

```js
test('project workspace preserves task and deliverable source ownership',()=>{
  for(const token of ['openProjectTaskList','openProjectDeliverable','sourceMeetingId','projectId','营销物料 / PPT','项目 / 商业文件','客户档案 / 跟进助手']) assert.match(html,new RegExp(token));
});
test('project workspace exposes recoverable states',()=>{
  for(const token of ['sourceAvailable','来源不可用','retryProjectMaterial','data-act="retry-project-material"','项目待关联','AI 推断 · 待人工判断']) assert.match(html,new RegExp(token));
});
```

- [ ] **Step 2: Confirm failure**

```bash
node --test --test-reporter=spec \
  --test-name-pattern="source ownership|recoverable states" \
  prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Route task and deliverable views to their sources**

```js
function openProjectTaskList(projectId){
  const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);
  if(!canCurrentAccountAccessProject(project)){toast('当前账号无权查看该项目待办','warn');return;}
  go('workhub');switchSubview('work-tasks');
  workHubState.selectedProjectId=projectId;
  const filter=$('#workTaskFilter');if(filter)filter.value='project';
  renderWorkTaskCenter();
}
function openProjectDeliverable(type,sourceId){
  const project=WORK_HUB_PROJECTS.find(item=>item.id===workHubState.selectedProjectId);
  if(!canCurrentAccountAccessProject(project)){toast('当前账号无权查看该项目成果','warn');return;}
  if(type==='ppt'){
    if(!hasSystemAction('content','查看')){toast('当前账号没有营销物料查看权限','warn');return;}
    const task=WORK_HUB_TASKS.find(task=>task.projectId===workHubState.selectedProjectId&&(task.resultId===sourceId||task.deliverableType==='ppt'));
    if(task){openWorkTaskDeliverable(task.id);return;}
    toast('PPT 来源不可用，已保留项目操作记录','warn');return;
  }
  if(type==='quote'||type==='contract'){
    const task=WORK_HUB_TASKS.find(item=>item.id===sourceId&&item.projectId===project.id&&item.deliverableType===type);
    if(task){openWorkTaskDeliverable(task.id);return;}
    modal('项目商业文件','<div class="state-callout">'+safeText(sourceId)+'<br>真源：项目 / 商业文件 · 原型仅展示来源元数据，不复制文件正文。</div>','返回项目',()=>{closeModal();openWorkProject(project.id,'deliverables');});return;
  }
  if(type==='script'){openWorkCustomerProfile(project.customerId);return;}
  toast('来源不可用，已保留项目操作记录','warn');
}
```

Update the `project` branch inside `renderWorkTaskCenter()` to require `task.projectId===workHubState.selectedProjectId`, not merely a truthy project ID.

Enhance `renderProjectTasks()` and `renderProjectDeliverables()` with concrete source buttons:

```js
function renderProjectTasks(project){
  const tasks=WORK_HUB_TASKS.filter(item=>item.projectId===project.id&&canCurrentAccountSeeWorkItem(item));
  return tasks.length?'<div class="rowact"><button class="btn sm" data-act="open-project-task-list" data-project-id="'+project.id+'">进入我的待办</button></div>'+tasks.slice(0,5).map(item=>'<div class="project-row"><b>'+safeText(item.title)+'</b><small>'+safeText(item.status)+' · '+safeText(item.sourceMeetingId||'人工创建')+'</small></div>').join(''):'<div class="card pad">暂无项目待办。</div>';
}
function renderProjectDeliverables(project){
  const pptTask=WORK_HUB_TASKS.find(item=>item.projectId===project.id&&item.deliverableType==='ppt');
  const ppt=pptTask?'<article class="work-commercial-document"><div><b>增长方案 PPT</b><small>真源：营销物料 / PPT</small></div><button class="btn sm" data-act="open-project-deliverable" data-deliverable-type="ppt" data-source-id="'+safeText(pptTask.resultId||pptTask.id)+'">打开</button></article>':'';
  const commercial=project.commercialDocuments.map(item=>{const type=/合同/.test(item)?'contract':'quote';return '<article class="work-commercial-document"><div><b>'+safeText(item)+'</b><small>真源：项目 / 商业文件</small></div><button class="btn sm" data-act="open-project-deliverable" data-deliverable-type="'+type+'" data-source-id="'+safeText(item)+'">打开</button></article>';}).join('');
  const commercialTasks=WORK_HUB_TASKS.filter(item=>item.projectId===project.id&&['quote','contract'].includes(item.deliverableType)).map(item=>'<article class="work-commercial-document"><div><b>'+safeText(item.title)+'</b><small>真源：项目 / 商业文件 · '+safeText(item.status)+'</small></div><button class="btn sm" data-act="open-project-deliverable" data-deliverable-type="'+item.deliverableType+'" data-source-id="'+item.id+'">打开</button></article>').join('');
  const script=project.customerId?'<article class="work-commercial-document"><div><b>客户沟通话术</b><small>真源：客户档案 / 跟进助手</small></div><button class="btn sm" data-act="open-project-deliverable" data-deliverable-type="script">打开</button></article>':'';
  const createActions='<div class="rowact"><button class="btn sm" data-act="create-project-commercial-document" data-deliverable-type="quote">生成报价草稿</button><button class="btn sm" data-act="create-project-commercial-document" data-deliverable-type="contract">生成合同草稿</button></div>';
  return createActions+renderProjectConflict(project)+ppt+commercial+commercialTasks+script;
}
function renderProjectConflict(project){
  const conflict=WORK_HUB_CONFLICTS.find(item=>item.id===project.conflictId);
  if(!conflict)return '';
  return '<section class="project-panel"><div class="head"><h3>项目冲突 · '+(conflict.status==='open'?'待员工判断':'已处理')+'</h3><span class="bdg '+(conflict.status==='open'?'warn':'ok')+'">'+safeText(conflict.status)+'</span></div><div class="permline"><span class="perm limit">'+safeText(conflict.left)+'</span><span>vs</span><span class="perm safe">'+safeText(conflict.right)+'</span></div><div class="rowact"><button class="btn sm" data-act="resolve-work-conflict" data-conflict-id="'+conflict.id+'" data-resolution="adopt">采纳老板要求</button><button class="btn sm" data-act="resolve-work-conflict" data-conflict-id="'+conflict.id+'" data-resolution="keep">保留原方案并说明</button><button class="btn sm" data-act="resolve-work-conflict" data-conflict-id="'+conflict.id+'" data-resolution="consult">发起协商</button></div></section>';
}
```

Keep the existing `createProjectCommercialDocument()` and `resolveWorkProjectConflict()` handlers as the single mutation paths. Generation still creates a task in “我的待办”; the project page only exposes the entry and current status.

Enhance `openProjectMaterialSource()` in this task so cross-module targets recheck their own permission:

```js
function openProjectMaterialSource(materialId){
  const material=WORK_HUB_PROJECT_MATERIALS.find(item=>item.id===materialId);
  if(!canCurrentAccountSeeProjectMaterial(material)){toast('当前账号无权查看该资料','warn');return;}
  if(!material.sourceAvailable){toast('来源不可用，已保留项目操作记录','warn');return;}
  if(material.sourceType==='meeting'){openProjectMeeting(material.sourceId,material.projectId);return;}
  if(material.sourceType==='ppt'){
    if(!hasSystemAction('content','查看')){toast('当前账号没有营销物料查看权限','warn');return;}
    go('marketing-materials');switchSubview('material-ppt',document.querySelector('[data-subview="material-ppt"]'));return;
  }
  if(['quote','contract'].includes(material.sourceType)){openWorkProject(material.projectId,'deliverables');return;}
  modal('项目资料 · '+safeText(material.title),'<div class="state-callout">文件预览为原型演示。项目只保存来源关系与权限元数据，不复制文件正文。</div>','关闭',closeModal);
}
```

- [ ] **Step 4: Add unavailable and retryable material states**

```js
WORK_HUB_PROJECT_MATERIALS.push({id:'material-archived-source',tenantId:'tenant-weiran',projectId:'proj-growth',sourceType:'document',sourceId:'archived-brief',title:'旧版需求说明.docx',ownerAccountId:'acct-boss',visibility:'project',selectedMemberIds:[],status:'ready',sourceAvailable:false,updatedAt:'8月29日 11:00'});
function projectMaterialStatusLabel(material){
  if(!material.sourceAvailable)return '来源不可用';
  return ({processing:'上传中',ready:'已完成',failed:'处理失败'})[material.status]||'待处理';
}
function retryProjectMaterial(materialId){
  const material=WORK_HUB_PROJECT_MATERIALS.find(item=>item.id===materialId);
  if(!material||!material.sourceAvailable){toast('来源不可用，无法重试','warn');return;}
  material.status='processing';renderWorkProjectDetail();
  setTimeout(()=>{material.status='ready';renderWorkProjectDetail();},450);
}
function renderProjectMaterialActions(material){
  const view='<button class="btn sm" data-act="open-project-material-source" data-material-id="'+material.id+'">查看</button>';
  const retry=material.status==='failed'&&material.sourceAvailable?'<button class="btn sm" data-act="retry-project-material" data-material-id="'+material.id+'">重试</button>':'';
  const permission=material.ownerAccountId===getCurrentWorkAccount().id||hasWorkHubAction('设置材料权限')?'<button class="btn sm" data-act="edit-project-material-permissions" data-material-id="'+material.id+'">查看权限</button>':'';
  return '<div class="rowact">'+view+retry+permission+'</div>';
}
```

Replace the inline action group in `renderProjectMaterials()` with `renderProjectMaterialActions(material)`. When simulated processing fails, also set `material.errorReason='模拟解析失败，请重试'` and render that reason only for accounts that already passed `canCurrentAccountSeeProjectMaterial()`. An unavailable item may show its authorized title and state, but never cached body content.

- [ ] **Step 5: Replace page PRD stubs with approved contracts**

Use concrete text in `prd/pages/工作中枢-项目.md`:

```markdown
## 用户流程

创建项目 → 选择客户和成员 → 进入项目总览 → 上传资料
→ 按类型处理并更新项目理解候选 → 查看会议/待办/成果
→ 从项目跳转到各自真源 → 返回项目继续执行。

## 状态与权限

项目访问先校验 tenantId、工作中枢模块权限和 all/team_self/self 数据范围；
材料内容再校验 project/selected_members/private。无权限时不返回标题、摘要、正文或受限数量。
```

Also update:

- `企业大脑-会议纪要.md`: direct selection, AI recommendation requiring confirmation, pending-link state, and return navigation.
- `设置-权限管理.md`: work-hub action registry and the existing data-scope mapping.
- Current baseline PRD: one concise unified-project-space paragraph.
- `PAGE_PRD_CONTENT['work-projects']`: concrete fields, actions, flows, logs, exceptions, acceptance, and technical notes matching the Markdown PRD.

- [ ] **Step 6: Wire remaining actions**

```js
case 'open-project-task-list':openProjectTaskList(el.dataset.projectId);break;
case 'open-project-deliverable':openProjectDeliverable(el.dataset.deliverableType,el.dataset.sourceId);break;
case 'retry-project-material':retryProjectMaterial(el.dataset.materialId);break;
```

- [ ] **Step 7: Run suites, diff check, and commit**

```bash
node --test --test-reporter=spec \
  prototype/tests/enterprise-work-hub.test.mjs \
  prototype/tests/ai-huoke-system-management.test.mjs
git diff --check
git add prototype/index.html \
  prototype/tests/enterprise-work-hub.test.mjs \
  prd/pages/工作中枢-项目.md \
  prd/pages/企业大脑-会议纪要.md \
  prd/pages/设置-权限管理.md \
  prd/PRD_企业AI经营大脑_当前开发基线.md
git commit -m "feat: complete project workspace flow"
```

Expected: PASS and no whitespace errors.

---

### Task 6: Add real-browser coverage and complete verification

**Files:**
- Modify: `prototype/scripts/capture-enterprise-work-hub.mjs`
- Modify: `prototype/tests/enterprise-work-hub.test.mjs`

**Interfaces:**
- Consumes: all public workspace functions and controls from Tasks 1–5.
- Produces: desktop/mobile evidence for creation, A1 cockpit, material ACLs, meeting links, return navigation, account differences, RBAC registration, console safety, and layout safety.

- [ ] **Step 1: Write a failing capture contract**

```js
test('work hub browser capture covers unified project workspace states',()=>{
  for(const state of ['project-list','project-create','project-cockpit','project-materials','project-material-permission','project-meeting-recommendation','project-meeting-link','project-meeting-return','project-account-visibility','workhub-permission-module']) {
    assert.match(capture,new RegExp(state));
  }
});
```

- [ ] **Step 2: Confirm failure**

```bash
node --test --test-reporter=spec \
  --test-name-pattern="browser capture covers unified" \
  prototype/tests/enterprise-work-hub.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Add real interaction audits**

Add after the current customer/meeting states:

```js
await evaluate(`setWorkHubAccount('acct-boss');go('workhub');switchSubview('work-projects');renderWorkHub()`);
audits['project-list']=await screenshot('project-list');

await evaluate(`document.querySelector('[data-act="create-work-project"]')?.click()`);
const createProject=await evaluate(`(() => ({open:document.querySelector('#mask')?.classList.contains('show'),title:document.querySelector('#modalTitle')?.textContent||'',members:document.querySelectorAll('[data-new-project-member]').length}))()`);
if(!createProject.open||!createProject.title.includes('创建项目')||createProject.members<1)throw Error('project create audit failed: '+JSON.stringify(createProject));
audits['project-create']=await screenshot('project-create');

await evaluate(`closeModal();openWorkProject('proj-growth','overview')`);
const cockpit=await evaluate(`(() => {const text=document.querySelector('#workProjectList')?.textContent||'';return{tabs:document.querySelectorAll('[data-project-tab]').length,next:text.includes('下一步工作'),blockers:text.includes('项目阻塞'),meeting:text.includes('最新会议'),ai:text.includes('AI 项目判断')}})()`);
if(cockpit.tabs!==6||!cockpit.next||!cockpit.blockers||!cockpit.meeting||!cockpit.ai)throw Error('project cockpit audit failed: '+JSON.stringify(cockpit));
audits['project-cockpit']=await screenshot('project-cockpit');
```

Then:

1. Click materials and capture `project-materials`.
2. Open ACL editor and capture `project-material-permission`.
3. Submit an in-browser `File` named `极光客户评审.mp3` without a `projectId`, wait for the ready stage, open the detail, assert the UI says `AI 推荐项目 · 极光科技增长项目（待确认）`, and capture `project-meeting-recommendation`.
4. Click `确认关联`; assert exactly one meeting `ProjectMaterialLink` exists, then open the linked meeting from the project and capture `project-meeting-link`.
5. Click return and verify the meetings tab before `project-meeting-return`.
6. Switch to employee, capture the visible material count, and assert neither `客户预算底稿.xlsx` nor `老板内部报价底线.docx` appears in the DOM or count before `project-account-visibility`.
7. Open the administrator role editor and assert “工作中枢” plus six actions before `workhub-permission-module`.

- [ ] **Step 4: Run all automated tests**

```bash
node --test --test-reporter=dot prototype/tests/*.test.mjs
git diff --check
```

Expected: all tests PASS.

- [ ] **Step 5: Run focused desktop/mobile browser verification**

```bash
codex-verify --focus enterprise-work-hub --browser
```

Expected: focused tests, served-source hash, 1440×900, 390×844, console, modal-bounds, and overflow audits all PASS.

If managed Chromium is blocked by the macOS sandbox, keep the browser in a foreground terminal and reuse its CDP port:

```bash
/Users/xinwei/.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell \
  --headless --remote-debugging-port=9228 \
  --user-data-dir=/private/tmp/ai-huoke-project-space-chrome \
  http://127.0.0.1:8010/index.html
codex-verify --focus enterprise-work-hub --browser --port 9228
```

- [ ] **Step 6: Inspect representative screenshots manually**

Inspect:

```text
validation/enterprise-work-hub/project-cockpit-1440x900.png
validation/enterprise-work-hub/project-material-permission-1440x900.png
validation/enterprise-work-hub/project-meeting-link-1440x900.png
validation/enterprise-work-hub/project-cockpit-390x844.png
validation/enterprise-work-hub/project-account-visibility-390x844.png
```

Confirm tabs are reachable, actions do not overlap, rows wrap, modals stay within the viewport, and restricted material titles/counts do not appear for the employee account.

- [ ] **Step 7: Commit browser coverage**

```bash
git add prototype/scripts/capture-enterprise-work-hub.mjs \
  prototype/tests/enterprise-work-hub.test.mjs
git commit -m "test: verify unified project workspace"
```

- [ ] **Step 8: Run final full verification**

```bash
codex-verify --full
```

Expected: all prototype tests PASS, served `prototype/index.html` hash matches the source, both viewports PASS, and no console/overflow/layout failure remains.

If the sandbox blocks managed Chromium, reuse the already running CDP browser:

```bash
codex-verify --full --port 9228
```

- [ ] **Step 9: Open final preview**

```bash
codex-preview --route workhub-projects
```

Expected: preflight reports a non-empty DOM and matching source hash, then opens the project workspace in the normal browser profile.

- [ ] **Step 10: Preserve verification artifacts outside the worktree and confirm final status**

If `validation/` is not ignored, move this run's evidence to a timestamped directory under `/private/tmp` rather than deleting it. Then run:

```bash
git status --short --branch
git log -6 --oneline
```

Expected: only intentional commits are present and no unrelated or generated files are staged.
