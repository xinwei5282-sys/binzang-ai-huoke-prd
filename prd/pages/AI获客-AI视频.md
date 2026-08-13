# 页面 PRD：AI 获客 / AI 视频

> 页面 ID：`remix`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_视频模板化生成与换人换产品]]

## 问题

视频生成成本高、供应商异步且容易局部失败，需要按镜头重试、预算控制和授权链，而不是整片反复重做。

## 目标

基于已确认脚本/分镜生成、拼装、质检和下载视频资产；成片与发布分离。

## 目标用户

视频运营创建和重试；审核人质检；负责人确认预算；只读成员预览。

## 用户流程

选择已确认项目 → 选模板/供应商/输出参数 → 查看成本 → 提交 → 逐镜生成 → 失败镜头重试 → 拼装质检 → 下载或创建发布任务。

## 功能规则

只接受confirmed script/storyboard；单段任务独立；已成功段不重复计费；成片带AI标识、版本和授权链；本页面不默认发布。

## 异常与边界

供应商超时/拒绝/内容审核、单段失败、拼装失败、预算超限、回调验签失败分别处理；部分成功保留成功段并允许接管。

## 字段交互 / 取值

### 来源项目
选择器。字段键：`source_project_id`。仅显示ready_for_render项目；必填。

### 生成模板
卡片选择。字段键：`template_id`。取值已启用且适配分镜的模板；必填。

### 供应商/模型
下拉或系统自动。字段键：`provider/model`。默认按能力路由；管理员可限制，普通用户只读。

### 分辨率/比例/帧率
选择器。字段键：`resolution/aspect_ratio/fps`。取值720p/1080p、9:16/16:9/1:1、24/25/30；默认1080p/9:16/25。

### 成本预估/预算上限
只读预估+金额输入。字段键：`estimated_cost/budget_limit`。预算必须≥预估或负责人确认。

### 镜头任务列表
显示镜号、方式、时长、供应商、状态、成本、操作。字段键：`segments[]`；状态queued/rendering/succeeded/failed。

### 只重试失败镜头
部分失败时显示；复用输入版本，为失败段创建新attempt，成功段不动。

### 拼装/质检/下载
全部必需段成功后拼装；质检通过才ready；下载冻结render_version。

### 创建发布任务
ready显示；跳转选择平台、具体账号、方式和时间，不自动带默认账号。

## 状态与权限

`draft → queued → rendering → partial_success | assembling → quality_review → ready | failed`。高成本提交需预算权限；重试、质检、下载和发布跳转写审计。

## 数据与接口

对象：`video_render_task`、`video_segment_task`、`assembly_task`、`quality_result`、`video_asset`。接口：创建、状态、回调、失败段重试、拼装、质检、下载。所有调用含input_version、provider、budget_limit、idempotency_key。

## Skill / Prompt

Skill：`ai-video-segment-generation`、`video-assembly`。触发条件：脚本和分镜图均已人工确认；输入为已确认的`visual_prompt`、`asset_refs`、时长、画幅、字幕和品牌版本；输出为片段manifest、成片manifest、AI标识和失败段。Prompt版本、模型版本和素材版本随任务固化；片段失败只重试失败段，不能跳过确认门。

```text
你是AI视频片段生成器。仅依据 approved_script、approved_storyboard_frames、visual_prompt、licensed_asset_refs、active_vi_version 和 technical_constraints 生成镜头。
输出 segments[]，每段包含 segment_id、duration、shot_description、asset_refs、subtitle_ref、model_params、ai_label、safety_notes；同时输出 assembly_order 和 missing_inputs。
不得增加脚本未确认的业务事实、价格、案例、资质或承诺；不得替换人物、产品和品牌主体；不得使用无授权素材。输入不足时返回 missing_inputs，不得猜测。所有片段生成完成后仍须人工预览确认，禁止直接发布。
```

## 埋点事件

`video_render_submitted`、`segment_succeeded/failed/retried`、`video_assembled`、`quality_failed`、`video_downloaded`、`publish_task_opened`。

## 验收标准

未确认上游不能提交；部分失败可只重试失败镜头；幂等不重复扣费；ready成片有AI标识和授权链；页面无默认发布行为。

## 核心指标

分段成功率≥95%；重复计费率0%；部分失败重用成功段率100%；质检通过率上线后建立基线。
