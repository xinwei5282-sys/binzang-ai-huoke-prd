import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
const html = readFileSync(resolve('prototype/index.html'),'utf8');
const capture = readFileSync(resolve('prototype/scripts/capture-enterprise-work-hub.mjs'),'utf8');
const fullCapture = readFileSync(resolve('prototype/scripts/capture-v1-prototype.mjs'),'utf8');
function sliceBetween(startToken,endToken){const start=html.lastIndexOf(startToken),end=html.indexOf(endToken,start);return html.slice(start,end<0?html.length:end);}
test('project materials support processing and scoped visibility',()=>{
 for(const token of ['openProjectMaterialUpload','submitProjectMaterialUpload','openProjectMaterialPermissions','saveProjectMaterialPermissions','renderProjectMaterials','projectMaterialType','projectMaterialStatusLabel','setProjectMaterialFilter','全项目可见','指定成员','仅自己','上传中','处理失败','项目理解候选','待人工确认','聊天记录'])assert.match(html,new RegExp(token));
 assert.match(html,/id="projectMaterialUpload"[^>]+accept="[^"]*(?:\.ppt|\.pptx)/);assert.match(html,/data-act="edit-project-material-permissions"/);
 const source=html.match(/function projectMaterialType\(file\)\{[\s\S]*?\n\}/)?.[0]||'';const projectMaterialType=Function('isMeetingMedia',`${source};return projectMaterialType;`)(file=>Boolean(file?.type?.startsWith('audio/')||file?.type?.startsWith('video/')));
 assert.equal(projectMaterialType({name:'方案.pptx'}),'ppt');assert.equal(projectMaterialType({name:'群聊.html'}),'chat');assert.equal(projectMaterialType({name:'会议.mp4',type:'video/mp4'}),'meeting');
});
test('material renderer only exposes authorized rows and delegates permission-aware actions',()=>{const source=html.match(/function renderProjectMaterials\(project\)\{[\s\S]*?\n\}/)?.[0]||'',actions=sliceBetween('function renderProjectMaterialActions','renderWorkHub();');for(const token of ['visibleProjectMaterials','projectMaterialTypeFilter','projectMaterialStatusFilter','projectMaterialStatusLabel','renderProjectMaterialActions','errorReason'])assert.match(source,new RegExp(token));for(const token of ['canCurrentAccountSeeProjectMaterial','设置材料权限','open-project-material-source','edit-project-material-permissions','retry-project-material'])assert.match(actions,new RegExp(token));assert.doesNotMatch(html,/PROJECT_.*CONTRACT|renderWorkHubLegacy|renderProjectOverviewContract/);});
test('material ACL and source paths enforce real permission branches',()=>{
 const permissions=sliceBetween('function openProjectMaterialPermissions','function renderProjectMeetings'),save=sliceBetween('function saveProjectMaterialPermissions','function openProjectMaterialSource'),source=sliceBetween('function openProjectMaterialSource','function renderProjectMeetings'),upload=sliceBetween('function submitProjectMaterialUpload','function renderProjectMaterials'),meetingCreate=sliceBetween('function createWorkMeetingItem','function finalizeMeetingProjectLink'),meetingUpload=sliceBetween('function submitWorkMeetingUpload','function retryWorkMeetingParsing'),renderer=sliceBetween('function renderProjectMaterials','function openProjectMaterialPermissions');
 for(const token of ['editMaterialMembers','selectedMemberIds','checked'])assert.match(permissions,new RegExp(token));
 for(const token of ['设置材料权限','canCurrentAccountAccessProject','editMaterialMembers','selected_members'])assert.match(save,new RegExp(token));
 assert.match(source,/sourceAvailable/);assert.match(upload,/hasSystemAction\('knowledge','上传资料'\)/);assert.match(upload,/submitWorkMeetingUpload\(file,\{projectId,visibility,selectedMemberIds\}\)/);
 for(const token of ['options={}','tenantId:getCurrentWorkAccount().tenantId','options.projectId','options.visibility','options.selectedMemberIds'])assert.match(meetingCreate,new RegExp(token.replace(/[{}()]/g,'\\$&')));assert.match(meetingUpload,/createWorkMeetingItem\(file,options\)/);assert.match(meetingUpload,/finalizeMeetingProjectLink\(item\)/);assert.match(renderer,/data-material-id=/);
});
test('meeting minutes link to projects only after explicit confirmation',()=>{for(const token of ['openWorkMeetingUpload','recommendMeetingProject','confirmMeetingProjectLink','renderMeetingProjectLink','openProjectMeeting','returnToMeetingProject','AI 推荐项目','待关联','返回项目'])assert.match(html,new RegExp(token));assert.match(html,/data-act="confirm-meeting-project-link"/);assert.match(html,/data-act="return-to-meeting-project"/);const links=html.match(/const WORK_HUB_PROJECT_MATERIALS=\[[\s\S]*?\];/)?.[0]||'';assert.doesNotMatch(links,/transcript|chapters|actionItems/);});
test('project task entry keeps an exact selected-project filter',()=>{
 const renderer=sliceBetween('function renderWorkTaskCenter','function confirmWorkTask'),entry=sliceBetween('function openProjectTaskList','function openProjectDeliverable'),projectTasks=sliceBetween('function renderProjectTasks','function renderProjectDeliverables');
 assert.match(renderer,/f==='project'\?t\.projectId===workHubState\.selectedProjectId/);
 for(const token of ["workHubState.selectedProjectId=projectId","workHubState.taskFilter='project'","filter.value='project'","switchSubview('work-tasks')"])assert.match(entry,new RegExp(token.replace(/[.()']/g,'\\$&')));
 assert.match(projectTasks,/data-act="open-project-task-list"/);assert.match(projectTasks,/workTaskSourceLabel/);assert.match(projectTasks,/进入我的待办/);
});
test('failed project material retry is authorized, recoverable and preserves unavailable sources',()=>{
 const retrySource=sliceBetween('function retryProjectMaterial','function renderProjectMaterialActions'),materials=[{id:'failed',status:'failed',sourceAvailable:true,errorReason:'解析失败'},{id:'archived',status:'ready',sourceAvailable:false}],messages=[];
 const retry=Function('WORK_HUB_PROJECT_MATERIALS','canCurrentAccountSeeProjectMaterial','toast','renderWorkProjectDetail','setTimeout',`${retrySource};return retryProjectMaterial;`)(materials,()=>true,(message)=>messages.push(message),()=>{},callback=>callback());
 retry('failed');assert.equal(materials[0].status,'ready');assert.equal(materials[0].errorReason,null);assert.equal(materials[0].contextCandidate.status,'待人工确认');
 retry('archived');assert.equal(materials[1].status,'ready');assert.match(messages.at(-1),/来源不可用/);
 const labelSource=sliceBetween('function projectMaterialStatusLabel','function projectMaterialVisibilityLabel'),label=Function(`${labelSource};return projectMaterialStatusLabel;`)();assert.equal(label(materials[1]),'来源不可用');
});
test('project sources and deliverables route by owning module after permission checks',()=>{
 const source=sliceBetween('function openProjectMaterialSource','function openWorkMeetingUpload'),deliverable=sliceBetween('function openProjectDeliverable','function retryProjectMaterial'),renderer=sliceBetween('function renderProjectDeliverables','function renderProjectMembers');
 for(const token of ['canCurrentAccountSeeProjectMaterial','canCurrentAccountAccessProject','hasSystemAction','openProjectMeeting',"go('marketing-materials')",'openProjectDeliverable','资料来源'])assert.match(source,new RegExp(token.replace(/[()']/g,'\\$&')));
 for(const token of ["type==='ppt'","type==='script'","['quote','contract']","openWorkTaskDeliverable","openWorkCustomerProfile","成果来源不可用"])assert.match(deliverable,new RegExp(token.replace(/[()'\[\]]/g,'\\$&')));
 for(const token of ['进入 PPT 生成','查看交付物','进入跟进助手','project.commercialDocuments','workTaskSourceLabel'])assert.match(renderer,new RegExp(token));
});
test('project workspace PRDs define source ownership permissions recovery and routing',()=>{
 const project=readFileSync(resolve('prd/pages/工作中枢-项目.md'),'utf8'),meeting=readFileSync(resolve('prd/pages/企业大脑-会议纪要.md'),'utf8'),permission=readFileSync(resolve('prd/pages/设置-权限管理.md'),'utf8'),baseline=readFileSync(resolve('prd/PRD_企业AI经营大脑_当前开发基线.md'),'utf8');
 for(const token of ['材料由上传账号拥有','selectedProjectId','sourceAvailable=false','PPT 跳转营销物料','不要求老板审批'])assert.match(project,new RegExp(token));
 for(const token of ['recommendedProjectId','重复确认不重复建材料','正文真源仍属于会议纪要'])assert.match(meeting,new RegExp(token));
 for(const token of ['项目空间复用系统权限','材料 ACL 是内容层约束','目标模块的查看权限'])assert.match(permission,new RegExp(token));
 for(const token of ['项目空间协作与来源基线','项目待办跳转携带','失败保留 `errorReason`','不设置老板审批门'])assert.match(baseline,new RegExp(token));
});
test('meeting project recommendation remains pending until confirmation and material linking is idempotent',()=>{
 const recommend=sliceBetween('function recommendMeetingProject','function ensureMeetingProjectMaterialLink'),ensure=sliceBetween('function ensureMeetingProjectMaterialLink','function confirmMeetingProjectLink'),confirm=sliceBetween('function confirmMeetingProjectLink','function renderMeetingProjectLink'),finalize=sliceBetween('function finalizeMeetingProjectLink','function submitWorkMeetingUpload');
 const projects=[{id:'proj-growth',name:'极光科技增长项目',customerId:'cust-aurora',tenantId:'tenant-weiran'}],customers=[{id:'cust-aurora',name:'极光科技'}],materials=[],meetings=[];
 const api=Function('WORK_HUB_PROJECTS','WORK_HUB_CUSTOMERS','WORK_HUB_PROJECT_MATERIALS','WORK_HUB_MEETINGS','canCurrentAccountAccessProject','canCurrentAccountSeeWorkItem','toast','renderWorkHub',`${recommend}\n${ensure}\n${confirm}\n${finalize}\nreturn {recommendMeetingProject,ensureMeetingProjectMaterialLink,confirmMeetingProjectLink,finalizeMeetingProjectLink};`)(projects,customers,materials,meetings,()=>true,()=>true,()=>{},()=>{});
 const pending={id:'meeting-pending',name:'极光科技复盘.mp4',projectId:null,projectLinkStatus:'pending',recommendedProjectId:null,ownerAccountId:'acct-boss',visibility:'private',selectedMemberIds:[],stage:'ready'};meetings.push(pending);api.finalizeMeetingProjectLink(pending);assert.equal(pending.projectId,null);assert.equal(pending.projectLinkStatus,'recommended');assert.equal(pending.recommendedProjectId,'proj-growth');assert.equal(materials.length,0);
 const linked={id:'meeting-linked',name:'已选项目会议.mp4',projectId:'proj-growth',projectLinkStatus:'linked',ownerAccountId:'acct-boss',visibility:'project',selectedMemberIds:[],stage:'ready'};api.finalizeMeetingProjectLink(linked);api.finalizeMeetingProjectLink(linked);assert.equal(materials.filter(item=>item.sourceId==='meeting-linked').length,1);
 api.confirmMeetingProjectLink('meeting-pending','proj-growth');api.confirmMeetingProjectLink('meeting-pending','proj-growth');assert.equal(pending.projectLinkStatus,'linked');assert.equal(pending.projectId,'proj-growth');assert.equal(materials.filter(item=>item.sourceId==='meeting-pending').length,1);
 const meetingDetail=sliceBetween('function openEnterpriseMeetingDetail','function confirmMeetingActionItems'),materialSource=sliceBetween('function openProjectMaterialSource','function openWorkMeetingUpload');assert.match(meetingDetail,/renderMeetingProjectLink\(meeting\)/);assert.match(materialSource,/openProjectMeeting\(material\.sourceId,material\.projectId\)/);
});
test('project function slices preserve complete workflow contracts',()=>{
 const create=sliceBetween('function openCreateWorkProject','function showProjectCreateStep'),advance=sliceBetween('function advanceProjectCreate','function saveWorkProject'),hub=sliceBetween('function renderWorkHub','function openWorkCustomerProfile'),overview=sliceBetween('function renderProjectOverview','function renderProjectMaterials'),detail=sliceBetween('function renderWorkProjectDetail','function openAddWorkProjectMember'),list=sliceBetween('function renderWorkProjectList','function openWorkTaskDeliverable');
 for(const token of ['WORK_HUB_CUSTOMERS.map','project-create-progress','项目名称','关联客户','项目状态','项目负责人','项目成员','data-step="1"','data-step="2"','data-step="3"'])assert.match(create,new RegExp(token));assert.match(advance,/newProjectName/);assert.match(advance,/newProjectOwner/);
 assert.match(hub,/renderWorkProjectList/);assert.match(hub,/renderWorkProjectDetail/);assert.doesNotMatch(hub,/WORK_HUB_PROJECTS\.map/);assert.match(hub,/createButton\.hidden/);assert.match(hub,/hasWorkHubAction\('创建项目'\)/);
 for(const token of ['客户意向','负责人','sourceMeetingId','sourceConflictId','open-project-meeting','intent','actionItems','visibilityLabel','ownerAccountId','AI 推断','待人工判断','renderProjectConflict'])assert.match(overview,new RegExp(token));
 for(const token of ['memberAction=hasWorkHubAction','关联客户','负责人','成员','return-work-project-list','role=','tab','tabpanel'])assert.match(detail,new RegExp(token));
 assert.ok(list.includes('WORK_HUB_PROJECTS.filter(canCurrentAccountAccessProject)'));for(const token of ['ownerAccountId','customerId','memberIds','pending','updatedAt'])assert.match(list,new RegExp(token));assert.match(html,/data-act="return-work-project-list"/);
 assert.doesNotMatch(html,/PROJECT_CREATE_FIELDS|PROJECT_CREATE_PROGRESS|PROJECT_DETAIL_CONTRACT|PROJECT_LIST_CONTRACT|renderProjectOverviewContract|renderWorkHubLegacy/);
});
test('project access and material ACL are separate contracts',()=>{for(const token of ['WORK_HUB_PROJECT_MEMBERS','WORK_HUB_PROJECT_MATERIALS','currentSystemActions','hasSystemAction','currentWorkDataScope','currentWorkHubActions','hasWorkHubAction','canCurrentAccountAccessProject','canCurrentAccountSeeProjectMaterial','visibleProjectMaterials','selectedMemberIds','createdByAccountId','role.dataScope'])assert.match(html,new RegExp(token));for(const visibility of ['project','selected_members','private'])assert.match(html,new RegExp(`visibility:'${visibility}'`));});
test('project workspace creates projects and exposes the A1 cockpit',()=>{for(const token of ['openCreateWorkProject','showProjectCreateStep','advanceProjectCreate','saveWorkProject','renderWorkProjectDetail','switchWorkProjectTab','openAddWorkProjectMember','saveWorkProjectMembers','data-project-create-step="1"','data-project-create-step="2"','data-project-create-step="3"','PROJECT_TABS','data-project-panel="overview"','data-project-panel="materials"','data-project-panel="meetings"','data-project-panel="tasks"','data-project-panel="deliverables"','data-project-panel="members"','下一步工作','项目阻塞','最新会议','AI 项目判断','最近资料'])assert.match(html,new RegExp(token));assert.match(html,/data-act="create-work-project"/);assert.match(html,/data-act="add-work-project-member"/);});
test('project cockpit keeps one detail implementation and preserves commercial actions',()=>{assert.equal((html.match(/function openWorkProject\(/g)||[]).length,1);assert.doesNotMatch(html,/openLegacyWorkProject/);assert.match(html,/id="newProjectName"/);assert.match(html,/id="newProjectCustomer"/);assert.match(html,/id="newProjectStatus"/);assert.match(html,/id="newProjectOwner"/);assert.match(html,/WORK_HUB_PROJECT_MEMBERS\.splice/);assert.match(html,/data-deliverable-type="quote"/);assert.match(html,/data-deliverable-type="contract"/);assert.match(html,/function renderProjectConflict/);assert.match(html,/renderProjectConflict\(project\)/);assert.match(html,/selectedProjectId=null/);assert.match(html,/aria-selected/);});
test('project actions have paired handlers and delivery routing',()=>{for(const name of ['openWorkTaskDeliverable','returnToWorkProjectList','openWorkProject','switchWorkProjectTab'])assert.match(html,new RegExp(`function ${name}\\(`));assert.match(html,/case 'open-work-task-deliverable'/);assert.match(html,/case 'return-work-project-list'/);assert.match(html,/renderWorkProjectList/);assert.match(html,/WORK_HUB_CUSTOMERS\.map/);assert.match(html,/data-conflict-resolution="(?:adopt|keep|consult)"/);});

test('authorization behavior enforces tenant, scope, membership and material visibility',()=>{
  const start=html.indexOf("const WORK_HUB_ACCOUNT_TEMPLATES=");
  const end=html.indexOf('function renderWorkHomeSummaries',start);
  const source=html.slice(start,end)+`\nreturn {WORK_HUB_ACCOUNT_TEMPLATES,WORK_HUB_PROJECTS,WORK_HUB_PROJECT_MATERIALS,workHubState,currentWorkDataScope,canCurrentAccountAccessProject,canCurrentAccountSeeProjectMaterial,visibleProjectMaterials};`;
  const roleGrants={管理员:{dataScope:'all',grants:{workhub:['查看项目']}},运营编辑:{dataScope:'team_self',grants:{workhub:['查看项目']}}};
  const auth=Function('AI_HUOKE_MEMBERS','AI_HUOKE_ROLE_GRANTS',source)([
    {accountId:'acct-boss',tenantId:'tenant-weiran',roles:['管理员']},{accountId:'acct-employee-lin',tenantId:'tenant-weiran',roles:['运营编辑']}
  ],roleGrants);
  const growth=auth.WORK_HUB_PROJECTS.find(project=>project.id==='proj-growth');
  const ops=auth.WORK_HUB_PROJECTS.find(project=>project.id==='proj-ops');
  auth.workHubState.currentAccountId='acct-boss';
  assert.equal(auth.currentWorkDataScope(),'all'); assert.equal(auth.canCurrentAccountAccessProject(growth),true); assert.equal(auth.canCurrentAccountAccessProject(ops),true);
  auth.workHubState.currentAccountId='acct-employee-lin';
  assert.equal(auth.currentWorkDataScope(),'team_self'); assert.equal(auth.canCurrentAccountAccessProject(growth),true); assert.equal(auth.canCurrentAccountAccessProject(ops),false);
  const projectMaterial=auth.WORK_HUB_PROJECT_MATERIALS.find(item=>item.visibility==='project');
  const selected=auth.WORK_HUB_PROJECT_MATERIALS.find(item=>item.visibility==='selected_members'&&item.ownerAccountId==='acct-boss');
  const privateMaterial=auth.WORK_HUB_PROJECT_MATERIALS.find(item=>item.visibility==='private');
  assert.equal(auth.canCurrentAccountSeeProjectMaterial(projectMaterial),true); assert.equal(auth.canCurrentAccountSeeProjectMaterial(selected),false); assert.equal(auth.canCurrentAccountSeeProjectMaterial(privateMaterial),true);
  selected.tenantId='other-tenant'; assert.equal(auth.canCurrentAccountSeeProjectMaterial(selected),false);
  roleGrants.运营编辑.dataScope='self'; roleGrants.运营编辑.grants.workhub=[];
  assert.equal(auth.canCurrentAccountAccessProject(growth),false);
});

test('prototype inline scripts remain valid JavaScript',()=>{const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);scripts.forEach((source,index)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:`prototype-inline-${index}.js`})));});

test('work hub owns tasks customers projects and meeting minutes belongs to brain',()=>{
 assert.match(html,/data-v="workhub"/); assert.match(html,/data-p="workhub"/);
 for(const view of ['work-tasks','work-customers','work-projects']) { assert.match(html,new RegExp(`data-subview="${view}"`)); assert.match(html,new RegExp(`data-subview-panel="${view}"`)); }
 assert.match(html,/data-kbtab="memory"/); assert.match(html,/data-kbpanel="memory"/); assert.doesNotMatch(html,/data-p="tasks"/);
});
test('prototype declares controlled account and conflict contracts',()=>{
 for(const name of ['WORK_HUB_ACCOUNT_TEMPLATES','WORK_HUB_MEETINGS','WORK_HUB_CUSTOMERS','WORK_HUB_PROJECTS','WORK_HUB_TASKS','WORK_HUB_CONFLICTS']) assert.match(html,new RegExp(`const ${name}=`));
 for(const choice of ['adopt','keep','consult']) assert.match(html,new RegExp(`data-conflict-resolution="${choice}"`)); assert.match(html,/不会自动覆盖/);
});
test('meeting minutes accepts only audio and video while enterprise knowledge owns other sources',()=>{
  assert.match(html,/data-kbtab="memory">会议纪要</);
  assert.match(html,/id="workMeetingUpload"[^>]+accept="audio\/\*,video\/\*"/);
  assert.doesNotMatch(html,/id="workMeetingUpload"[^>]+(?:image\/\*|\.pdf|\.doc|\.txt)/);
  assert.match(html,/id="knowledgeSourceUpload"[^>]+accept="image\/\*,\.pdf,\.doc,\.docx,\.txt"/);
  for(const label of ['上传聊天记录','上传文件资料','粘贴文本']) assert.match(html,new RegExp(label));
});
test('work hub exposes account and meeting workflows',()=>{ for(const token of ['tenantId','ownerAccountId','visibility','projectId','customerId','setWorkHubAccount','canCurrentAccountSeeWorkItem','data-work-account','workMeetingUpload','原型演示','会议证据']) assert.match(html,new RegExp(token)); });
test('meeting cards expose detail and retry controls',()=>{
  assert.match(html,/data-act="open-enterprise-meeting-detail"/);
  assert.match(html,/data-act="retry-work-meeting"/);
  assert.match(html,/解析失败/);
});
test('meeting detail presents source transcript summary decisions actions and intent',()=>{
  for(const label of ['音视频来源','说话人转写','会议总结','关键决策','行动项','客户意向']) assert.match(html,new RegExp(label));
  for(const status of ['extracting_audio','transcribing','diarizing','summarizing','ready','failed']) assert.match(html,new RegExp(`['"]${status}['"]`));
  assert.match(html,/sourceMeetingId/);
});
test('meeting detail defaults to AI summary with independently switchable transcript and long meeting progress',()=>{
  for(const token of ['data-meeting-tab="summary"','data-meeting-tab="transcript"','AI 总结','逐字稿','2:36:18','已完成 3/4','查看 AI 总结']) assert.match(html,new RegExp(token));
  assert.match(html,/data-act="switch-meeting-tab"/);assert.match(html,/data-act="seek-meeting"/);
});
test('meeting detail implementation contains real tab panels and segment progress contract',()=>{const fn=html.match(/function openEnterpriseMeetingDetail\([\s\S]*?\nfunction /)?.[0]||html;for(const token of ['data-meeting-tab="summary"','data-meeting-tab="transcript"','data-meeting-panel="summary"','data-meeting-panel="transcript"'])assert.match(fn,new RegExp(token));assert.match(html,/segmentProgress:\{total:4,completed:3,current:/);assert.match(capture,/transcriptTab/);});
test('meeting detail owns the structured summary and evidence controls',()=>{const fn=html.match(/function openEnterpriseMeetingDetail\([\s\S]*?\nfunction /)?.[0]||'';for(const token of ['meeting.chapters','meeting.needs','meeting.objections','meeting.nextSteps','meeting.openQuestions','一句话结论','章节纪要','关键需求与异议','下一步建议','未决问题与风险','data-summary-section','data-act="open-meeting-evidence"','data-transcript-time'])assert.match(fn,new RegExp(token));assert.doesNotMatch(html,/meetingSummaryObserver/);});
test('meeting detail keeps one implementation and preserves decisions actions and evidence',()=>{assert.equal((html.match(/function openEnterpriseMeetingDetail\(/g)||[]).length,1);const fn=html.match(/function openEnterpriseMeetingDetail\([\s\S]*?\nfunction /)?.[0]||'';for(const token of ['一句话结论','已确认决策','待办事项','客户意向','data-meeting-action','确认所选行动项'])assert.match(fn,new RegExp(token));for(const token of ['个分段 · 已完成','结果生成后可查看 AI 总结与逐字稿'])assert.match(html,new RegExp(token));});
test('meeting and knowledge upload routes reject files that belong in the other entry',()=>{
  const source=html.match(/function isMeetingMedia\(file\)\{[^\n]+/)?.[0]||'';
  assert.ok(source,'isMeetingMedia is missing');
  const isMeetingMedia=Function(`${source};return isMeetingMedia;`)();
  assert.equal(isMeetingMedia({name:'访谈.mp4',type:'video/mp4'}),true);
  assert.equal(isMeetingMedia({name:'录音.m4a',type:''}),true);
  assert.equal(isMeetingMedia({name:'聊天记录.png',type:'image/png'}),false);
  assert.equal(isMeetingMedia({name:'报价单.pdf',type:'application/pdf'}),false);
  assert.match(html,/function routeUnsupportedMeetingFile/);
  assert.match(html,/function routeUnsupportedKnowledgeFile/);
});
test('work hub exposes customer project task and deliverable actions',()=>{ for(const token of ['customer-followup-assistant','project-commercial-documents','openWorkCustomerProfile','generateCustomerFollowupScript','adoptCustomerFollowupScript','resolveWorkProjectConflict','renderWorkTaskCenter','openWorkTaskDeliverable','pptCreationState','studioBrief']) assert.match(html,new RegExp(token)); });
test('project quotation and contract actions create tracked deliverables',()=>{
  assert.match(html,/createProjectCommercialDocument/);
  assert.match(html,/data-deliverable-type="quote"/);
  assert.match(html,/data-deliverable-type="contract"/);
  assert.match(html,/commercialDocuments\.push/);
});
test('work hub detail rows stay readable and consultation becomes a task',()=>{
  assert.match(html,/work-customer-timeline/);
  assert.match(html,/work-commercial-document/);
  assert.match(html,/task-conflict-consult-/);
  assert.match(html,/发起项目冲突协商/);
});
test('boss and employee receive distinct home summaries',()=>{
  assert.match(html,/renderWorkHomeSummaries/);
  assert.match(html,/老板决策/);
  assert.match(html,/我的工作提醒/);
  assert.match(capture,/employee home audit failed/);
});
test('page PRDs are concrete and differentiated',()=>{for(const key of ['work-tasks','work-customers','work-projects','kb-memory']){const m=html.match(new RegExp(`['"]${key}['"]:\\{([\\s\\S]*?)\\n  [a-z-]+:`));assert.ok(m,`${key} inline PRD`);for(const field of ['overview','rules','fields','actions','flows','logs','exceptions','acceptance','tech'])assert.match(m[1],new RegExp(`${field}:\\[?[^\\n]*(?!\\[\\])`),`${key} ${field}`);}const docs=['工作中枢-我的待办.md','工作中枢-客户.md','工作中枢-项目.md','企业大脑-会议纪要.md'];for(const d of docs){const s=readFileSync(resolve('prd/pages',d),'utf8');for(const h of ['问题','目标用户','用户流程','功能规则','异常与边界','字段交互','状态与权限','数据与接口','Skill / Prompt','埋点事件','验收标准','核心指标'])assert.match(s,new RegExp(`## ${h}`),`${d} ${h}`);}});

test('work hub browser capture honors verifier arguments and audits runtime states',()=>{
  assert.match(capture,/const port\s*=\s*Number\(args\.port/);
  assert.match(capture,/const width\s*=\s*Number\(args\.width/);
  assert.match(capture,/Runtime\.consoleAPICalled/);
  assert.match(capture,/Runtime\.exceptionThrown/);
  assert.match(capture,/Emulation\.setDeviceMetricsOverride/);
  assert.match(capture,/visiblePages/);
  assert.match(capture,/documentOverflow/);
  for(const state of ['boss-home','enterprise-memory','meeting-detail','enterprise-knowledge','employee-private-memory','customer-followup','project-conflict','task-tree','ppt-routing']) assert.match(capture,new RegExp(state));
  assert.match(capture,/\$\{name\}-\$\{width\}x\$\{height\}\.png/);
});

test('work hub browser capture covers unified project workspace states',()=>{
  for(const state of ['project-list','project-create','project-cockpit','project-materials','project-material-permission','project-meeting-recommendation','project-meeting-link','project-meeting-return','project-account-visibility','workhub-permission-module']) assert.match(capture,new RegExp(state));
  assert.match(capture,/projectAccountVisibility\.hasBudget/);
  assert.match(capture,/confirmedMeeting\.links !== 1/);
  assert.match(capture,/workhubPermissionModule\.actions !== 6/);
});

test('full browser capture audits work hub routes as first-class pages',()=>{
  for(const state of ['workhub-tasks','workhub-customers','workhub-projects','kb-memory']) {
    assert.match(fullCapture,new RegExp(`\\['${state}'[^\\n]+`));
  }
  assert.match(fullCapture,/data-v="system"/);
  assert.match(fullCapture,/enterpriseSettings\.activePanel !== 'system'/);
});
