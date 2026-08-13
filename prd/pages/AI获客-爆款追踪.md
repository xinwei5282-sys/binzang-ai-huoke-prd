# 页面 PRD：AI 获客 / 爆款追踪

> 页面 ID：`burst`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_爆款抓取]]

## 问题

运营缺少持续、可追溯的公开趋势来源，容易把偶然热度当成企业事实或直接复制他人内容。

## 目标

从公开来源发现、去重、转写和拆解内容模式，形成选题候选；保留来源和版权边界。

## 目标用户

运营搜索和采用选题；负责人配置对标范围；审核人检查来源与版权。

## 用户流程

选择关键词/账号/榜单 → 设置平台与时间 → 发起采集 → 查看列表与证据 → 转写/拆解 → 采用为选题或忽略。

## 功能规则

只采集公开可访问内容；不绕过登录、验证码、付费墙和访问控制。原内容只供内部研究，采用结果不是企业硬事实，生成新内容仍需事实和合规审核。

## 异常与边界

页面失效、无字幕、转写空、指标不可验证、重复URL、配额/QPS超限分别显示状态；不得用AI补造原文或热度。

## 字段交互 / 取值

### 采集模式
页签。字段键：`mode`。取值keyword/account/ranking；默认keyword；切换保留各模式输入。

### 平台
单选。字段键：`platform`。取值已配置的公开数据平台；必填；显示能力和覆盖说明。

### 关键词
文本/标签输入。字段键：`keywords[]`。每项2–30字，最多20项；keyword模式至少1项。

### 对标账号
账号名称或公开链接列表。字段键：`benchmark_accounts[]`。最多20个；account模式至少1个；保存canonical账号ID。

### 时间范围/排序
下拉。字段键：`date_range/sort`。时间7/30/90天；排序按发布时间/互动/相关性；默认7天+相关性。

### 采集按钮
创建异步collection任务；loading防重复；消耗预估在提交前显示。

### 候选列表字段
封面、标题、来源账号、发布时间、采集时间、公开指标、相关性、证据级别、状态。字段键：`candidate.*`；不可验证指标显示“—”。

### 原始来源
链接按钮。字段键：`source_url`。新窗口打开；失效时显示最后采集快照和失效标记。

### 转写/拆解
按能力显示；触发ASR/正文提取和结构分析。字段键：`extract/analyze`；空结果进入failed，不进入完成。

### 采用为选题/忽略
采用生成topic_candidate并保留source_ref；忽略填写可选原因，不删除原候选。

## 状态与权限

`discovered → extracting → extracted → analyzing → pending_review → adopted | ignored | failed`。运营采集分析；负责人配置来源；采用需内容权限。

## 数据与接口

对象：`trend_collection`、`trend_candidate`、`transcript`、`topic_candidate`。接口：`POST /trend-collections`、`GET /trend-candidates`、`POST /{id}/extract|analyze|adopt|ignore|retry`。唯一约束platform+external_content_id或canonical_url。

## Skill / Prompt

Skills：公开采集、defuddle/ASR、去重、内容拆解。
```text
分析公开内容并输出hook、audience、structure、arguments、visual_pattern、cta、transferable_pattern、risk_flags、relevance、source_refs、fact_or_inference。不得复制长段原文，不得虚构指标；可迁移模式仅作为选题候选。
```

## 埋点事件

`trend_collection_started/failed`、`trend_source_opened`、`trend_analyzed`、`trend_adopted/ignored`；属性含mode、platform、result_count、error_code。

## 验收标准

来源、发布时间和采集时间可追溯；重复内容合并；空转写不标完成；采用不写企业硬事实；受限页面不采集。

## 核心指标

可追溯来源率100%；去重准确率上线后建立基线；转写空结果误完成率0%；选题采用率仅观察。
