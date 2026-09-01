import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((entries, item, index, list) => {
  if (item.startsWith('--')) entries.push([item.slice(2), list[index + 1]]);
  return entries;
}, []));
const port = Number(args.port || 9228);
const width = Number(args.width || 1440);
const height = Number(args.height || 900);
const outDir = resolve(args['out-dir'] || 'validation/page-prd-drawer');
mkdirSync(outDir, { recursive: true });

const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
const target = targets.find(item => item.type === 'page' && /^http:\/\/127\.0\.0\.1:8010\/index\.html/.test(item.url));
if (!target) throw new Error('No AI acquisition prototype page found at http://127.0.0.1:8010/index.html');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true });
  socket.addEventListener('error', rejectOpen, { once: true });
});

let nextId = 0;
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
  await new Promise(resolveWait => setTimeout(resolveWait, 220));
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(resolve(outDir, `${name}-${width}x${height}.png`), Buffer.from(result.data, 'base64'));
}

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 560 });
await send('Page.reload', { ignoreCache: true });
await new Promise(resolveWait => setTimeout(resolveWait, 900));
await evaluate(`new Promise((resolveReady,rejectReady)=>{let attempts=0;const timer=setInterval(()=>{if(document.body&&typeof go==='function'&&typeof openPagePrd==='function'){clearInterval(timer);resolveReady(true);}else if(++attempts>40){clearInterval(timer);rejectReady(new Error('page PRD runtime did not become ready'));}},100);})`);
consoleErrors.length = 0;
runtimeErrors.length = 0;

const cases = [
  ['acquisition', 'AI 获客总览'],
  ['remix', 'AI 混剪'],
  ['create', '营销视频']
];
const audits = [];
for (const [route, label] of cases) {
  await evaluate(`(() => { const login=document.querySelector('#login');if(login)login.style.display='none';go(${JSON.stringify(route)});document.querySelector('#pagePrdTrigger').click(); })()`);
  await new Promise(resolveWait => setTimeout(resolveWait, 260));
  const audit = await evaluate(`(() => {
    const drawer=document.querySelector('#pagePrdDrawer');
    const trigger=document.querySelector('#pagePrdTrigger');
    const body=document.querySelector('#pagePrdBody');
    const head=document.querySelector('.page-prd-head').getBoundingClientRect();
    const foot=document.querySelector('.page-prd-foot').getBoundingClientRect();
    const drawerRect=drawer.getBoundingClientRect();
    const triggerRect=trigger.getBoundingClientRect();
    return {
      route:${JSON.stringify(route)},
      title:document.querySelector('#pagePrdTitle').textContent.trim(),
      sectionCount:body.querySelectorAll('.page-prd-section').length,
      expanded:trigger.getAttribute('aria-expanded'),
      hidden:drawer.getAttribute('aria-hidden'),
      documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
      drawerOverflow:drawerRect.left<-2||drawerRect.right>innerWidth+2,
      headVisible:head.top>=-1&&head.bottom<=innerHeight,
      footVisible:foot.top>=0&&foot.bottom<=innerHeight+1,
      triggerAtRight:Math.abs(triggerRect.right-innerWidth)<2,
      tableScrollContainers:[...body.querySelectorAll('.page-prd-table-wrap')].every(item=>item.scrollWidth>=item.clientWidth)
    };
  })()`);
  const expectedTitle = `${label} · 页面 PRD`;
  if (audit.title !== expectedTitle) throw new Error(`${route} title mismatch: ${audit.title}`);
  if (audit.sectionCount !== 10) throw new Error(`${route} section count mismatch: ${audit.sectionCount}`);
  if (audit.expanded !== 'true' || audit.hidden !== 'false') throw new Error(`${route} drawer state mismatch`);
  if (audit.documentOverflow || audit.drawerOverflow || !audit.headVisible || !audit.footVisible || !audit.triggerAtRight || !audit.tableScrollContainers) throw new Error(`${route} layout audit failed: ${JSON.stringify(audit)}`);
  audits.push(audit);
  await screenshot(`page-prd-${route}`);
  await evaluate(`closePagePrd()`);
}

if (consoleErrors.length || runtimeErrors.length) throw new Error(`runtime errors: ${[...consoleErrors, ...runtimeErrors].join(' | ')}`);
socket.close();
process.stdout.write(`${JSON.stringify({ status: 'PASS', viewport: `${width}x${height}`, screenshots: cases.length, audits }, null, 2)}\n`);
