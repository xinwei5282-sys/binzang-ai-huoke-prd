---
artifact: prd
version: "1.0"
created: 2026-08-13
status: current
---

# PRD：营销物料

> 上位真源：[[PRD_企业AI经营大脑_当前开发基线]]。相关细节参考 [[PRD_内容创作]]、[[PRD_作品库与发布]]。

## 1. 目标与渠道边界

基于企业正式知识和已启用 VI 生成可编辑营销物料。不同渠道能力必须分开，不能套用统一的“发布+数据回收”。

| 渠道 | 核心能力 | 发布 | 数据回收 |
|---|---|---|---|
| PPT | 大纲确认、异步生成、编辑、下载 | 无 | 无 |
| 朋友圈图文 | 新建、编辑、预览、导出图文包 | 无 | 无 |
| 海报 | 新建、编辑、预览、下载图片 | 无 | 无 |
| 公众号文章 | 创作、审核、选账号、定时/API/RPA 发布 | 支持 | 每篇阅读、分享 |

公众号文章不显示“在看”和“新增关注”。朋友圈、海报不得出现发布账号、自动发布、发布状态或效果数据。

## 2. 共享生成契约

### MAT-001 创建任务

- 输入：目标、受众、场景、渠道、语气、企业知识版本、active VI、经营计划关联项。
- 输出：内容草稿、来源引用、风险提示、生成版本。
- 状态：`draft → generating → pending_review → approved | rejected | failed`。
- AI 修改后重新进入 `pending_review`；未确认事实不得进入成品。

### MAT-002 朋友圈图文

- 页面只保留新建、列表、预览、编辑、导出图文包、草稿/审核状态。
- 导出包含图片、正文、标签建议和使用说明。
- 无发布、账号选择和结果回收。

### MAT-003 海报

- 支持尺寸/场景选择、文案编辑、图片替换、预览和下载。
- 生成内容必须使用 active VI；未启用 VI 不进入上下文。
- 无发布、账号选择和结果回收。

### MAT-004 公众号文章

- 创建时必须选择已绑定公众号；支持多公众号。
- 发布方式按账号能力显示：官方 API、RPA、手动导出。
- 自动发布时间是文章任务独立字段，可读取经营计划建议时间，但必须单独确认。
- 列表每篇直接展示阅读、分享数据及最后同步时间，不再用“文章数据”容器包裹。
- 数据必须按 `article_id + account_id + publish_record_id` 回收，不能混入其他文章。

## 3. PPT 专项

### MAT-PPT-001 生成

- 一句话需求 → AI 逐页大纲 → 人工确认 → 后台异步生成。
- 状态：`draft_outline → pending_outline_confirmation → generating → ready | failed`。
- `ready` 可直接下载 PPTX/PDF 或进入编辑页。

### MAT-PPT-002 编辑器

- Presenton 风格三栏：左侧缩略图、中间画布、右侧 AI 追问/替换图片/页面操作。
- 标题栏以下三列等高并铺满一屏；左侧缩略图独立滚动。
- 删除设计工具、版式候选和“编辑图表”。
- 标题、正文、页码/栏目、指标组、要点组、来源文字可在安全边界内任意拖拽。
- 编辑、拖拽、替换图片和页面操作默认自动保存，显示 `保存中 | 已保存 | 保存失败`。
- 支持新增、上移、下移、复制、删除、隐藏页面。
- AI 追问只生成当前页候选，点击采用后才覆盖原页。

### MAT-PPT-003 背景与导出

- 每页背景独立异步生成；失败时降级为主题纯色，不阻断文本编辑和整套下载。
- 导出适配器使用自有接口；首发 PPTX 使用 PptxGenJS，禁止接入许可证不明的导出组件。
- Demo 使用完整 8 页“企业 AI 经营大脑项目介绍”。

## 4. 数据与接口

核心对象：`content_task`、`content_version`、`ppt_task`、`ppt_slide`、`element_position`、`publishing_account`、`publish_task`、`article_metric`。

- `POST /content-tasks`、`GET /content-tasks/{id}`。
- `POST /ppt-tasks/{id}/confirm-outline`、`PATCH /ppt-slides/{id}`。
- `POST /publish-tasks`、`POST /publish-tasks/{id}/confirm`。
- `GET /articles/{id}/metrics?account_id=`。

## 5. Skill 与 Prompt

- Skills：`content-context-builder`、`ppt-outline-generator`、`ppt-slide-generator`、`official-account-publisher`、`rpa-publisher`、`channel-metrics-collector`。
- Prompts：总 PRD `P-000`、`P-040`、`P-041`、`P-060`。
- 每次执行记录 Skill 版本、Prompt 版本、输入知识版本、输出 Schema、耗时和错误。

## 6. 验收标准

| ID | 操作 | 预期结果 |
|---|---|---|
| MM-AC-001 | 打开朋友圈/海报 | 无发布和数据回收相关控件 |
| MM-AC-002 | 创建公众号文章 | 必须选择具体公众号和发布方式 |
| MM-AC-003 | 查看文章列表 | 每篇只显示对应阅读、分享和同步时间 |
| MM-AC-004 | 设置文章自动发布时间 | 独立保存；计划时间仅作为建议值 |
| MM-AC-005 | 1440×900 打开 PPT 编辑器 | 三列等高满屏，缩略图可独立滚动 |
| MM-AC-006 | 拖拽第 2 页文字并重开 | 可拖到安全区任意位置，坐标自动保存且仅影响第 2 页 |
| MM-AC-007 | 单页背景失败 | 使用主题纯色，其他页仍可编辑和下载 |

## 7. 风险与依赖

- 依赖企业知识、企业 VI、账号绑定、公众号 API/RPA、调度器和指标回收接口。
- RPA 易受页面变化影响，必须人工确认、幂等、截图留证并支持人工接管。
- 导出许可证风险必须保留组件级清单和法律复核记录。
