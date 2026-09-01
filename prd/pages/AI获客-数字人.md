# 页面 PRD：AI 获客 / 数字人

> 页面 ID：`avatar`｜版本：v1.1｜优先级：P0｜日期：2026-09-01｜上位：[[../PRD_数字人]]

## 页面概述

| 项目 | 说明 |
|---|---|
| 页面目标 | 管理授权形象和声音，并完成低成本预览、人工确认、异步成片和质检。 |
| 适用角色 | 管理员管理授权；运营选择脚本和资源；授权审核人确认；视频人员处理失败。 |
| 页面入口 | `AI 获客 → 数字人`，或从 AI 混剪选择数字人时进入管理。 |
| 权限要求 | 授权审核、训练、成片和查看分权；创建人不得自批授权。 |

## 页面级业务规则

- 未授权、授权过期或被禁用的形象和声音不可训练、预览或正式出片。
- 修改口播脚本创建新版本并使旧预览确认失效。
- 正式成片前必须完成人工预览和预算检查，所有成片包含 AI 生成标识。
- 供应商失败不得自动更换人物或声音；只能按授权范围选择替代项。
- 本页不保存平台密码、不直接发布；成片发布进入独立发布任务。

## 页面字段

| 字段 | 类型 | 必填/展示规则 | 业务口径 |
|---|---|---|---|
| 形象卡片 | 3:4卡片 | 列表必显 | 图片、名称、类型、授权状态和训练状态。 |
| 形象名称 | 文本 | 2–40字，必填 | 同租户可重名但 ID 唯一。 |
| 形象/声音素材 | 文件 | 按供应商规则必填 | 文件租户隔离，不进入 Prompt 日志。 |
| 授权证明 | 文件+范围表单 | 必填 | 范围、授权人、用途和有效期可追溯。 |
| 数字人形象/声音 | 选择器 | 创建成片时必填 | 只显示 `available` 且授权有效资源。 |
| 口播脚本 | 版本选择+编辑 | 必填 | 使用已审核脚本；编辑后产生新版本。 |
| 输出参数 | 组合控件 | 必填 | 时长、画幅、分辨率、字幕和语速。 |
| 成片状态 | 枚举 | 列表必显 | `queued/rendering/quality_review/succeeded/failed`。 |

## 操作与结果

| 按钮/操作 | 展示条件 | 执行结果 | 权限与记录 |
|---|---|---|---|
| 新建形象 | 有管理权限 | 创建 `draft` 并上传素材 | 写创建人和文件版本。 |
| 提交授权审核 | 授权材料完整 | `draft → pending_authorization` | 写授权范围快照。 |
| 开始训练 | 授权通过 | 创建训练任务 | 保存供应商、授权和输入版本。 |
| 生成预览 | 资源可用且脚本已审核 | 生成低成本短预览 | 不消耗完整成片额度。 |
| 确认并生成成片 | 预览、预算和额度通过 | 创建正式渲染任务 | 写确认人和脚本版本。 |
| 重试 | 训练或渲染失败 | 仅重试失败阶段 | 保留失败原因和次数。 |
| 禁用/撤回授权 | 有授权管理权限 | 阻止新任务，保留历史产物 | 写原因和操作者。 |

## 产品边界

数字人页面只管理授权、训练、口播适配和视频资产，不负责账号发布或绕过供应商限制。原型使用演示素材和状态；生产环境必须接真实存储、供应商、回调验签、成本和授权校验。

## 状态与跳转

- `形象：draft → pending_authorization → training → available | failed | disabled`
- `成片：draft → awaiting_human_confirmation → queued → rendering → quality_review → succeeded | failed`
- `succeeded → download or create_publish_task`

## 通知与日志

- 授权待审、授权到期、训练失败、质检失败和成片完成通知对应负责人。
- 记录 `avatar_created`、`authorization_submitted/approved/rejected`、`avatar_training_started/failed`、`avatar_preview_generated`、`avatar_render_confirmed/succeeded/failed`。
- 审计包含授权、脚本、供应商和任务版本，不记录授权文件正文、声音原文件或密钥。

## 异常与空状态

| 场景 | 页面表现 |
|---|---|
| 首次无形象 | 说明授权要求并提供新建入口。 |
| 授权材料缺失 | 阻止提交并定位缺失范围或文件。 |
| 授权过期/撤回 | 标记禁用并阻止新任务，历史审计仍可查看。 |
| 训练或供应商失败 | 显示脱敏错误码、重试和人工处理入口。 |
| 额度不足 | 阻止正式成片，显示成本预估和额度入口。 |
| 回调验签失败 | 不更新成功状态，记录安全事件。 |

## 页面验收标准

1. 未授权、过期或禁用的资源不可训练、预览或出片。
2. 脚本修改后旧确认失效，正式成片使用当前脚本版本。
3. 重复回调不会重复创建成片或扣费。
4. 授权撤回阻止新任务但不删除历史审计。
5. 成片包含 AI 标识、授权链、脚本版本和质检结果。

