---
tags: ["type/prd", "domain/ai获客", "kw/企业AI经营大脑", "kw/开发基线", "kw/skills", "kw/prompts"]
keywords: ["企业AI经营大脑", "AI获客", "企业大脑", "企业VI", "外部情报", "营销物料", "RPA", "Skills", "Prompts"]
---

# PRD：企业 AI 经营大脑（当前开发基线）

> **版本**：v3.1 ｜ **状态**：当前开发真源 ｜ **日期**：2026-08-13
> **功能基线**：当前原型 `prototype/index.html`。原型与旧模块 PRD 冲突时，以本 PRD 和当前原型为准。
> **能力边界**：当前页面是静态演示原型；真实模型、网页采集、公众号接口、数据回收、RPA 运行器、文件生成与版权检查均需工程接入，不得把演示定时器或示例数据当成已交付能力。
> **一级模块 PRD**：[[PRD_品牌与经营]]、[[PRD_营销物料]]、[[PRD_AI获客]]、[[PRD_企业大脑]]。开发 AI 先读本总纲，再完整读取目标一级模块和其专项 PRD；不得只读取一个摘要章节开始开发。

## 0. 给开发 AI 的执行指令

### 0.1 任务意图

把当前单文件原型实现为可持续开发的企业级产品，保持现有信息架构、人工确认门和渠道差异。开发 AI 必须先完整读取本 PRD，再按需求 ID 拆分任务；不得根据旧 PRD 自行恢复已删除功能。

### 0.2 决策优先级

1. 当前用户明确指令。
2. 本 PRD。
3. 当前原型中可观察的交互与文案。
4. 旧模块 PRD，仅用于复用仍未冲突的数据结构。

### 0.3 开发 AI 不得自行推断

- 不得将上传、OCR、网页采集、公众号提取或模型推断直接写为企业正式事实。
- 不得给朋友圈图文、海报增加发布和结果回收。
- 不得给公众号文章增加“在看”或“新增关注”指标。
- 不得假设一个平台只能绑定一个账号。
- 不得把 RPA 描述为官方 API，也不得在没有人工确认时启动 RPA。
- 不得让生成失败或非 `active` 的企业 VI 进入内容生成上下文。
- 不得把生成内容中的价格、地址、案例、承诺反向覆盖企业硬事实。
- 不得在企业 VI、外部情报、进化与治理页显示“Agent 授权”和“上传资料”主操作。

### 0.4 Definition of Ready

技术任务只有同时包含以下内容才可进入开发：需求 ID、页面入口、前置条件、输入字段、状态变化、输出、异常分支、人工门禁、埋点、验收用例。缺一项时，开发 AI 应回查本 PRD，而不是补猜业务规则。

## 1. Problem Statement

企业的经营资料、品牌表达、外部信息、营销内容和发布账号彼此割裂，AI 容易在事实未确认、账号未选择、平台能力不一致的情况下生成或发布错误内容。产品需要把“企业事实 → 诊断与计划 → 企业 VI → 内容生成 → 人工审核 → 按渠道发布或导出 → 结果回收 → 受控学习”连接成可追溯闭环。

## 2. Solution

产品采用五个一级模块：`首页`、`品牌与经营`、`营销物料`、`AI 获客`、`企业大脑`，以及独立的`设置`。企业大脑维护可被 AI 使用的事实、VI 和外部证据；内容模块消费已确认上下文；发布任务必须绑定具体账号和发布方式；高风险事实、对外承诺、VI 方向确认、外部情报采用和 RPA 执行均保留人工门禁。VI 方向一经人工确认，完整 VI 生成成功后自动进入 `active`，不再二次审批启用。

## 3. 信息架构与标题契约

### IA-001 标题层级

- 左侧一级菜单决定顶部标题栏名称。
- 二级菜单决定内容区域标题和说明。
- 内容面板内部不得重复显示与内容区域相同的标题。
- 示例：点击“企业大脑 / 诊断总览”后，顶部显示“企业大脑”，内容区显示“诊断总览”。
- 示例：点击“设置 / 企业设置”后，顶部显示“设置”，内容区显示“企业设置”。

### IA-002 菜单映射

| 一级菜单 | 二级菜单 | 内容区核心 |
|---|---|---|
| 品牌与经营 | 品牌报告 | 诊断依据、版本、预览、下载、重新生成 |
| 品牌与经营 | 经营计划 | 公司全盘计划、人工审核、月度跟踪、季度复盘 |
| 营销物料 | PPT | 创建、预览、可编辑源文件、PDF/文件导出 |
| 营销物料 | 朋友圈图文 | 生成、编辑、预览、导出图文包 |
| 营销物料 | 海报 | 生成、编辑、预览、下载图片 |
| 营销物料 | 公众号文章 | 创作、审核、选择账号与发布方式、发布、逐文章回收阅读/分享 |
| AI 获客 | 获客计划/爆款追踪/短视频创作/AI 视频/数字人 | 按当前原型分别进入任务页 |
| 企业大脑 | 诊断总览 | 信息完整度、六维诊断、信息缺口 |
| 企业大脑 | 企业 VI | 偏好、方向确认、单方向生成、VI 应用场景、自动生效与下载 |
| 企业大脑 | 企业知识 | 正式知识、候选、来源和分组治理 |
| 企业大脑 | 外部情报 | 公开链接、公开网站采集、候选确认 |
| 企业大脑 | 进化与治理 | 内容复盘、学习候选、人工治理 |
| 设置 | 企业设置/成员与权限/平台账号/Agent 权限/用量与套餐/帮助与服务 | 对应设置能力 |

## 4. 核心功能需求

### ONB-001 首次引导

**入口**：首次登录后弹窗。
**行为**：弹窗必须有清晰关闭按钮；用户可跳过，不以资料上传作为进入系统的硬门槛。
**步骤**：第一步为企业身份/营业执照；第二步合并补充资料、官网和公众号等可选来源。
**状态**：`not_started → in_progress → skipped | submitted`。
**约束**：手填值优先；上传/来源提取均生成候选，人工确认后才进入正式信息。
**验收**：关闭后可正常使用系统；重新进入可继续补充；跳过不会产生伪造的企业事实。

### BRAIN-001 诊断总览

**输入**：已确认企业事实、待确认候选、信息缺口。
**展示**：企业信息完整度、六维诊断底稿、AI 优先提醒、基础/深度诊断结果。
**阈值**：完整度达到 40% 可生成基础诊断；达到 80% 且六维各自不低于 60% 才允许深度诊断。阈值应做成配置，不硬编码在 UI。
**约束**：未确认候选不计入完整度与诊断依据；AI 结论和原始依据分开展示。
**验收**：任一候选从待确认变为已确认后，完整度和对应诊断维度可重算且有审计记录。

