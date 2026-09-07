import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((entries, item, index, list) => {
  if (item.startsWith('--')) entries.push([item.slice(2), list[index + 1]]);
  return entries;
}, []));
const port = Number(args.port || 9228);
const width = Number(args.width || 1440);
const height = Number(args.height || 900);
const pageUrl = args.url || 'http://127.0.0.1:8010/index.html?review=workhub';
const pageOrigin = new URL(pageUrl).origin;
const outDir = resolve(args['out-dir'] || 'validation/enterprise-work-hub');
mkdirSync(outDir, { recursive: true });

const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
const target = targets.find(item => item.type === 'page' && item.url.startsWith(`${pageOrigin}/index.html`));
if (!target) throw new Error(`No AI Huoke prototype page found at ${pageOrigin}/index.html`);

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true });
  socket.addEventListener('error', rejectOpen, { once: true });
});

let nextId = 0;
let screenshotCount = 0;
const waiting = new Map();
const consoleErrors = [];
const runtimeErrors = [];

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && waiting.has(message.id)) {
    const { resolveCall, rejectCall } = waiting.get(message.id);
    waiting.delete(message.id);
    return message.error ? rejectCall(new Error(message.error.message)) : resolveCall(message.result);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    consoleErrors.push(message.params.args.map(argument => argument.value || argument.description).join(' '));
  }
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || 'Uncaught exception');
  }
});

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCall, rejectCall) => waiting.set(id, { resolveCall, rejectCall }));
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Evaluation failed');
  return result.result.value;
}

async function screenshot(name) {
  await new Promise(resolveWait => setTimeout(resolveWait, 180));
  const audit = await evaluate(`(() => {
    const page=document.querySelector('.page.show');
    const pageRect=page?.getBoundingClientRect();
    const modal=document.querySelector('#mask.show .modal');
    const modalRect=modal?.getBoundingClientRect();
    return {
      route:page?.dataset.p||'',
      visiblePages:document.querySelectorAll('.page.show').length,
      documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
      documentScrollWidth:document.documentElement.scrollWidth,
      documentClientWidth:document.documentElement.clientWidth,
      bodyScrollWidth:document.body.scrollWidth,
      scrollX:window.scrollX,
      detailDrawerHidden:document.querySelector('#detailDrawer')?.getAttribute('aria-hidden'),
      pagePrdDrawerHidden:document.querySelector('#pagePrdDrawer')?.getAttribute('aria-hidden'),
      pageOutside:Boolean(pageRect&&(pageRect.left<-2||pageRect.right>innerWidth+2)),
      modalOutside:Boolean(modalRect&&(modalRect.left<-2||modalRect.right>innerWidth+2)),
      modalVerticalOutside:Boolean(modalRect&&(modalRect.top<-2||modalRect.bottom>innerHeight+2)),
      overflowElements:[...document.querySelectorAll('body *')].map(element=>{const rect=element.getBoundingClientRect();return{tag:element.tagName.toLowerCase(),id:element.id||'',className:String(element.className||'').slice(0,80),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width)}}).filter(item=>item.right>innerWidth+2).slice(0,12),
      overflowContainers:[...document.querySelectorAll('body *')].filter(element=>element.scrollWidth>element.clientWidth+2).map(element=>({tag:element.tagName.toLowerCase(),id:element.id||'',className:String(element.className||'').slice(0,80),clientWidth:element.clientWidth,scrollWidth:element.scrollWidth})).slice(0,12)
    };
  })()`);
  if (audit.visiblePages !== 1 || audit.documentOverflow || audit.pageOutside || audit.modalOutside || audit.modalVerticalOutside) {
    throw new Error(`${name} layout audit failed: ${JSON.stringify(audit)}`);
  }
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(resolve(outDir, `${name}-${width}x${height}.png`), Buffer.from(result.data, 'base64'));
  screenshotCount += 1;
  return audit;
}

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 560 });
await send('Page.reload', { ignoreCache: true });
await new Promise(resolveWait => setTimeout(resolveWait, 900));
await evaluate(`new Promise((resolveReady,rejectReady)=>{let attempts=0;const timer=setInterval(()=>{if(document.body&&typeof go==='function'&&typeof renderWorkHub==='function'&&typeof showKbTab==='function'){clearInterval(timer);resolveReady(true);}else if(++attempts>60){clearInterval(timer);rejectReady(new Error('work hub runtime did not become ready'));}},100);})`);
await evaluate(`(() => { const login=document.querySelector('#login');if(login)login.style.display='none';document.body.classList.remove('login-active');if(typeof closeModal==='function')closeModal(); })()`);
consoleErrors.length = 0;
runtimeErrors.length = 0;

