# 闭源 SaaS PPT 引擎安全集成设计

## 1. 目标

在不引入 AGPL、GPL、SSPL、限制商用或许可不明组件的前提下，增强企业 AI 经营大脑的 PPT 生成和编辑能力。继承优秀开源产品的主题预览、版式候选、浏览器编辑、页面管理和可编辑 PPTX 导出体验，同时保留当前产品的企业知识、VI、人工门禁和异步任务逻辑。

## 2. 决策

采用“自有产品流程 + 可替换开源能力 + 自有导出链”方案：

- 当前 `prototype/index.html` 及 PRD 中的 PPT 产品流程继续作为真源。
- Presenton 仅作为 Apache-2.0 开源实现的技术参考和可选代码来源，不整仓直接嵌入。
- 不使用 `presenton-export` 二进制导出运行包，直到其提供可验证的商用许可和对应版本条款。
- PPTX 导出使用 MIT 许可的 PptxGenJS；PDF 由 PPTX 渲染或独立的已审核组件产生。
- 编辑器、数据模型、企业 VI 主题映射、版式库和 AI 提示词由本项目维护。

## 3. 范围

### 3.1 本期纳入

- 生成前主题预览和选择。
- 企业 VI 主题优先；未启用 VI 时提供自有默认主题。
- 每页多版式候选，候选共享同一事实与页面目标。
- 标题、正文、图片、图表、强调项的浏览器编辑。
- 页面拖拽排序、复制、删除和隐藏。
- 单页 AI 修改候选，未采用前不覆盖原页。
- 自动保存、整稿版本和页面变更记录。
- 真实可编辑 PPTX 与 PDF 导出。

### 3.2 本期不做

- 像 PowerPoint 一样的完整图层面板和任意矢量编辑。
- 实时多人协同编辑。
- 导入任意 PPTX 后达到像素级还原。
- 使用 Dashi 的代码、模板、素材、主题命名、提示词或专有导出引擎。

## 4. 架构

```text
企业大脑正式知识 + Active VI + 本次临时资料
                         ↓
                 PPT Planning Service
       需求理解 → 逐页大纲 → 人工确认
                         ↓
                PPT Composition Service
        标准内容模型 → 版式匹配 → 候选版
                         ↓
                    PPT Web Editor
       文字/图片/图表编辑 + 页面管理 + AI 候选
                         ↓
                 PPT Export Adapter
              PptxGenJS → PPTX → PDF
```

### 4.1 适配器边界

```ts
interface PptCompositionAdapter {
  createDeck(input: PptCompositionInput): Promise<PptDeck>;
  regenerateSlide(input: SlideRevisionInput): Promise<PptSlideCandidate>;
}

interface PptExportAdapter {
  exportPptx(deck: PptDeck): Promise<ExportArtifact>;
  exportPdf(deck: PptDeck): Promise<ExportArtifact>;
}
```

首发实现使用自有 `NativeCompositionAdapter` 和 `PptxGenJsExportAdapter`。只有在商业授权完成后，才允许增加其他专有适配器。

## 5. 数据模型

### 5.1 整稿

```json
{
  "id": "deck_id",
  "tenant_id": "tenant_id",
  "status": "generating | ready | failed",
  "outline_version": 1,
  "deck_version": 1,
  "theme_id": "enterprise_vi_v2",
  "knowledge_snapshot_ids": [],
  "enterprise_vi_version_id": "vi_v2",
  "slides": [],
  "license_manifest_version": "2026-08-13"
}
```

### 5.2 页面

```json
{
  "id": "slide_id",
  "role": "cover | agenda | insight | comparison | process | chart | action | closing",
  "layout_id": "owned_layout_id",
  "content": {
    "title": "",
    "summary": "",
    "items": [],
    "chart": null,
    "media": []
  },
  "candidate": null,
  "hidden": false,
  "order": 1
}
```

主题、版式和内容必须分离，切换主题不得改写企业事实。

## 6. 产品流程