### BRAIN-002 企业知识

**知识域**：企业基础事实、产品与服务、客户与市场、品牌与内容规范、销售与经营规则、案例与证明材料、外部环境与行业情报。
**候选优先级**：企业人工确认 > 已采用候选 > 待确认候选 > 待补充。
**入库规则**：上传资料、网页提取、外部情报均先进入 `pending_confirmation`；人工采用后才为 `formal=true`、`usable_for_generation=true`。
**生成内容规则**：系统生成内容可作为内容资产检索复用，但其中硬事实不得反向覆盖企业事实。
**删除规则**：正式内容使用软删除并保留原因、操作者和时间。

### BRAIN-003 企业知识总览

**核心问题**：首屏回答“系统已经了解这家企业什么”，不以通用指标卡代替企业认知。
**四张认知卡**：企业身份；业务、产品与客户；获客与经营；目标、资源与品牌。
**每卡内容**：已确认字段摘要、来源证据、待确认数量、待补充字段和冲突提示；可展开查看明细。
**下方区域**：客户上传资料与内容源、候选处理入口、知识治理状态。
**状态优先级**：客户人工确认 > 已采用候选 > 待确认候选 > 待补充。
**约束**：上传资料只作为证据或候选；无真实治理数据时显示“待接入”，不得展示伪造健康度。

### VI-001 企业 VI 方向确认、生成与下载

**流程**：企业偏好 → 生成三套方向及 Logo → 查看具体方向展示 → 确认唯一方向并生成 VI → 在“03 · VI 应用场景”内查看企业推荐、单图生成状态与就地操作 → 完整 VI 生成成功后自动生效 → 下载全套 VI。
**状态机**：

```text
idle
  → analyzing_preferences
  → directions_ready
  → direction_confirmed（当前批次只保留所选方向）
  → generating_vi
  → active
任一生成阶段 → generation_failed → retry → 原失败阶段
```

**图片任务状态**：`queued → generating → review → adopted | rejected`；失败为 `failed → queued`。场景图任务不再单独平铺，其状态、失败原因和操作并入对应的 VI 应用场景卡；基础视觉任务仅汇总进度。
**自动生效条件**：基础视觉任务全部 `adopted`；场景任务全部完成审核且至少一张 `adopted`。条件满足后自动创建唯一 `active` 版本。
**复用条件**：只有 `active` 版本可注入 PPT、海报、朋友圈和公众号；新草案不得覆盖旧的 active 版本。
**下载**：正式实现输出可下载压缩包及清单；至少包含 Logo/图标 SVG、PNG，色彩 ASE/说明，字体与版式说明，VI 规范 PDF。当前原型仅展示清单，不等于真实文件已生成。
**人工门禁**：确认 VI 方向、采用单张图片需人工操作；完整 VI 生成成功后自动生效，不再显示“确认并启用”。
**异常**：单张失败不得导致整套任务丢失；保留已完成结果并允许单张重试。

### INTEL-001 添加公开链接

**入口**：企业大脑 / 外部情报 / 添加公开链接。
**字段**：类型、地区、标题、原始链接、来源机构、发布时间、来源摘要。
**校验**：只接受 `http/https`；清除 URL hash 和跟踪参数；以 canonical URL 优先去重。
**输出**：外部情报候选，默认 `pending_confirmation`，不得直接入脑。

### INTEL-002 采集公开网站

**入口**：企业大脑 / 外部情报 / 采集公开网站。
**输入**：关键词、地区、时间范围、来源范围。
**允许来源**：政府/监管网站、企业官网、行业协会、公开报告和可明确归属的公开页面。
**禁止**：绕过登录、付费墙、验证码、robots 或其他访问控制。
**处理**：检索 → 正文提取 → 标准化 → 去重 → 证据分级 → 相关性/时效判断 → 生成候选。
**操作**：查看原文、采用入脑、忽略。
**边界**：真实功能需接入网页检索和正文提取；当前演示候选不可进入生产数据。

### GOV-001 进化与治理

**展示**：知识可信度、内容质量与效果、学习价值、待确认学习候选。
**允许自动化**：候选排序、内容推荐、复盘建议。
**禁止自动化**：修改评分权重、企业事实、价格、承诺、合规规则和正式 VI。
**操作**：确认采用、驳回；两者均记录审计。
**页面约束**：不显示 Agent 授权和上传资料操作。

### MAT-001 营销物料共享生成契约

所有渠道共享上下文：`enterprise_knowledge`、`active_enterprise_vi`、`asset_library`、`compliance_policy`。价格、地址、案例、效果承诺缺少已确认来源时必须留空或标记缺口。图文类内容按渠道进入人工审核；PPT 只在生成前审核大纲，成品生成后可直接下载或编辑，不设二次成品审核。

| 渠道 | 生成内容 | 审核后动作 | 发布 | 结果回收 |
|---|---|---|---|---|
| PPT | 逐页大纲、页面文案、版式、引用 | 大纲确认后异步生成，直接下载 PPTX/PDF 或进入独立编辑页 | 无 | 无 |
| 朋友圈图文 | 封面、正文、配图、CTA | 导出图文包 | **无** | **无** |
| 海报 | 主标题、主视觉、CTA | 下载图片 | **无** | **无** |
| 公众号文章 | 标题、摘要、正文、封面、配图、CTA | 选择账号和方式后发布 | API/RPA/手动 | 每篇文章的阅读、分享 |

### MAT-002 朋友圈图文

页面只保留新建、列表、预览、编辑、导出图文包、草稿/审核状态。不得出现发布账号、自动发布、发布状态、阅读、曝光、线索或结果回收。

### MAT-PPT-001 PPT 异步生成与单页编辑

**生成门禁**：用户一句话提交需求，系统基于企业大脑正式知识和 active VI 生成逐页大纲；只有大纲人工确认后才能创建完整 PPT 任务。

**长任务**：完整 PPT 使用 `generating → ready | failed` 异步任务；提交后返回 PPT 列表，不把长时间生成放入用户步骤条。`ready` 可直接下载 PPTX/PDF，不再进行成品审核。

**独立编辑页**：列表点击“预览 / 编辑”新开页面，原列表保留。详情页参考 Presenton 的三栏工作台：左侧为页面缩略图，中间为当前页画布，右侧只保留 AI 追问、替换图片和页面操作。右侧不显示“设计工具/版式候选”板块，不提供“编辑图表”入口。标题和正文在画布内直接编辑；不使用右侧结构化内容表单和“编辑 / 预览 / AI”模式切换。