const audits = {};

await evaluate(`setWorkHubAccount('acct-boss');go('home')`);
const bossHome = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,decisions:Boolean(document.querySelector('#homeDecisionQueue')),customers:Boolean(document.querySelector('#homeCustomerOpportunities')),tasks:Boolean(document.querySelector('#homeTaskTree')),role:document.querySelector('#homeDecisionQueue')?.textContent||''}))()`);
if (bossHome.route !== 'home' || !bossHome.decisions || !bossHome.customers || !bossHome.tasks || !bossHome.role.includes('老板决策')) throw new Error(`boss home audit failed: ${JSON.stringify(bossHome)}`);
audits['boss-home'] = await screenshot('boss-home');

const homeWorkbench = await evaluate(`(() => {const nav=[...document.querySelectorAll('[data-nav-group="workspace"]>button')].map(button=>button.textContent.trim()),host=document.querySelector('#homeWorkTaskOverview'),text=host?.textContent||'';return{nav,overview:Boolean(host),project:text.includes('极光科技增长项目'),calendar:Boolean(host?.querySelector('[data-task-calendar-date]')),today:text.includes('今日待办'),workbench:text.includes('进入工作台')}})()`);
if (homeWorkbench.nav[0] !== '首页' || !homeWorkbench.nav[1]?.startsWith('工作台') || !homeWorkbench.overview || !homeWorkbench.project || !homeWorkbench.calendar || !homeWorkbench.workbench) throw new Error(`home workbench integration audit failed: ${JSON.stringify(homeWorkbench)}`);
audits['home-workbench-summary'] = await screenshot('home-workbench-summary');

await evaluate(`go('workhub');switchSubview('work-tasks');setWorkTaskGroupMode('project')`);
const projectTaskSummary = await evaluate(`(() => {const text=document.querySelector('#workTaskCenter')?.textContent||'';return{route:document.querySelector('.page.show')?.dataset.p,parentTitle:document.querySelector('#ptitle')?.textContent||'',pageTitle:document.querySelector('[data-p="workhub"]>.lead .t')?.textContent||'',groups:document.querySelectorAll('[data-task-project-group]').length,project:text.includes('极光科技增长项目'),calendar:Boolean(document.querySelector('#workTaskCenter [data-task-calendar-date]')),mode:document.querySelector('#workTaskGroupMode')?.value||''}})()`);
if (projectTaskSummary.route !== 'workhub' || projectTaskSummary.parentTitle !== '工作台' || projectTaskSummary.pageTitle !== '我的待办' || projectTaskSummary.groups < 1 || !projectTaskSummary.project || !projectTaskSummary.calendar || projectTaskSummary.mode !== 'project') throw new Error(`project task summary audit failed: ${JSON.stringify(projectTaskSummary)}`);
audits['task-project-summary'] = await screenshot('task-project-summary');

const calendarDrag = await evaluate(`(() => {const source=document.querySelector('#workTaskCenter [data-task-id="task-meeting-followup"][draggable="true"]'),slot=document.querySelector('#workTaskCenter [data-task-calendar-date="2026-09-11"][data-task-calendar-time="14:00"]'),transfer=new DataTransfer();source?.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));slot?.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:transfer}));slot?.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));const task=WORK_HUB_TASKS.find(item=>item.id==='task-meeting-followup'),newSlot=document.querySelector('#workTaskCenter [data-task-calendar-date="2026-09-11"][data-task-calendar-time="14:00"]');return{dueAt:task?.dueAt,scheduledDate:task?.scheduledDate,scheduledTime:task?.scheduledTime,rendered:newSlot?.textContent.includes('确认极光科技会议下一步')}})()`);
if (calendarDrag.dueAt !== '9月11日 14:00' || calendarDrag.scheduledDate !== '2026-09-11' || calendarDrag.scheduledTime !== '14:00' || !calendarDrag.rendered) throw new Error(`task calendar drag audit failed: ${JSON.stringify(calendarDrag)}`);
audits['task-calendar-drag'] = await screenshot('task-calendar-drag');

await evaluate(`document.querySelector('#workTaskCenter [data-act="schedule-work-task"][data-task-id="task-meeting-followup"]')?.click()`);
const scheduleFallback = await evaluate(`(() => ({open:document.querySelector('#mask')?.classList.contains('show'),title:document.querySelector('#modalTitle')?.textContent||'',date:document.querySelector('#workTaskScheduleDate')?.value||'',time:document.querySelector('#workTaskScheduleTime')?.value||''}))()`);
if (!scheduleFallback.open || scheduleFallback.title !== '调整待办时间' || scheduleFallback.date !== '2026-09-11' || scheduleFallback.time !== '14:00') throw new Error(`task schedule fallback audit failed: ${JSON.stringify(scheduleFallback)}`);
audits['task-schedule-fallback'] = await screenshot('task-schedule-fallback');
await evaluate(`closeModal()`);

await evaluate(`go('home')`);
const homeTaskSync = await evaluate(`(() => {const slot=document.querySelector('#homeWorkTaskOverview [data-task-calendar-date="2026-09-11"][data-task-calendar-time="14:00"]'),task=WORK_HUB_TASKS.find(item=>item.id==='task-meeting-followup');return{route:document.querySelector('.page.show')?.dataset.p,dueAt:task?.dueAt,rendered:slot?.textContent.includes('确认极光科技会议下一步')}})()`);
if (homeTaskSync.route !== 'home' || homeTaskSync.dueAt !== '9月11日 14:00' || !homeTaskSync.rendered) throw new Error(`home task sync audit failed: ${JSON.stringify(homeTaskSync)}`);
audits['home-task-sync'] = await screenshot('home-task-sync');

await evaluate(`setWorkHubAccount('acct-boss');go('workhub');switchSubview('work-projects');renderWorkHub()`);
const projectList = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,rows:document.querySelectorAll('#workProjectList > article').length,createVisible:document.querySelector('[data-act="create-work-project"]')?.hidden===false}))()`);
if (projectList.route !== 'workhub' || projectList.rows < 2 || !projectList.createVisible) throw new Error(`project list audit failed: ${JSON.stringify(projectList)}`);
audits['project-list'] = await screenshot('project-list');

