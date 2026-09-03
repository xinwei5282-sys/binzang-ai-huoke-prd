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
