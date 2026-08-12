# Enterprise VI Image Skill Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前 CSS Logo 方向演示升级为产品内的企业 VI 图片 Skill 原型，支持三套图片方向、品牌种子、根据企业情况动态推荐场景、逐张异步状态和人工采用。

**Architecture:** 继续以 `prototype/index.html` 为唯一活跃真源，在现有 `enterpriseViState` 中增加 `brandStrategy`、`brandSeed`、`sceneRecommendations` 和 `imageTasks`。方向卡和 VI 详情使用实际 PNG/JPG 演示资产；异步生成、质量检查和单张重试由前端状态机模拟，明确标注“原型演示 · 待接入图片生成服务”。

**Tech Stack:** 单文件 HTML/CSS/JavaScript、PNG/JPG 演示资产、Node.js `node:test`、Chrome DevTools Protocol 桌面/手机截图验收。

---

## 文件责任图

- Create: `prototype/assets/demo/enterprise-vi/direction-steady.png` — 稳健决策方向品牌板图片。
- Create: `prototype/assets/demo/enterprise-vi/direction-human.png` — 人文专业方向品牌板图片。
- Create: `prototype/assets/demo/enterprise-vi/direction-growth.png` — 现代增长方向品牌板图片。
- Create: `prototype/assets/demo/enterprise-vi/scene-*.png` — 为动态推荐池提供的少量真实场景演示图。
- Modify: `prototype/assets/demo/README.md` — 记录 VI 图片的来源、用途、演示边界和替换规则。
- Modify: `prototype/index.html` — VI Skill 数据模型、场景评分、图片任务状态机、方向图、详情分组、交互和响应式样式。
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs` — 品牌种子、动态场景、图片任务、人工采用和正式启用边界测试。
- Modify: `prototype/scripts/capture-enterprise-cognition-vi.mjs` — 方向图、推荐清单、生成中、单张失败/重试、采用和正式启用的真实渲染验收。
- Existing: `prototype/verification-manifest.json` — 继续使用 `enterprise-vi` 定向验证映射，不新增重复 profile。

## 边界决策

- 原型使用本地 PNG/JPG 表达最终图片视觉，不用 CSS 字符假装最终 Logo。
- 图片中不放置需要精准拼写的大段文字；企业名称、色值、场景理由和状态均使用 HTML 真实文本展示。
- 方向图和场景图由图片生成工具产出后存入项目，不把生成过程或未选稿当作交付。
- 动态推荐是基于企业字段的可解释规则评分，不是固定的“电商/门店/服务”套餐切换。
- 只有 `adopted` 的图片能随 VI 正式启用；`review`、`failed` 和 `rejected` 均不进入正式上下文。

### Task 1: 创建可审核的 VI 图片资产

**Files:**
- Create: `prototype/assets/demo/enterprise-vi/direction-steady.png`
- Create: `prototype/assets/demo/enterprise-vi/direction-human.png`
- Create: `prototype/assets/demo/enterprise-vi/direction-growth.png`
- Create: `prototype/assets/demo/enterprise-vi/scene-packaging.png`
- Create: `prototype/assets/demo/enterprise-vi/scene-storefront.png`
- Create: `prototype/assets/demo/enterprise-vi/scene-presentation.png`
- Create: `prototype/assets/demo/enterprise-vi/scene-social.png`
- Create: `prototype/assets/demo/enterprise-vi/scene-exhibition.png`
- Create: `prototype/assets/demo/enterprise-vi/scene-workwear.png`
- Modify: `prototype/assets/demo/README.md`

- [ ] **Step 1: 生成三张方向品牌板**

分别使用 `logo-brand`/brand-kit 类图片生成提示，保持同一虚构企业与同一基础标志构成，仅改变视觉策略：

```text
Asset type: enterprise brand-kit direction board
Brand: fictional Chinese enterprise service brand; no readable text
Required panels: primary logo mark, palette, typography mood, graphic language,
2-3 relevant application mockups
Direction: <steady decision | human professional | modern growth>
Constraints: one coherent brand system, no watermark, no copied trademark,
no random extra logos, no dense moodboard, raster image only
```

- [ ] **Step 2: 人工查看三张方向图**

逐张确认标志是主视觉、三套可区分、没有竞品标识/水印/乱码大字、构图可以被 3:2 卡片安全裁切。不通过的图片单独重生成。

- [ ] **Step 3: 生成六张场景演示图**

生成包装、门店、提案/PPT、社交媒体、展会、工作服场景，所有图片继承同一个已选方向的标志形态、色彩和图形语言。

- [ ] **Step 4: 记录资产边界**

在 `prototype/assets/demo/README.md` 中记录生成日期、用途、虚构品牌、不含真实客户事实，以及“原型演示资产，不代表图片生成服务已接通”。

- [ ] **Step 5: 检查文件和像素尺寸**

Run: `file prototype/assets/demo/enterprise-vi/*.png`

Expected: 9 个可读取 PNG，方向图为横向，场景图无损坏。

- [ ] **Step 6: 提交资产**

Run: `git add prototype/assets/demo/enterprise-vi prototype/assets/demo/README.md && git commit -m "feat: add enterprise VI demo imagery"`

### Task 2: 建立品牌策略、品牌种子与动态场景合同

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写失败测试**

在模型加载器中导出以下函数，并断言：

```js
const strategy = vi.buildEnterpriseViBrandStrategy(snapshot);
assert.equal(strategy.evidenceBoundary, 'confirmed_only');

const seed = vi.buildEnterpriseViBrandSeed(direction);
assert.equal(seed.directionId, direction.id);
assert.equal(seed.logoImage, direction.logoProposal.imageUrl);

const scenes = vi.recommendEnterpriseViScenes({
  intakeBusinessModes: { display: '线上店铺销售' },
  intakeTransactionMethod: { display: '淘宝下单' },
  intakeCoreProduct: { display: '实物商品' }
});
assert.ok(scenes.length >= 4 && scenes.length <= 6);
assert.equal(scenes[0].id, 'packaging');
assert.match(scenes[0].reason, /线上|商品|淘宝/);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL，原因是品牌策略、品牌种子和场景推荐函数尚未存在。

- [ ] **Step 3: 扩展 VI 状态**

将默认状态扩展为：

```js
{
  brandStrategy: null,
  brandSeed: null,
  sceneRecommendations: [],
  scenePlanConfirmed: false,
  imageTasks: []
}
```

`loadEnterpriseViState()` 对旧版 `localStorage` 保持兼容，数组字段损坏时回退到空数组。

- [ ] **Step 4: 实现可解释的场景评分**

定义 `ENTERPRISE_VI_SCENE_CATALOG` 和 `scoreEnterpriseViScene()`。每个场景包含 `signals`、`evidenceKeys`、`fallbackReason`、`imageUrl`；按企业字段命中累加分数，按分数降序取 4–6 项，不以企业类型直接切固定套餐。

- [ ] **Step 5: 实现品牌策略与品牌种子**

`buildEnterpriseViBrandStrategy()` 仅读取确认快照；`buildEnterpriseViBrandSeed()` 深拷贝已选方向的 Logo 图片、色彩、字体、图片风格、语气和禁用表达。

- [ ] **Step 6: 运行测试并确认通过**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交数据合同**

Run: `git add prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs && git commit -m "feat: add VI brand seed and scene recommendations"`

### Task 3: 建立逐张图片任务状态机

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写生成、重试、采用和启用失败测试**

测试顺序：确认场景清单 → 创建独立任务 → 单张失败 → 只重试失败项 → 逐张采用。未采用全部必要基础图时，`activateEnterpriseViDraft()` 返回 `null`；已采用图片进入 active context，`review/failed/rejected` 不进入。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL，原因是尚无图片任务状态机。

- [ ] **Step 3: 实现状态函数**

增加：

```js
confirmEnterpriseViScenePlan(ids)
queueEnterpriseViImageTasks()
advanceEnterpriseViImageTask(id, outcome)
retryEnterpriseViImageTask(id)
adoptEnterpriseViImageTask(id)
rejectEnterpriseViImageTask(id)
getAdoptedEnterpriseViImages()
```

任务状态只允许：

```text
queued -> generating -> review -> adopted
                       -> rejected
              -> failed -> queued
```

禁止 `failed -> adopted` 和 `rejected -> adopted`；任务重试仅增加该任务的 `attempts`。

- [ ] **Step 4: 收紧正式启用边界**

`activateEnterpriseViDraft()` 检查必要基础图已采用，所有已选场景都已完成人工处理（`adopted` 或 `rejected`），且至少有一张场景图被采用。启用时把 `brandSeed` 与 adopted 图片深拷贝到新版本。`buildActiveEnterpriseViContext()` 只返回该正式快照。

- [ ] **Step 5: 运行测试并确认通过**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交任务状态机**

Run: `git add prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs && git commit -m "feat: add VI image task lifecycle"`

### Task 4: 用真实图片改造方向卡与 VI 详情

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写 UI 合同失败测试**

断言存在：

- `.vi-direction-image` 与三个方向图路径；
- `#enterpriseViScenePlan` 场景推荐区；
- `#enterpriseViImageTasks` 图片任务区；
- “根据企业情况推荐”、“确认场景并开始生成”、“单张重新生成”、“确认采用”、“不采用”；
- “原型演示 · 待接入图片生成服务”边界。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL，原因是页面尚未使用方向图，也没有场景清单和逐张任务区。

- [ ] **Step 3: 改造方向卡**

每张卡的主视觉改为：

```html
<img class="vi-direction-image"
     src="assets/demo/enterprise-vi/direction-steady.png"
     alt="稳健决策 VI 方向图：Logo、色彩和应用场景">
```

品牌名称、方向、色板、推荐理由和按钮保持 HTML 文本，不依赖图内文字。

- [ ] **Step 4: 增加动态场景清单**

方向确认后显示 4–6 个推荐卡，包含缩略图、相关性分数、推荐原因、证据来源、保留/移除控件和追加场景入口。

- [ ] **Step 5: 增加图片任务画廊**

任务卡显示预览图、任务状态、质量检查结果和对应操作。失败项只显示“单张重新生成”；待确认项显示“确认采用/不采用”；已采用项只显示“查看大图/下载图片”。

- [ ] **Step 6: 增加桌面和手机样式**

桌面端方向三列、任务画廊三列；手机端全部单列。图片使用 `aspect-ratio`、`object-fit:cover` 和固定裁切焦点，不强制页面宽度。

- [ ] **Step 7: 运行测试并确认通过**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS。

- [ ] **Step 8: 提交图片界面**

Run: `git add prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs && git commit -m "feat: show VI imagery and relevant scenes"`

### Task 5: 接通原型交互与异步恢复

**Files:**
- Modify: `prototype/tests/enterprise-cognition-vi-v1.test.mjs`
- Modify: `prototype/index.html`

- [ ] **Step 1: 写交互动作失败测试**

断言事件分发包含：

```text
toggle-enterprise-vi-scene
confirm-enterprise-vi-scene-plan
retry-enterprise-vi-image
adopt-enterprise-vi-image
reject-enterprise-vi-image
preview-enterprise-vi-image
download-enterprise-vi-image
```

断言下载仍明确为原型演示，不创建伪造 Blob 文件。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: FAIL，原因是新动作尚未存在。

- [ ] **Step 3: 实现事件处理**

场景确认后为基础规范和场景图分别建立任务；用短定时器演示 `queued -> generating -> review`；预置一个失败样例验证单张恢复。每次变化均先保存状态再重渲染。

- [ ] **Step 4: 保持重新生成与旧版本隔离**

重新生成三套方向时，清空当前草案的品牌种子、推荐清单和图片任务，但不修改 `activeVersion` 和 `history`。

- [ ] **Step 5: 运行测试并确认通过**

Run: `node --test prototype/tests/enterprise-cognition-vi-v1.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交交互流程**

Run: `git add prototype/index.html prototype/tests/enterprise-cognition-vi-v1.test.mjs && git commit -m "feat: connect VI image review interactions"`

### Task 6: 真实浏览器验收与收口

**Files:**
- Modify: `prototype/scripts/capture-enterprise-cognition-vi.mjs`

- [ ] **Step 1: 扩展截图流程**

桌面和手机端分别截取：

1. 三套方向图；
2. 动态推荐场景清单；
3. 生成中/待确认画廊；
4. 单张失败与重试；
5. 已采用草案；
6. 已启用正式 VI。

- [ ] **Step 2: 增加浏览器断言**

记录并断言：方向图 `naturalWidth > 0`、推荐场景 4–6 项、推荐理由非空、重试仅改变一张任务、未采用时无法启用、已采用后 active context 只包含 adopted 图片。

- [ ] **Step 3: 运行定向结构验证**

Run: `codex-verify --focus enterprise-vi`

Expected: PASS；定向测试、原型范围 `git diff --check` 和真源 SHA-256 检查通过。

- [ ] **Step 4: 运行桌面与手机真实浏览器验收**

Run: `codex-verify --focus enterprise-vi --browser`

Expected: PASS；1440×900 和 390×844 均无 console/runtime error、无横向溢出、图片加载完整，手机操作按钮高度不小于 40px。

- [ ] **Step 5: 人工查看关键截图**

使用本地图片查看工具查看方向、场景清单、画廊和已启用截图，确认 Logo 为主视觉、三套方向可区分、场景图与推荐理由一致、手机端不裁切关键主体。

- [ ] **Step 6: 运行全量测试**

Run: `node --test prototype/tests/*.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 7: 格式和真源检查**

Run: `git diff --check -- prototype`

Expected: exit 0。如全仓已有无关空白错误，只报告原型范围的真实结果，不修改无关文件。

- [ ] **Step 8: 打开日常 Chrome 预览**

Run: `codex-preview --route kb-cognition`

Expected: 在日常 Chrome profile 中打开与 `prototype/index.html` SHA-256 一致的页面，`isolatedBrowser: false`。

- [ ] **Step 9: 提交验收脚本**

Run: `git add prototype/scripts/capture-enterprise-cognition-vi.mjs && git commit -m "test: verify enterprise VI image skill"`

## 交付边界

- 本计划完成后，可验收的是“产品内 VI 图片 Skill 的高保真交互原型”。
- 不可表述为已接通生产图片模型、任务队列、对象存储、商标检索或真实下载服务。
- 图片资产是用于验证产品流程的虚构品牌演示图，不是客户正式 Logo 或商用 VI 交付。