await evaluate(`document.querySelector('[data-act="create-work-project"]')?.click()`);
const projectCreate = await evaluate(`(() => ({open:document.querySelector('#mask')?.classList.contains('show'),title:document.querySelector('#modalTitle')?.textContent||'',steps:document.querySelectorAll('[data-project-create-step]').length,name:Boolean(document.querySelector('#newProjectName')),customer:Boolean(document.querySelector('#newProjectCustomer'))}))()`);
if (!projectCreate.open || !projectCreate.title.includes('创建项目') || projectCreate.steps !== 3 || !projectCreate.name || !projectCreate.customer) throw new Error(`project create audit failed: ${JSON.stringify(projectCreate)}`);
audits['project-create'] = await screenshot('project-create');

await evaluate(`closeModal();openWorkProject('proj-growth','overview')`);
const projectCockpit = await evaluate(`(() => {const text=document.querySelector('#workProjectList')?.textContent||'';return{tabs:document.querySelectorAll('[data-project-tab]').length,next:text.includes('下一步工作'),blockers:text.includes('项目阻塞'),meeting:text.includes('最新会议'),ai:text.includes('AI 项目判断')}})()`);
if (projectCockpit.tabs !== 6 || !projectCockpit.next || !projectCockpit.blockers || !projectCockpit.meeting || !projectCockpit.ai) throw new Error(`project cockpit audit failed: ${JSON.stringify(projectCockpit)}`);
audits['project-cockpit'] = await screenshot('project-cockpit');

