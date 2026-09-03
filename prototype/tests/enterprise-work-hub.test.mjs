import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const html = readFileSync(resolve('prototype/index.html'),'utf8');

test('work hub owns tasks customers projects and memory belongs to brain',()=>{
 assert.match(html,/data-v="workhub"/); assert.match(html,/data-p="workhub"/);
 for(const view of ['work-tasks','work-customers','work-projects']) { assert.match(html,new RegExp(`data-subview="${view}"`)); assert.match(html,new RegExp(`data-subview-panel="${view}"`)); }
 assert.match(html,/data-kbtab="memory"/); assert.match(html,/data-kbpanel="memory"/); assert.doesNotMatch(html,/data-p="tasks"/);
});
test('prototype declares controlled account and conflict contracts',()=>{
 for(const name of ['WORK_HUB_ACCOUNT_TEMPLATES','WORK_HUB_MEMORIES','WORK_HUB_CUSTOMERS','WORK_HUB_PROJECTS','WORK_HUB_TASKS','WORK_HUB_CONFLICTS']) assert.match(html,new RegExp(`const ${name}=`));
 for(const choice of ['adopt','keep','consult']) assert.match(html,new RegExp(`data-conflict-resolution="${choice}"`)); assert.match(html,/不会自动覆盖/);
});
test('work hub exposes account and memory workflows',()=>{ for(const token of ['tenantId','ownerAccountId','visibility','projectId','customerId','setWorkHubAccount','canCurrentAccountSeeWorkItem','data-work-account','workMemoryUpload','原型演示','会议证据','聊天证据']) assert.match(html,new RegExp(token)); });
test('work hub exposes customer project task and deliverable actions',()=>{ for(const token of ['customer-followup-assistant','project-commercial-documents','openWorkCustomerProfile','generateCustomerFollowupScript','adoptCustomerFollowupScript','resolveWorkProjectConflict','renderWorkTaskCenter','openWorkTaskDeliverable','pptCreationState','studioBrief']) assert.match(html,new RegExp(token)); });
test('page PRDs are concrete and differentiated',()=>{for(const key of ['work-tasks','work-customers','work-projects','kb-memory']){const m=html.match(new RegExp(`['"]${key}['"]:\\{([\\s\\S]*?)\\n  [a-z-]+:`));assert.ok(m,`${key} inline PRD`);for(const field of ['overview','rules','fields','actions','flows','logs','exceptions','acceptance','tech'])assert.match(m[1],new RegExp(`${field}:\\[?[^\\n]*(?!\\[\\])`),`${key} ${field}`);}const docs=['工作中枢-我的待办.md','工作中枢-客户.md','工作中枢-项目.md','企业大脑-企业记忆.md'];for(const d of docs){const s=readFileSync(resolve('prd/pages',d),'utf8');for(const h of ['问题','目标用户','用户流程','功能规则','异常与边界','字段交互','状态与权限','数据与接口','Skill / Prompt','埋点事件','验收标准','核心指标'])assert.match(s,new RegExp(`## ${h}`),`${d} ${h}`);}});
