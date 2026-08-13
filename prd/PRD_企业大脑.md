---
artifact: prd
version: "1.0"
created: 2026-08-13
status: current
---

# PRD：企业大脑

> 上位真源：[[PRD_企业AI经营大脑_当前开发基线]]。底座参考 [[PRD_知识库]]、[[PRD_多模态知识库底座]]。
> **版本**：v1.1 ｜ **状态**：当前模块开发基线 ｜ **负责人**：产品—明策 ｜ **原型**：`prototype/index.html`

## 0. 文档概述

### 0.1 产品背景

企业资料、品牌资产、公开信息和 AI 推断若混在一起，会造成事实污染、重复待办和不可解释生成。历史知识库偏重“上传与检索”，但企业经营大脑还需要回答系统认识了什么、证据是什么、缺什么、哪些可被 AI 使用。本模块融合知识库、多模态底座、企业 VI、外部情报和进化治理，建立统一可信上下文。

### 0.2 产品目标与指标

| 目标 | 验收指标 |
|---|---|
| 企业认知清晰 | 四张认知卡字段/来源/缺口完整展示率 100% |
| 候选不污染事实 | 未确认候选进入正式生成上下文次数 0 |
| 硬事实准确 | 未命中正确留空率 100%，已命中引用可追溯率 100% |
| VI 一致 | 非 active VI 被生成调用次数 0 |
| 治理可追溯 | 采用、驳回、回滚和软删除审计覆盖率 100% |

### 0.3 用户与场景

企业负责人确认核心事实和 VI；运营上传资料、处理候选和补缺；品牌人员选择并下载 VI；研究人员采集公开网站；治理人员处理冲突、过期项与学习候选。首次使用允许跳过，未确认提取结果始终是候选。

## 1. 目标与信息架构

企业大脑是所有 AI 任务的可信上下文中心，回答“系统已经了解企业什么、依据是什么、还缺什么、哪些内容待确认”。二级页面包括：诊断总览、企业 VI、企业知识、外部情报、进化与治理。

顶部标题显示一级菜单“企业大脑”，内容区显示当前二级菜单名称。企业知识、企业 VI、外部情报、进化与治理页不得显示“Agent 授权”；企业 VI、外部情报和进化与治理页不得显示“上传资料”。

## 2. 核心能力

### BRAIN-001 知识总览

- 首屏四张认知卡：企业身份；业务、产品与客户；获客与经营；目标、资源与品牌。
- 每卡显示已确认摘要、来源证据、待确认数量、待补字段和冲突提示。
- 下方显示内容源、统一待处理队列和知识治理状态。
- 无真实治理数据时显示“待接入”，不得伪造健康度。

### BRAIN-002 统一待处理队列

- 将“待确认、资料收件箱、资料处理中”合并为一个工作队列，用状态和筛选区分。
- 状态：`received → processing → pending_confirmation → adopted | rejected | failed`。
- 处理中的项目不重复出现在另一个入口；失败项保留原因和重试入口。
- 人工采用后才设置 `formal=true`、`usable_for_generation=true`。

### BRAIN-003 企业知识

- 七类知识域：基础事实、产品服务、客户市场、品牌内容规范、销售经营规则、案例证明、外部环境。
- 来源优先级：企业人工确认 > 已采用候选 > 待确认候选 > 待补充。
- 正式内容软删除并保留操作者、原因和时间。
- AI 生成内容可作为资产复用，但不得反向覆盖企业硬事实。

### VI-001 企业 VI

- 流程：偏好 → 三套方向 → 查看具体 VI 展示 → 选择方向 → 场景图生成/审核 → 完整草案 → 人工启用 → 下载全套 VI。
- 每套方向至少展示 Logo、颜色、字体、图形语言和多个应用场景。
- 只有 `active` 版本可进入内容生成上下文；下载任务必须冻结版本。

### INTEL-001 外部情报

- 两个对齐入口：添加公开链接、采集公开网站。
- 仅采集公开可访问内容；记录 URL、来源、发布时间、采集时间、摘要、证据片段。
- 去重后进入候选列表，人工采用后才可用于企业事实或生成上下文。
- 登录后、付费、私域或禁止抓取内容不采集。

### GOV-001 进化与治理

