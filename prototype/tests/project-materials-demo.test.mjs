import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/project-materials-demo.js',import.meta.url),'utf8');
function harness(initial={}){
  const store=new Map(),fields={},actions={},notes=[];let modalCall=null,download=null,clipboard='';
  const window={safeText:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),modal:(title,body,okText,onOk)=>{modalCall={title,body,okText,onOk};},closeModal(){},toast:text=>notes.push(text)};
  const document={querySelector(selector){return fields[selector]??null;},createElement(){return {click(){},set href(v){this._href=v},set download(v){this._download=v}};}};
  const navigator={clipboard:{writeText:async text=>{clipboard=text;}}};
  vm.runInNewContext(source,{window,localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},document,navigator,Date,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){ }},setTimeout(){}});
  const ctx={scopeKey:'test',project:{name:'项目 X'},role:'supervisor',canLead:true,refresh(){},observe:text=>notes.push(text),downloadDeck:(title,slides)=>{download={title,slides};}};
  store.set('project-materials-demo:test',JSON.stringify({...initial}));
  const host={querySelector(){return null},querySelectorAll(){return []}};
  const el={closest:()=>host};
  function click(action,role=ctx.role){ctx.role=role;window.projectMaterialsDemo.act(action,el,ctx);}
  function finish(fieldsMap){Object.assign(fields,fieldsMap);assert.ok(modalCall,'expected modal');modalCall.onOk();modalCall=null;}
  return {window,ctx,store,fields,notes,click,finish,get modal(){return modalCall},get download(){return download},get clipboard(){return clipboard}};
}

test('scope confirmation creates outline and stage talk; outline approval auto-builds a substantive editable deck',()=>{
  const h=harness();h.click('mat-edit-scope');h.finish({'#matScopeText':{value:'会员增长策略、会员体系方案、数据看板原型'}});
  let state=JSON.parse(h.store.get('project-materials-demo:test'));
  assert.equal(state.scopeConfirmed,true);assert.equal(state.proposal,true);assert.ok(state.scripts.customer.includes('会员增长策略'));
  h.click('mat-edit-outline');h.finish({'#matOutlineEdit':{value:'目标与基线\n关键问题\n目标用户\n交付边界\n里程碑\n验收指标'}});
  state=JSON.parse(h.store.get('project-materials-demo:test'));
  assert.equal(state.outlineApproved,true);assert.equal(state.currentDeck.length,6);
  assert.notEqual(state.currentDeck[0].body,state.currentDeck[1].body);
  assert.ok(state.currentDeck[4].body.includes('M1'));
  assert.match(h.window.projectMaterialsDemo.deliverables(h.ctx).find(row=>row.key==='deck').action,/预览 \/ 编辑/);
  h.click('mat-download-deck');assert.equal(h.download.slides.length,6);assert.ok(h.download.slides[0].body.includes('会员增长策略'));
  h.click('mat-deck-history');assert.match(h.modal.body,/目标与基线/);
});

