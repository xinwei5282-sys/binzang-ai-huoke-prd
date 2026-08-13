# 页面 PRD：设置 / Agent 权限

> 页面 ID：`agent-center`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_设置与治理]]

## 问题

不同Agent需要不同知识、工具和执行边界；权限入口散落在业务页面会让授权关系不透明并容易越权。

## 目标

在设置中统一维护Agent能力、数据范围、动作权限和人工审批门；支持测试、版本和审计。

## 目标用户

企业管理员配置；企业负责人批准高风险能力；业务负责人限定领域；审计人员查看记录。

## 用户流程

进入Agent权限 → 选择Agent → 查看当前能力与风险 → 编辑数据范围/工具/动作/审批门 → 权限模拟 → 提交审核 → 启用新版本 → 查看运行审计或回滚。

## 功能规则

- Agent授权仅在本页维护，企业VI、企业知识、外部情报、进化与治理不提供授权入口。
- 权限由确定性策略执行，Prompt不能扩大授权。
- 默认最小权限；发布、删除、外发、凭证、受限知识和自动采用必须人工审批或禁止。
- 每次修改形成不可变版本；运行记录保存实际命中的权限版本。

## 异常与边界

规则冲突时取更严格结果；禁用Agent立即阻止新任务但不删除历史；引用中的权限版本不可物理删除；模拟失败不允许启用；跨租户资源永远拒绝。

## 字段交互 / 取值

### Agent选择
下拉/列表。字段键：`agent_id`。取值同租户已注册Agent；显示名称、用途、状态和当前权限版本。

### Agent状态
开关。字段键：`enabled`。取值true/false；默认false；启用需至少一个数据域和一个允许动作。

### 数据范围
多选。字段键：`data_scopes`。取值confirmed_enterprise_knowledge/specified_domains/owned_tasks/public_intelligence；受限域单独审批。

### 知识域
多选。字段键：`knowledge_domains`。仅当选择specified_domains时必填；不可超过操作者本人授权范围。

### 工具能力
复选。字段键：`tool_capabilities`。取值read/search/generate/render/collect_public_data/create_draft；默认无。

### 动作权限
权限矩阵。字段键：`action_permissions`。每项取deny/allow/approval_required；动作含adopt/publish/export/send/delete/manage_credentials。

### 平台账号范围
账号多选。字段键：`platform_account_ids`。只有需发布草稿的Agent显示；Agent不能读取凭证，只能引用账号ID。

### 人工审批门
规则列表。字段键：`approval_gates`。含action、approver_role、threshold、timeout_behavior；高风险动作默认approval_required且超时拒绝。

### 运行限制
数字/时间配置。字段键：`runtime_limits`。含每日任务上限、单任务成本上限、允许时段、并发数；均需非负。

### 权限模拟
按钮。字段键：`simulate_policy`。选择用户、资源、动作后返回allow/deny、命中规则和缺口；不执行真实动作。

### 保存草稿
按钮。字段键：`save_policy_draft`。管理员可保存不完整版本，不影响active权限。

### 提交并启用
主按钮。字段键：`activate_policy`。模拟通过且审批完成后生成active版本；高风险变化需负责人二次确认。

### 回滚
危险按钮。字段键：`rollback_policy`。选择历史版本并说明原因；新建回滚版本，不删除历史。

## 状态与权限

权限版本：`draft → pending_approval → active → superseded | rolled_back`。管理员编辑，负责人批准高风险，审计只读，Agent自身无权修改。

## 数据与接口

对象：`agent_registry`、`agent_policy_version`、`agent_permission_rule`、`approval_gate`、`policy_decision_log`。接口：`GET/PATCH /settings/agents/{id}/policies`、`POST /policies/{id}/simulate|submit|activate|rollback`。错误码：`POLICY_CONFLICT`、`SCOPE_ESCALATION`、`SIMULATION_FAILED`、`APPROVAL_REQUIRED`、`CROSS_TENANT_DENIED`。

## Skill / Prompt

授权决策不使用大模型。配置助手Prompt：

```text
把用户描述转换为权限草案，不执行授权。输出data_scopes、tool_capabilities、action_permissions、approval_gates、risk_notes。任何发布、外发、删除、凭证、受限知识和自动采用默认approval_required或deny。
```

## 埋点事件

`agent_policy_viewed`、`agent_policy_draft_saved`、`agent_policy_simulated`、`agent_policy_submitted/activated/rolled_back`、`agent_action_denied`；属性含agent_id、action、risk_level、policy_version。

## 验收标准

1. 业务页面无Agent授权入口。
2. Prompt无法越过策略引擎权限。
3. 高风险动作默认需要审批或拒绝。
4. 每次运行可追溯实际权限版本和决策理由。
5. 跨租户访问始终拒绝。

## 核心指标

越权执行数0；高风险审批覆盖率100%；权限决策可解释率100%；运行权限版本可追溯率100%。
