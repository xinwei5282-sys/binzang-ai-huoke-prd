import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((entries, item, index, list) => {
  if (item.startsWith('--')) entries.push([item.slice(2), list[index + 1]]);
  return entries;
}, []));
const port = Number(args.port || 9228);
const width = Number(args.width || 1440);
const height = Number(args.height || 900);
const pageUrl = args.url || 'http://127.0.0.1:8010/index.html?review=prompts';
const pageOrigin = new URL(pageUrl).origin;
const outDir = resolve(args['out-dir'] || 'validation/system-management');
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
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(resolve(outDir, `${name}-${width}x${height}.png`), Buffer.from(result.data, 'base64'));
  screenshotCount += 1;
}

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 560 });
await send('Page.reload', { ignoreCache: true });
await new Promise(resolveWait => setTimeout(resolveWait, 1000));
await evaluate(`new Promise((resolveReady,rejectReady)=>{let attempts=0;const timer=setInterval(()=>{if(document.body&&typeof go==='function'&&typeof renderAiHuokePromptRows==='function'){clearInterval(timer);resolveReady(true);}else if(++attempts>50){clearInterval(timer);rejectReady(new Error('system management runtime did not become ready'));}},100);})`);
consoleErrors.length = 0;
runtimeErrors.length = 0;
await evaluate(`(() => { const login=document.querySelector('#login');if(login)login.style.display='none';document.body.classList.remove('login-active'); })()`);

const routes = [
  ['system', '系统设置'],
  ['members', '成员管理'],
  ['permissions', '权限管理'],
  ['bind', '平台账号'],
  ['prompts', '提示词管理'],
  ['usage', '用量管理'],
  ['logs', '日志与审计'],
];
const routeAudits = [];
for (const [route, label] of routes) {
  await evaluate(`go(${JSON.stringify(route)})`);
  const pageAudit = await evaluate(`(() => {
    const page=document.querySelector('.page.show');
    const trigger=document.querySelector('#pagePrdTrigger');
    const rect=page.getBoundingClientRect();
    return {route:page?.dataset.p||'',title:page?.querySelector(':scope > .lead .t')?.textContent.trim()||'',prdRoute:trigger?.dataset.pagePrdRoute||'',visiblePages:document.querySelectorAll('.page.show').length,documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,pageOutside:rect.right>innerWidth+2||rect.left<-2};
  })()`);
  if (pageAudit.route !== route || pageAudit.title !== label || pageAudit.prdRoute !== route || pageAudit.visiblePages !== 1 || pageAudit.documentOverflow || pageAudit.pageOutside) throw new Error(`${route} page audit failed: ${JSON.stringify(pageAudit)}`);
  await evaluate(`document.querySelector('#pagePrdTrigger').click()`);
  const prdAudit = await evaluate(`(() => ({title:document.querySelector('#pagePrdTitle').textContent.trim(),context:document.querySelector('#pagePrdContext').textContent.trim(),sections:document.querySelectorAll('#pagePrdBody .page-prd-section').length,route:document.querySelector('#pagePrdBody .page-prd-meta')?.textContent||'',drawerHidden:document.querySelector('#pagePrdDrawer').getAttribute('aria-hidden'),drawerOverflow:document.querySelector('#pagePrdDrawer').scrollWidth>document.querySelector('#pagePrdDrawer').clientWidth+2}))()`);
  if (prdAudit.title !== `${label} · 页面 PRD` || prdAudit.sections !== 10 || !prdAudit.route.includes(`页面键：${route}`) || prdAudit.drawerHidden !== 'false' || prdAudit.drawerOverflow) throw new Error(`${route} PRD audit failed: ${JSON.stringify(prdAudit)}`);
  routeAudits.push({ ...pageAudit, prd: prdAudit });
  await screenshot(`system-${route}-prd`);
  await evaluate(`closePagePrd()`);
}