await evaluate(`switchWorkProjectTab('materials')`);
const projectMaterials = await evaluate(`(() => {const text=document.querySelector('[data-project-panel="materials"]')?.textContent||'';return{visible:!document.querySelector('[data-project-panel="materials"]')?.hidden,rows:document.querySelectorAll('[data-project-panel="materials"] [data-material-id]').length,hasMeeting:text.includes('客户需求沟通会议.mp4'),hasPpt:text.includes('增长方案大纲.pptx'),hasUnavailable:text.includes('来源不可用'),permissionActions:document.querySelectorAll('[data-project-panel="materials"] [data-act="edit-project-material-permissions"]').length}})()`);
if (!projectMaterials.visible || projectMaterials.rows < 4 || !projectMaterials.hasMeeting || !projectMaterials.hasPpt || !projectMaterials.hasUnavailable || projectMaterials.permissionActions < 1) throw new Error(`project materials audit failed: ${JSON.stringify(projectMaterials)}`);
audits['project-materials'] = await screenshot('project-materials');

await evaluate(`document.querySelector('[data-project-panel="materials"] [data-act="edit-project-material-permissions"]')?.click()`);
const projectMaterialPermission = await evaluate(`(() => ({open:document.querySelector('#mask')?.classList.contains('show'),title:document.querySelector('#modalTitle')?.textContent||'',visibility:Boolean(document.querySelector('#editMaterialVisibility')),members:document.querySelectorAll('#editMaterialMembers input').length}))()`);
if (!projectMaterialPermission.open || !projectMaterialPermission.title.includes('材料查看权限') || !projectMaterialPermission.visibility) throw new Error(`project material permission audit failed: ${JSON.stringify(projectMaterialPermission)}`);
audits['project-material-permission'] = await screenshot('project-material-permission');
await evaluate(`closeModal()`);

await evaluate(`go('kb');showKbTab('memory');submitWorkMeetingUpload(new File(['demo'],'极光客户评审.mp3',{type:'audio/mpeg'}),{customerId:'cust-aurora'})`);
await new Promise(resolveWait => setTimeout(resolveWait, 1900));
const recommendedMeeting = await evaluate(`(() => {const meeting=WORK_HUB_MEETINGS.find(item=>item.name==='极光客户评审.mp3');if(meeting)openEnterpriseMeetingDetail(meeting.id);const text=document.querySelector('#modal')?.textContent||'';return{id:meeting?.id||'',stage:meeting?.stage||'',projectId:meeting?.projectId||null,recommendedProjectId:meeting?.recommendedProjectId||null,linkStatus:meeting?.projectLinkStatus||'',recommendation:text.includes('AI 推荐项目 · 极光科技增长项目（待确认）')}})()`);
if (!recommendedMeeting.id || recommendedMeeting.stage !== 'ready' || recommendedMeeting.projectId !== null || recommendedMeeting.recommendedProjectId !== 'proj-growth' || recommendedMeeting.linkStatus !== 'recommended' || !recommendedMeeting.recommendation) throw new Error(`project meeting recommendation audit failed: ${JSON.stringify(recommendedMeeting)}`);
audits['project-meeting-recommendation'] = await screenshot('project-meeting-recommendation');

await evaluate(`document.querySelector('#modal [data-act="confirm-meeting-project-link"]')?.click()`);
const confirmedMeeting = await evaluate(`(() => {const meeting=WORK_HUB_MEETINGS.find(item=>item.name==='极光客户评审.mp3'),links=WORK_HUB_PROJECT_MATERIALS.filter(item=>item.projectId==='proj-growth'&&item.sourceType==='meeting'&&item.sourceId===meeting?.id);return{id:meeting?.id||'',projectId:meeting?.projectId||'',linkStatus:meeting?.projectLinkStatus||'',links:links.length}})()`);
if (confirmedMeeting.projectId !== 'proj-growth' || confirmedMeeting.linkStatus !== 'linked' || confirmedMeeting.links !== 1) throw new Error(`project meeting link audit failed: ${JSON.stringify(confirmedMeeting)}`);
await evaluate(`closeModal();openWorkProject('proj-growth','meetings');document.querySelector('[data-project-panel="meetings"] [data-act="open-project-meeting"]')?.click()`);
const linkedMeeting = await evaluate(`(() => {const text=document.querySelector('#modal')?.textContent||'';return{open:document.querySelector('#mask')?.classList.contains('show'),linked:text.includes('已关联 极光科技增长项目'),returnAction:Boolean(document.querySelector('#modal [data-act="return-to-meeting-project"]'))}})()`);
if (!linkedMeeting.open || !linkedMeeting.linked || !linkedMeeting.returnAction) throw new Error(`project linked meeting audit failed: ${JSON.stringify(linkedMeeting)}`);
audits['project-meeting-link'] = await screenshot('project-meeting-link');

