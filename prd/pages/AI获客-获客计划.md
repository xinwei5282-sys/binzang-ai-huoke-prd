# 页面 PRD：AI 获客 / 获客计划

> 页面 ID：`plan`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_AI获客]]

## 问题

企业获客动作常与经营目标、目标客户、负责人和渠道资源脱节；计划若直接发布又会绕过账号选择和人工确认。

## 目标

把经营计划拆成可执行的获客计划、内容任务和衡量指标，但不自动选择账号、不自动外发。

## 目标用户

企业负责人审核计划；增长/运营负责人编排任务；执行成员更新进度；只读成员查看。

## 用户流程

进入列表 → 新建计划 → 选择经营目标/周期/受众/渠道 → AI生成草案 → 人工编辑审核 → 启用 → 创建内容任务 → 跟踪复盘。

## 功能规则

- 每个获客计划关联0或1个经营计划行动；无关联时必须手填目标依据。
- 渠道任务只保存平台偏好，真正发布时必须重新选择具体账号和方式。
- 未确认事实、预算和承诺进入缺口，不得形成正式任务。
- 计划启用后修改产生新版本。

## 异常与边界

无目标客户、指标或负责人不能提交审核；预算超护栏阻止启用；关联经营行动失效时标记待修复；并发修改返回版本冲突。

## 字段交互 / 取值

### 计划名称
文本输入，失焦保存。字段键：`name`。取值2–80字，必填；默认“周期+获客计划”。

### 关联经营行动
选择器。字段键：`operating_plan_action_id`。取值同租户active行动，可为空；选择后带入目标和建议周期。

### 目标客户
多行输入+企业画像建议。字段键：`target_audience`。取值5–500字，必填；AI建议需人工采用。

### 阶段目标
多行输入。字段键：`objective`。取值5–300字，必填；不得写未经确认ROI承诺。

### 计划周期
日期范围。字段键：`start_at/end_at`。开始<结束且最长1年；必填。

### 渠道
多选。字段键：`channels`。取值wechat/douyin/xiaohongshu/offline/other；至少1项；不等于发布账号。

### 预算上限
金额输入。字段键：`budget_limit`。取值≥0，币种CNY；可为空；超过租户护栏需负责人确认。

### 核心指标
指标组。字段键：`metrics[]`。每项含name/target/unit；至少1项；禁止用虚构基线。

### 负责人
成员选择器。字段键：`owner_id`。取值active成员，必填。

### 任务列表
展示任务名称、类型、负责人、截止时间、状态、关联内容。字段键：`tasks[]`；支持新增、排序、拆分和进入对应页面。

### 生成获客计划
主按钮；字段完整后调用AI生成draft，loading防重复。

### 提交审核/确认启用
分别进入pending_confirmation和active；高风险、预算、缺口未关闭时阻止启用。

## 状态与权限

`draft → pending_confirmation → active → completed | archived`。负责人审核启用；运营编辑草案和任务；执行人只更新被分配任务。

## 数据与接口

对象：`acquisition_plan`、`acquisition_task`、`plan_metric`、`plan_review`。接口：`GET/POST /acquisition-plans`、`PATCH /{id}`、`POST /{id}/generate|review|activate|archive`、`POST/PATCH /{id}/tasks`。错误码：`METRIC_REQUIRED`、`BUDGET_GUARDRAIL`、`FACT_GAP`、`OWNER_INVALID`、`VERSION_CONFLICT`。

## Skill / Prompt

```text
你是企业获客策划。仅使用 confirmed_facts、approved_operating_plan 和 user_constraints。输出目标客户、阶段目标、渠道策略、任务、负责人角色、时间、指标、预算风险、evidence_refs、missing_inputs。不得选择具体发布账号、不得执行发布、不得承诺ROI。
```

## 埋点事件

`acquisition_plan_created/generated/reviewed/activated`、`acquisition_task_created`、`budget_guardrail_triggered`；属性含plan_id、channel_count、task_type、risk_count。

## 验收标准

1. 缺目标客户、指标、负责人时不能审核。
2. 启用计划不会自动创建发布记录。
3. 任务进入发布时仍必须选择具体账号和方式。
4. 历史版本与依据可追溯。

## 核心指标

计划字段完整率100%；审核通过率和按期完成率上线后建立基线；绕过账号选择的发布任务数0。