## 技术评估项

- 核心对象：`avatar/voice/authorization_record/avatar_training_task/avatar_video_task`。
- 上传、授权审核、训练、预览、成片、回调、重试和禁用接口均按租户隔离。
- 回调必须验签并按供应商任务 ID 幂等；重复成功回调不得重复扣费。
- 口播适配只允许断句、停顿、重音和时长建议，不得改变硬事实和承诺。
- 正式接入前需评估供应商算法备案、数据保留、删除、授权范围、成本和失败率。

# 详细执行契约（保留）

## 问题

数字人涉及人物、声音授权和供应商成本，若授权失效或口播事实错误仍出片，会产生合规和客户风险。

## 目标

管理授权形象/声音，完成低成本预览、人工确认、异步成片和质检；发布由独立任务处理。

## 目标用户

管理员管理授权；运营选择形象和脚本；授权审核人确认；视频人员处理失败。

## 用户流程

查看形象 → 新建/上传授权 → 训练 → 选择形象声音和已审核脚本 → 预览 → 确认 → 正式成片 → 质检下载/创建发布任务。

## 功能规则

未授权或过期形象/声音不可训练或出片；修改口播产生新版本并重新确认；所有成片带AI标识；本模块不持有平台密码、不直接发布。

## 异常与边界

授权材料缺失、训练失败、供应商拒绝、额度不足、回调验签失败、质检失败分别展示；授权撤回后阻止新任务但保留历史审计。

## 字段交互 / 取值

### 形象卡片
3:4大卡，显示图片、名称、类型、授权/训练状态。字段键：`avatar_id/status`。状态draft/pending_authorization/training/available/failed/disabled。

### 形象名称
文本输入。字段键：`name`。2–40字，必填。

### 形象素材/声音素材
文件上传。字段键：`avatar_media/voice_media`。按供应商格式/时长校验；文件租户隔离，不进入Prompt日志。

### 授权证明
文件+授权范围表单。字段键：`authorization_document/scope/expires_at`。必填；到期时间不得早于今天。

### 数字人形象/声音
创建成片时选择。字段键：`avatar_id/voice_id`。只显示available且未过期；必填。

### 口播脚本
选择已审核脚本或文本编辑。字段键：`script_version_id/script_text`。事实引用必需；修改后生成新版本。

### 输出参数
时长、比例、分辨率、字幕开关。字段键：`duration/aspect_ratio/resolution/subtitles`；默认跟脚本/9:16/1080p/开。

### 生成预览
授权和脚本通过时可用；生成低成本短预览，不扣正式成片全部额度。

### 确认并生成成片
预览确认、预算和额度通过后提交；loading防重复。

### 成片列表字段
任务、形象、脚本版本、状态、时长、成本、AI标识、操作。状态queued/rendering/quality_review/succeeded/failed。

## 状态与权限

形象：`draft → pending_authorization → training → available | failed | disabled`；成片：`draft → awaiting_human_confirmation → queued → rendering → quality_review → succeeded | failed`。授权管理员审核；运营不可自批授权。

## 数据与接口

对象：`avatar`、`voice`、`authorization_record`、`avatar_training_task`、`avatar_video_task`。接口：上传、授权审核、训练、预览、成片、回调、重试、禁用。回调验签且幂等。

## Skill / Prompt

Skill：`digital-human-script-adapter`、`digital-human-render-router`。触发条件：数字人和声音授权有效、脚本已审核；输入为已审核脚本、形象ID、声音ID、语速和画幅；输出为断句后的口播脚本、时长估算、渲染参数和风险提示。授权文件、密钥和声音原文件不得进入模型上下文；渲染失败返回供应商错误映射，不自动换用其他人物或声音。

```text
你是数字人口播适配器。仅对 approved_script 做断句、停顿、重音和时长适配，保持原意和所有事实不变。
输入：approved_script、avatar_id、voice_id、speech_rate、target_duration、aspect_ratio、pronunciation_dictionary。
输出：speech_segments[]、estimated_duration、pronunciation_warnings、overflow_actions、render_constraints。
不得补写或改写价格、承诺、案例、资质和CTA；不得推断授权内容；不得输出凭证、授权文件或声音原文件。超出时长时只给出可删除句段建议，由用户确认后再改。成片生成后必须人工预览，禁止自动发布。
```

## 埋点事件

`avatar_created`、`authorization_submitted/approved/rejected`、`avatar_training_failed`、`avatar_preview_generated`、`avatar_render_confirmed/succeeded/failed`。

## 验收标准

未授权不可训练/出片；脚本修改后旧确认失效；回调重复不重复建成片/扣费；授权撤回阻止新任务；成片有AI标识和授权链。

## 核心指标

授权校验覆盖率100%；重复扣费率0%；成片成功率≥95%；未授权出片次数0。