await evaluate(`document.querySelector('#modal [data-act="return-to-meeting-project"]')?.click()`);
const projectMeetingReturn = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,meetingTab:document.querySelector('[data-project-tab="meetings"]')?.getAttribute('aria-selected'),meetingPanel:!document.querySelector('[data-project-panel="meetings"]')?.hidden}))()`);
if (projectMeetingReturn.route !== 'workhub' || projectMeetingReturn.meetingTab !== 'true' || !projectMeetingReturn.meetingPanel) throw new Error(`project meeting return audit failed: ${JSON.stringify(projectMeetingReturn)}`);
audits['project-meeting-return'] = await screenshot('project-meeting-return');

await evaluate(`setWorkHubAccount('acct-employee-lin');openWorkProject('proj-growth','materials')`);
const projectAccountVisibility = await evaluate(`(() => {const text=document.querySelector('[data-project-panel="materials"]')?.textContent||'';return{rows:document.querySelectorAll('[data-project-panel="materials"] [data-material-id]').length,hasBudget:text.includes('客户预算底稿.xlsx'),hasBossPrivate:text.includes('老板内部报价底线.docx'),canCreate:document.querySelector('[data-act="create-work-project"]')?.hidden===false,canManageMembers:Boolean(document.querySelector('[data-act="add-work-project-member"]'))}})()`);
if (projectAccountVisibility.rows < 3 || projectAccountVisibility.hasBudget || projectAccountVisibility.hasBossPrivate || projectAccountVisibility.canCreate || projectAccountVisibility.canManageMembers) throw new Error(`project account visibility audit failed: ${JSON.stringify(projectAccountVisibility)}`);
audits['project-account-visibility'] = await screenshot('project-account-visibility');

await evaluate(`setWorkHubAccount('acct-boss');go('permissions');openSystemRoleEditor('管理员')`);
const workhubPermissionModule = await evaluate(`(() => {const module=document.querySelector('#modal [data-permission-module="workhub"]');return{route:document.querySelector('.page.show')?.dataset.p,label:module?.textContent||'',actions:module?.querySelectorAll('.permission-child').length||0,checked:module?.querySelectorAll('.permission-child:checked').length||0}})()`);
if (workhubPermissionModule.route !== 'permissions' || !workhubPermissionModule.label.includes('工作台') || workhubPermissionModule.actions !== 6 || workhubPermissionModule.checked !== 6) throw new Error(`workhub permission module audit failed: ${JSON.stringify(workhubPermissionModule)}`);
audits['workhub-permission-module'] = await screenshot('workhub-permission-module');
await evaluate(`closeModal()`);

await evaluate(`document.querySelector('[data-nav-sub="kb"] [data-kbtab="memory"]')?.click();renderWorkHub()`);
const memoryList = await evaluate(`(() => {const text=document.querySelector('[data-kbpanel="memory"]')?.textContent||'',names=[...document.querySelectorAll('#enterpriseMemoryList [data-meeting-id] h3')].map(node=>node.textContent||'');return{route:document.querySelector('.page.show')?.dataset.p,panelVisible:document.querySelector('[data-kbpanel="memory"]')?.classList.contains('show'),heading:document.querySelector('[data-p="kb"] > .lead .t')?.textContent||'',rows:names.length,onlyMeetingMedia:names.every(name=>/\.(mp3|wav|m4a|aac|flac|ogg|mp4|mov|mkv|webm)$/i.test(name)),detailButtons:document.querySelectorAll('#enterpriseMemoryList [data-act="open-enterprise-meeting-detail"]').length,demo:/原型演示/.test(text),meetingOnly:/只处理会议音频和视频/.test(text)}})()`);
if (memoryList.route !== 'kb' || !memoryList.panelVisible || memoryList.heading !== '会议纪要' || memoryList.rows < 1 || !memoryList.onlyMeetingMedia || memoryList.detailButtons < 1 || !memoryList.demo || !memoryList.meetingOnly) throw new Error(`meeting minutes audit failed: ${JSON.stringify(memoryList)}`);
audits['enterprise-memory'] = await screenshot('enterprise-memory');

await evaluate(`document.querySelector('#enterpriseMemoryList [data-meeting-id="meeting-aurora-01"] [data-act="open-enterprise-meeting-detail"]')?.click()`);
const meetingDetail = await evaluate(`(() => {const text=document.querySelector('#modal')?.textContent||'';return{modalOpen:document.querySelector('#mask')?.classList.contains('show'),title:document.querySelector('#modalTitle')?.textContent||'',hasSource:text.includes('音视频来源'),hasTranscript:text.includes('说话人转写'),hasSummary:text.includes('一句话结论'),hasDecisions:text.includes('已确认决策'),hasActions:text.includes('待办事项'),hasIntent:text.includes('客户意向'),transcriptRows:document.querySelectorAll('.meeting-transcript-row').length,actionChecks:document.querySelectorAll('[data-meeting-action]').length}})()`);
if (!meetingDetail.modalOpen || !meetingDetail.title.includes('会议纪要') || !meetingDetail.hasSource || !meetingDetail.hasTranscript || !meetingDetail.hasSummary || !meetingDetail.hasDecisions || !meetingDetail.hasActions || !meetingDetail.hasIntent || meetingDetail.transcriptRows < 1 || meetingDetail.actionChecks < 1) throw new Error(`meeting detail audit failed: ${JSON.stringify(meetingDetail)}`);
audits['meeting-detail'] = await screenshot('meeting-detail');
const tabAudit = await evaluate(`(() => {const summary=document.querySelector('#modal [data-meeting-panel="summary"]'),transcript=document.querySelector('#modal [data-meeting-panel="transcript"]');return{summaryVisible:!!summary&&!summary.hidden,transcriptHidden:!!transcript&&transcript.hidden}})()`);
if(!tabAudit.summaryVisible||!tabAudit.transcriptHidden)throw Error('summary tab default failed');
const structuredSummary = await evaluate(`(() => {const panel=document.querySelector('#modal [data-meeting-panel="summary"]'),text=panel?.textContent||'';return{sections:panel?.querySelectorAll('[data-summary-section]').length||0,evidenceButtons:panel?.querySelectorAll('[data-act="open-meeting-evidence"]').length||0,labels:['一句话结论','客户意向','章节纪要','关键需求与异议','已确认决策','待办事项','下一步建议','未决问题与风险'].every(label=>text.includes(label))}})()`);
if(structuredSummary.sections!==8||structuredSummary.evidenceButtons<5||!structuredSummary.labels)throw Error(`structured meeting summary failed: ${JSON.stringify(structuredSummary)}`);
audits['meeting-summary-structured'] = await screenshot('meeting-summary-structured');
await evaluate(`(() => {const body=document.querySelector('#modal .mb');if(body)body.scrollTop=body.scrollHeight;})()`);
audits['meeting-summary-followup'] = await screenshot('meeting-summary-followup');
await evaluate(`document.querySelector('#modal [data-act="open-meeting-evidence"][data-time="00:18:02"]')?.click()`);
const transcriptTab = await evaluate(`({summaryHidden:document.querySelector('#modal [data-meeting-panel="summary"]')?.hidden,transcriptVisible:!document.querySelector('#modal [data-meeting-panel="transcript"]')?.hidden,focusedTime:document.querySelector('#modal .meeting-transcript-row.evidence-focus')?.dataset.transcriptTime||''})`);
if(!transcriptTab.summaryHidden||!transcriptTab.transcriptVisible||transcriptTab.focusedTime!=='00:18:02')throw Error(`transcript evidence switch failed: ${JSON.stringify(transcriptTab)}`);
audits['meeting-transcript-evidence'] = await screenshot('meeting-transcript-evidence');
await evaluate(`document.querySelector('#modal [data-meeting-tab="summary"]')?.click()`);
const returnedSummary = await evaluate(`!document.querySelector('#modal [data-meeting-panel="summary"]')?.hidden`);if(!returnedSummary)throw Error('summary return failed');
await evaluate(`document.querySelector('#modal [data-mo]')?.click();go('kb');showKbTab('memory');renderWorkHub()`);
const longMeeting = await evaluate(`(() => {const m=WORK_HUB_MEETINGS.find(x=>x.id==='meeting-long-demo');return{duration:m?.duration,progress:m?.segmentProgress,text:document.querySelector('#enterpriseMemoryList')?.textContent||''}})()`);
if(longMeeting.duration!=='2:36:18'||longMeeting.progress?.total!==4||longMeeting.progress?.completed!==3||!longMeeting.text.includes('2:36:18')||!longMeeting.text.includes('4 个分段')||!longMeeting.text.includes('已完成 3 个')||!longMeeting.text.includes('结果生成后可查看 AI 总结与逐字稿'))throw Error('long meeting progress failed');
await evaluate(`document.querySelector('#modal [data-mo]')?.click()`);
const meetingTask = await evaluate(`(() => {const task=WORK_HUB_TASKS.find(item=>item.sourceMeetingId==='meeting-aurora-01'&&item.title==='整理增长方案大纲');return{exists:Boolean(task),sourceMeetingId:task?.sourceMeetingId||'',evidenceTimestamp:task?.evidenceTimestamp||''}})()`);
if (!meetingTask.exists || meetingTask.sourceMeetingId !== 'meeting-aurora-01' || meetingTask.evidenceTimestamp !== '00:12:34') throw new Error(`meeting task audit failed: ${JSON.stringify(meetingTask)}`);

await evaluate(`document.querySelector('[data-nav-sub="kb"] [data-kbtab="content"]')?.click()`);
const knowledgeSources = await evaluate(`(() => {const panel=document.querySelector('[data-kbpanel="content"]'),text=panel?.textContent||'';return{visible:panel?.classList.contains('show'),chat:text.includes('上传聊天记录'),file:text.includes('上传文件资料'),paste:text.includes('粘贴文本'),inputAccept:document.querySelector('#knowledgeSourceUpload')?.getAttribute('accept')||''}})()`);
if (!knowledgeSources.visible || !knowledgeSources.chat || !knowledgeSources.file || !knowledgeSources.paste || knowledgeSources.inputAccept !== 'image/*,.pdf,.doc,.docx,.txt') throw new Error(`enterprise knowledge source audit failed: ${JSON.stringify(knowledgeSources)}`);
audits['enterprise-knowledge'] = await screenshot('enterprise-knowledge');

await evaluate(`setWorkHubAccount('acct-employee-lin');go('home')`);
const employeeHome = await evaluate(`(() => ({role:document.querySelector('#homeDecisionQueue')?.textContent||'',bossOnlyHidden:document.querySelector('[data-home-boss-only]')?.hidden===true}))()`);
if (!employeeHome.role.includes('我的工作提醒') || !employeeHome.bossOnlyHidden) throw new Error(`employee home audit failed: ${JSON.stringify(employeeHome)}`);
audits['employee-home'] = await screenshot('employee-home');
await evaluate(`document.querySelector('[data-nav-sub="kb"] [data-kbtab="memory"]')?.click();renderWorkHub()`);
const privateMemory = await evaluate(`(() => ({hasPrivate:/林晓客户回访录音/.test(document.querySelector('#enterpriseMemoryList')?.textContent||''),hasEnterpriseMeeting:/客户需求沟通会议/.test(document.querySelector('#enterpriseMemoryList')?.textContent||''),onlyMedia:[...document.querySelectorAll('#enterpriseMemoryList [data-meeting-id] h3')].every(node=>/\.(mp3|wav|m4a|aac|flac|ogg|mp4|mov|mkv|webm)$/i.test(node.textContent||''))}))()`);
if (!privateMemory.hasPrivate || !privateMemory.hasEnterpriseMeeting || !privateMemory.onlyMedia) throw new Error(`employee project-shared meeting audit failed: ${JSON.stringify(privateMemory)}`);
audits['employee-private-memory'] = await screenshot('employee-private-memory');

await evaluate(`setWorkHubAccount('acct-boss');openWorkCustomerProfile('cust-aurora');generateCustomerFollowupScript()`);
const followup = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,candidate:Boolean(document.querySelector('[data-followup-candidate]')),manualBoundary:/不自动发送|人工发送/.test(document.querySelector('#customer-followup-assistant')?.textContent||'')}))()`);
if (followup.route !== 'workhub' || !followup.candidate || !followup.manualBoundary) throw new Error(`customer followup audit failed: ${JSON.stringify(followup)}`);
audits['customer-followup'] = await screenshot('customer-followup');