await evaluate(`go('prompts')`);
const promptAudit = await evaluate(`(() => {
  const base=document.querySelector('[data-prompt-id="P-000"]');
  const tenant=document.querySelector('[data-prompt-id="T-010"]');
  return {count:document.querySelectorAll('#aiHuokePromptBody tr').length,totalText:document.querySelector('#aiHuokePromptCount').textContent,baseActions:[...base.querySelectorAll('[data-act]')].map(x=>x.dataset.act),tenantActions:[...tenant.querySelectorAll('[data-act]')].map(x=>x.dataset.act)};
})()`);
if (promptAudit.count < 34 || !promptAudit.totalText.includes('34') || promptAudit.baseActions.includes('edit-ai-huoke-prompt') || !promptAudit.tenantActions.includes('rollback-ai-huoke-prompt')) throw new Error(`Prompt boundary audit failed: ${JSON.stringify(promptAudit)}`);

await evaluate(`document.querySelector('[data-prompt-id="P-000"] [data-act="view-ai-huoke-prompt"]').click()`);
const baselineDetail = await evaluate(`(() => ({title:document.querySelector('#modalTitle').textContent,content:document.querySelector('.prompt-content')?.textContent||'',contract:document.querySelector('#modal .prompt-contract')?.textContent||''}))()`);
if (!baselineDetail.content.includes('企业 AI 经营大脑的安全边界') || !baselineDetail.contract.includes('输入合同') || !baselineDetail.contract.includes('真源')) throw new Error(`Baseline full-content audit failed: ${JSON.stringify(baselineDetail)}`);
await evaluate(`closeModal()`);

await evaluate(`document.querySelector('[data-prompt-id="T-010"] [data-act="edit-ai-huoke-prompt"]').click();document.querySelector('#aiHuokePromptEditor').value+='\\n验收追加：保持品牌语气。';document.querySelector('#modal [data-mo]').click()`);
await evaluate(`document.querySelector('[data-prompt-id="T-010"] [data-act="test-ai-huoke-prompt"]').click();document.querySelector('#modal [data-mo]').click()`);
const tested = await evaluate(`promptById('T-010').status`);
if (tested !== '测试通过') throw new Error(`Tenant Prompt test state mismatch: ${tested}`);
await evaluate(`document.querySelector('[data-prompt-id="T-010"] [data-act="publish-ai-huoke-prompt"]').click();document.querySelector('#modal [data-mo]').click()`);
const published = await evaluate(`({status:promptById('T-010').status,version:promptById('T-010').version,logs:AI_HUOKE_LOG_RECORDS.filter(x=>x.object==='T-010').length})`);
if (published.status !== '已发布' || published.version !== 'v1.1' || published.logs < 3) throw new Error(`Tenant Prompt publish audit failed: ${JSON.stringify(published)}`);
await evaluate(`document.querySelector('[data-prompt-id="T-010"] [data-act="rollback-ai-huoke-prompt"]').click();document.querySelector('#modal [data-mo]').click()`);
const rolledBack = await evaluate(`promptById('T-010').version`);
if (rolledBack !== 'v1.2') throw new Error(`Tenant Prompt rollback version mismatch: ${rolledBack}`);

await evaluate(`document.querySelector('#aiHuokePromptSearch').value='不存在的资产';document.querySelector('#aiHuokePromptSearch').dispatchEvent(new Event('input',{bubbles:true}))`);
const emptyVisible = await evaluate(`!document.querySelector('#aiHuokePromptEmpty').hidden`);
if (!emptyVisible) throw new Error('Prompt empty state did not appear');
await evaluate(`document.querySelector('[data-act="clear-ai-huoke-prompt-filters"]').click()`);
await evaluate(`document.querySelector('#toasts').innerHTML=''`);
await screenshot('system-prompts-governance');

await evaluate(`go('agent-center')`);
const legacyAudit = await evaluate(`({route:document.querySelector('.page.show')?.dataset.p,prd:document.querySelector('#pagePrdTrigger')?.dataset.pagePrdRoute,notice:document.querySelector('#toasts')?.textContent||''})`);
if (legacyAudit.route !== 'prompts' || legacyAudit.prd !== 'prompts' || !legacyAudit.notice.includes('已升级为提示词管理')) throw new Error(`Legacy route audit failed: ${JSON.stringify(legacyAudit)}`);

if (consoleErrors.length || runtimeErrors.length) throw new Error(`Runtime errors: ${[...consoleErrors, ...runtimeErrors].join(' | ')}`);
socket.close();
process.stdout.write(`${JSON.stringify({ status: 'PASS', viewport: `${width}x${height}`, screenshots: screenshotCount, promptAudit, published, rolledBack, legacyAudit, routeAudits }, null, 2)}\n`);
