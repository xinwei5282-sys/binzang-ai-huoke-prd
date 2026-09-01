import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const prdDir = new URL('../../prd/pages/', import.meta.url);
const routes = ['system', 'members', 'permissions', 'bind', 'prompts', 'usage', 'logs'];
const labels = ['系统设置', '成员管理', '权限管理', '平台账号', '提示词管理', '用量管理', '日志与审计'];
const docs = ['设置-系统设置.md', '设置-成员管理.md', '设置-权限管理.md', '设置-平台账号.md', '设置-提示词管理.md', '设置-用量管理.md', '设置-日志与审计.md'];
const retiredDocs = ['设置-Agent权限.md', '设置-企业设置.md', '设置-成员与权限.md', '设置-用量与套餐.md', '设置-帮助与服务.md'];
const headings = ['页面概述', '页面级业务规则', '页面字段级定义', '页面级操作定义', '产品边界', '页面级流程', '通知与日志', '异常与空状态', '页面验收标准', '技术实现提示'];
const pagePrdContexts = [
  'home',
  'brand-report', 'operating-plan',
  'material-ppt', 'material-moments', 'material-poster', 'material-wechat',
  'acquisition', 'plan', 'burst', 'remix', 'create', 'avatar',
  'kb-diagnosis', 'kb-cognition', 'kb-content', 'kb-intelligence', 'kb-evolution',
  'studio', 'tune', 'works',
  ...routes,
];

function pageRoutes() {
  return [...html.matchAll(/<section\s+class="page(?:\s+show)?"[^>]*data-p="([^"]+)"/g)].map(match => match[1]);
}

test('system management has seven approved routes in order with no duplicate pages', () => {
  const nav = html.match(/data-nav-sub="settings"[\s\S]*?<\/div>/)?.[0] || '';
  let last = -1;
  for (const [index, route] of routes.entries()) {
    const position = nav.indexOf(`data-v="${route}"`);
    assert.ok(position > last, `${route} order`);
    assert.match(nav, new RegExp(`data-v="${route}"[^>]*>${labels[index]}`));
    last = position;
  }
  const routedPages = pageRoutes();
  assert.equal(new Set(routedPages).size, routedPages.length, 'page routes must be unique');
  for (const route of routes) assert.equal(routedPages.filter(value => value === route).length, 1, `${route} page count`);
  assert.doesNotMatch(nav, /Agent 权限|Agent 中心|成员与权限|用量与套餐|帮助与服务/);
});