**整屏布局**：进入编辑模式后，工作台占满顶部标题栏以下的一整屏，页面本身不向下撑长。桌面端左、中、右三列高度一致；左侧栏头和“添加页面”固定，缩略图列表独立纵向滚动；中间画布和右侧工具栏在各自区域内滚动。移动端改为画布、横向缩略图、工具面板的纵向编排。

**AI 追问**：每次只对当前页生成候选版。候选版未采用前不覆盖原页；采用后只更新当前页并递增整套 PPT 版本号，撤回或失败不影响原页和已有下载版本。

**交互边界**：保留页面切换、上一页/下一页、全屏播放和下载；本期支持文字类元素在画布安全边界内自由拖拽，但不支持图片/图形自由拖拽、图层编辑、对齐参考线、群组或任意矢量节点编辑。

**主题与版式**：创建时可预览并选择 Active 企业 VI 或至少三套自有默认主题。每页提供至少三个与页面角色匹配的自有版式候选；切换主题或版式只改变视觉呈现，不改写企业事实。

**编辑增强**：支持新增页面、替换图片，以及页面上移、下移、复制、删除和隐藏。中间画布内的标题、正文、页码/栏目、指标组、要点组和来源文字均可拖拽调整位置；拖拽坐标按页、按元素独立保存，不影响其他页。右侧面板只承载当前页的 AI 追问、替换图片和页面操作。所有 AI 改动先形成候选版。

**保存规则**：默认自动保存，不设必须点击的“保存”按钮。文字编辑、元素拖拽、替换图片、页面排序/复制/隐藏/删除等操作在结束后自动保存当前草稿，顶部显示 `保存中 | 已保存 | 保存失败`。导出始终读取最近一次“已保存”版本。AI 候选版仅在用户点击“采用新版”后写入。

**背景生成**：完整 PPT 任务为每页生成 `background_prompt`，背景图作为独立异步资产任务。背景必须保留标题和正文的安全留白区，不得生成文字、Logo、水印或未确认业务数据。单页背景失败时使用当前主题纯色降级，可单独重试，不得阻断其他页和文本编辑。

**Demo 案例**：原型内置一套 8 页“企业 AI 经营大脑项目介绍”，依次展示项目定位、企业痛点、企业大脑认知底座、经营计划与任务执行、营销物料、AI 获客与结果回收、进化治理、实施路径。Demo 仅用于展示已确认的产品能力与交互，演示数据必须标识为样例，不得表述为真实客户成果。

**开源框架边界**：产品交互和技术架构可参考 Presenton，仅允许引入经文件级审计确认为 Apache-2.0 的源码。不得整仓无审计嵌入，模板、字体、图片和依赖均需独立许可清单。

**导出实现**：建立自有 `PptExportAdapter`，首发正式 PPTX 导出使用 MIT 许可的 PptxGenJS，PDF 使用已审核宽松许可组件或由 PPTX 渲染产生。许可证不明的 `presenton-export` 禁止进入代码库、构建链、测试包和生产环境；只有获得覆盖闭源多租户商业 SaaS 的明确书面授权后才可重新评估。

### MAT-003 海报

页面只保留新建、列表、预览、编辑、下载、草稿/审核状态。不得出现发布和结果回收。

### MAT-004 公众号文章

**创建必填**：主题、`publishing_account_id`、`publish_method`；参考资料和 CTA 可选。
**账号过滤**：只显示当前租户下 `platform=wechat` 且可用的账号。
**列表字段**：文章、发布账号、发布状态、阅读、分享、操作。阅读/分享属于对应文章行，不使用独立“文章数据”容器。
**禁用指标**：在看、新增关注。
**同步条件**：只有文章状态为 `published` 才可同步；同步结果按 `article_id + publishing_account_id` 保存，不得写到其他文章。
**编辑规则**：已生成文章被编辑或重新生成后回到 `pending_review`。

### ACCOUNT-001 多平台多账号绑定

**支持平台**：公众号、抖音、小红书；同一平台可绑定多个账号。
**账号字段**：`id`、`tenant_id`、`platform`、`name`、`status`、`supported_publish_methods`、`authorization_scope`、`expires_at`。
**发布能力**：公众号可支持官方 API、RPA、手动；抖音和小红书当前需求支持 RPA、手动。实际能力必须由账号授权和平台适配器返回，不能只由前端写死。
**创建任务**：任何需要发布的公众号或 AI 获客任务均先选平台，再选该平台账号，再选该账号支持的发布方式。
**安全**：产品数据库不保存或展示 RPA 目标平台明文密码。

### RPA-001 RPA 发布

**定位**：RPA 是发布执行适配器，不是官方 API。
**前置条件**：账号已绑定、目标平台已有可用登录会话、内容已通过人工审核、操作者再次确认启动。
**状态机**：

```text
queued → awaiting_human_confirmation → running → succeeded
                                      ↘ failed → retrying → running
                                               ↘ manual_takeover
```

**记录**：执行 ID、任务 ID、账号 ID、平台、内容版本、开始/结束时间、当前状态、失败阶段、脱敏错误、重试次数、人工接管人。
**失败处理**：保留文章/任务、失败原因和重试入口；允许转人工发布。不得因失败重复创建内容。
**工程边界**：真实运行器、浏览器会话隔离、平台页面适配、风控和验证码人工接管均待接入；前端定时器只可用于 demo 环境。

## 5. 数据契约

### 5.1 外部情报候选 `external_intelligence_candidate`

```json
{
  "id": "string",
  "tenant_id": "string",
  "type": "competitor | policy | industry | customer_demand | other",
  "title": "string",
  "summary": "string",
  "enterprise_relevance": "string",
  "evidence_level": "primary | secondary | inference",
  "confidence": "high | medium | low",
  "status": "pending_confirmation | confirmed | rejected",
  "formal": false,
  "usable_for_facts": false,
  "published_at": "ISO-8601 | null",
  "collected_at": "ISO-8601",
  "applicable_region": "string | null",
  "freshness": "current | aging | stale | unknown",
  "sources": [{"title":"string","publisher":"string","url":"canonical URL","source_type":"government | company | association | media | report | public_page | other","evidence":"string"}],
  "conflicts": [],
  "suggested_actions": ["view_source", "adopt", "ignore"],
  "audit": []
}
```

人工采用时才同时设置 `status=confirmed`、`formal=true`、`usable_for_facts=true`。

### 5.2 发布账号 `publishing_account`

