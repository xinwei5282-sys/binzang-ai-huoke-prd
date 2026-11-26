import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { waitForPrototypeTarget } from './lib/managed-browser.mjs';

const { values } = parseArgs({ options: {
  port: { type: 'string' }, width: { type: 'string' }, height: { type: 'string' },
  url: { type: 'string', default: 'http://127.0.0.1:8010/index.html' },
} });
const width = Number(values.width);
const height = Number(values.height);
const mobile = width <= 760;
const size = { title: '24px', section: '18px', body: mobile ? '16px' : '14px', meta: mobile ? '14px' : '12px' };
const target = await waitForPrototypeTarget(Number(values.port), 8000, values.url);
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

const pending = new Map();
const runtimeErrors = [];
let requestId = 0;
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
  const request = pending.get(message.id);
  if (!request) return;
  clearTimeout(request.timer);
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out`));
    }, 8000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function click(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}

async function checkFonts(area, expectations) {
  for (const [selector, role] of Object.entries(expectations)) {
    const actual = await evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})]
      .filter(element => element.getClientRects().length)
      .map(element => getComputedStyle(element).fontSize)`);
    assert.ok(actual.length, `${width}px ${area}: no rendered match for ${selector}`);
    assert.deepEqual([...new Set(actual)], [size[role]], `${width}px ${area}: ${selector} must use ${role} (${size[role]})`);
  }
}

