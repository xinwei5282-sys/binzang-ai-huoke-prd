# AI 获客通用首次拜访 PPT Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成一套 12 页、诊断引导型、混合式可编辑的 AI 获客通用首次拜访 PPT，并通过 ChatGPT 网页版生图证据、全页渲染和 WPS/PowerPoint 人工验收。

**Architecture:** 内容与页面计划保存在 AI 获客项目，PPT 证据和审批状态由 `knowledge-maintenance` 的正式运行时管理，高质量可编辑页面由 `ai-sales-agent` 中本次新建的独立 deck 包生成。先补齐四页样稿、真实原型资产绑定和外部富内容 contract 三项通用能力，再创建三种视觉方向、通过 Chrome 中的 ChatGPT 网页订阅版生成所需图片、让用户选定方向，最后扩展整套并完成真实渲染验收。

**Tech Stack:** Python 3.14、Node.js 20+、PptxGenJS 4、ChatGPT 网页订阅版、Keynote PDF 导出、Poppler、WPS 或 Microsoft PowerPoint。

---

## 执行时变量

文中的尖括号名称不是未确定需求，而是由前一步命令返回、在同一次执行中原样带入下一步的运行值：`<RUN_ID>`、`<OUTLINE_SHA>`、`<DIRECTIONS_SHA>`、`<SELECTED_DIRECTION>`、`<DIRECTION>`、`<SLIDE>`、`<DOWNLOADED_FILE>`、`<VISIBLE_LABEL>`、`<ISO_TIME>`、`<FINAL_PPTX>`、`<CONTACT_SHEET_SHA>` 和 `<VERSION>`。执行者必须先从对应 CLI 输出、浏览器可见信息或 WPS“关于”界面取得真实值，再运行后续命令；不得猜测或复用旧 run 的值。

---

## 文件责任图

### AI 获客知识与规格仓库

创建：

- `PPT/AI获客通用首次拜访-2026-08-07/content/evidence-pack.json`：脱敏证据、真实原型截图来源和事实边界。
- `PPT/AI获客通用首次拜访-2026-08-07/content/outline-input.json`：已确认的 12 页大纲契约。
- `PPT/AI获客通用首次拜访-2026-08-07/content/three-directions.json`：三种实质不同的视觉方向。
- `PPT/AI获客通用首次拜访-2026-08-07/tests/source-contract.test.mjs`：页数、证据、敏感词和视觉差异测试。
- `PPT/AI获客通用首次拜访-2026-08-07/validation/run.json`：正式运行 ID、审批哈希和交付路径。

### PPT 通用运行时仓库

修改：

- `presentation_prompts.py`：从三页样稿升级为四页关键样稿。
- `presentation_builder.py`：允许四页方向样稿和受验证的外部富内容 contract。
- `presentation_cli.py`：接收真实原型资产及外部 contract。
- `presentation_run.py`：把真实资产路径、哈希和证据来源纳入正式审批门禁。
- `ppt_runtime/src/lib/contract.mjs`：验证富内容 contract 中的图层和图片哈希。

创建：

- `presentation_real_assets.py`：将证据包中的真实截图复制进 run、校验哈希并生成可审计清单。

测试：

- `tests/test_presentation_prompts.py`
- `tests/test_presentation_builder.py`
- `tests/test_presentation_cli.py`
- `tests/test_presentation_real_assets.py`
- `tests/test_presentation_run.py`

### AI 获客 PPT 生成包

在 `ai-sales-agent` 仓库中创建，不修改已有脏目录 `decks/ai-huoke-v2/`：

- `decks/ai-huoke-first-visit-20260807/package.json`：本套 PPT 的构建和验证命令。
- `decks/ai-huoke-first-visit-20260807/content/deck.json`：12 页完整中文内容和讲稿。
- `decks/ai-huoke-first-visit-20260807/scripts/build-contract.mjs`：把内容、选定方向和 run 资产组装成富内容 contract。
- `decks/ai-huoke-first-visit-20260807/scripts/build-samples.mjs`：为三种方向生成第 1、5、8、12 页样稿。
- `decks/ai-huoke-first-visit-20260807/scripts/lib/layouts.mjs`：内容驱动的 12 页布局函数。
- `decks/ai-huoke-first-visit-20260807/scripts/lib/theme.mjs`：根据方向建立色彩、字体和节奏。
- `decks/ai-huoke-first-visit-20260807/scripts/validate-content.mjs`：内容、证据和边界检查。
- `decks/ai-huoke-first-visit-20260807/scripts/validate-output.mjs`：PPTX 页数、文字、图片和可编辑对象检查。
- `decks/ai-huoke-first-visit-20260807/scripts/*.test.mjs`：布局、内容与输出测试。

