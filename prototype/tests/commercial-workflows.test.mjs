import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('content creation is split into two complete workflows', () => {
  for (const phrase of ['营销场景生成', '数字人混剪']) assert.match(html, new RegExp(phrase));
  assert.match(html, /data-p="create"/);
  assert.match(html, /data-p="remix"/);
  for (const id of ['marketingCover', 'marketingTitle', 'marketingBody', 'remixCover', 'remixCaption']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /data-act="submit-remix"/);
});

test('trend discovery stays in AI acquisition without a duplicate automation workspace', () => {
  assert.match(html, /data-p="burst"/);
  assert.match(html, /data-p="create"/);
  assert.doesNotMatch(html, /data-p="automation"/);
  assert.doesNotMatch(html, /data-act="approve-automation"/);
  assert.doesNotMatch(html, /data-act="run-automation"/);
});

test('unfinished AI sales workspace is removed while approval boundaries remain visible', () => {
  assert.doesNotMatch(html, /data-p="sales-agent"/);
  assert.doesNotMatch(html, /data-act="takeover-lead"/);
  assert.match(html, /需要老板审批/);
  assert.match(html, /对外发布/);
});

test('PPT and moments are separate workspaces with clear ownership', () => {
  for (const phrase of ['PPT 创建', '朋友圈图文', '完整封面', '大纲审核', '正文与 CTA', '预览 / 编辑', '下载 PPTX', 'PPT Agent', '朋友圈图文 Agent']) {
    assert.match(html, new RegExp(phrase));
  }
  assert.match(html, /data-subview-panel="material-ppt"/);
  assert.match(html, /data-subview-panel="material-moments"/);
  assert.doesNotMatch(html, /<div class="t">PPT \/ 朋友圈 Agent<\/div>/);
  assert.match(html, /data-act="generate-ppt-outline"/);
  assert.match(html, /data-act="approve-ppt-outline"/);
  assert.doesNotMatch(html, /data-act="submit-studio-review"/);
});

test('moments workspace covers creation, platform adaptation, review and export', () => {
  for (const token of ['new-moments', 'momentsList', 'graphicTopic', 'graphicReferenceFiles', 'preview-graphic', 'edit-graphic', 'export-graphic', 'pick-graphic-reference', '提交人工审核']) {
    assert.match(html, new RegExp(token));
  }
  assert.match(html, /data-act="pick-edit-graphic-body"/);
  assert.match(html, /multiple hidden/);
});

test('moments workspace keeps only creation review and file export', () => {
  const moments = html.match(/<div class="subview" data-subview-panel="material-moments">([\s\S]*?)<div class="subview" data-subview-panel="material-poster">/)?.[1] ?? '';
  for (const label of ['新建朋友圈图文', '图文内容', '状态', '预览', '编辑', '导出图文包']) assert.match(moments, new RegExp(label));
  for (const removed of ['发布与结果回收', '已发布', '阅读/互动', '新增咨询', '有效线索', '发布前确认', 'workspace-summary', 'workflow-ribbon', 'workspace-aside']) assert.doesNotMatch(moments, new RegExp(removed));
  assert.match(html, /page\.classList\.toggle\('focused-material-active',\['material-moments','material-poster','material-wechat'\]\.includes\(name\)\)/);
});

test('poster stays file-only and WeChat publishes by account with article-level results', () => {
  const poster = html.match(/<div class="subview" data-subview-panel="material-poster">([\s\S]*?)<div class="subview" data-subview-panel="material-wechat">/)?.[1] ?? '';
  const wechat = html.match(/<div class="subview" data-subview-panel="material-wechat">([\s\S]*?)<\/section>/)?.[1] ?? '';
  for (const label of ['新建海报', '海报内容', '状态', '预览', '编辑', '下载']) assert.match(poster, new RegExp(label));
  for (const label of ['新建公众号文章', '发布账号', '发布状态', '阅读', '分享', '预览', '编辑', '审核并发布']) assert.match(html, new RegExp(label));
  for (const removed of ['发布前确认', '已发布', '发布失败', '待发布', 'workspace-aside', 'material-statebar', '剩余 10 次', '重新生成']) assert.doesNotMatch(poster, new RegExp(removed));
  for (const token of ['wechat-integration-bar', 'wechatAccountStatus', 'wechatAutoPublish', 'PLATFORM_ACCOUNTS', 'graphicPublishingAccount', 'data-wechat-read', 'data-wechat-share', 'publish-wechat', 'sync-wechat-article']) assert.match(html, new RegExp(token));
});

test('graphic content channels share one internal task contract without promotional UI', () => {
  for (const token of ['CONTENT_FACTORY_CHANNELS', 'createContentFactoryTask', 'content-factory-v1', 'enterprise-knowledge', 'brand-visual', 'asset-library', 'compliance-policy', 'review-and-results']) {
    assert.match(html, new RegExp(token));
  }
  for (const channel of ['wechat', 'moments', 'poster', 'ppt']) assert.match(html, new RegExp(`${channel}:\\{`));
  assert.doesNotMatch(html, /不同入口调用不同 Agent，底层共用/);
});

test('WeChat and moments use the same graphic editor interaction', () => {
  for (const token of ['openGraphicComposer', 'previewGraphic', 'editGraphic', 'pick-graphic-reference', 'preview-graphic', 'edit-graphic', 'export-graphic', 'shared-editor', 'editGraphicTitle', 'editGraphicGallery']) {
    assert.match(html, new RegExp(token));
  }
  assert.match(html, /function openWechatComposer\(\)\{return openGraphicComposer\('wechat'\)/);
  assert.match(html, /function openMomentsComposer\(\)\{return openGraphicComposer\('moments'\)/);
  assert.match(html, /function previewWechat\(trigger\)\{return previewGraphic\('wechat'/);
  assert.match(html, /function previewMoments\(trigger\)\{return previewGraphic\('moments'/);
});

test('moments stops at reviewed file export and has no result sink', () => {
  assert.match(html, /moments:\{[^}]*pipeline:\[[^\]]*'导出图文包'/);
  assert.match(html, /moments:\{[^}]*delivery:'文件导出'/);
  assert.match(html, /data-act="export-graphic" data-channel="moments"/);
  assert.match(html, /resultSink:\['moments','poster'\]\.includes\(channel\)\?null:'review-and-results'/);
});

test('internal local file executor is not exposed to customers', () => {
  assert.doesNotMatch(html, /data-p="local-codex"/);
  assert.doesNotMatch(html, /id="localDeviceStatus"/);
  assert.doesNotMatch(html, /data-act="run-local-task"/);
  assert.doesNotMatch(html, /企业专属文件执行器/);
});

test('Agent permissions are a compact settings governance view', () => {
  assert.match(html, /data-p="agent-center"/);
  assert.equal((html.match(/data-agent-card/g) || []).length, 0);
  for (const phrase of ['知识范围', '数据范围', '动作权限', '人工审批', '结果回传']) {
    assert.match(html, new RegExp(phrase));
  }
  assert.doesNotMatch(html, /data-act="configure-agent"/);
  assert.doesNotMatch(html, /data-act="add-business-agent"/);
});
