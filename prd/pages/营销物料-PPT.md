# 页面 PRD：营销物料 / PPT

> 页面 ID：`material-ppt`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_营销物料]]

## 问题

PPT生成耗时长，生成后还要真实编辑和导出。若把长任务塞进步骤条、只能左右拖字、缩略图不能滚动或右侧堆满设计工具，用户无法完成实际交付。

## 目标

实现“需求→大纲确认→异步生成→三栏编辑→自动保存→PPTX/PDF导出”，文字可在安全区任意拖拽；不提供发布和结果回收。

## 目标用户

售前/运营创建编辑；审核人确认大纲；授权成员预览下载。

## 用户流程

进入列表 → 新建并填写需求 → AI生成逐页大纲 → 人工修改确认 → 返回列表异步生成 → ready后下载或进入编辑器 → 修改自动保存 → 导出最近已保存版本。

## 功能规则

- 未确认大纲不得生成完整PPT。
- 编辑器三列占满标题栏以下一屏并等高；左侧缩略图独立滚动。
- 标题、正文、页码/栏目、指标组、要点组、来源文字可任意拖拽；图片/图形自由拖拽、图层、群组、对齐线和矢量节点不在本期。
- 右侧只保留AI追问、替换图片、页面操作；删除设计工具、版式候选和编辑图表。
- AI追问先生成当前页候选，采用后才覆盖并递增deck_version。
- 页面背景独立异步生成，失败降级主题纯色。

## 异常与边界

大纲Schema失败可重试；单页失败不阻断其他页；保存失败保留本地待同步状态；导出前等待最近保存完成；版本冲突显示差异；背景失败不影响ready；导出组件许可证不明则禁止调用。

## 字段交互 / 取值

### PPT用途

单选/自定义。字段键：`purpose`。取值项目介绍/销售提案/经营汇报/培训/自定义；必填。默认项目介绍。

### 汇报对象

文本输入。字段键：`audience`。取值2–100字符，必填。

### 一句话目标

多行输入。字段键：`goal`。取值10–500字符，必填。

### 页数

数字或档位选择。字段键：`slide_count`。取值5–30，默认8；超出提示范围。

### 参考资料

多文件上传。字段键：`reference_assets`。PDF/DOCX/PPTX/TXT/图片，单个≤30MB；提取只进入任务上下文。

### 主题/VI

主题卡片选择。字段键：`theme_id/vi_version_id`。取值active VI或至少3套系统主题；必填。切换只改变视觉，不改事实。

### 大纲页面标题

逐页单行输入。字段键：`outline.slides[].title`。取值2–60字符，必填；失焦保存。

### 大纲页面目的

逐页多行输入。字段键：`outline.slides[].objective`。取值5–300字符，必填。

### PPT列表字段

字段键：`name/status/slide_count/deck_version/created_at/updated_at/error`。状态brief/outline_review/generating/ready/failed；generating无下载。

### 生成大纲

校验需求后调用AI；loading防重复；失败显示错误码并保留输入。

### 确认大纲并生成

所有页面标题/目的完整时可用；二次确认后冻结outline_version、创建异步任务并返回列表。

### 预览/编辑

ready显示；新开独立编辑页并保留列表状态。

### 缩略图列表

纵向滚动；选中切页。字段键：`selected_slide_id`。支持新增、拖动排序、隐藏状态；移动端横向滚动。

### 文字元素

点击编辑、拖拽移动。字段键：`elements[].content/x/y/w/h`。坐标为画布归一化0–1；拖拽限制安全区；结束后自动保存。

### 保存状态

只读。字段键：`save_status`。取值saving/saved/failed；失败显示重试，不设置必点保存按钮。

### AI追问

多行输入。字段键：`page_prompt`。取值2–500字符；仅作用当前页。生成候选时不覆盖原页。

### 采用新版/撤回

候选存在时显示。采用写入当前页并递增版本；撤回删除候选，不改原页。

### 替换图片

选择当前页图片后上传或生成替换；保存授权来源，成功后自动保存。

### 页面操作

上移/下移/复制/删除/隐藏。删除需二次确认，至少保留1页；操作后自动保存。

### 下载PPTX/PDF

ready且save_status=saved时可用；读取最近已保存deck_version，生成任务防重复。

## 状态与权限

任务：`brief → outline_review → generating → ready | failed`。保存：`saving → saved | failed`。候选：`generating → pending_candidate → adopted | discarded | failed`。创建者/编辑者可改，审核人确认大纲，授权成员下载；删除和导出写审计。

## 数据与接口

对象：`ppt_task`、`outline_version`、`ppt_slide`、`slide_element`、`background_asset`、`page_candidate`、`export_task`。slide_element含element_id、slide_id、type、content、x/y/w/h、z_order、style、source_refs、version。

接口：`GET/POST /ppt-tasks`、`POST /{id}/outline`、`POST /{id}/confirm-outline`、`GET /{id}/status`、`PATCH /ppt-slides/{id}`、`PATCH /slide-elements/{id}`、`POST /ppt-slides/{id}/candidates`、`POST /candidates/{id}/adopt`、`POST /ppt-tasks/{id}/export`。

错误码：`OUTLINE_NOT_CONFIRMED`、`SCHEMA_INVALID`、`SAVE_FAILED`、`VERSION_CONFLICT`、`ELEMENT_OUT_OF_BOUNDS`、`BACKGROUND_FAILED`、`EXPORT_LICENSE_BLOCKED`、`EXPORT_FAILED`。

## Skill / Prompt

Skills：`ppt-outline-generator`、`ppt-slide-generator`、`imagegen`等价背景服务、`ppt-export-adapter`。

```text
你是企业演示文稿策划。基于 confirmed_facts、active_vi、purpose、audience、goal 先输出逐页大纲。每页返回 title、objective、role、key_points、evidence_refs、visual_intent、background_prompt。禁止编造数据、案例和承诺。背景提示词不得包含文字、Logo、水印或业务数字，并为文字保留安全区。只有 outline_confirmed=true 后才能生成完整页面。
```

## 埋点事件

`ppt_created`、`ppt_outline_generated/confirmed`、`ppt_generation_failed`、`ppt_editor_opened`、`ppt_element_moved`、`ppt_auto_save_failed`、`ppt_candidate_adopted`、`ppt_exported`；拖拽事件含slide_id、element_type，不记录正文。

## 验收标准

1. 未确认大纲不能创建完整PPT任务。
2. 1440×900三列等高，8页以上缩略图独立滚动；390×844横向滚动。
3. 文字可上下左右任意拖到安全区，重开和导出位置一致。
4. 右侧无设计工具、版式候选和编辑图表。
5. 单页背景失败降级纯色，其他页仍可编辑下载。
6. 导出读取最近saved版本，PPTX保持可编辑文字。

## 核心指标

大纲确认后生成成功率≥95%；自动保存成功率≥99.5%；位置恢复准确率100%；导出成功率≥99%；编辑器严重溢出/控制台错误0。
