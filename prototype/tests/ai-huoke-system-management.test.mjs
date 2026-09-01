import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const prdDir = new URL('../../prd/pages/', import.meta.url);
const routes = ['system','members','permissions','bind','prompts','usage','logs'];
const labels = ['系统设置','成员管理','权限管理','平台账号','提示词管理','用量管理','日志与审计'];
const docs = ['设置-系统设置.md','设置-成员管理.md','设置-权限管理.md','设置-平台账号.md','设置-提示词管理.md','设置-用量管理.md','设置-日志与审计.md'];
const headings = ['页面概述','页面级业务规则','页面字段级定义','页面级操作定义','产品边界','页面级流程','通知与日志','异常与空状态','页面验收标准','技术实现提示'];

test('system management has seven approved routes in order and legacy redirect', () => {
  const nav = html.match(/data-nav-sub="settings"[\s\S]*?<\/div>/)?.[0] || '';
  let last = -1;
  for (const route of routes) { const i = nav.indexOf(`data-v="${route}"`); assert.ok(i > last, `${route} order`); last = i; }
  for (const label of labels) assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, />Agent 权限</);
  assert.match(html, /['"]agent-center['"]\s*:\s*['"]prompts['"]/);
});

test('prompt catalog exposes governed assets with full content contracts', () => {
  for (const token of ['AI_HUOKE_ENABLED_CAPABILITIES','AI_HUOKE_PROMPT_CATALOG','AI_HUOKE_PROMPT_CONTENT','sourceRef','inputContract','outputContract']) assert.match(html, new RegExp(token));
  for (const id of ['P-000','P-001','P-010','P-011','P-012','P-020','P-021','P-030','P-040','P-041','P-042','P-043','P-044','P-050','P-060']) assert.match(html, new RegExp(id));
  for (const action of ['测试 Prompt','查看配置','编辑配置','发布版本','回滚版本']) assert.match(html, new RegExp(action));
});

test('RBAC, usage and audit contracts are present', () => {
  for (const token of ['AI_HUOKE_MEMBERS','AI_HUOKE_PERMISSION_MODULES','AI_HUOKE_ROLE_GRANTS','共享总额度','子账号','操作日志','登录与安全日志','AI 调用日志','知识使用日志','导出记录','查看','编辑','测试','发布']) assert.match(html, new RegExp(token));
});

test('seven system pages have ten-section PRDs and drawer records', () => {
  for (const route of routes) assert.match(html, new RegExp(`${route}\\s*:\\s*\\{`));
  for (const file of docs) { const url = new URL(file, prdDir); assert.equal(existsSync(url), true, file); const md = readFileSync(url,'utf8'); for (const heading of headings) assert.match(md, new RegExp(`## ${heading}`), `${file}: ${heading}`); }
});