- 展示内容表现、事实冲突、过期知识、低置信度项和学习候选。
- 指标回收只能生成“建议调整”，不得自动修改知识、VI、Prompt 或经营计划。
- 采用、拒绝、回滚均保留版本和审计记录。

## 3. 数据与接口

核心对象：`knowledge_item`、`knowledge_source`、`intake_item`、`vi_version`、`external_intelligence_candidate`、`learning_candidate`、`audit_event`。

- `GET /enterprise-brain/overview`：读取四卡认知和缺口。
- `GET /knowledge-intake?status=`、`POST /knowledge-intake/{id}/adopt|reject|retry`。
- `POST /vi-directions`、`POST /vi-versions/{id}/activate`、`POST /vi-downloads`。
- `POST /external-intelligence/links`、`POST /external-intelligence/collections`。
- `POST /learning-candidates/{id}/adopt|reject`。

所有候选对象必须保存 `tenant_id`、来源、提取器/Skill 版本、置信度、状态和审计时间。

## 4. Skill 与 Prompt

- Skills：`enterprise-intake-extractor`、`knowledge-conflict-detector`、`enterprise-vi-generator`、`collect-external-intelligence`、`learning-candidate-generator`。
- Prompts：总 PRD `P-010`、`P-020`、`P-021`、`P-030`。
- Skill 输出必须通过 Schema 校验；失败或部分成功不能伪装成已采用事实。

### 4.1 企业知识提取提示词模板

```text
你是企业知识提取 Agent。输入 raw_source、source_type、source_uri、tenant_id 和已有 confirmed_facts。
只抽取原文明确出现的信息；每条返回 domain、key、value、evidence_quote、source_location、confidence、candidate_status。无法确认时标记 unknown，不得补全。
发现与 confirmed_facts 冲突时返回 conflict_with_fact_id，不覆盖原事实。所有结果初始为 pending_confirmation，usable_for_generation=false。
严格按 output_schema 输出。
```

外部情报 Prompt 额外返回 `published_at/collected_at/topic/summary/relevance/source_url/dedup_key`；VI Prompt 只使用已确认品牌事实生成三套差异化方向，不得虚构 Logo 权属、字体许可证或企业案例。

## 5. 验收标准

| ID | 操作 | 预期结果 |
|---|---|---|
| EB-AC-001 | 打开企业知识总览 | 首屏显示四张企业认知卡、依据、待确认和待补项 |
| EB-AC-002 | 上传资料并开始处理 | 只进入统一待处理队列，状态由处理中转为待确认 |
| EB-AC-003 | 未确认候选触发内容生成 | 候选不进入正式生成上下文 |
| EB-AC-004 | 查看任一 VI 方向 | 可查看具体 Logo、色彩、字体和场景展示 |
| EB-AC-005 | 下载全套 VI | 下载内容对应冻结的 active 版本 |
| EB-AC-006 | 添加公开链接 | 生成带来源的候选，人工采用前不写入正式知识 |
| EB-AC-007 | 打开四个治理相关页面 | 不出现 Agent 授权；指定页面不出现上传资料 |
| EB-AC-008 | 回收内容效果 | 只产生学习候选，未经采用不改变知识与策略 |

## 6. 风险与依赖

- 依赖文档/OCR、网页采集、对象存储、检索、VI 图片生成和审计服务。
- 事实污染风险：候选与正式知识物理/逻辑分层，所有采用动作人工确认。
- 多租户泄露风险：检索、文件、凭证、缓存和日志均按租户隔离。
- 采集合规风险：仅公开来源，遵守站点规则并保留来源证据。

## 7. 开发拆分与里程碑

| 阶段 | 交付 |
|---|---|
| M1 | 四卡总览、统一待处理队列、候选/正式事实和审计 |
| M2 | 多模态提取、硬事实精确查询、冲突和缺口治理 |
| M3 | VI 三方向、场景预览、active 版本与全套下载 |
| M4 | 公开链接/网站采集、进化候选和全链路验收 |

## 8. 修订记录

| 版本 | 日期 | 说明 |
|---|---|---|
| v1.1 | 2026-08-13 | 融合知识库和多模态底座历史规格，补齐背景、目标、指标、Prompt 和里程碑 |