await evaluate(`setWorkHubAccount('acct-employee-lin');openWorkProject('proj-growth')`);
const conflict = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,choices:document.querySelectorAll('[data-conflict-resolution]').length,hasEmployeeQuote:/员工报价 28 万/.test(document.querySelector('#workProjectList')?.textContent||''),hasBossRequirement:/老板会议要求 32 万/.test(document.querySelector('#workProjectList')?.textContent||'')}))()`);
if (conflict.route !== 'workhub' || conflict.choices < 3 || !conflict.hasEmployeeQuote || !conflict.hasBossRequirement) throw new Error(`project conflict audit failed: ${JSON.stringify(conflict)}`);
audits['project-conflict'] = await screenshot('project-conflict');

await evaluate(`document.querySelector('[data-act="create-project-commercial-document"][data-deliverable-type="contract"]')?.click()`);
const commercialTask = await evaluate(`(() => {const task=[...WORK_HUB_TASKS].reverse().find(item=>item.deliverableType==='contract');return{taskId:task?.id||'',status:task?.status||'',owner:task?.ownerAccountId||'',taskPanel:document.querySelector('[data-subview-panel="work-tasks"]')?.classList.contains('show')}})()`);
if (!commercialTask.taskId || commercialTask.status !== 'pending' || commercialTask.owner !== 'acct-employee-lin' || !commercialTask.taskPanel) throw new Error(`commercial task audit failed: ${JSON.stringify(commercialTask)}`);
await evaluate(`runWorkAgentTask('${commercialTask.taskId}')`);
await new Promise(resolveWait => setTimeout(resolveWait, 850));
const commercialResult = await evaluate(`(() => {const task=WORK_HUB_TASKS.find(item=>item.id==='${commercialTask.taskId}'),project=WORK_HUB_PROJECTS.find(item=>item.id==='proj-growth');return{status:task?.status||'',resultId:task?.resultId||'',projectHasResult:project?.commercialDocuments.includes('contract-draft · 合同草稿')||false}})()`);
if (commercialResult.status !== 'ready' || !commercialResult.resultId || !commercialResult.projectHasResult) throw new Error(`commercial result audit failed: ${JSON.stringify(commercialResult)}`);

await evaluate(`setWorkHubAccount('acct-boss');go('workhub');switchSubview('work-tasks');renderWorkTaskCenter()`);
const taskTree = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,rows:document.querySelectorAll('#workTaskCenter [data-task-id]').length,hasSource:Boolean(document.querySelector('#workTaskCenter [data-act="open-work-task-source"]')),hasChild:/↳/.test(document.querySelector('#workTaskCenter')?.textContent||'')}))()`);
if (taskTree.route !== 'workhub' || taskTree.rows < 1 || !taskTree.hasSource || !taskTree.hasChild) throw new Error(`task tree audit failed: ${JSON.stringify(taskTree)}`);
audits['task-tree'] = await screenshot('task-tree');

await evaluate(`openWorkTaskDeliverable('task-agent-ppt')`);
const pptRouting = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,brief:document.querySelector('#studioBrief')?.value||'',taskId:pptCreationState.taskContext?.taskId||'',pptVisible:document.querySelector('[data-subview-panel="material-ppt"]')?.classList.contains('show')}))()`);
if (pptRouting.route !== 'marketing-materials' || !pptRouting.brief.includes('极光科技') || pptRouting.taskId !== 'task-agent-ppt' || !pptRouting.pptVisible) throw new Error(`PPT routing audit failed: ${JSON.stringify(pptRouting)}`);
audits['ppt-routing'] = await screenshot('ppt-routing');

if (consoleErrors.length || runtimeErrors.length) throw new Error(`browser runtime errors: ${JSON.stringify({ consoleErrors, runtimeErrors })}`);

socket.close();
process.stdout.write(`${JSON.stringify({ status: 'PASS', width, height, screenshotCount, audits }, null, 2)}\n`);
