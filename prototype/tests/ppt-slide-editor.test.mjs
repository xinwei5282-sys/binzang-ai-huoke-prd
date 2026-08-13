import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function loadEditorModel() {
  const source = html.match(/const PPT_CREATION_STAGES=[\s\S]*?(?=\nfunction openCompanyOperatingPlanReview)/)?.[0] || '';
  assert.ok(source, 'PPT editor model is missing');
  return Function(`${source};return {createPptOutlineDraft,approvePptOutline,createPptGenerationTask,completePptGenerationTask,createEditablePptDeck,updatePptSlideDraft,createPptSlideCandidate,adoptPptSlideCandidate,discardPptSlideCandidate};`)();
}

function readyDeck() {
  const model = loadEditorModel();
  const outline = model.approvePptOutline(model.createPptOutlineDraft({ request: '生成客户提案 PPT' }), '企业负责人');
  return { model, deck: model.createEditablePptDeck(model.completePptGenerationTask(model.createPptGenerationTask(outline))) };
}

test('manual editing only changes the selected slide', () => {
  const { model, deck } = readyDeck();
  const edited = model.updatePptSlideDraft(deck, 'page-2', { title: '新标题' });
  assert.equal(edited.slides[1].title, '新标题');
  assert.equal(edited.slides[0].title, deck.slides[0].title);
});

test('AI follow-up creates a candidate before adoption and can be discarded', () => {
  const { model, deck } = readyDeck();
  const candidate = model.createPptSlideCandidate(deck, 'page-2', '减少文字');
  assert.equal(candidate.pending.slideId, 'page-2');
  assert.equal(candidate.slides[1].title, deck.slides[1].title);
  const adopted = model.adoptPptSlideCandidate(candidate);
  assert.equal(adopted.pending, null);
  assert.equal(adopted.version, 2);
  const discarded = model.discardPptSlideCandidate(candidate);
  assert.equal(discarded.pending, null);
  assert.equal(discarded.slides[1].title, deck.slides[1].title);
});

test('PPT detail opens separately, edits canvas text inline and keeps only AI follow-up on the right', () => {
  for (const phrase of ['页面缩略图', '点击文字直接编辑', '全屏播放', '正在修改第 1 页', 'AI 追问', '只修改当前页', '请告诉 AI 如何修改当前页', '采用新版', '撤回', '已保存', '下载 PPTX', '下载 PDF']) assert.match(html, new RegExp(phrase));
  for (const action of ['select-ppt-slide', 'ppt-preview-prev', 'ppt-preview-next', 'ppt-fullscreen', 'request-ppt-slide-revision', 'adopt-ppt-slide-candidate', 'discard-ppt-slide-candidate', 'download-pptx', 'download-pdf']) assert.match(html, new RegExp(`data-act="${action}"`));
  assert.match(html, /contenteditable="true" data-ppt-inline-field="title"/);
  assert.match(html, /contenteditable="true" data-ppt-inline-field="body"/);
  assert.match(html, /window\.open\([\s\S]*'_blank'/);
  assert.match(html, /get\('pptEdit'\)/);
  assert.match(html, /pptEditParam\)\{\$\('#login'\)\.hidden=true/);
  for (const removedId of ['pptEditorModes', 'pptSlideTitle', 'pptSlideBody', 'pptSlideData', 'pptSlideImage', 'pptSlideNotes', 'pptSlideLayout']) assert.doesNotMatch(html, new RegExp(`id="${removedId}"`));
  assert.doesNotMatch(html, /data-ppt-editor-panel=/);
  assert.doesNotMatch(html, /data-act="switch-ppt-editor-mode"/);
  assert.doesNotMatch(html, /data-act="submit-studio-review"/);
});