1. 用户提交一句话需求与可选资料。
2. 系统只读取企业大脑正式知识和 Active VI。
3. 生成可编辑大纲，人工确认后才创建完整 PPT 任务。
4. 用户选择企业 VI 或一套自有默认主题，可查看封面和正文预览。
5. 后台异步生成完整稿，返回列表后用户可离开。
6. 就绪后可直接下载，或进入独立编辑页。
7. 单页 AI 修改生成候选版；采用后仅更新当前页并递增整稿版本。
8. 导出服务从同一份 `PptDeck` 模型产生 PPTX/PDF，不依赖未授权二进制组件。

## 7. 许可证与素材门禁

### 7.1 允许类型

- MIT
- Apache-2.0
- BSD-2-Clause / BSD-3-Clause
- ISC
- 经单独确认的 OFL 字体
- 有明确商业授权证明的自有或购买素材

### 7.2 默认禁止

- AGPL、GPL、SSPL 和其他强 copyleft 代码。
- 无 LICENSE、仅在 README 中模糊声明或仅提供二进制文件的组件。
- “仅限个人”、“不得用于其他产品”或需额外书面授权的组件。
- 来源不明的模板、图片、图标、字体、提示词和设计素材。

### 7.3 自动化检查

- 维护 `third-party-licenses.json`，记录名称、版本、来源、许可证、用途和文件范围。
- CI 检查 npm/Python 依赖许可证，未识别或禁止许可证直接失败。
- CI 扫描 Dashi 包名、文件指纹、专有导出组件和 Presenton 未授权导出包。
- 每套模板必须具有 `template-manifest.json`，缺失时不得上架。

## 8. 异常与降级

- 版式无法容纳内容时，切换至同角色的其他自有版式，不自动删除必要事实。
- 图片生成或上传失败时，保留原页和重试入口。
- 单页 AI 生成失败时，原页继续可编辑和下载。
- PPTX 导出失败时，记录失败阶段和脱敏错误，不将任务标记为就绪。
- PDF 转换不可用时，PPTX 仍可单独下载，并明确标注 PDF 生成失败。

## 9. 验收标准

- 用户可在企业 VI 和至少 3 套自有默认主题中预览并选择。
- 每页可切换至少 3 个适配当前内容角色的版式。
- 可修改文字、替换图片、编辑图表数据，并自动保存。
- 页面可排序、复制、删除和隐藏，且操作具有撤销或确认保护。
- AI 候选未采用前不改变原页；采用后不改变其他页。
- 导出的 PPTX 在 PowerPoint/WPS 中可打开，主要文字、形状、图表和图片可编辑。
- 导出前通过内容检查、全页渲染、溢出/遮挡检查和人工抽查。
- 产品运行依赖、模板、字体和图片的许可证清单无缺失项，CI 不含 AGPL/GPL/SSPL/未知许可证。

## 10. 分阶段实施

1. **PoC**：验证 PptxGenJS 的中文字体、企业 VI、图表、图片和 WPS/PowerPoint 可编辑性。
2. **产品原型**：补齐主题预览、版式候选、图片/图表编辑和页面管理。
3. **生成服务**：落地标准 `PptDeck` 模型、异步任务、对象存储和下载链接。
4. **许可证收口**：建立第三方清单、模板清单和 CI 阻断规则。
5. **真实交付验收**：完成 PPTX/PDF 全页渲染、WPS/PowerPoint 打开与编辑验证。

## 11. 开源来源使用原则

- Presenton：只能引入已确认属于 Apache-2.0 且完成依赖/素材审计的文件。
- PptxGenJS：作为 PPTX 导出引擎，保留 MIT 许可声明。
- Bento：仅在具体编辑器模块通过文件级来源和依赖审计后考虑引入。
- IBM chuk-mcp-pptx：可用于验证组件注册表和模板分析思路，不默认成为生产依赖。
- Dashi PPT：不进入代码库、构建、运行时、模板库或提示词库。

## 12. 安全结论

本设计不依赖“微服务隔离即规避许可证”的高风险假设。未知或受限组件默认不使用；对应能力由宽松许可开源组件与自有代码实现。这能支持闭源商业 SaaS，但上线前仍需对实际锁定的版本、模板、字体和素材进行最终法务复核。
