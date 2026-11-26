import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../assets/project-reports-demo.js',import.meta.url),'utf8');
function setup(){
  const storage=new Map();
  const localStorage={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
  const window={localStorage};
  vm.runInNewContext(script,{window,OFFICE_CHANNELS:{feishu:{name:'飞书'}}});
  const record={kind:'daily',projectId:'p1',provider:'feishu',providers:['feishu'],ref:'FS-07',form:'日报表格',title:'联调进展',text:'测试等待确认',createdAt:'2026-11-23T01:00:00Z'};
  const ctx={scopeKey:'org.p1',project:{id:'p1'},role:'employee',accountId:'employee-a',evidence:()=>[record]};
  const key='aiHuokeProjectReportsDemo.v1.org.p1';
  return {api:window.projectReportsDemo,record,ctx,state:()=>JSON.parse(storage.get(key)),save:state=>storage.set(key,JSON.stringify(state))};
}
test('原平台日报进入主管汇报，重复通知和其他项目的记录不会重复写入',()=>{
  const {api,record,ctx,state}=setup();
  assert.match(api.receiveDaily(ctx,record),/直属主管/);
  assert.equal(state().periods[0].status,'employee_submitted');
  api.receiveDaily(ctx,record);
  api.receiveDaily(ctx,{...record,projectId:'p2'});
  assert.equal(state().periods[0].submissions.length,1);
  assert.equal(api.brainEntries(ctx)[0].ref,'FS-07');
});
test('后到日报保留已上报状态，签认后的汇报快照保持冻结',()=>{
  const {api,record,ctx,state,save}=setup();
  api.receiveDaily(ctx,record);
  const existing=state();
  existing.periods[0].status='supervisor_submitted';save(existing);
  const later={...record,ref:'FS-08'};
  ctx.evidence=()=>[record,later];
  api.receiveDaily(ctx,later);
  assert.equal(state().periods[0].status,'supervisor_submitted');
  assert.equal(state().periods[0].submissions.length,2);
  const closed=state();closed.periods[0].status='verified';save(closed);
  const final={...record,ref:'FS-09'};
  ctx.evidence=()=>[final];
  assert.match(api.receiveDaily(ctx,final),/已归档/);
  assert.deepEqual(state().periods,closed.periods);
  const next=state();next.periods.push({id:'next',status:'employee_draft',submissions:[]});save(next);
  assert.match(api.receiveDaily(ctx,final),/已同步/);
  assert.equal(state().periods[1].submissions.length,0);
});