test('legacy settings routes normalize before page lookup and PRD lookup', () => {
  assert.match(html, /const LEGACY_SYSTEM_ROUTES=\{settings:'system',member:'members','agent-center':'prompts'\}/);
  assert.match(html, /function normalizeSystemRoute\(/);
  assert.match(html, /function go\(v\)\{[\s\S]{0,180}normalizeSystemRoute\(v\)/);
  assert.match(html, /function reviewState\(state\)\{[\s\S]{0,500}normalizeSystemRoute/);
  assert.doesNotMatch(html, /<section\s+class="page(?:\s+show)?"[^>]*data-p="(?:settings|member|agent-center)"/);
});

test('system identity, members and SaaS RBAC expose complete management contracts', () => {
  for (const token of ['enterprise_name', 'enterprise_short_name', 'unified_social_credit_code', 'registered_address', 'contact_name', 'contact_phone']) assert.match(html, new RegExp(token));
  for (const token of ['AI_HUOKE_MEMBERS', 'AI_HUOKE_PERMISSION_MODULES', 'AI_HUOKE_ROLE_GRANTS', 'add-system-member', 'edit-system-member-roles', 'toggle-system-member', 'reset-system-member-password', 'create-system-role', 'edit-system-role', 'copy-system-role', 'delete-system-role', 'permission-parent', 'permission-child']) assert.match(html, new RegExp(token));
  for (const permission of ['查看', '编辑', '测试', '发布']) assert.match(html, new RegExp(`prompts[^\\n]{0,220}${permission}`));
  assert.match(html, /成员最终权限为所分配角色权限并集/);
});

test('role permissions edit in an independent modal instead of an always-visible list panel', () => {
  assert.doesNotMatch(html, /<div class="permission-layout">[\s\S]*?class="[^"]*permission-builder/);
  assert.match(html, /function openSystemRoleEditor\(/);
  assert.match(html, /modal\('编辑角色 · '/);
});

test('prompt catalog covers every approved function cluster with full governed content', () => {
  for (const token of ['AI_HUOKE_ENABLED_CAPABILITIES', 'AI_HUOKE_PROMPT_CATALOG', 'AI_HUOKE_PROMPT_CONTENT', 'sourceRef', 'inputContract', 'outputContract', 'visibleToCurrentAccount']) assert.match(html, new RegExp(token));
  for (const id of ['P-000', 'P-001', 'P-010', 'P-011', 'P-012', 'P-020', 'P-021', 'P-030', 'KG-001', 'KG-002', 'KG-003', 'KG-004', 'KG-005', 'KG-006', 'KG-007', 'P-040', 'P-041', 'M-010', 'M-020', 'M-021', 'M-030', 'M-031', 'M-032', 'M-040', 'A-010', 'A-020', 'P-042', 'P-043', 'P-044', 'A-030', 'A-031', 'P-050', 'P-060', 'T-010']) assert.match(html, new RegExp(id));
  for (const action of ['filter-ai-huoke-prompts', 'clear-ai-huoke-prompt-filters', 'view-ai-huoke-prompt', 'edit-ai-huoke-prompt', 'test-ai-huoke-prompt', 'publish-ai-huoke-prompt', 'rollback-ai-huoke-prompt']) assert.match(html, new RegExp(action));
  assert.match(html, /平台基线 · 可创建租户版本/);
  assert.match(html, /function canManageAiHuokePrompt\(/);
  assert.match(html, /租户覆盖 · 基于平台基线/);
  assert.match(html, /租户可配置/);
  assert.match(html, /合规检查[^\n]{0,300}温度 0(?:\.0)?/);
  assert.match(html, /非 Prompt 驱动/);
});

test('usage and audit expose account-level management and five log families', () => {
  for (const token of ['共享总额度', '已用量', '剩余额度', '活跃子账号', 'AI_HUOKE_USAGE_MEMBERS', 'set-member-usage-cap', '额度调整记录', '平台增加额度']) assert.match(html, new RegExp(token));
  for (const token of ['操作日志', '登录与安全日志', 'AI 调用日志', '知识使用日志', '导出记录', 'filter-ai-huoke-logs', 'clear-ai-huoke-log-filters', 'view-ai-huoke-log', 'export-ai-huoke-logs', 'export-ai-huoke-log-report']) assert.match(html, new RegExp(token));
});

test('seven system pages have field-level PRDs, current indexes and distinct drawer records', () => {
  for (const file of docs) {
    const url = new URL(file, prdDir);
    assert.equal(existsSync(url), true, file);
    const md = readFileSync(url, 'utf8');
    assert.ok(md.split('\n').length >= 80, `${file} must be field-level, not a summary stub`);
    for (const heading of headings) assert.match(md, new RegExp(`## ${heading}`), `${file}: ${heading}`);
  }
  for (const file of retiredDocs) assert.equal(existsSync(new URL(file, prdDir)), false, `${file} retired`);
  for (const indexFile of ['README.md', '../PRD索引.md']) {
    const source = readFileSync(new URL(indexFile, prdDir), 'utf8');
    for (const file of docs) assert.match(source, new RegExp(file.replace('.md', '')), `${indexFile}: ${file}`);
    for (const file of retiredDocs) assert.doesNotMatch(source, new RegExp(file.replace('.md', '')), `${indexFile}: ${file}`);
  }
  assert.match(html, /Object\.assign\(PAGE_PRD_CONTENT,\{/);
  for (const route of routes) assert.match(html, new RegExp(`\\n\\s*${route}:\\{\\n\\s*label:`), `drawer PRD: ${route}`);
});

test('every reachable page and subpage has its own page PRD context', () => {
  const source = html.match(/const PAGE_PRD_CONTENT=\{[\s\S]*?\n\}\);\nlet pagePrdTriggerBeforeOpen/)?.[0] || '';
  const keys = new Set([...source.matchAll(/^  ['"]?([a-z][a-z-]*)['"]?:\{/gm)].map(match => match[1]));
  const missing = pagePrdContexts.filter(context => !keys.has(context));
  assert.deepEqual(missing, [], `missing page PRDs: ${missing.join(', ')}`);
});