运行时和最终产物不进入 Git：

- `/Users/xinwei/codex-compat/runtime/presentation-generation/runs/<RUN_ID>/`
- `/Users/xinwei/Desktop/AI获客通用首次拜访版_20260807.pptx`
- `/Users/xinwei/Desktop/AI获客通用首次拜访版_20260807.pdf`

---

### Task 1: 支持四张关键页方向样稿

**Files:**

- Modify: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/presentation_prompts.py`
- Modify: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/presentation_builder.py`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/tests/test_presentation_prompts.py`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/tests/test_presentation_builder.py`

- [ ] **Step 1: 写失败测试，固定四页选择契约**

```python
def test_key_samples_include_cover_architecture_evidence_and_close():
    selected = select_key_slides(twelve_slide_outline())
    assert selected == ("slide-01", "slide-05", "slide-08", "slide-12")
```

- [ ] **Step 2: 运行测试确认 RED**

Run:

```bash
python3 -m unittest tests.test_presentation_prompts tests.test_presentation_builder
```

Expected: FAIL，现实现只返回三页，builder 也拒绝四页样稿。

- [ ] **Step 3: 实现角色覆盖优先的四页选择**

将返回类型改为 `tuple[str, ...]`，按以下顺序选择：

```python
roles = (
    {"cover", "chapter"},
    {"architecture", "process"},
    {"evidence"},
    {"decision"},
)
```

每组在未选页面中按证据、可编辑对象和素材需求复杂度选择；缺少某类角色时再从剩余页面补足。`build_deck_contract()` 在方向样稿场景要求恰好四页。

- [ ] **Step 4: 运行聚焦测试和全量回归**

```bash
python3 -m unittest tests.test_presentation_prompts tests.test_presentation_builder
python3 -m unittest discover -s tests -p 'test_*.py'
npm test --prefix ppt_runtime
git diff --check
```

Expected: 聚焦测试、Python 全量和 Node 全量均 PASS。

- [ ] **Step 5: 只提交本功能文件**

```bash
git add presentation_prompts.py presentation_builder.py tests/test_presentation_prompts.py tests/test_presentation_builder.py
git commit -m "feat: support four-page PPT direction samples"
```

不得暂存或提交现有 `config.json`。

### Task 2: 把真实原型截图纳入正式资产证据链

**Files:**

- Create: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/presentation_real_assets.py`
- Modify: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/presentation_cli.py`
- Modify: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/presentation_run.py`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/tests/test_presentation_real_assets.py`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/tests/test_presentation_cli.py`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/tests/test_presentation_run.py`

- [ ] **Step 1: 写失败测试**

覆盖以下行为：

```python
def test_real_asset_is_copied_inside_run_and_hash_bound(): ...
def test_real_asset_hash_mismatch_is_rejected(): ...
def test_real_asset_outside_declared_visual_sources_is_rejected(): ...
def test_formal_approval_rejects_changed_real_asset(): ...
```

证据包中每个真实截图必须包含：

```json
{
  "source_id": "prototype-enterprise-profile",
  "source_path": "/absolute/source.png",
  "source_sha256": "64-char-sha256",
  "slide_ids": ["slide-07"],
  "evidence_kind": "prototype",
  "caption": "现有原型｜示例数据｜不代表生产系统已部署"
}
```

- [ ] **Step 2: 运行测试确认 RED**

```bash
python3 -m unittest tests.test_presentation_real_assets tests.test_presentation_cli tests.test_presentation_run
```

Expected: FAIL，因为当前 `assets-manifest.json` 只接受订阅版生成图。

- [ ] **Step 3: 实现真实资产摄取与校验**

`presentation_real_assets.py` 提供：

```python
@dataclass(frozen=True)
class RealPresentationAsset:
    slide_id: str
    source_id: str
    path: Path
    sha256: str
    caption: str

def ingest_real_assets(evidence_pack: dict, run_dir: Path) -> dict[str, dict]: ...
```

