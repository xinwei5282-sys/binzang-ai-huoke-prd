import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startManagedBrowser, stopManagedBrowser } from './lib/managed-browser.mjs';
import { ensurePrototypeServer } from './lib/prototype-server.mjs';

const root=resolve(import.meta.dirname,'../..');
const out=resolve(root,'validation/workbench-single-page');
mkdirSync(out,{recursive:true});
const server=await ensurePrototypeServer(root);
const browser=await startManagedBrowser({url:server.url+'?review=home'});
const socket=new WebSocket(browser.target.webSocketDebuggerUrl);
await new Promise((yes,no)=>{socket.addEventListener('open',yes,{once:true});socket.addEventListener('error',no,{once:true});});
let next=0;const pending=new Map(),errors=[],audits={};
socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.id&&pending.has(message.id)){const {yes,no,timer}=pending.get(message.id);clearTimeout(timer);pending.delete(message.id);message.error?no(new Error(message.error.message)):yes(message.result);}
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
  if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')errors.push(message.params.args.map(arg=>arg.value||arg.description).join(' '));
});
function send(method,params={}){const id=++next;return new Promise((yes,no)=>{const timer=setTimeout(()=>{pending.delete(id);no(new Error('CDP timeout: '+method));},method==='Runtime.evaluate'?55000:12000);pending.set(id,{yes,no,timer});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
async function click(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
async function projectFilter(value){await evaluate(`(()=>{const select=document.querySelector('#workbenchProjectScope');select.value=${JSON.stringify(value)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
async function capture(name,width,height){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<560});
  await evaluate(`go('home');workHubState.projectProgressFilter='all';renderWorkProjectProgress();document.querySelector('.main')?.scrollTo(0,0);window.scrollTo(0,0);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  const audit=await evaluate(`(()=>{const box=document.querySelector('#workbenchProjectOverview').getBoundingClientRect();return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,projectLeft:box.left,projectRight:box.right,rows:document.querySelectorAll('[data-workbench-project]').length};})()`);
  assert.ok(audit.scrollWidth<=width+2,JSON.stringify(audit));assert.ok(audit.projectLeft>=0&&audit.projectRight<=width+2,JSON.stringify(audit));assert.equal(audit.rows,2);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,name+'.png'),Buffer.from(shot.data,'base64'));audits[name]=audit;
}
async function takeState(name){await evaluate(`Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished))`);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,name+'.png'),Buffer.from(shot.data,'base64'));}
try{
 await send('Runtime.enable');await send('Page.enable');
 await evaluate(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(typeof renderWorkProjectProgress==='function'&&document.querySelector('#workbenchProjectRows')){clearInterval(timer);resolve(true)}else if(++n>450){clearInterval(timer);reject(new Error('workbench not ready'))}},100)})`);
 await evaluate(`document.querySelector('#login').style.display='none';document.body.classList.remove('login-active');setWorkHubAccount('acct-boss');go('home')`);
 const initial=await evaluate(`({rows:[...document.querySelectorAll('[data-workbench-project]')].map(el=>el.dataset.workbenchProject),metrics:[...document.querySelectorAll('#projectOverviewMetrics b')].map(el=>+el.textContent),tabs:document.querySelectorAll('[data-act="workbench-tab"],[data-act="work-calendar-view"]').length,panels:[...document.querySelectorAll('.workbench-panel')].map(el=>el.hidden),list:!!document.querySelector('.work-task-list-pane'),calendar:!!document.querySelector('.work-calendar-agenda'),business:!!document.querySelector('#workbenchBusinessOverview')})`);
 assert.deepEqual(initial.rows,['proj-growth','proj-ops']);assert.deepEqual(initial.metrics,[2,1,2]);assert.equal(initial.tabs,0);assert.deepEqual(initial.panels,[false,false]);assert.ok(initial.list&&initial.calendar&&!initial.business);audits.initial=initial;
 await capture('workbench-desktop',1440,900);
 for(const scale of [.5,.25]){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1440,height:900,scale}});writeFileSync(resolve(out,'workbench-desktop-'+scale+'.png'),Buffer.from(shot.data,'base64'));}
 await click('[data-act="open-workbench-calendar"]');await evaluate(`new Promise(resolve=>setTimeout(resolve,500))`);
 assert.ok(await evaluate(`(()=>{const box=document.querySelector('#workbenchCalendarPane').getBoundingClientRect();return box.top>=0&&box.top<innerHeight-160;})()`));
 await evaluate(`document.querySelector('#homeWorkTaskWorkspace').scrollIntoView({block:'start'})`);await takeState('tasks-and-calendar-desktop');
 const layout=await evaluate(`(()=>{const a=document.querySelector('.work-task-list-pane').getBoundingClientRect(),b=document.querySelector('.work-task-calendar-pane').getBoundingClientRect();return {listLeft:a.left,listRight:a.right,calendarLeft:b.left,calendarRight:b.right,overviewHidden:document.querySelector('#workbenchOverviewPanel').hidden}})()`);
 assert.ok(layout.listRight<=layout.calendarLeft+2);assert.ok(layout.calendarRight<=1440);assert.equal(layout.overviewHidden,false);audits.layout=layout;
 const calendar=await evaluate(`({dates:[...document.querySelectorAll('.agenda-day')].slice(0,7).map(el=>el.dataset.taskCalendarDate),expected:getWorkCalendarDays().map(d=>d.date),today:document.querySelector('.agenda-day.is-today')?.textContent})`);assert.deepEqual(calendar.dates,calendar.expected);assert.ok(calendar.today);audits.calendar=calendar;
 await click('[data-act="work-calendar-week"][data-direction="-1"]');assert.equal(await evaluate(`workHubState.calendarWeekOffset`),-1);
 await takeState('previous-week-desktop');
 await click('[data-act="work-calendar-week"][data-direction="today"]');assert.equal(await evaluate(`workHubState.calendarWeekOffset`),0);
 const dragged=await evaluate(`(()=>{window.auditTaskOriginal={...WORK_HUB_TASKS.find(t=>t.id==='task-meeting-followup')};const day=getWorkCalendarDays()[4].date,source=document.querySelector('.work-task-list-pane [data-task-id="task-meeting-followup"][draggable]'),slot=document.querySelector('.agenda-day[data-task-calendar-date="'+day+'"]'),transfer=new DataTransfer();source.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));slot.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));return {date:WORK_HUB_TASKS.find(t=>t.id==='task-meeting-followup').scheduledDate,day,rendered:!!document.querySelector('.agenda-day[data-task-calendar-date="'+day+'"] [data-task-id="task-meeting-followup"]')};})()`);assert.equal(dragged.date,dragged.day);assert.ok(dragged.rendered);audits.dragged=dragged;
 await evaluate(`Object.assign(WORK_HUB_TASKS.find(t=>t.id==='task-meeting-followup'),window.auditTaskOriginal);renderWorkTaskCenter();window.scrollTo(0,0)`);
 await projectFilter('attention');assert.equal(await evaluate(`document.querySelectorAll('[data-workbench-project]').length`),1);await projectFilter('closed');assert.equal(await evaluate(`document.querySelectorAll('[data-workbench-project]').length`),0);await projectFilter('all');
 await click('[data-workbench-project="proj-growth"]');assert.equal(await evaluate(`document.querySelector('#modal').classList.contains('project-peek')`),true);await click('[data-act="gantt-project-tasks"]');
 assert.equal(await evaluate(`workHubState.taskContextProjectId`),'proj-growth');assert.ok(await evaluate(`document.querySelector('#homeWorkTaskWorkspace').getBoundingClientRect().top<200`));assert.equal(await evaluate(`document.querySelector('#workbenchOverviewPanel').hidden`),false);
 assert.ok(await evaluate(`[...document.querySelectorAll('.work-task-list-pane .work-task-card')].every(el=>WORK_HUB_TASKS.find(t=>t.id===el.dataset.taskId).projectId==='proj-growth')`));
 await evaluate(`clearWorkTaskFilters();window.scrollTo(0,0)`);await click('[data-executive-task="task-content-approval"] [data-act="open-work-task-detail"]');await click('#modal [data-mo]');assert.equal(await evaluate(`!!document.querySelector('[data-executive-task="task-content-approval"]')`),false);await evaluate(`WORK_HUB_TASKS.find(t=>t.id==='task-content-approval').status='pending';renderWorkTaskCenter()`);
 await evaluate(`setWorkHubAccount('acct-employee-lin')`);assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-workbench-project]')].map(el=>el.dataset.workbenchProject)`),['proj-growth']);await evaluate(`setWorkHubAccount('acct-boss')`);
 await evaluate(`new Promise(resolve=>{const timer=setInterval(()=>{if(!document.querySelector('#toasts .toast')){clearInterval(timer);resolve(true)}},100)})`);
 await capture('workbench-mobile',390,844);
 await evaluate(`document.querySelector('#homeWorkTaskWorkspace').scrollIntoView({block:'start'})`);await takeState('tasks-mobile');
 await click('[data-act="open-workbench-calendar"]');await evaluate(`new Promise(resolve=>setTimeout(resolve,500))`);await takeState('calendar-mobile');
 const mobile=await evaluate(`(()=>{const a=document.querySelector('.work-task-list-pane').getBoundingClientRect(),b=document.querySelector('.work-task-calendar-pane').getBoundingClientRect();return{scrollWidth:document.documentElement.scrollWidth,width:innerWidth,stacked:b.top>=a.bottom-2}})()`);assert.ok(mobile.scrollWidth<=mobile.width+2);assert.ok(mobile.stacked);audits.mobile=mobile;
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'audit.json'),JSON.stringify({status:'PASS',sourceSha256:server.sha256,audits,errors},null,2));console.log(JSON.stringify({status:'PASS',out,audits,errors},null,2));
}catch(error){console.error(JSON.stringify({errors},null,2));throw error;}finally{socket.close();await stopManagedBrowser(browser);}