```json
{
  "id": "string",
  "tenant_id": "string",
  "platform": "wechat | douyin | xiaohongshu",
  "name": "string",
  "status": "pending | authorized | expired | disabled",
  "supported_publish_methods": ["api | rpa | manual"],
  "authorization_scope": ["publish | metrics"],
  "expires_at": "ISO-8601 | null"
}
```

### 5.3 内容与发布任务

```json
{
  "content_id": "string",
  "tenant_id": "string",
  "channel": "moments | poster | wechat | douyin | xiaohongshu",
  "version": 1,
  "status": "draft | pending_review | approved | publishing | published | failed | exported",
  "publishing_account_id": "string | null",
  "publish_method": "api | rpa | manual | null",
  "knowledge_snapshot_ids": [],
  "enterprise_vi_version_id": "string | null",
  "compliance_result": {},
  "metrics": {"reads": null, "shares": null},
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

约束：`moments/poster` 的账号、发布方式和 metrics 必须为 `null`；`wechat` 发布前账号和方式必填。PPT 不进入通用内容发布任务。

### 5.3A PPT 任务与页面草稿

```json
{
  "ppt_id": "string",
  "tenant_id": "string",
  "status": "brief | outline_review | outline_approved | generating | ready | failed",
  "outline_version": 1,
  "knowledge_snapshot_ids": [],
  "enterprise_vi_version_id": "string",
  "deck_version": 1,
  "slides": [
    {
      "slide_id": "string",
      "title": "string",
      "body": "string",
      "role": "cover | insight | architecture | process | factory | metrics | governance | cta",
      "layout_id": "string",
      "layout_candidates": [],
      "element_positions": {
        "title": {"x": 0, "y": 0},
        "body": {"x": 0, "y": 0},
        "metrics": {"x": 0, "y": 0}
      },
      "background_prompt": "string",
      "background_asset_id": "string | null",
      "background_status": "queued | generating | ready | failed | fallback",
      "source_refs": [],
      "hidden": false
    }
  ],
  "pending_candidate": {
    "slide_id": "string",
    "prompt": "string",
    "candidate_slide": {}
  },
  "pptx_url": "string | null",
  "pdf_url": "string | null",
  "error_code": "string | null",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

PPT 不使用通用内容审核状态 `pending_review | approved`。用户只审核大纲；确认后进入后台异步生成，成品为 `ready` 时可直接下载或进入独立画布编辑页。画布中的标题和正文支持直接编辑和自由拖拽，右侧仅保留当前页 AI 追问、替换图片和页面操作，不显示设计工具、版式候选或“编辑图表”；AI 结果先进入 `pending_candidate`，采用后才覆盖当前页并递增 `deck_version`。背景图是独立资产，单页失败不改变整套 PPT 的 `ready` 可编辑状态。

### 5.4 Skill 执行记录 `skill_run`

```json
{
  "run_id": "string",
  "tenant_id": "string",
  "skill_id": "string",
  "skill_version": "string",
  "prompt_id": "string",
  "prompt_version": "string",
  "input_snapshot_id": "string",
  "status": "queued | running | succeeded | failed | awaiting_human_confirmation",
  "output_artifact_ids": [],
  "model": "string | null",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601 | null",
  "error_code": "string | null"
}
```

不得在日志中记录账号密码、Cookie、完整 access token 或客户未授权的原文。

## 6. AI Skill 编排

> 下表中的本地 Skill 是研发/运营侧可复用能力定义。生产系统应实现等价服务契约，不得让线上业务直接依赖个人电脑的 `~/.codex/skills` 路径。

| Skill ID | 能力 | 触发场景 | 输入 | 输出 | 当前状态 |
|---|---|---|---|---|---|
| `collect-external-intelligence` | 公开信息检索、核验、去重、结构化 | INTEL-002 | 企业、行业、地区、关键词、竞对、时间窗 | 待确认情报候选 | 已有本地 Skill；生产采集待接入 |
| `defuddle` | 公开网页正文清洗 | 情报采集中的普通网页 | URL | 干净正文与元数据 | 可用编排能力；生产服务待接入 |
| `summarize` | 长网页/PDF/报告摘要 | 外部报告过长 | URL/文件、摘要目标 | 可追溯摘要 | 可用编排能力；生产服务待接入 |
| `competitive-brief` | 竞对比较与定位影响 | 情报类型为 competitor 且需比较 | 已核验候选、企业上下文 | 比较矩阵与推论 | 可用；不得自动入脑 |
| `market-research` | 行业、需求、政策影响分析 | 需形成市场判断 | 已核验候选、研究问题 | 市场结构与建议 | 可用；不得自动入脑 |
| `imagegen` | VI 方向图、场景图、海报视觉生成 | VI-001、MAT-003 | 品牌种子、场景、尺寸、负面约束 | 图片任务结果 | 研发侧可用；产品图片服务待接入 |
| `content-factory-v1` | 多渠道内容编排 | MAT-001 | 企业知识、active VI、素材、合规、渠道参数 | 渠道草稿 | 产品逻辑已在原型定义；需工程服务化 |
| `rpa-publish-adapter` | 操作已登录平台完成发布 | RPA-001 | 审核通过内容、账号会话引用、平台适配器 | 执行结果与日志 | **待开发，不是现有 Skill** |

### 6.1 Skill 调用通用契约

1. 先校验租户、权限、数据确认状态和输入完整性。
2. 固化输入快照、Skill 版本、Prompt 版本和模型版本。
3. 结构化输出必须通过 JSON Schema 校验；失败不得写业务正式表。
4. 需要人工确认时进入 `awaiting_human_confirmation`，不得继续执行高风险动作。
5. 重试使用相同幂等键；变更输入后创建新版本，不覆盖旧执行记录。

## 7. 提示词规范

### 7.1 组装顺序

```text
系统安全与合规基线
→ 当前任务 Prompt
→ 已确认企业知识快照
→ 已启用企业 VI 快照
→ 用户本次输入与参考资料
→ 输出 JSON Schema
```

低优先级内容不得覆盖高优先级约束。未经确认的候选只能以 `candidate_context` 传入，并明确禁止当成事实陈述。

### P-000 全局系统提示词

```text
你是“企业 AI 经营大脑”的任务执行器。只使用输入中标记为 confirmed/formal 的企业事实。
pending_confirmation、inference、unknown 只能作为待核验信息，不得写成确定事实。
不得虚构价格、地址、客户案例、资质、经营结果、承诺、发布时间或来源。
只有 status=active 的企业 VI 可用于正式内容。
所有对外发布、正式知识采用、VI 方向确认、价格与承诺变更都必须等待人工确认。
严格返回指定 JSON；信息不足时写入 gaps，不得自行补齐。
```

### P-001 意图路由

**用途**：把自然语言请求映射为开发或业务动作，防止技术 AI 猜错页面和能力边界。

```text
输入：用户请求、当前页面、租户权限、可用账号、可用 Skills。
任务：识别 primary_intent、target_module、target_submodule、required_inputs、risk_level、human_gate、skill_chain。
规则：
1. “朋友圈/海报”请求不得生成发布或数据回收动作。
2. “公众号发布/数据”必须定位到具体 article_id 与 publishing_account_id。
3. “采集公开网站/外部情报”输出候选，不得直接更新企业事实。
4. “选择/启用 VI”必须区分预览、选择方向、采用图片、正式启用。
输出 JSON：
{"primary_intent":"","target_module":"","target_submodule":"","required_inputs":[],"risk_level":"low|medium|high","human_gate":"none|review|confirm_action","skill_chain":[],"ambiguities":[]}
```

### P-010 企业资料提取

```text
根据上传资料提取企业候选信息，按“企业身份、业务/产品/客户、获客/经营、目标/资源/品牌”四组输出。
每个字段返回 value、source_id、evidence、confidence、status=pending_confirmation。
手填 confirmed 值不可被覆盖；冲突写入 conflicts；未找到写入 gaps；不得从行业常识推断价格、预算和经营结果。
```

### P-011 企业初步诊断

**版本**：v1.0
**用途**：在资料尚不完整时快速判断企业当前状态、六维覆盖和高影响信息缺口；输出是初步判断，不替代深度诊断。

```text
你是企业 AI 经营大脑的初步诊断分析器。输入包含 confirmed_enterprise_knowledge、candidate_context、evidence_catalog、diagnosis_threshold 和 input_snapshot_id。

任务：
1. 只使用 confirmed/formal 信息形成企业事实；candidate_context 只能进入 gaps 或待核验说明。
2. 对“产品与客户价值、客户与市场、定位与战略、商业模式与增长、品牌与营销、组织与执行”六维分别给出 coverage、current_state、strengths、issues、evidence_refs、confidence 和 gaps。
3. 输出当前优势、优先问题、信息缺口及下一步补充建议；不得跨维度推导深层根因，不得生成确定性战略承诺。
4. 每条判断必须引用 evidence_refs；没有证据时写 unknown，不得用行业常识补齐。
5. 保存 prompt_id=P-011、prompt_version=v1.0 和 input_snapshot_id；同一快照可复现，输入变化生成新版本。

禁止：不得虚构行业基准、ROI、经营结果、客户案例、价格、预算或承诺；不得把未确认候选写成企业事实。

输出严格遵循 JSON：
{
  "type": "initial_diagnosis_report",
  "prompt_id": "P-011",
  "prompt_version": "v1.0",
  "input_snapshot_id": "",
  "overall_completeness": 0,
  "overall_confidence": "low|medium|high",
  "enterprise_status": "",
  "six_dimension": [{
    "dimension": "",
    "coverage": 0,
    "current_state": "",
    "strengths": [],
    "issues": [],
    "evidence_refs": [],
    "confidence": "low|medium|high",
    "gaps": []
  }],
  "priority_issues": [],
  "information_gaps": [],
  "initial_recommendations": [],
  "validation_error": null
}

校验：缺少 input_snapshot_id、六维未全部返回、结论无 evidence_refs 或整体完整度未达到 40% 时，validation_error 写明阻断原因；允许输出“信息不足的初步报告”，但不得伪装成深度诊断。
```

### P-012 企业深度诊断

**版本**：v1.0
**用途**：基于已确认资料与经营证据形成完整管理层交付，完成跨维度因果分析、战略选项比较、明确推荐及 30/60/90 天行动计划。

```text
你是企业 AI 经营大脑的深度诊断顾问。输入包含 confirmed_enterprise_knowledge、operating_evidence、interview_evidence、initial_diagnosis_report、evidence_catalog、prompt_version、input_snapshot_id 和 validation_rules。

准入校验：整体完整度必须达到 80%，且六维中每一维完整度必须达到 60%；未达标立即返回 validation_error、缺失维度和补充清单，不得生成貌似完整的深度报告。

分析规则：
1. 所有结论区分 confirmed_fact、operating_evidence、ai_judgement、hypothesis，且必须带 evidence_refs 和 confidence。
2. 从现象到直接原因、跨维度根因、经营后果构建 causal_chain；相关不等于因果，证据不足必须标 hypothesis。
3. root_priority 按影响、紧迫性、可控性和证据强度排序为 P0/P1/P2。
4. 至少比较“保守优化、聚焦突破、增长扩张”三个 strategy_options，分别写 actions、required_inputs、expected_benefits、risks、applicable_conditions。
5. recommendation 必须写推荐方案、成立条件和为什么暂不选择其他方案；不得只给空泛建议。
6. action_plan 分 0—30、31—60、61—90 天，每项包含 objective、actions、owner_role、deliverables、acceptance_metrics、dependencies。
7. risks_appendix 必须包含 assumptions、validation_actions、warning_signals、stop_conditions、evidence_index 和版本审计信息。
8. 不得虚构行业基准、ROI、经营结果、客户案例、价格、预算或承诺；没有数据时使用可验证过程指标。
9. 保存 prompt_id=P-012、prompt_version=v1.0、input_snapshot_id；资料变化生成新报告版本，不覆盖历史报告。

输出严格遵循 JSON：
{
  "type": "deep_diagnosis_report",
  "prompt_id": "P-012",
  "prompt_version": "v1.0",
  "input_snapshot_id": "",
  "report_context": {},
  "executive_summary": {},
  "decision_list": [],
  "evidence_confidence": [],
  "six_dimension": [],
  "causal_chain": [],
  "root_priority": [],
  "strategy_options": [],
  "recommendation": {},
  "action_plan": [],
  "risks_appendix": {},
  "evidence_refs": [],
  "validation_error": null
}

输出前自检：11 个章节键必须齐全；每个核心结论至少有一个 evidence_refs；行动项必须有负责人角色与验收指标；任一硬性条件不满足时 validation_error 不得为 null。
```

### P-020 企业 VI 三方向

```text
输入已确认企业信息、品牌偏好、原 Logo 状态和目标场景，生成 3 个明显可区分的 VI 方向。
每个方向返回 name、strategy、tone、colors、font、image_style、logo_proposal、application_preview、risks。
若有原 Logo，说明保留与调整项；不得声称已完成商标或版权核验。
只生成候选方向，status=directions_ready，不得在用户确认前自动生成正式 VI。用户确认后仅保留 selected_direction_id 对应方向。
```

### P-021 企业 VI 单图任务

```text
按一个 scene_id 生成一张 VI 应用图。严格使用 selected_direction_id 对应 brand_seed 的 Logo、颜色、字体层级与图片风格。
不要生成难以校对的小字号正文；不要添加未确认价格、案例或承诺；保留安全留白。
返回 image_asset、scene_id、consistency_check、text_safety、copyright_check_status=pending_review。
每张图独立失败和重试，不影响其他任务。
```

### P-030 外部情报标准化

```text
仅总结来源实际支持的内容。返回 type、title、summary、enterprise_relevance、evidence_level、confidence、published_at、collected_at、applicable_region、freshness、sources、conflicts、suggested_actions。
来源时间未知时 published_at=null；推论必须标 evidence_level=inference；默认 status=pending_confirmation。
不得把竞对宣传语当成已证实经营结果，不得生成无法追溯的链接。
```

### P-040 内容工厂通用提示词

```text
依据 confirmed enterprise_knowledge、active enterprise_vi、approved assets 和 compliance_policy 生成 {{channel}} 草稿。
目标：{{topic}}；受众：{{audience}}；CTA：{{cta}}。
事实必须附 source_id；缺失价格、地址、案例、承诺写入 gaps，不得补造。
输出 channel、title、body_blocks、image_briefs、cta、citations、compliance_flags、gaps、status=pending_review。
渠道边界：moments 仅导出图文包；poster 仅下载；wechat 才可进入账号选择与发布。
```

### P-041 公众号文章

```text
生成公众号文章的标题、摘要、正文块、封面 brief、正文配图 brief 和 CTA。
使用所选公众号的账号语气配置，但不得把账号名称写成企业资质。
输出必须包含 publishing_account_id 和 publish_method；缺少任一字段时返回 validation_error，不生成发布任务。
人工审核通过前 status=pending_review。发布后的 metrics 只允许 reads、shares，并绑定当前 article_id。
```

### P-050 公司经营计划

```text
只根据已确认企业事实、诊断和经营数据生成公司级经营计划草案。
覆盖战略、产品、市场、销售、交付、组织、财务、风险八维；公司级优先事项最多 3 项。
每项返回目标、指标、负责人、资源、依赖、证据、缺口和风险。
价格、预算、交付时效和结果承诺单列 high_risk_commitments，必须人工审核；草案 status=draft_review，不得自动下发任务。
```

### P-060 RPA 发布前检查

```text
你只做发布前结构化检查，不直接操作平台。
校验 content_status=approved、account_status=authorized、publish_method=rpa、session_status=available、human_confirmation=true。
返回 ready、blocking_reasons、warnings、content_version、account_id、idempotency_key。
任何条件不满足时 ready=false；不得请求或输出密码、Cookie、token。
```

### 7.2 Prompt 版本与安全

- 每次执行保存 `prompt_id + prompt_version + input_snapshot_id`。
- Prompt 修改后创建新版本；历史任务保留原版本，不静默覆盖。
- 企业微调只能加品牌语气、卖点和额外禁忌，不能放松合规基线。
- 合规检查温度固定为 0；业务生成参数应在租户护栏范围内。
- Prompt 输出进入业务表前必须完成 Schema、事实来源和合规校验。

## 8. 接口草案

| 接口 | 方法 | 关键行为 |
|---|---|---|
| `/enterprise/profile/candidates` | POST | 上传/提取结果写候选，不写正式事实 |
| `/enterprise/profile/candidates/{id}/adopt` | POST | 人工采用并记录审计 |
| `/enterprise/vi/directions` | POST | 创建异步三方向任务 |
| `/enterprise/vi/images/{id}/adopt` | POST | 单图采用 |
| `/enterprise/vi/{id}/activate` | POST | 校验启用条件后切换 active 版本 |
| `/enterprise/vi/{id}/download` | POST | 异步生成全套文件并返回清单 |
| `/intelligence/collect` | POST | 创建公开网站采集任务 |
| `/intelligence/candidates/{id}/adopt` | POST | 人工采用入脑 |
| `/publishing/accounts` | GET/POST | 多平台多账号查询与绑定 |
| `/contents` | POST | 按渠道生成草稿 |
| `/contents/{id}/approve` | POST | 人工审核通过 |
| `/publishing/tasks` | POST | 校验账号、方式与内容版本后建发布任务 |
| `/publishing/tasks/{id}/confirm-rpa` | POST | 人工确认并启动 RPA |
| `/wechat/articles/{id}/metrics:sync` | POST | 只同步本篇文章阅读/分享 |

所有写接口要求 `tenant_id` 从认证上下文获取，不接受前端任意指定；采用幂等键并写审计日志。

## 9. User Stories

1. As an 企业老板, I want 跳过首次引导先进入系统, so that 我可按自己的节奏补资料。
2. As an 企业管理员, I want 先确认提取候选再入脑, so that AI 不会把错误识别当企业事实。
3. As an 品牌负责人, I want 查看三套 VI 的具体场景展示再选择, so that 方向决策不是只看名称。
4. As an 运营, I want 只让已启用 VI 进入物料生成, so that 所有对外内容视觉一致。
5. As an 运营, I want 从公开网站收集可追溯情报候选, so that 经营判断有来源且可复核。
6. As an 运营, I want 朋友圈和海报只保留创作、审核、导出, so that 页面不出现无法兑现的发布功能。
7. As an 公众号运营, I want 创建文章时选择具体账号和发布方式, so that 多账号任务不会发错。
8. As an 公众号运营, I want 在每篇文章行看到阅读和分享, so that 数据不会和其他文章混淆。
9. As an 运营, I want 使用 RPA 时二次确认并能失败重试或人工接管, so that 自动化可控且可追溯。
10. As an 企业负责人, I want 用一句话生成 PPT 大纲并在确认后离开页面, so that 长时间生成不阻断其他工作。
11. As an 内容编辑, I want 在 PPT 画布中直接修改标题和正文, so that 不需在画布和表单之间反复对照。
12. As an 内容编辑, I want 通过 AI 追问只重做当前页并先查看候选版, so that 修改不会误伤整套 PPT。
13. As an 内容编辑, I want PPT 编辑工作台在一屏内保持三列等高并独立滚动, so that 编辑较长演示文稿时不会丢失画布和工具上下文。
14. As an 内容编辑, I want 为单页生成与企业 VI 一致的背景并可失败降级, so that 成品不是重复的黑色占位页。
15. As an 售前人员, I want 直接打开完整的项目介绍 Demo, so that 可在无真实客户数据时演示生成、编辑和下载流程。
16. As an 内容编辑, I want 直接拖拽 PPT 画布中的文字元素并自动保存, so that 我可快速调整视觉位置而不需要在右侧填写坐标或手动保存。

## 10. Testing Decisions

### 10.1 必测状态与规则

- 候选未经确认不可进入诊断、生成事实上下文或正式知识。
- 企业知识总览四张认知卡按确认优先级展示，上传证据不自动变成事实。
- VI 各阶段、单图失败/重试、旧 active 版本保留、启用条件。
- 外部链接 canonicalize、去重合并、缺失时间、冲突来源、采用/忽略。
- 多平台多账号过滤；创建任务时账号与发布方式必填且匹配。
- 公众号文章 A/B 两行数据隔离；只显示阅读/分享。
- 朋友圈和海报 DOM 中不存在发布与结果回收入口。
- PPT 大纲确认门、异步任务状态、就绪后直接下载。
- PPT 预览/编辑新开页，画布文字自动保存，切页后数据隔离。
- PPT AI 候选版的生成、采用、撤回、失败保留原页和版本递增。
- PPT 编辑模式三列等高、一屏填满，桌面端缩略图纵向滚动和移动端横向滚动。
- PPT 背景提示词、资产异步状态、单页重试、纯色降级和文字安全区。
- 8 页项目介绍 Demo 的页面角色、依据、多版式和背景展示完整。
- PPT 各文字元素拖拽坐标按页隔离、边界限制、自动保存状态和重新打开后的位置恢复。
- RPA 人工确认、幂等、失败重试和人工接管。
- 一级标题、二级标题、重复标题清理。

### 10.2 验收用例

| ID | Given | When | Then |
|---|---|---|---|
| AC-001 | 首次引导已打开 | 点击关闭 | 弹窗关闭，可进入首页，未生成正式事实 |
| AC-002 | 有一条 OCR 候选 | 未点击采用并运行诊断 | 候选不计入完整度和诊断证据 |
| AC-002A | 已确认企业身份、另有待确认产品候选 | 打开企业知识总览 | 身份显示已确认；产品候选显示待确认且不写成正式事实 |
| AC-003 | 已有 active VI v1 | 确认 v2 方向但生成失败 | 内容生成仍引用 v1，v2 不进入 active |
| AC-004 | VI 应用场景一张生成失败 | 在对应场景卡点击单张重试 | 仅该图重试，其他场景状态不变，页面无独立“图片生成任务”板块 |
| AC-005 | 同一公开 URL 带不同 utm 参数 | 分别采集 | 合并为一个候选并保留来源审计 |
| AC-006 | 打开朋友圈图文 | 检查所有操作 | 只有预览、编辑、导出，无发布和数据回收 |
| AC-007 | 打开海报 | 检查所有操作 | 只有预览、编辑、下载，无发布和数据回收 |
| AC-008 | 租户有两个公众号 | 新建文章 | 必须选择其中一个账号和其支持的发布方式 |
| AC-009 | 两篇已发布文章 | 同步第一篇 | 只有第一篇的阅读/分享变化 |
| AC-010 | RPA 内容未审核 | 尝试启动 | 被阻止且返回明确 blocking reason |
| AC-011 | RPA 执行中失败 | 点击重试 | 原内容与执行记录保留，重试次数 +1 |
| AC-012 | 点击企业大脑/企业 VI | 查看页面 | 顶部为企业大脑，内容区为企业 VI，标题不重复 |
| AC-013 | PPT 大纲未确认 | 尝试生成完整 PPT | 被阻止，且不创建后台任务 |
| AC-014 | PPT 大纲已确认 | 开始生成 | 返回列表显示“生成中”，就绪后可直接下载 PPTX/PDF |
| AC-015 | PPT 列表有一条 ready 任务 | 点击“预览 / 编辑” | 新开对应 PPT 编辑页，原列表页保留 |
| AC-016 | 编辑器选中第 2 页 | 在画布修改标题并等待自动保存 | 显示“已保存”；第 1 页内容不变 |
| AC-017 | 编辑器选中任意一页 | 发起 AI 追问 | 先生成候选版；采用前原页不变，采用后只更新当前页并递增版本 |
| AC-018 | 打开 PPT 编辑页 | 检查右侧面板 | 只显示当前页 AI 追问、替换图片和页面操作；无设计工具/版式候选、编辑图表、标题/正文结构化表单和模式切换 |
| AC-019 | 1440×900 打开 8 页 PPT | 检查三栏高度并滚动左侧 | 左、中、右占满标题栏以下一屏且高度一致；缩略图列表可独立纵向滚动 |
| AC-020 | 390×844 打开 8 页 PPT | 滑动页面缩略图 | 画布、缩略图、工具面板纵向编排，缩略图可横向滚动 |
| AC-021 | 第 2–8 页均有背景任务 | 某一页生成失败 | 该页降级为当前主题纯色并可单页重试，其他页、文本和下载版本不受影响 |
| AC-022 | 打开内置项目介绍 Demo | 逐页检查 | 完整展示 8 页项目内容，页面角色不少于 4 种，均有依据，样例数据不表述为真实客户成果 |
| AC-023 | 编辑器选中第 2 页 | 拖拽标题和正文到新位置 | 只更新第 2 页对应元素坐标，拖拽期间显示“保存中”，结束后显示“已保存”，无手动保存步骤 |
| AC-024 | 已保存一次文字位置调整 | 重新打开同一 PPT 并导出 | 画布恢复已保存坐标，导出读取最近一次“已保存”版本 |

### 10.3 验证门

1. 单元测试与契约测试通过。
2. `git diff --check` 通过。
3. 真实浏览器检查桌面 1440×900 与移动 390×844：无横向溢出、无控制台错误、关键交互可完成。
4. 发布/采集/RPA 等外部能力必须以真实适配器终态和脱敏日志验收；前端成功提示不算生产验收。

## 11. Implementation Decisions

- 原型单文件仅是交互真源；正式工程拆分为企业大脑、内容工厂、账号与发布、Skill/Prompt 编排、审计五个领域服务或清晰模块。
- 业务状态以服务端为准；前端不得用定时器模拟结果后回写生产状态。
- 所有生成任务异步化并可查询、取消、重试；高风险节点使用人工确认状态。
- PPT 使用独立的大纲审核门和页面版本模型；成品不套用图文内容的二次 `pending_review` 审核门。
- PPT 画布手动编辑直接保存当前草稿；AI 追问使用候选版对象，两者不得共用“立即覆盖”语义。
- 知识、VI、Prompt、内容和发布均版本化；生成任务保存所用版本快照以便复现。
- 外部平台采用 adapter 接口，官方 API、RPA、手动发布实现相同发布任务协议。
- 内容发布与数据回收按内容 ID 和账号 ID 绑定，禁止租户间或文章间串数据。

## 12. Out of Scope

- 朋友圈和海报的自动发布与结果回收。
- 未经人工确认的企业事实、外部情报或学习规则自动生效。
- 通过 RPA 绕过验证码、平台风控或访问限制。
- 把本地 Skill、演示账号、演示图片、定时器结果当成线上服务。
- 未经授权抓取私域、登录后或付费内容。
- 自动承诺 ROI、成交、价格、交付周期或合规结论。
- PPT 图片/图形自由拖拽、任意图层编辑、对齐参考线、群组及矢量节点编辑；本期仅开放文字类元素拖拽。
- Presenton 前端界面的像素级复制，以及未经审计的 Presenton 源码、模板或导出二进制直接集成。

## 13. 推荐开发顺序

1. 冻结 IA、路由、标题和页面边界。
2. 实现租户、多账号、权限、审计和版本基础对象。
3. 实现企业事实候选/确认与诊断读模型。
4. 实现企业 VI 状态机、方向确认、场景内单图任务、自动生效与下载任务。
5. 实现外部情报 Skill 服务和人工采用门。
6. 实现内容工厂四渠道，先朋友圈/海报/PPT 导出，再公众号发布。
7. 接入公众号官方 API 与逐文章数据回收。
8. 接入 RPA adapter、人工确认、失败重试和人工接管。
9. 补齐端到端测试、真实浏览器验证和外部适配器验收。

## 14. 可直接创建的开发任务

| Task ID | 交付 | 依赖 | 主要验收 |
|---|---|---|---|
| DEV-001 | 租户、账号、审计、版本和异步任务基础对象 | 无 | 数据租户隔离；写操作有审计；任务可重试 |
| DEV-002 | IA 路由与标题组件 | 无 | IA-001/002、AC-012 |
| DEV-003 | 可关闭/可跳过的两步首次引导 | DEV-001 | ONB-001、AC-001/002 |
| DEV-004 | 企业候选确认、四卡知识总览、知识域与诊断读模型 | DEV-001/003 | BRAIN-001/002/003、AC-002/002A |
| DEV-005 | 企业 VI 方向确认、单方向生成、场景内单图任务、自动生效、版本和下载 | DEV-001/004 | VI-001、AC-003/004 |
| DEV-006 | 外部情报采集 Skill 服务与候选审核 | DEV-001/004 | INTEL-001/002、AC-005 |
| DEV-007 | 内容工厂公共上下文与 Prompt Runner | DEV-001/004/005 | MAT-001、P-000/P-040、Schema 校验 |
| DEV-008 | PPT 大纲审核、异步生成、三栏整屏编辑页、文字拖拽/自动保存、背景资产与下载 | DEV-007 | MAT-PPT-001、AC-013–024 |
| DEV-008A | 朋友圈、海报生成与导出 | DEV-007 | MAT-002/003、AC-006/007 |
| DEV-009 | 多平台多账号绑定与能力查询 | DEV-001 | ACCOUNT-001、AC-008 |
| DEV-010 | 公众号文章、官方 API 发布与逐文章指标 | DEV-007/009 | MAT-004、AC-008/009 |
| DEV-011 | RPA 发布适配器、确认、失败重试和人工接管 | DEV-009/010 | RPA-001、AC-010/011 |
| DEV-012 | 进化治理与受控学习候选 | DEV-004/006/007 | GOV-001；禁止规则自动生效 |
| DEV-013 | 全链路契约、浏览器和外部适配器验收 | DEV-002–012 | §10 全部验证门 |

每个 Task 建卡时必须引用本表 Task ID、关联需求 ID 和 AC ID；若拆成前后端子任务，二者共享同一个数据 Schema 和状态机，不允许各自发明字段。

## 15. 埋点与审计事件

| 事件 | 触发时机 | 必要属性 |
|---|---|---|
| `onboarding_closed/submitted` | 关闭或提交首次引导 | tenant_id、step、result |
| `knowledge_candidate_adopted/rejected` | 候选采用或驳回 | candidate_id、source_type、operator_id |
| `vi_direction_selected` | 选择 VI 方向 | direction_id、draft_version |
| `vi_image_adopted/rejected` | 审核单张 VI 图片 | image_task_id、scene_id、result |
| `vi_activated` | 正式启用 VI | vi_version_id、operator_id |
| `intelligence_collection_started` | 创建采集任务 | query_id、region、time_window、source_scope |
| `intelligence_candidate_adopted/rejected` | 采用或忽略情报 | candidate_id、evidence_level、operator_id |
| `content_generated/approved/exported` | 内容生命周期变化 | content_id、channel、version、vi_version_id |
| `ppt_outline_approved` | PPT 大纲审核通过 | ppt_id、outline_version、operator_id、knowledge_snapshot_id、vi_version_id |
| `ppt_generation_started/ready/failed` | PPT 后台任务状态变化 | task_id、ppt_id、status、duration_ms、error_code |
| `ppt_slide_saved` | 画布文字自动保存 | ppt_id、slide_id、deck_version、field、result |
| `ppt_slide_candidate_adopted/rejected` | AI 追问候选版被采用或撤回 | ppt_id、slide_id、candidate_id、result、deck_version |
| `publish_task_created` | 建立发布任务 | task_id、content_id、account_id、publish_method |
| `rpa_confirmed/succeeded/failed/manual_takeover` | RPA 状态变化 | execution_id、task_id、platform、error_code |
| `wechat_metrics_synced` | 单篇文章数据同步完成 | article_id、account_id、reads、shares、synced_at |

埋点和审计中不得记录正文全文、明文凭据、Cookie、token 或个人敏感信息；外部错误只保存脱敏错误码和必要诊断摘要。

## 16. Further Notes

- 各模块 PRD 已增加“当前通用产品开发基线”；同文件上方殡葬 V1 内容保留为历史记录，冲突时以该文件最新基线章节和本主 PRD 为准。
- 产品 Agent 名称（公众号 Agent、海报 Agent、PPT Agent 等）是业务角色；本地 Codex Skill 是研发/运营编排能力，两者不要混为一层。
- 若后续新增渠道，必须先定义渠道能力矩阵，再决定是否允许账号选择、发布和结果回收，不能从公众号能力复制推断。