实现要求：

- 校验源文件存在且 SHA-256 与证据包一致。
- 原子复制到 `<run>/source-assets/`，避免外部文件后续变化。
- 每个 `real_asset` 页面只能映射一项明确来源。
- `assets-manifest.json` 条目增加 `evidence_type: real_asset`、`source_id` 和 `caption`。
- `image_evidence_summary(require_binding=True)` 对生成图校验网页 receipt，对真实图校验 run 内路径、源 ID 和文件哈希；不能要求真实图伪造 ChatGPT receipt。
- 纯矢量 deck 的 assets manifest 仍必须为空。

- [ ] **Step 4: 运行聚焦测试、全量测试和攻击回归**

```bash
python3 -m unittest tests.test_presentation_real_assets tests.test_presentation_cli tests.test_presentation_run
python3 -m unittest discover -s tests -p 'test_*.py'
npm test --prefix ppt_runtime
git diff --check
```

Expected: PASS；篡改源截图、run 内副本、manifest 路径或哈希均 fail-closed。

- [ ] **Step 5: 独立提交**

```bash
git add presentation_real_assets.py presentation_cli.py presentation_run.py tests/test_presentation_real_assets.py tests/test_presentation_cli.py tests/test_presentation_run.py
git commit -m "feat: bind real prototype assets in PPT runs"
```

### Task 3: 支持经过验证的富内容外部 contract

**Files:**

- Modify: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/presentation_builder.py`
- Modify: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/presentation_cli.py`
- Modify: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/ppt_runtime/src/lib/contract.mjs`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/tests/test_presentation_builder.py`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/tests/test_presentation_cli.py`
- Test: `/Users/xinwei/weiran-env/projects/knowledge-maintenance/ppt_runtime/test/contract.test.mjs`

- [ ] **Step 1: 写失败测试**

验证 `build --contract-file`：

- contract 的 slide ID 必须与已批准 outline 完全一致。
- direction 必须与已选方向一致。
- 所有图片路径与 SHA 必须来自已绑定 assets manifest。
- headline、claim 和来源文字必须仍为可编辑文本。
- contract 不得包含 outline 和证据包之外的硬事实。

```python
def test_external_contract_cannot_change_approved_slide_ids(): ...
def test_external_contract_image_must_match_bound_assets(): ...
```

- [ ] **Step 2: 运行测试确认 RED**

```bash
python3 -m unittest tests.test_presentation_builder tests.test_presentation_cli
npm test --prefix ppt_runtime
```

Expected: FAIL，因为 CLI 尚无 `--contract-file`。

- [ ] **Step 3: 实现最小外部 contract 入口**

CLI 参数：

```python
build.add_argument("--contract-file")
```

构建前调用：

```python
contract = load_and_validate_external_contract(
    Path(args.contract_file),
    outline=outline,
    direction=direction,
    assets=assets,
    evidence_pack=evidence,
)
```

校验成功后将规范化 contract 写入 `<run>/build/deck-build.json`，再使用现有 `run_ppt_builder()` 构建并记录 deck artifact。未传 `--contract-file` 时保留现有通用 builder 行为。

- [ ] **Step 4: 回归并提交**

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
npm test --prefix ppt_runtime
git diff --check
git add presentation_builder.py presentation_cli.py ppt_runtime/src/lib/contract.mjs tests/test_presentation_builder.py tests/test_presentation_cli.py ppt_runtime/test/contract.test.mjs
git commit -m "feat: accept verified rich PPT contracts"
```

### Task 4: 建立本套 PPT 的内容、证据与三种视觉方向

**Files:**

- Create: `/Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/content/evidence-pack.json`
- Create: `/Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/content/outline-input.json`
- Create: `/Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/content/three-directions.json`
- Create: `/Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/tests/source-contract.test.mjs`

- [ ] **Step 1: 先写 source contract 测试**

测试固定：12 页；第 1、5、8、12 页为关键样稿；所有 confirmed 页面都有 source ID；不出现报价、客户专名、虚构 ROI、自动发布或生产部署承诺；三种方向至少在色彩、网格、字体、图片语言、图表语言和节奏中的三项不同。

- [ ] **Step 2: 运行测试确认 RED**

