---
artifact: prd
version: "1.3"
created: 2026-08-13
status: current
---

# PRD：AI 获客

> 上位真源：[[PRD_企业AI经营大脑_当前开发基线]]。专项参考 [[PRD_爆款抓取]]、[[pages/AI获客-AI混剪]]、[[PRD_数字人]]。
> **版本**：v1.3 ｜ **状态**：当前模块开发基线 ｜ **日期**：2026-09-01 ｜ **负责人**：产品—明策 ｜ **原型**：`prototype/index.html`
> **页面 PRD**：[[pages/AI获客-总览]]、[[pages/AI获客-获客计划]]、[[pages/AI获客-爆款追踪]]、[[pages/AI获客-AI混剪]]、[[pages/AI获客-营销视频]]、[[pages/AI获客-数字人]]。

## 0. 文档概述

### 0.1 产品背景

企业获客常停在“找热点—做内容—发出去”的零散动作：趋势没有证据，脚本与企业事实脱节，高成本视频缺少确认门，多账号发布容易选错，回收数据也无法对应内容。本模块融合历史爆款抓取、视频模板、数字人和发布能力，形成受控、可追溯的获客执行链。

### 0.2 产品目标与指标

| 目标 | 验收指标 |
|---|---|
| 趋势可追溯 | 候选来源 URL/采集时间完整率 100% |
| 成本受控 | 未确认脚本/首帧触发正式渲染次数 0 |
| 发布准确 | 平台、账号、内容、发布记录关联准确率 100% |
| 防止重复 | 同幂等键重复外发率 0% |
| 数据闭环 | 可支持账号的指标回收成功率 ≥95% |

### 0.3 用户与场景

老板制定获客方向并审批高风险动作；运营寻找选题、完成脚本和发布；内容人员制作视频；系统管理员维护账号与授权。典型场景包括公开趋势转选题、两级确认后出片、选多个平台账号发布、RPA 失败人工接管和结果复盘。

## 1. 目标与范围

把经营目标、公开趋势和企业内容能力转化为可执行的获客任务，并通过选定账号发布、回收结果和人工复盘形成闭环。

本期包括：获客计划、爆款追踪、AI 混剪、营销视频、数字人、账号选择、发布任务和结果回收。线索自动成交、私域自动触达和未经确认的自动外发不在本期。

## 2. 核心流程

`经营计划/人工目标 → 公开趋势候选 → 选题与脚本 → 人工确认 → 素材/首帧确认 → 成片 → 选择平台及账号 → 选择 API/RPA/手动 → 人工确认发布 → 结果回收 → 复盘候选`

### LEAD-001 获客计划

- 输入：目标客户、阶段目标、渠道、预算边界、周期、经营计划关联项。
- 输出：渠道动作、内容任务、负责人、时间、指标和风险。
- 计划只能创建任务，不得绕过任务级账号选择和发布确认。

### TREND-001 爆款追踪

- 仅采集公开可访问页面，记录来源 URL、发布时间、采集时间和证据摘要。
- 去重、转写和结构化结果先作为候选，不直接成为企业事实。
- 输出选题结构、内容钩子和可借鉴机制；不得复制受版权保护的完整内容。

### REMIX-001 AI 混剪

- 列表为入口，创建后仅有「视频设置、素材确认」两步；企业上下文自动从企业大脑提取。
- 口播支持手动输入、爆款仿写和授权链接抓取后仿写；目标平台、画幅、时长独立设置，CTA 可选。
- 数字人和声音必选；默认右下圆形小窗、贯穿口播，保持 Remotion 独立轨道。
- 分镜素材与首尾帧合并展示；每个分镜可查看真实图/视频、口播、时长、来源、授权和质检结果，仅支持查看/播放、替换和删除。
- 质量门禁在素材方案生成后后台执行，问题直接标记到对应分镜；存在阻断或未处理待优化项时不得正式渲染。
- 人工确认后由 Remotion 按 `cover/mainVisual/avatar/captions/music/cta` 多轨合成；片段失败只重试失败片段。
- 成片与发布分离；查看成片只展示视频并支持下载，不自动发布。

### AVATAR-001 数字人

- 创建/使用数字人前必须校验人物和声音授权。
- 预览确认后才能生成正式成片；AI 生成内容按平台规则标识。
- 授权过期或撤回后禁止新任务，历史产物保留审计状态。

### PUB-001 多账号发布

- 系统支持一个租户绑定多个公众号、抖音、小红书账号。
- 创建发布任务必须先选平台，再选具体账号，再选该账号支持的发布方式。
- RPA 发布状态：`queued → awaiting_human_confirmation → running → succeeded | failed | needs_manual_takeover`。
- 外部发布前必须人工确认；使用幂等键避免重复发布。

### RESULT-001 结果回收

