import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pagePrdDirectory = new URL('../../prd/pages/', import.meta.url);

const pagePrds = [
  ['AI获客-总览.md', 'acquisition'],
  ['AI获客-获客计划.md', 'plan'],
  ['AI获客-爆款追踪.md', 'burst'],
  ['AI获客-AI混剪.md', 'remix'],
  ['AI获客-营销视频.md', 'create'],
  ['AI获客-数字人.md', 'avatar']
];

const requiredSections = [
  '页面概述',
  '页面级业务规则',
  '页面字段',
  '操作与结果',
  '产品边界',
  '状态与跳转',
  '通知与日志',
  '异常与空状态',
  '页面验收标准',
  '技术评估项'
];

function assertSectionsInOrder(markdown, filename) {
  let previousIndex = -1;
  for (const section of requiredSections) {
    const index = markdown.indexOf(`## ${section}`);
    assert.ok(index > previousIndex, `${filename} must include “${section}” in the common page PRD order`);
    previousIndex = index;
  }
}

test('AI acquisition routes expose one isolated, route-aware page PRD drawer', () => {
  for (const [, route] of pagePrds) {
    assert.match(html, new RegExp(`(?:^|\\n)\\s*${route}:\\s*\\{`), `${route} needs its own page PRD data`);
  }

  for (const contract of [
    'id="pagePrdTrigger"',
    'id="pagePrdMask"',
    'id="pagePrdDrawer"',
    'data-act="open-page-prd"',
    'data-act="close-page-prd"',
    'function syncPagePrdEntry(route)',
    'function openPagePrd(trigger)',
    'function closePagePrd()'
  ]) {
    assert.match(html, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(html, /width:min\(720px,100vw\)/);
  assert.match(html, /\.page-prd-trigger\{[^}]*position:fixed[^}]*width:44px[^}]*height:92px/);
  assert.doesNotMatch(html, /id="detailDrawer"[^]*id="pagePrdBody"[^]*id="drawerBody"/);
});

test('six AI acquisition page PRDs use the shared field-level writing structure', () => {
  for (const [filename, route] of pagePrds) {
    const file = new URL(filename, pagePrdDirectory);
    assert.equal(existsSync(file), true, `${filename} must exist for route ${route}`);
    const markdown = readFileSync(file, 'utf8');
    assert.match(markdown, new RegExp(`页面 ID[：:]?[^\\n]*[\x60\"]?${route}[\x60\"]?`));
    assertSectionsInOrder(markdown, filename);
  }
});

test('current PRD indexes link marketing video and AI remix without retired page names', () => {
  const pageIndex = readFileSync(new URL('../../prd/pages/README.md', import.meta.url), 'utf8');
  const prdIndex = readFileSync(new URL('../../prd/PRD索引.md', import.meta.url), 'utf8');
  const operatingBaseline = readFileSync(new URL('../../prd/PRD_企业AI经营大脑_当前开发基线.md', import.meta.url), 'utf8');
  const currentIndexes = `${pageIndex}\n${prdIndex}\n${operatingBaseline}`;

  for (const currentName of ['AI获客-营销视频', 'AI获客-AI混剪', 'AI获客-总览']) {
    assert.match(currentIndexes, new RegExp(currentName));
  }
  assert.doesNotMatch(currentIndexes, /AI获客-短视频创作|AI获客-AI视频|短视频创作\/AI 视频/);
});
