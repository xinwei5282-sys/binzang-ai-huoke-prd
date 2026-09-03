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
      overflowElements:[...document.querySelectorAll('body *')].map(element=>{const rect=element.getBoundingClientRect();return{tag:element.tagName.toLowerCase(),id:element.id||'',className:String(element.className||'').slice(0,80),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width)}}).filter(item=>item.right>innerWidth+2).slice(0,12),
      overflowContainers:[...document.querySelectorAll('body *')].filter(element=>element.scrollWidth>element.clientWidth+2).map(element=>({tag:element.tagName.toLowerCase(),id:element.id||'',className:String(element.className||'').slice(0,80),clientWidth:element.clientWidth,scrollWidth:element.scrollWidth})).slice(0,12)
    };
  })()`);
  if (audit.visiblePages !== 1 || audit.documentOverflow || audit.pageOutside || audit.modalOutside) {
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

await evaluate(`go('kb');showKbTab('memory');renderWorkHub()`);
const memoryList = await evaluate(`(() => ({route:document.querySelector('.page.show')?.dataset.p,panelVisible:document.querySelector('[data-kbpanel="memory"]')?.classList.contains('show'),rows:document.querySelectorAll('#enterpriseMemoryList .card').length,detailButtons:document.querySelectorAll('#enterpriseMemoryList [data-act="open-enterprise-memory-detail"]').length,demo:/原型演示/.test(document.querySelector('[data-kbpanel="memory"]')?.textContent||'')}))()`);
if (memoryList.route !== 'kb' || !memoryList.panelVisible || memoryList.rows < 1 || memoryList.detailButtons < 1 || !memoryList.demo) throw new Error(`enterprise memory audit failed: ${JSON.stringify(memoryList)}`);
audits['enterprise-memory'] = await screenshot('enterprise-memory');

await evaluate(`document.querySelector('#enterpriseMemoryList [data-memory-id="mem-meeting-01"]')?.click()`);
const meetingDetail = await evaluate(`(() => {const text=document.querySelector('#modal')?.textContent||'';return{modalOpen:document.querySelector('#mask')?.classList.contains('show'),title:document.querySelector('#modalTitle')?.textContent||'',hasMinutes:text.includes('原文 / 纪要'),hasIntent:text.includes('客户意向'),hasCandidate:text.includes('候选待办')}})()`);
if (!meetingDetail.modalOpen || !meetingDetail.title.includes('会议与沟通详情') || !meetingDetail.hasMinutes || !meetingDetail.hasIntent || !meetingDetail.hasCandidate) throw new Error(`meeting detail audit failed: ${JSON.stringify(meetingDetail)}`);
audits['meeting-detail'] = await screenshot('meeting-detail');
await evaluate(`closeModal()`);

await evaluate(`setWorkHubAccount('acct-employee-lin');go('home')`);
const employeeHome = await evaluate(`(() => ({role:document.querySelector('#homeDecisionQueue')?.textContent||'',bossOnlyHidden:document.querySelector('[data-home-boss-only]')?.hidden===true}))()`);
if (!employeeHome.role.includes('我的工作提醒') || !employeeHome.bossOnlyHidden) throw new Error(`employee home audit failed: ${JSON.stringify(employeeHome)}`);
audits['employee-home'] = await screenshot('employee-home');
await evaluate(`go('kb');showKbTab('memory');renderWorkHub()`);
const privateMemory = await evaluate(`(() => ({hasPrivate:/林晓个人草稿/.test(document.querySelector('#enterpriseMemoryList')?.textContent||''),hasEnterpriseMeeting:/客户需求沟通会议/.test(document.querySelector('#enterpriseMemoryList')?.textContent||'')}))()`);
if (!privateMemory.hasPrivate || privateMemory.hasEnterpriseMeeting) throw new Error(`employee private memory audit failed: ${JSON.stringify(privateMemory)}`);
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
