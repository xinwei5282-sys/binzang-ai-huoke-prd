import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, '../index.html'), 'utf8');

function loadFunction(name) {
  const source = html.match(new RegExp(`function ${name}\\([^)]*\\)\\{[\\s\\S]*?\\n\\}`))?.[0];
  assert.ok(source, `${name} should exist`);
  return vm.runInNewContext(`(${source})`);
}

test('core copy formatter removes repeated prototype labels without weakening boundaries', () => {
  const compactCoreCopyText = loadFunction('compactCoreCopyText');

  assert.equal(compactCoreCopyText('原型演示 · AI 推荐需人工确认。'), '项目推荐需人工确认。');
  assert.equal(compactCoreCopyText('文件不会上传到真实服务器。'), '文件不上传服务器。');
  assert.equal(compactCoreCopyText('系统不会自动覆盖任一版本，请由项目负责人结合事实判断。'), '不会覆盖原版本，需人工判断。');
  assert.equal(compactCoreCopyText('已记录人工发送结果（原型演示）'), '已记录人工发送结果');
  assert.equal(compactCoreCopyText('点击统计筛选任务'), '');
  assert.equal(compactCoreCopyText('本周期经营结果'), '本周期');
});

test('prototype disclosure is centralized in one persistent environment badge', () => {
  const badges = html.match(/data-demo-environment/g) || [];
  assert.equal(badges.length, 1);
  assert.match(html, /data-demo-environment[^>]*>演示环境<\/span>/);
});
