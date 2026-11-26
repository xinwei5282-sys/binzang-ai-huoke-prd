import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mobile = readFileSync(new URL('../mobile.html', import.meta.url), 'utf8');

test('backoffice no longer exposes the unfinished mobile H5 from customer navigation', () => {
  const navigation = html.match(/<nav>[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.doesNotMatch(navigation, /移动端体验|mobile\.html/);
  assert.doesNotMatch(html, /data-p="mobile-experience"/);
  for (const token of ['结果先行', '快速画像', '企业诊断', '最近成果', '移动端导航', '和 AI 说说企业', '对话式企业补充']) assert.match(mobile, new RegExp(token));
  assert.match(mobile, /viewport-fit=cover/);
  assert.match(mobile, /env\(safe-area-inset-bottom\)/);
  assert.match(mobile, /min-height:48px/);
});

test('backoffice shell keeps the approved compact system', () => {
  for (const token of [
    '--sidebar-w:228px', '--topbar-h:56px', '--page-pad:28px',
    '--panel-radius:6px', '--control-h:36px', '--row-h:44px',
    '--drawer-w:560px', '--motion-fast:140ms', '--motion-base:220ms'
  ]) assert.ok(html.includes(token), `missing ${token}`);
  assert.match(html, /PingFang SC.*HarmonyOS Sans SC.*Microsoft YaHei/);
});

test('workbench prioritizes business overview and actionable tasks', () => {
  const home = html.match(/<section class="page show" data-p="home"([\s\S]*?)<section class="page" data-p="plan">/)?.[1] ?? '';
  for (const label of ['项目总览', '待办事项']) {
    assert.match(home, new RegExp(label));
  }
  assert.doesNotMatch(home, /id="agentPrompt"|agent-command-bar|企业 Agent 学习建议/);
  assert.doesNotMatch(home, /id="workbenchQuickActions"|workbench-quick-action/);
  assert.match(home, /id="workbenchOverviewPanel"/);
  assert.match(home, /id="workbenchProgress"/);
  assert.match(home, /id="workTaskCenter"/);
  assert.match(home, /id="workTaskFilter"/);
  assert.match(home, /id="workbenchProgressItems"/);
  assert.doesNotMatch(home, /metric-line|home-grid/);
});

test('AI acquisition is a task workspace rather than a feature-card launcher', () => {
  const section = html.match(/<section class="page" data-p="acquisition"([\s\S]*?)<section class="page show" data-p="home"/)?.[1] ?? '';
  assert.match(section, /class="workspace-toolbar"/);
  assert.match(section, /class="workspace-surface"/);
  for (const label of ['任务名称', '当前阶段', '知识依据', '人工确认']) assert.match(section, new RegExp(label));
  for (const cls of ['workspace-summary', 'workspace-frame', 'workspace-aside', 'workspace-state']) assert.match(section, new RegExp(cls));
  assert.match(section, /id="acquisitionLoading"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(section, /id="acquisitionError"[^>]*role="alert"/);
  assert.match(html, /function refreshAcquisition\(/);
  assert.doesNotMatch(section, /class="outcome-grid"/);
});

test('marketing material workspace keeps only channel work and honest delivery boundaries', () => {
  const section = html.match(/<section class="page" data-p="marketing-materials"([\s\S]*?)<section class="page" data-p="acquisition"/)?.[1] ?? '';
  for (const label of ['PPT', '朋友圈图文', '海报', '公众号文章', '导出图文包', '审核文章', '发布与数据回收']) assert.match(section, new RegExp(label));
  assert.doesNotMatch(section, /data-content-factory="shared"|统一内容底座|Content Factory V1/);
});

test('enterprise brain follows the governed diagnosis-to-evolution flow', () => {
  const section = html.match(/<section class="page" data-p="kb"([\s\S]*?)<section class="page" data-p="avatar"/)?.[1] ?? '';
  for (const label of ['诊断总览', '企业 VI', '企业知识', '外部情报', '进化与治理', '正式知识', '资料与待处理', '待确认', '维护中心', '版本冲突', '即将到期', '负责人']) {
    assert.match(section, new RegExp(label));
  }
  for (const state of ['待确认', '处理中', '处理失败', '严格受限']) assert.match(html, new RegExp(state));
  assert.match(section, /来源：2026 产品报价\.xlsx/);
  assert.match(section, /修改会提示受影响的 Agent 与工作流/);
});

test('enterprise knowledge exposes intake evidence and an honest governance boundary', () => {
  const section = html.match(/<section class="page" data-p="kb"([\s\S]*?)<section class="page" data-p="avatar"/)?.[1] ?? '';
  for (const label of ['AI 已了解的企业信息', '企业身份', '业务、产品与客户', '获客与经营', '目标、资源与品牌', '资料与待处理', '企业知识可用性']) {
    assert.match(section, new RegExp(label));
  }
  for (const decision of ['auto_usable', 'draft_only', 'quarantined']) assert.match(html, new RegExp(decision));
  assert.match(html, /function renderEnterpriseKnowledgeOverview/);
  assert.match(html, /function renderKnowledgeEvidenceSummary/);
  assert.match(section, /原型演示 · 待接入/);
});

test('enterprise brain keeps the approved five-entry navigation', () => {
  const section = html.match(/<section class="page" data-p="kb"([\s\S]*?)<section class="page" data-p="avatar"/)?.[1] ?? '';
  const subnav = section.match(/<div class="subnav">([\s\S]*?)<\/div>/)?.[1] ?? '';
  for (const label of ['诊断总览', '企业 VI', '企业知识', '外部情报', '进化与治理']) assert.match(subnav, new RegExp(label));
  for (const label of ['资料与待处理', '正式知识']) assert.doesNotMatch(subnav, new RegExp(label));
  assert.match(section, /id="kbDataView"/);
  assert.match(section, /企业大脑/);
  assert.match(section, /class="kb-data-tabs"/);
  assert.match(html, /function showKbDataView/);
  assert.match(html, /function placeKbDataView/);
  assert.match(section, /data-act="kb-data-tab"/);
  for (const label of ['资料与待处理', '正式知识']) assert.match(section, new RegExp('data-act="kb-data-tab"[^>]*>[^<]*'+label));
});

test('enterprise brain keeps source actions available', () => {
  const section = html.match(/<section class="page" data-p="kb"([\s\S]*?)<section class="page" data-p="avatar"/)?.[1] ?? '';
  const lead = section.match(/<div class="lead">([\s\S]*?)<\/div>\s*<div class="subnav">/)?.[1] ?? '';
  assert.match(lead, /连接数据源|上传资料|上传企业资料/);
});

test('knowledge tabs do not duplicate source actions after the tab strip', () => {
  const section = html.match(/<section class="page" data-p="kb"([\s\S]*?)<section class="page" data-p="avatar"/)?.[1] ?? '';
  const dataView = section.match(/<div class="card pad" id="kbDataView"([\s\S]*?)<\/div>\s*<div class="card pad">/)?.[0] ?? '';
  assert.doesNotMatch(dataView, /连接数据源/);
  assert.doesNotMatch(dataView, /data-act="open-kb-upload"/);
  assert.doesNotMatch(dataView, /知识库内容和待确认统一在这里处理/);
  assert.match(html, /\.kb-data-tabs\{display:flex;align-items:center;gap:2px;flex-wrap:wrap;border-bottom/);
});

test('uploaded source candidates are inserted into the source-centered work queue', () => {
  assert.match(html, /id="knowledgeWorkQueue"/);
  assert.match(html, /function appendKbReviewCandidate/);
  assert.match(html, /appendKbReviewCandidate\(f,ty\)/);
  assert.match(html, /来源定位/);
});

test('standard drawer and interaction states are accessible', () => {
  assert.match(html, /id="detailDrawer"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /function openDrawer\(/);
  assert.match(html, /function closeDrawer\(/);
  assert.match(html, /data-act="open-drawer"/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html, /\.inp:focus-visible/);
});

test('project and office workflow forms reuse the standard form controls', () => {
  for (const file of ['project-reports-demo.js', 'office-workflow-demo.js', 'project-progress-demo.js', 'project-materials-demo.js']) {
    const source = readFileSync(new URL('../assets/' + file, import.meta.url), 'utf8');
    const controls = [...source.matchAll(/<(?:input|textarea|select)\b[^>]*>/g)]
      .map(([control]) => control)
      .filter(control => !/\btype="(?:checkbox|radio|hidden|file)"/.test(control));
    assert.ok(controls.length, file + ' should contain form controls');
    for (const control of controls) {
      assert.match(control, /\bclass="[^"]*\binp\b/, file + ' should use the standard input class');
    }
    assert.doesNotMatch(source, /\.pr-field\s+(?:textarea|input)\b/);
  }
});

test('workbench and project filters share the dropdown chrome and toolbar width', () => {
  assert.match(html, /<select class="inp filter-width" id="workTaskFilter"/);
  assert.match(html, /<details class="project-filter filter-width" id="projectFilterMenu"><summary class="inp dropdown-trigger"/);
  assert.match(html, /:is\(select\.inp:not\(\[multiple\]\):not\(\[size\]\),summary\.inp\.dropdown-trigger\)\{[^}]*appearance:none[^}]*padding-inline-end:32px[^}]*background-image:url[^}]*background-position:right 11px center/);
  assert.match(html, /\.filter-width\{width:160px/);
  assert.doesNotMatch(html, /\.project-filter>summary::after/);
});

test('workbench project metrics are the sole filters above the project rows', () => {
  assert.match(html, /id="projectOverviewMetrics"[^>]*><\/div>\s*<div[^>]*id="workbenchProjectRows"/);
  assert.match(html, /data-act="filter-work-project-progress"[^>]*aria-controls="workbenchProjectRows"/);
  assert.doesNotMatch(html, /workbenchProjectScope|workbenchProjectFilters/);
});

test('text buttons do not append decorative navigation arrows', () => {
  assert.match(html, /<button class="btn" data-act="open-customer-management-projects">管理项目<\/button>/);
  const projectProgress = readFileSync(new URL('../assets/project-progress-demo.js', import.meta.url), 'utf8');
  for (const source of [html, projectProgress]) {
    assert.doesNotMatch(source, /<button\b[^>]*>[^<]+\s[↗→↓]\s*<\/button>/);
  }
});

test('desktop and mobile typography maintain separate size and leading values', () => {
  assert.match(html, /--ui-title-size:24px;--ui-section-size:18px;--ui-body-size:14px;--ui-meta-size:12px/);
  assert.match(html, /@media\(max-width:760px\)\{\s*:root\{\s*--ui-title-size:24px;--ui-section-size:18px;--ui-body-size:16px;--ui-meta-size:14px/);
  assert.match(html, /--ui-body-leading:1\.55/);
  assert.match(html, /--ui-body-leading:1\.6/);
});

test('work, schedule, project, and channel styles use semantic font sizes', () => {
  assert.match(html, /\.page\[data-p="projects"\][^\n]*\s+\.mini,\.tm,\.bdg,\.perm,small[^{}]+\{font-size:var\(--ui-meta-size\)/);
  const reports = readFileSync(new URL('../assets/project-reports-demo.js', import.meta.url), 'utf8');
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n');
  const component = /\.(?:workbench-|home-workbench-|work-task-|work-calendar-|project-|schedule-|agenda-|gantt-|oa-|pf-|mat-|pr-|calendar-task-|calendar-navigation|week-calendar-note|customer-list-table|executive-project-)/;
  for (const [, selector, declarations] of (styles + '\n' + reports).matchAll(/([^{}\n]+)\{([^{}\n]+)\}/g)) {
    if (component.test(selector)) assert.doesNotMatch(declarations, /font-size:\s*[\d.]+(?:px|rem|em)\b/, selector);
  }
});

test('project table headers, milestone dates, and row actions use body typography', () => {
  assert.match(html, /\.project-list-table :is\(thead th,\.project-list-deadlines,\.rowact>\.btn\)[^{}]+\{\s*font-size:var\(--ui-body-size\)/);
  assert.match(html, /<small class="project-list-deadlines">原定/);
  assert.match(html, /<button class="btn" data-act="open-work-project"[^>]+>查看项目/);
});

test('primary navigation and form labels use native accessible semantics', () => {
  const navigation = html.match(/<nav>[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.doesNotMatch(navigation, /<a(?![^>]*\bhref=)[^>]*data-v=/);
  for (const route of ['home', 'brand-planning', 'marketing-materials', 'acquisition', 'kb', 'settings']) {
    assert.match(navigation, new RegExp(`<button[^>]*type="button"[^>]*data-v="${route}"`));
  }
  assert.doesNotMatch(navigation, /data-v="enterprise-profile"/);
  assert.match(html, /function bindFormLabels\(\)/);
  assert.match(html, /label\.htmlFor=control\.id/);
  assert.match(html, /bindFormLabels\(\);/);
});

test('the V1.0 style layer contains no raw hexadecimal colors', () => {
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n');
  assert.doesNotMatch(styles, /#[0-9a-fA-F]{3,8}\b/);
});

test('narrow layouts do not force page-wide desktop width', () => {
  assert.doesNotMatch(html, /html\{[^}]*min-width:1024px/);
  assert.doesNotMatch(html, /body\{[^}]*min-width:1024px/);
  assert.doesNotMatch(html, /\.app\{[^}]*min-width:1024px/);
  assert.match(html, /@media\(max-width:560px\)[\s\S]*min-height:44px/);
});

test('prototype labels simulated capabilities and recovery states honestly', () => {
  assert.match(html, /能力演示 · 待接入/);
  assert.match(html, /部分成功/);
  assert.match(html, /只重试失败镜头/);
  assert.doesNotMatch(html, /本地 Codex 已连接|设备在线|自动发布成功/);
});

test('V1.0 migration layer governs every routed page and legacy surface family', () => {
  assert.match(html, /V1\.0 full migration layer/);
  const pages = [...html.matchAll(/<section class="page[^\"]*" data-p="([^"]+)"/g)].map(match => match[1]);
  assert.ok(pages.length >= 16, `expected all retained routed workspaces, got ${pages.length} pages`);
  assert.equal(new Set(pages).size, pages.length, 'page routes must remain unique');
  for (const family of [
    '.card,.tile,.atile,.burst,.dis',
    '.workspace-toolbar,.toolbar',
    '.workspace-surface,.artifact-list',
    '.modal,.drawer,.toast',
    '.wizard-steps,.kb-onboarding-steps'
  ]) assert.ok(html.includes(family), `missing migration coverage for ${family}`);
  assert.doesNotMatch(html, /var\(--control-radius\)/);
});