test('formal quote uses only approved source snapshots and respects amount, scope, version and withdrawal',()=>{
  const h=harness({scopeConfirmed:true,scopeText:'策略方案、会员体系、看板原型'});
  const expiry=new Date().toISOString().slice(0,10);
  let row={ref:'BP-9',title:'报价审批',state:'pending',text:'批复正文',updatedAt:'v1',quote:{currency:'CNY',expiry,scope:'策略方案、会员体系',items:'策略方案,100.25\n会员体系,249.75'}};
  h.ctx.quoteApprovals=()=>[row];
  const selection={'#matApproval':{value:'BP-9'}};
  h.click('mat-quote-approve');assert.equal(h.modal,null);
  row={...row,state:'approved'};
  h.click('mat-quote-approve');h.finish(selection);
  let state=JSON.parse(h.store.get('project-materials-demo:test'));
  assert.equal(state.quote.totalCents,35000);assert.equal(state.quote.approvalVersion,'v1');
  h.click('mat-quote-approve');h.finish(selection);
  state=JSON.parse(h.store.get('project-materials-demo:test'));assert.equal(state.quote.version,1);
  row={...row,updatedAt:'v2',quote:{...row.quote,items:'策略方案,110.16\n会员体系,250'}};
  h.click('mat-quote-approve');h.finish(selection);
  state=JSON.parse(h.store.get('project-materials-demo:test'));assert.equal(state.quote.version,2);
  row={...row,state:'withdrawn'};
  assert.doesNotMatch(h.window.projectMaterialsDemo.render(h.ctx),/预览报价单/);
  assert.equal(h.window.projectMaterialsDemo.parseItems('策略方案,10000.519'),null);
});
test('employee render, talk editing, copying and quote export never reveal amounts',()=>{
  const h=harness({scopeConfirmed:true,scopeText:'策略方案',quote:{currency:'CNY',totalCents:9876500,expiry:'2099-01-01',quoteScope:'策略方案',items:[{name:'策略',cents:9876500}],approval:'BP',approvalText:'批准',status:'approved'},scripts:{customer:'客户报价 CNY 98765.00'}});
  h.ctx.role='employee';h.ctx.canLead=true;
  const html=h.window.projectMaterialsDemo.render(h.ctx);assert.doesNotMatch(html,/98765/);
  h.click('mat-edit-talk','employee');assert.doesNotMatch(h.modal.body,/98765/);
  h.click('mat-preview-quote','employee');assert.ok(h.notes.some(x=>x.includes('不可供此角色')));
  h.click('mat-copy-script','employee');assert.doesNotMatch(h.clipboard,/98765/);
});

test('withdrawal archives original quote and talk, regenerates safe copy, and turns off export',async()=>{
  const h=harness({scopeConfirmed:true,scopeText:'策略方案',quote:{currency:'CNY',totalCents:9876500,expiry:'2099-01-01',quoteScope:'策略方案',items:[{name:'策略',cents:9876500}],approval:'BP',approvalText:'原始批复正文',status:'approved',version:3},scripts:{customer:'已批准报价 CNY 98765.00'}});
  h.click('mat-quote-revoke');const state=JSON.parse(h.store.get('project-materials-demo:test'));
  assert.equal(state.quote,null);assert.ok(state.quoteHistory[0].approvalText.includes('原始批复'));assert.ok(state.quoteHistory[0].scriptSnapshot.includes('98765'));
  assert.doesNotMatch(state.scripts.customer,/98765/);assert.doesNotMatch(h.window.projectMaterialsDemo.render(h.ctx),/98765/);
  h.click('mat-copy-script');await Promise.resolve();assert.doesNotMatch(h.clipboard,/98765/);
  h.click('mat-quote-history');assert.match(h.modal.body,/原始批复正文/);
});

test('brain entries distinguish drafts, restrict quote amount, and local path changes use change handler',()=>{
  const h=harness({scopeConfirmed:true,proposal:true,outlineApproved:false,outline:['未审阅页']});
  let rows=h.window.projectMaterialsDemo.brainEntries({...h.ctx,role:'employee'});assert.ok(rows.some(x=>x.summary.includes('待审阅草稿')));
  h.store.set('project-materials-demo:test',JSON.stringify({scopeConfirmed:true,scopeText:'策略方案',quote:{currency:'CNY',totalCents:123400,expiry:'2099-01-01',quoteScope:'策略方案',items:[{name:'策略',cents:123400}],approval:'BP',approvalText:'正文',status:'approved'}}));
  rows=h.window.projectMaterialsDemo.brainEntries({...h.ctx,role:'employee',canLead:true});assert.ok(rows.every(x=>!x.summary.includes('1234')));
  const select={value:'internal'};assert.equal(h.window.projectMaterialsDemo.change('mat-kind',select,h.ctx),true);
  const state=JSON.parse(h.store.get('project-materials-demo:test'));assert.equal(state.kind,'internal');assert.equal(state.quote,null);assert.equal(state.scopeConfirmed,false);
  const repeat=h.window.projectMaterialsDemo.change('mat-kind',{value:'internal'},h.ctx);assert.equal(repeat,true);
});