```bash
node --test PPT/AI获客通用首次拜访-2026-08-07/tests/source-contract.test.mjs
```

Expected: FAIL，源文件尚未创建。

- [ ] **Step 3: 创建安全证据包**

使用以下真实来源并计算当前 SHA-256：

- `产品说明/AI获客产品说明-2026-07-24.md`
- `docs/superpowers/specs/2026-08-05-enterprise-ai-operating-brain-v1-product-design.md`
- `prototype/index.html`
- `validation/v1-prototype/enterprise-profile-quick-1440x900.png`
- `validation/v1-prototype/marketing-materials-wechat-1440x900.png`

证据包的 `restricted_values` 包含当前仓库中可识别的客户企业名、报价数字和合同关键词；对外内容不得回显这些值。

- [ ] **Step 4: 创建 12 页 outline 和三种方向**

方向基线：

1. `direction-01 / 经营航图`：深炭黑、暖象牙、朱砂橙；非对称编辑网格；电影感经营路径与空间层次。
2. `direction-02 / 企业作战室`：纸白、石墨、信号红；瑞士信息设计；纪实办公材质与精准标注。
3. `direction-03 / 知识生长`：深森林绿、矿物米色、酸性黄绿；分层节点网格；自然结构与组织知识网络。

三者均禁止生成文字、数字、Logo、图表、按钮和产品 UI。

- [ ] **Step 5: 运行测试并独立提交**

```bash
node --test PPT/AI获客通用首次拜访-2026-08-07/tests/source-contract.test.mjs
git diff --check -- PPT/AI获客通用首次拜访-2026-08-07
git add -- PPT/AI获客通用首次拜访-2026-08-07
git commit -m "feat: add AI acquisition first-visit deck sources"
```

只提交本次新目录，不包含仓库其他脏改动。

### Task 5: 创建独立高质量 deck 生成包

**Files:**

- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/package.json`
- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/content/deck.json`
- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/build-contract.mjs`
- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/build-samples.mjs`
- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/lib/layouts.mjs`
- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/lib/theme.mjs`
- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/validate-content.mjs`
- Create: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/validate-output.mjs`
- Test: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/layouts.test.mjs`
- Test: `/Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/scripts/content.test.mjs`

- [ ] **Step 1: 读取 `pptx` 的 scratch 生成指南并写失败测试**

测试要求：12 页内容完整；页面布局至少包含 hero、broken-chain、diagnostic-map、architecture、operating-loop、prototype-proof、human-handoff、boundary、deliverables、decision-close；每页正文最小字号不低于 14pt；没有整页位图化中文正文。

- [ ] **Step 2: 运行测试确认 RED**

```bash
node --test decks/ai-huoke-first-visit-20260807/scripts/*.test.mjs
```

- [ ] **Step 3: 实现内容驱动布局**

`content/deck.json` 保存每页标题、主张、结构化段落、来源和讲稿。`build-contract.mjs` 只把内容转为原生文本、形状、流程、表格和图片图层，不自行增加事实。

图片规则：第 1、12 页使用 ChatGPT 生成背景；第 5 页使用生成片段加原生架构；第 7、8 页使用真实原型截图；其余页面使用原生可编辑矢量。

- [ ] **Step 4: 聚焦测试和源内容检查**

```bash
node --test decks/ai-huoke-first-visit-20260807/scripts/*.test.mjs
node decks/ai-huoke-first-visit-20260807/scripts/validate-content.mjs
git diff --check -- decks/ai-huoke-first-visit-20260807
```

- [ ] **Step 5: 只提交新 deck 目录**

```bash
git add -- decks/ai-huoke-first-visit-20260807
git commit -m "feat(deck): build AI acquisition first-visit presentation"
```

不得暂存 `decks/ai-huoke-v2/` 的任何现有改动。

### Task 6: 启动正式运行、校验字体并准备三方向提示词

**Files:**

- Create: `/Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/validation/run.json`

- [ ] **Step 1: 启动 run**

```bash
cd /Users/xinwei/weiran-env/projects/knowledge-maintenance
python3 presentation_cli.py start \
  --instruction "生成AI获客通用企业首次拜访PPT，推动客户同意企业诊断并补充基础资料" \
  --customer generic-prospect \
  --project "AI获客产品" \
  --audience client \
  --slides 12 \
  --evidence-pack-file /Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/content/evidence-pack.json \
  --outline-file /Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/content/outline-input.json
```

Expected: 返回 `RUN_ID` 和 64 位 `outline_sha256`。

- [ ] **Step 2: 用已确认大纲哈希批准 outline**

```bash
python3 presentation_cli.py approve-outline --run-id <RUN_ID> --sha256 <OUTLINE_SHA> --reviewer xinwei
python3 presentation_cli.py directions --run-id <RUN_ID> --directions-file /Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品/PPT/AI获客通用首次拜访-2026-08-07/content/three-directions.json
```

Expected: 三个方向，关键页为 `slide-01`、`slide-05`、`slide-08`、`slide-12`。

- [ ] **Step 3: 字体预检**

```bash
python3 presentation_cli.py fonts --run-id <RUN_ID>
```

Expected: 三个方向均 `ready: true`，或明确列出 fallback；不自动下载字体。

- [ ] **Step 4: 写入 run.json 并提交该收据文件**

保存 run ID、outline hash、directions hash、字体结果和创建时间。只提交 `validation/run.json`。

### Task 7: 通过 ChatGPT 网页版生成三套关键页样稿

**Files:**

- Runtime prompts: `/Users/xinwei/codex-compat/runtime/presentation-generation/runs/<RUN_ID>/directions/*/prompts/`
- Runtime images: `/Users/xinwei/codex-compat/runtime/presentation-generation/runs/<RUN_ID>/directions/*/assets/`
- Visual companion: 当前 AI 获客项目的 `.superpowers/brainstorm/<SESSION>/content/`

- [ ] **Step 1: 读取 Chrome 控制规则并确认 ChatGPT 网页会话**

只打开 `https://chatgpt.com/`。不调用 OpenAI API，不使用 ChatGPT 桌面端生图，不读取浏览器 Cookie 或 Token。

- [ ] **Step 2: 导出三个方向的 sample queue**

```bash
python3 presentation_cli.py image-export --run-id <RUN_ID> --direction-id direction-01
python3 presentation_cli.py image-export --run-id <RUN_ID> --direction-id direction-02
python3 presentation_cli.py image-export --run-id <RUN_ID> --direction-id direction-03
```

- [ ] **Step 3: 在 ChatGPT 网页版逐项生成并下载原图**

每次生成前核对方向和 slide ID；下载后记录页面可见的产品标签和生成时间。不得让图片包含中文正文、数字、Logo、图表、按钮或产品 UI。

- [ ] **Step 4: 导入原图并生成收据**

```bash
python3 presentation_cli.py image-import --run-id <RUN_ID> --direction-id <DIRECTION> --slide-id <SLIDE> --file <DOWNLOADED_FILE> --evidence-level chatgpt_web_original --product-label "<VISIBLE_LABEL>" --generated-at <ISO_TIME>
```

Expected: 每个订阅图片都有 prompt hash、asset hash、尺寸和网页原图证据。

- [ ] **Step 5: 生成四页样稿和全页图片**

```bash
node decks/ai-huoke-first-visit-20260807/scripts/build-samples.mjs --run-id <RUN_ID>
```

将三套样稿转为 PDF/PNG，逐页检查后放到视觉伴随页面并排展示。浏览器地址每次明确告知用户。

- [ ] **Step 6: 用户视觉选择 checkpoint**

暂停，等待用户选择 `direction-01`、`direction-02` 或 `direction-03`。不得在选择前批量生成整套最终背景图。

### Task 8: 扩展选定方向并生成整套可编辑 PPT

**Files:**

- Runtime contract: `/Users/xinwei/codex-compat/runtime/presentation-generation/runs/<RUN_ID>/build/deck-build.json`
- Runtime PPTX: `/Users/xinwei/codex-compat/runtime/presentation-generation/runs/<RUN_ID>/build/final.pptx`

- [ ] **Step 1: 按用户选择批准方向**

```bash
python3 presentation_cli.py approve-direction --run-id <RUN_ID> --direction-id <SELECTED_DIRECTION> --sha256 <DIRECTIONS_SHA> --reviewer xinwei
```

- [ ] **Step 2: 仅导出选定方向的剩余图片队列**

```bash
python3 presentation_cli.py image-export --scope final --run-id <RUN_ID> --direction-id <SELECTED_DIRECTION>
```

在 ChatGPT 网页版生成并使用 `--scope final` 导入，直到队列无缺项。

- [ ] **Step 3: 生成富内容 contract**

```bash
node decks/ai-huoke-first-visit-20260807/scripts/build-contract.mjs --run-id <RUN_ID> --direction-id <SELECTED_DIRECTION>
```

- [ ] **Step 4: 通过正式 CLI 构建与渲染**

```bash
python3 presentation_cli.py build --run-id <RUN_ID> --contract-file /Users/xinwei/weiran-env/projects/ai-sales-agent/decks/ai-huoke-first-visit-20260807/validation/deck-build.json
python3 presentation_cli.py render --run-id <RUN_ID>
python3 presentation_cli.py status --run-id <RUN_ID>
```

Expected: `rendered-not-human-approved`，且无 fixture 或 image evidence error。

- [ ] **Step 5: 内容与结构 QA**

```bash
python3 -m markitdown <FINAL_PPTX>
node decks/ai-huoke-first-visit-20260807/scripts/validate-content.mjs
node decks/ai-huoke-first-visit-20260807/scripts/validate-output.mjs <FINAL_PPTX>
unzip -t <FINAL_PPTX>
```

- [ ] **Step 6: 全页视觉 QA 与至少一次修复循环**

渲染 12 页并由独立视觉审查检查重叠、溢出、间距、对比度、裁切、字体替换、截图标签、来源脚注和能力边界。记录首轮问题，修改 deck source 或 layout 后重新构建和渲染受影响页面；至少完成一次 fix-and-verify。

- [ ] **Step 7: 只提交本套 deck 的修复**

```bash
git add -- decks/ai-huoke-first-visit-20260807
git commit -m "fix(deck): close AI acquisition visual QA findings"
```

### Task 9: WPS/PowerPoint 人工复核与正式交付

**Files:**

- Deliverable: `/Users/xinwei/Desktop/AI获客通用首次拜访版_20260807.pptx`
- Deliverable: `/Users/xinwei/Desktop/AI获客通用首次拜访版_20260807.pdf`

- [ ] **Step 1: 在 WPS 或 Microsoft PowerPoint 打开最终 PPTX**

逐页检查：字体、换行、图片裁切、动画兼容、可编辑对象、讲稿、页数和全屏放映效果。Keynote 或 LibreOffice 只能作为辅助渲染，不能代替本步骤。

- [ ] **Step 2: 用户最终视觉确认 checkpoint**

展示联系表和最终文件，请用户确认整套视觉与内容。只有用户明确确认后才记录正式人工批准。

- [ ] **Step 3: 写入正式批准收据**

```bash
python3 presentation_cli.py approve-render --run-id <RUN_ID> --sha256 <CONTACT_SHEET_SHA> --reviewer xinwei --application WPS --application-version <VERSION> --notes "逐页复核通过"
python3 presentation_cli.py status --run-id <RUN_ID>
```

Expected: `human-approved`。

- [ ] **Step 4: 复制交付物并核对哈希**

```bash
shasum -a 256 /Users/xinwei/Desktop/AI获客通用首次拜访版_20260807.pptx /Users/xinwei/Desktop/AI获客通用首次拜访版_20260807.pdf
```

- [ ] **Step 5: 最终汇报**

汇报最终文件路径、页数、可编辑性、ChatGPT 网页生成证据、自动测试、全页渲染、WPS/PowerPoint 复核、最终状态和仍存在的人工发布边界。

---

## 总体验收门禁

- 大纲：12 页，与确认规格一致。
- 方向：三种视觉方向有实质差异，用户在关键页样稿阶段选定。
- 图片：仅 ChatGPT 网页订阅版生成；真实原型截图有源文件与哈希；图片不承载业务正文。
- 内容：不包含报价、客户敏感资料、虚构数据和未验证上线承诺。
- 可编辑：中文正文、图表、流程、架构、行动项和产品说明均为 PowerPoint 原生对象。
- QA：内容、结构、PPTX ZIP、全页渲染和视觉检查均通过，并至少完成一次修复复验。
- 人工验收：最终在 WPS 或 Microsoft PowerPoint 中逐页检查并由用户确认。