try {
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  const deadline = Date.now() + 8000;
  while (!await evaluate("typeof reviewState === 'function' && typeof renderWorkProjectList === 'function'")) {
    if (Date.now() >= deadline) throw new Error('Prototype workspace did not finish loading');
    await delay(100);
  }
  await evaluate("reviewState('home');setWorkHubAccount('acct-boss');clearWorkTaskFilters()");
  assert.equal(await evaluate("document.body.classList.contains('login-active')"), false);
  await click('[data-act=filter-work-task-status][data-status=pending]');
  const tasks = '#homeWorkTaskWorkspace';
  await checkFonts('工作台待办', {
    [`${tasks} .work-task-card-copy b`]: 'body',
    [`${tasks} .work-task-due`]: 'body',
    [`${tasks} .work-task-card .bdg`]: 'meta',
    [`${tasks} .workbench-status-toggle span`]: 'body',
    [`${tasks} .workbench-status-toggle b`]: 'meta',
    [`${tasks} .work-calendar-time`]: 'meta',
    [`${tasks} .work-calendar-day span`]: 'meta',
  });
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.work-task-card-top')].slice(0,2).map(card=>card.querySelector('.bdg:last-child')?.textContent)`), ['待决策', '待审批']);
  assert.equal(await evaluate("document.querySelector('.workbench-heading-tools [data-act=open-customer-management-projects]').textContent"), '管理项目');
  const taskDropdown = await evaluate("getComputedStyle(document.querySelector('#workTaskFilter')).backgroundImage");
  assert.notEqual(taskDropdown, 'none');

  await click('.workbench-heading-tools [data-act=open-customer-management-projects]');
  await click('[data-view-key=portfolio][data-view-value=list]');
  const table = '.project-list-table';
  await checkFonts('项目管理列表', {
    ...(!mobile && { [`${table} thead th`]: 'body' }),
    [`${table} tbody td`]: 'body',
    [`${table} tbody td:first-child b`]: 'body',
    '.schedule-portfolio .schedule-switch .btn': 'body',
    [`${table} .project-list-deadlines`]: 'body',
    [`${table} .bdg`]: 'meta',
    [`${table} .rowact>.btn`]: 'body',
  });
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#projectFilterMenu summary')).backgroundImage"), taskDropdown);
  await click('#projectFilterMenu summary');
  assert.equal(await evaluate("document.querySelector('#projectFilterMenu').open"), true);
  await click('#projectFilterMenu summary');

  await click('[data-view-key=portfolio][data-view-value=gantt]');
  await checkFonts('项目甘特图', {
    '.schedule-row-title': 'body',
    '.schedule-axis time': 'meta',
    '.schedule-legend': 'meta',
  });
  await click('[data-view-key=portfolio][data-view-value=calendar]');
  await checkFonts('项目日历', {
    '.schedule-calendar-head h4': 'section',
    '.schedule-calendar>b': 'meta',
    '.schedule-day time': 'meta',
    '.schedule-calendar-head .schedule-switch .btn': 'body',
  });
  await click('[data-view-key=portfolio][data-view-value=list]');
  await click('.project-list-table [data-act=open-work-project][data-project-id=proj-growth]');
  await click('[data-project-tab=decisions]');
  await checkFonts('项目审批与决策', { '#project-panel-decisions .perm': 'meta' });
  await click('[data-project-tab=overview]');
  await checkFonts('项目概览', { '.project-detail-heading h2': 'title', '#project-panel-overview small': 'meta' });
  const detailTabs = [
    ['overview', '.project-summary-main h3', 'section'],
    ['work-items', '.project-current-tasks h4', 'section'],
    ['schedule', '.schedule-heading h4', 'section'],
    ['reports', '.pr-section-title h3', 'section'],
    ['decisions', '.project-panel h3', 'section'],
    ['stage', '.project-delivery-summary h3', 'section'],
  ];
  for (const [tab, heading, role] of detailTabs) {
    await click(`[data-project-tab=${tab}]`);
    const panel = `#project-panel-${tab}:not([hidden])`;
    await checkFonts(`详情 ${tab}`, {
      [`${panel} ${heading}`]: role,
      [`${panel} .btn`]: 'body',
    });
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'), true, tab);
  }
  await click('#pagePrdTrigger');
  await checkFonts('项目详情 PRD', {
    '#pagePrdDrawer.show .page-prd-head h2': 'section',
    '#pagePrdDrawer.show .page-prd-overview dt': 'meta',
    '#pagePrdDrawer.show .page-prd-overview dd': 'body',
    '#pagePrdDrawer.show .page-prd-table td': 'body',
  });
  await click('#pagePrdDrawer [data-act=close-page-prd]');
  await click('.top-path-back');
  assert.equal(await evaluate("document.querySelector('#projectPortfolioHeading').hidden"), false);

  await click('[data-act=create-work-project]');
  await checkFonts('创建项目', {
    '#mask.show #modal h4': 'section',
    '#modal .project-create-progress span': 'body',
    '#modal .field label': 'meta',
    '#modal input.inp': 'body',
  });
  await click('#modal [data-mc]');

  await click('.project-list-table [data-act=open-work-project][data-project-id=proj-eight-stage-acceptance-demo]');
  assert.equal(await evaluate(`document.querySelectorAll('#project-panel-overview [data-tab="work-items"],#project-panel-overview [data-tab="schedule"]').length`), 0);
  await click('[data-project-tab=work-items]');
  assert.equal(await evaluate("document.querySelectorAll('#project-panel-work-items [data-act=open-project-task-list]').length"), 0);
  if (mobile) {
    assert.equal(await evaluate(`(() => {
      const trigger = document.querySelector('#pagePrdTrigger');
      const workspace = document.querySelector('.project-detail-workspace');
      return getComputedStyle(trigger).position === 'fixed' &&
        workspace.getBoundingClientRect().right < trigger.getBoundingClientRect().left;
    })()`), true, 'right-side PRD must not overlap project content');
  }
  await click('[data-project-tab=stage]');
  await evaluate(`(() => {
    const jump = document.querySelector('#projectDeliveryJump');
    jump.value = 'project-delivery-acceptance';
    jump.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  assert.equal(await evaluate("document.activeElement.id"), 'project-delivery-acceptance');
  await click('.top-path-back');

  await evaluate("go('channel-settings')");
  for (const provider of ['wecom', 'feishu', 'dingtalk']) {
    await click(`[data-act=oa-select][data-provider=${provider}]`);
    await checkFonts(`渠道设置 ${provider}`, {
      '#officeConnectionForm .field input': 'body',
      '#officeConnectionForm .field label': 'meta',
      '#officeConnectionForm .mini': 'meta',
    });
  }
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'), true);
  assert.deepEqual(runtimeErrors, []);
  console.log(`PASS ${width}x${height}: workbench, project list, Gantt, project detail and three channel settings`);
} finally {
  socket.close();
}