- 按平台、账号、内容、发布记录保存数据，不跨账号或内容聚合错配。
- 原始指标与 AI 复盘建议分开；建议只能成为学习候选，人工采用后才能影响后续策略。

## 3. 数据与接口

核心对象：`acquisition_plan`、`trend_candidate`、`remix_task`、`remix_scene`、`quality_issue`、`remotion_manifest`、`avatar_authorization`、`publishing_account`、`publish_task`、`channel_metric_snapshot`、`learning_candidate`。

- `POST /acquisition-plans`、`POST /trend-collections`。
- `POST /remix-tasks`、`POST /remix-tasks/{id}/build-plan`、`POST /remix-tasks/{id}/confirm-render`。
- `GET /publishing-accounts?platform=`。
- `POST /publish-tasks`、`POST /publish-tasks/{id}/confirm`、`POST /publish-tasks/{id}/retry`。
- `GET /publish-records/{id}/metrics`。

## 4. Skill 与 Prompt

- Skills：`collect-public-trends`、`trend-deduplicator`、`video-script-generator`、`remix-plan-builder`、`asset-semantic-matcher`、`caption-aligner`、`remix-quality-gate`、`remotion-render-orchestrator`、`digital-human-generator`、`rpa-publisher`、`channel-metrics-collector`。
- Prompt 输入必须包含企业知识版本、渠道、账号能力、授权状态和合规规则。
- AI 混剪使用 `remix-video-v1.0.0`；策划与后台质量门禁共用版本号，完整 Prompt 以 `remotion/beauty-shoulder-relaxation/src/prompts.ts` 为真源。
- RPA 使用总 PRD `P-060` 做发布前检查，并记录截图/日志/外部内容 ID。

### 4.1 获客任务提示词模板

```text
你是企业获客策划 Agent。输入 goal、audience、confirmed_facts、public_trend_candidates、channel_capabilities、budget_guardrails。
趋势只能作为外部候选并保留 source_url；企业事实只能来自 confirmed_facts。输出 acquisition_strategy、topic_candidates、content_tasks、owner、schedule、metric、risk_flags、evidence_refs。
不得复制原内容，不得承诺 ROI，不得选择账号或执行发布。需要视频时创建 AI 混剪任务；素材方案生成后自动执行后台质量门禁，只有 render_allowed=true 且 human_confirmed=true 才能创建 Remotion 正式渲染。
严格按 output_schema 输出。
```

RPA Prompt 只生成结构化执行检查单和目标字段映射，不生成任意脚本；执行器仅接受白名单动作，遇到验证码、登录失效、页面结构变化或二次确认进入 `needs_manual_takeover`。

## 5. 验收标准

| ID | 操作 | 预期结果 |
|---|---|---|
| ACQ-AC-001 | 创建抖音发布任务 | 必须选择具体抖音账号和受支持的发布方式 |
| ACQ-AC-002 | AI 混剪存在未处理分镜问题时尝试生成 | 系统阻止 Remotion 正式渲染，并在对应分镜显示问题 |
| ACQ-AC-003 | RPA 发布前未人工确认 | 任务保持等待确认，不操作外部平台 |
| ACQ-AC-004 | 同一幂等键重复提交 | 只形成一条外部发布记录 |
| ACQ-AC-005 | 回收多个账号数据 | 每条指标能追溯到平台、账号、内容和发布记录 |
| ACQ-AC-006 | AI 生成复盘建议 | 进入学习候选，未采用前不修改策略或企业事实 |

## 6. 风险与依赖

- 依赖公开采集服务、模型/视频供应商、账号绑定、平台 API/RPA 和指标接口。
- 版权风险：只做结构借鉴，保留来源，不下载或复刻受限内容。
- 账号风险：凭证按租户隔离，发布前人工确认，失败支持人工接管。
- 成本风险：使用脚本和首帧两级门禁、配额预估和任务幂等。

## 7. 开发拆分与里程碑

| 阶段 | 交付 |
|---|---|
| M1 | 获客计划、公开趋势候选、选题与证据链 |
| M2 | 脚本/分镜/首帧两级确认、视频与数字人任务 |
| M3 | 多平台多账号、API/RPA/手动发布和人工接管 |
| M4 | 指标回收、学习候选、成本/权限/异常验收 |

## 8. 修订记录

| 版本 | 日期 | 说明 |
|---|---|---|
| v1.1 | 2026-08-13 | 融合爆款、视频、数字人和发布旧规格，补齐背景、目标、指标、Prompt 和里程碑 |
| v1.2 | 2026-08-17 | 将短视频/AI 视频口径更新为 AI 混剪，引用两步流程、Remotion 多轨、后台质量门禁和分镜级素材确认专项 PRD |
| v1.3 | 2026-09-01 | 六个 AI 获客页面统一字段级 PRD 结构，并在原型增加随当前路由切换的页面 PRD 抽屉 |
