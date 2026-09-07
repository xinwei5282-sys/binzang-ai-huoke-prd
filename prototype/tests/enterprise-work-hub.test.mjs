import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
const html = readFileSync(resolve('prototype/index.html'),'utf8');
const capture = readFileSync(resolve('prototype/scripts/capture-enterprise-work-hub.mjs'),'utf8');
const fullCapture = readFileSync(resolve('prototype/scripts/capture-v1-prototype.mjs'),'utf8');
test('project access and material ACL are separate contracts',()=>{for(const token of ['WORK_HUB_PROJECT_MEMBERS','WORK_HUB_PROJECT_MATERIALS','currentSystemActions','hasSystemAction','currentWorkDataScope','currentWorkHubActions','hasWorkHubAction','canCurrentAccountAccessProject','canCurrentAccountSeeProjectMaterial','visibleProjectMaterials','selectedMemberIds','createdByAccountId','role.dataScope'])assert.match(html,new RegExp(token));for(const visibility of ['project','selected_members','private'])assert.match(html,new RegExp(`visibility:'${visibility}'`));});

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

test('full browser capture audits work hub routes as first-class pages',()=>{
  for(const state of ['workhub-tasks','workhub-customers','workhub-projects','kb-memory']) {
    assert.match(fullCapture,new RegExp(`\\['${state}'[^\\n]+`));
  }
  assert.match(fullCapture,/data-v="system"/);
  assert.match(fullCapture,/enterpriseSettings\.activePanel !== 'system'/);
});
