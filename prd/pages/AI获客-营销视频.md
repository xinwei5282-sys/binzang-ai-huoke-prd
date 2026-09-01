---
artifact: prd
version: "3.1"
created: 2026-08-17
status: current
---

# 页面 PRD：AI 获客 / 营销视频

> 页面 ID：`create`｜版本：v3.1｜优先级：P0｜日期：2026-09-01｜上位：[[../PRD_AI获客]]
> 当前原型真源：`prototype/index.html`｜Prompt 注册：[[../PRD_提示词]]
> 本文覆盖营销视频列表、AI 生成视频和商品营销视频；AI 混剪以 [[AI获客-AI混剪]] 为准。

## 页面概述

| 项目 | 说明 |
|---|---|
| 页面目标 | 在同一任务列表中提供 AI 生成视频和商品营销视频两条最短流程，并在付费生成前完成必要的素材和质量确认。 |
| 适用角色 | 运营创建和编辑；审核人确认内容；视频人员处理生成失败；负责人控制预算和对外承诺。 |
| 页面入口 | `AI 获客 → 营销视频`，或从获客计划、爆款追踪创建任务。 |
| 权限要求 | 查看、创建、编辑、确认和生成分权；发布仍由独立发布任务控制。 |

## 页面级业务规则

- 两类视频共用任务列表、标题和详情入口，但根据视频类型进入不同流程。
- AI 生成视频按“视频设置 → 封面、脚本与分镜确认”两步完成；商品营销视频只收商品主图、模特图和名称，质量通过后直接生成。
- 营销场景和目标客户由企业大脑与任务输入推断，不重复要求用户手填；证据不足时展示待确认。
- AI 生成视频的封面、口播、分镜素材、时长、来源、授权和质量问题必须在生成前统一确认。
- P-042、P-043、P-044 分别负责方向推断、方案生成和质量门禁；任何一层不得执行发布。

## 页面字段

| 字段 | 类型 | 必填/展示规则 | 业务口径 |
|---|---|---|---|
| 视频标题 | 文本 | 2–80字，必填 | 两类视频共用，用于列表、详情和文件名。 |
| 视频类型 | 分段控件 | 必填 | `ai_generated/product_marketing`。 |
| 参考来源 | 爆款/链接/文本 | AI 生成视频可选 | 仅借鉴结构，不复制原内容。 |
| 国产模型 | 选择器 | AI 生成视频必填 | 只展示已配置国产模型和成本说明。 |
| 企业方向推断 | 只读摘要 | AI 生成视频展示 | 营销场景、目标客户、置信度、证据和缺失项。 |
| 封面 | 素材卡 | AI 生成视频第二步必显 | 支持重新生成和本地替换，保存素材版本。 |
| 口播文案 | 多行文本 | AI 生成视频第二步必显 | 修改后使质量确认失效。 |
| 分镜素材 | 分镜卡列表 | AI 生成视频第二步必显 | 画面、对应口播、时长、来源、授权、首尾帧和问题。 |
| CTA | 开关+文本 | AI 生成视频可选 | 商品营销视频不展示 CTA。 |
| 商品主图/模特图/名称 | 文件+文本 | 商品营销视频必填 | 图片需通过格式、主体和授权检查。 |
| 任务状态 | 枚举 | 列表和详情必显 | 与真实生成阶段一致，不用定时器冒充服务状态。 |

## 操作与结果

| 按钮/操作 | 展示条件 | 执行结果 | 权限与记录 |
|---|---|---|---|
| 新建营销视频 | 有创建权限 | 创建草稿并选择视频类型 | 保存企业知识和用户输入版本。 |
| 下一步生成方案 | AI 生成视频字段完整 | 调用 P-042/P-043 并进入统一确认页 | 保存推断证据、Prompt 和方案版本。 |
| 预览/替换/重新生成素材 | 第二步 | 更新素材方案并重跑 P-044 | 保存素材授权和操作人。 |
| 确认并生成成片 | P-044 通过且人工确认 | 创建正式生成任务 | 写确认人、预算和输入快照。 |
| 立即生成 | 商品素材检查通过 | 直接创建商品营销视频任务 | 不增加脚本或分镜审核。 |
| 查看详情/成片 | 任务存在 | 只读查看任务输入、阶段、问题或成片 | 不改变任务状态。 |
| 重试 | `failed/partial_success` | 仅重试失败阶段或片段 | 保留已成功产物。 |

## 产品边界

营销视频负责生成和审核视频资产，不直接发布。真实模型、商品视频服务、素材存储和质量门禁需要工程接入；当前原型的图片、视频和定时状态仅用于展示流程。

## 状态与跳转

- `AI 生成：draft → planning → awaiting_confirmation → queued → generating → quality_review → succeeded | failed | partial_success`
- `商品营销：draft → asset_checking → queued → generating → quality_review → succeeded | failed`
- `succeeded → download or create_publish_task`

## 通知与日志

- 方案待确认、质量 blocker、生成失败、部分成功和成片完成通知任务负责人。
- 记录 `marketing_video_created/type_selected/plan_generated/material_replaced/quality_checked/render_confirmed/succeeded/failed`。
- 审计包含 P-042/P-043/P-044、知识、素材授权、模型、输入和确认版本，不记录密钥或文件二进制。

## 异常与空状态

| 场景 | 页面表现 |
|---|---|
| 首次无任务 | 解释两种视频类型并提供创建入口。 |
| 企业证据不足 | 展示宽泛方向和待确认项，不虚构客户属性。 |
| 参考来源不可用 | 保留手动输入路径，不补造原文或指标。 |
| 素材缺失/时长不足 | 定位到封面或具体分镜，提供替换、补齐或重新生成。 |
| P-044 阻断 | 显示检查项和恢复动作，正式生成按钮不可用。 |
| 单段失败 | 保留成功片段，允许局部重试。 |

## 页面验收标准

1. 两类视频共用列表，但创建字段和确认步骤按类型正确分流。
2. AI 生成视频在第二步统一展示封面、口播、分镜、时长、来源、授权和质量问题。
3. 商品营销视频不显示脚本、分镜或 CTA，素材检查通过后可直接生成。
4. P-044 未通过或未人工确认时不能创建正式生成任务。
5. 场景与客户推断可追溯证据，缺证据时不会虚构具体属性。
6. 任务不会在本页静默发布，失败可按阶段或片段重试。

## 技术评估项

- 核心对象：`marketing_video_task/marketing_video_plan/marketing_video_scene/product_marketing_input/marketing_video_quality_issue/marketing_video_artifact`。
- P-042/P-043/P-044 输出必须通过 JSON Schema、事实引用、授权和合规校验。
- 写接口携带 `tenant_id/input_version/idempotency_key`；素材更新使相关质量确认失效。
- 正式生成前固化企业知识、Prompt、模型、素材、授权、预算和人工确认快照。
- 模型成本、供应商时延、回调验签、局部重试和成片 AI 标识需在工程接入前完成评估。

# 详细执行契约（保留）

## 1. 问题

企业需要以较低操作成本持续生成营销成片，但两类任务的输入和确认方式不同：

1. AI 生成视频需要根据标题、企业事实和参考内容生成脚本、封面与分镜，人工确认后再生成成片。
2. 商品营销视频只需要商品主图、模特图和商品名称，系统直接生成成片，不应强迫用户确认脚本或分镜。
3. 原流程存在字段重复、步骤过多、生成前无法看清素材与质量问题的问题，也容易把营销场景和目标客户变成重复手填项。

## 2. 目标

1. 两类视频共用一个任务列表和一个公共标题，按视频类型进入最短可用流程。
2. AI 生成视频在正式生成前一次性确认封面、口播、分镜素材、时长、来源和质量问题。
3. 商品营销视频通过素材质量检查后直接生成，不增加脚本或分镜确认步骤。
4. 企业信息、营销场景和目标客户由后台从企业大脑及本次任务自动推断，减少用户填写。
5. 所有任务可追溯到输入、企业事实、素材授权、模型、Prompt 和人工操作版本。

## 3. 目标用户

| 角色 | 使用目的 | 默认权限 |
|---|---|---|
| 企业老板/管理员 | 创建、审核并查看营销视频 | 创建、编辑、确认、生成、下载 |
| 内容运营 | 批量创建和调整视频 | 创建、编辑、暂存；是否可生成由角色权限决定 |
| 品牌/合规审核人 | 检查事实、素材授权和品牌表达 | 查看详情、处理问题、确认生成 |
| 只读成员 | 查看任务设置和成片 | 只读详情、查看成片；不可下载时隐藏下载 |

## 4. 核心指标

| 指标 | 统计口径 | 目标 |
|---|---|---|
| 创建完成率 | 进入创建页后成功创建任务的会话数/进入创建页会话数 | 上线后建立基线 |
| AI 方案一次确认率 | 未重新生成全部方案即通过确认的 AI 生成任务占比 | 上线后建立基线 |
| 质量问题拦截率 | 存在未处理 blocker/warning 且未进入正式生成的任务占比 | 100% |
| 任务配置追溯率 | 可追溯输入、知识、Prompt、模型和素材版本的任务占比 | 100% |
| 商品素材校验覆盖率 | 创建前完成主图、模特图、清晰度与授权检查的商品任务占比 | 100% |
| 成片生成成功率 | 最终进入 completed 的生成任务/已提交生成任务 | 上线后建立基线 |

## 5. 范围

### 5.1 本期范围

- 统一任务列表、按状态操作、创建、详情、暂存、重试、查看成片和下载。
- 公共标题及 AI 生成视频/商品营销视频类型切换。
- AI 生成视频两步流程：视频设置 → 封面、脚本与分镜确认。
- 商品营销视频单页直接生成。
- 自动读取企业大脑、自动推断营销场景与目标客户。
- 授权链接抓取、粘贴文案、爆款库参考和结构仿写。
- 国产视频模型选择；商品营销由系统自动路由模型。
- AI 封面、分镜素材、首尾帧、口播、素材时长与质量问题统一确认。
- AI 生成视频可选 CTA；未配置时自然收尾。
- 后台质量门禁、分镜级问题、素材替换/补齐/重新生成。

### 5.2 不在本期

- 不提供右侧竖屏模拟预览；只展示真实生成的封面和分镜素材。
- 不提供时间线、逐帧、手动裁剪、调色等专业 NLE 能力。
- 不自动发布到抖音、小红书、视频号或快手。
- 不把推断的营销场景、目标客户或参考内容写回正式企业知识。
- 不展示未接入模型为可用生产能力。
- 商品营销视频不开放脚本、分镜、CTA、目标时长和模型人工控制。

## 6. 用户流程

### 6.1 任务列表

进入「营销视频」 → 查看统一任务列表 → 点击「创建营销视频」或按任务状态执行操作。

| 状态 | 展示信息 | 可用操作 |
|---|---|---|
| `draft` 草稿 | 已保存配置、最后更新时间 | 查看详情、继续编辑、删除草稿 |
| `checking` 检查中 | 当前检查阶段 | 查看详情 |
| `review` 待确认 | 封面、脚本与分镜已就绪 | 查看详情、确认并生成 |
| `queued` 排队中 | 已提交生成 | 查看详情、取消任务（供应商未开始时） |
| `generating` 生成中 | 当前生成阶段，不展示虚假百分比 | 查看详情 |
| `completed` 已完成 | 成片版本、完成时间 | 查看详情、查看成片、下载、复用配置 |
| `failed` 失败 | 失败阶段和可读原因 | 查看详情、重试失败阶段、复用配置 |

所有状态均支持「查看详情」。详情复用创建页结构并锁定字段；运行中的详情不承诺供应商级实时百分比。

### 6.2 AI 生成视频

1. 填写标题。
2. 选择「AI 生成视频」。
3. 设置参考来源、目标平台、画面比例、目标时长、可选 CTA 和国产视频模型。
4. 点击「生成内容方案并进入下一步」。
5. 后台读取企业大脑，推断营销方向，生成封面、口播、分镜与必要首尾帧并运行质量门禁。
6. 用户在第二步查看或修改封面、标题正文、口播和分镜素材，处理分镜级问题。
7. 全部问题处理完成后点击「确认并生成成片」。
8. 返回列表查看状态；完成后查看或下载成片。

### 6.3 商品营销视频

1. 填写标题。
2. 选择「商品营销视频」。
3. 上传商品主图和模特图，填写商品名称，选择目标平台和画面比例。
4. 系统校验素材完整性、清晰度、主体一致性和授权风险。
5. 通过后点击「立即生成」，直接创建任务并返回列表，不进入第二步。

## 7. 功能规则与字段契约

### 7.1 公共字段

#### 标题

单行文本，位于视频类型上方，两种类型共用。字段键：`video_title`。取值：去除首尾空格后 2–60 字符，必填。默认：新建时可为空，原型示例值不代表生产默认。校验：失焦和提交时校验；为空提示「请填写标题」，超长提示「标题最多 60 个字符」。联动：用于任务名称、详情标题和生成目标；切换类型时保留，复用配置时回填。权限：创建/编辑角色可改，详情只读。

#### 视频类型

分段单选。字段键：`video_type`。取值：`ai_generated/product_marketing`，必填，默认 `ai_generated`。联动：AI 类型展示两步流程；商品类型隐藏步骤导航和 AI 专属字段。切换类型不清除标题；各类型的专属草稿数据分别保留。任务创建后不可直接改类型，只能复用配置创建新任务。

### 7.2 AI 生成视频第一步

#### 参考来源

分段单选。字段键：`reference_source_type`。取值：`authorized_url/manual_text/viral_library`，默认 `authorized_url`。选择后只显示对应输入区。

#### 参考视频链接

URL 输入。字段键：`reference_url`。仅在 `authorized_url` 时显示；HTTPS，最长 2048 字符。提交时要求用户确认有权使用；抓取失败可改为粘贴文案，不阻断暂存。系统只提取结构和信息，不逐句复制。

#### 参考文案

多行文本。字段键：`reference_text`。仅在 `manual_text` 时显示；10–10000 字符。文本只用于本任务，不自动进入企业大脑。

#### 爆款库内容

下拉选择。字段键：`viral_content_id`。仅在 `viral_library` 时显示，取值必须属于当前租户可见范围。选择后回显标题、平台、热度和来源；删除源内容后历史任务保留输入快照。

#### 企业知识依据

只读状态卡。字段键：`knowledge_snapshot_id`。展示本次引用的正式企业事实、版本和缺失项，不展示营销方向推断卡。存在未确认的价格、资质、案例、功效或服务承诺时标记 blocker。

#### 目标平台

多选。字段键：`target_platforms[]`。取值：`douyin/xiaohongshu/wechat_channels/kuaishou`，至少 1 项；默认继承企业最近使用值，没有历史时默认抖音。每个平台生成独立适配版本，不能用一个平台规则覆盖其他平台。

#### 画面比例

单选。字段键：`aspect_ratio`。取值：`9:16/16:9/1:1`，默认 `9:16`。模型不支持所选比例时提交前阻断并给出可选比例。

#### 目标时长

单选。字段键：`target_duration_seconds`。取值：模型能力配置返回的合法时长，原型基线为 15/30/60 秒，默认 30 秒。该字段是生成约束，不展示「最终时长」；最终成片允许在模型容差内浮动并保存实际时长。

#### 结尾引导 CTA

开关加文本。字段键：`cta_enabled/cta_text`。默认关闭；关闭时不生成 CTA 分镜。开启后 `cta_text` 必填，2–40 字符，默认不自动填联系方式；为空提示「请填写结尾引导」。仅 AI 生成视频显示。

#### 视频生成模型

下拉单选。字段键：`video_model_id`。候选由后台能力接口返回，只显示国产且当前租户可用模型；原型展示 Seedance、可灵、海螺、通义万相并标记待接入。默认选择后台推荐模型。模型不可用、额度不足或规格不兼容时阻断提交。

#### 生成内容方案并进入下一步

主按钮。校验标题、平台、比例、时长、参考输入和模型；防重复点击。成功创建方案任务并进入第二步；不是正式成片生成。失败保留全部输入并展示失败阶段和重试入口。

### 7.3 AI 生成视频第二步

#### 完整封面素材

素材卡。字段键：`cover_asset/cover_copy`。展示真实缩略图、封面文案、比例、来源、授权和质量状态。支持查看、重新生成封面、本地替换封面；本地上传支持 JPG/PNG/WebP，单文件不超过后台配置上限。替换后重新执行封面质检。

#### 分镜素材与首尾帧

卡片列表。字段键：`scenes[]`。每张卡必须展示 `scene_id/order/time_range/narration/visual_intent/asset_id/asset_type/source/license_status/required_duration/available_duration/keyframe_requirement/quality_issues`。口播可编辑；素材支持查看、替换、补齐或重新生成，不提供裁剪。AI 生成镜头默认生成首帧，仅动作连续、转场衔接或下一镜复用时生成尾帧。

#### 平台标题与正文

文本字段。字段键：`platform_copies[].title/body`。每个平台保存独立版本；标题 2–60 字符，正文长度按平台规则校验。切换平台只切换当前版本，不覆盖其他平台。

#### 质量门禁

只读汇总加分镜级问题。字段键：`quality_summary/quality_issues[]`。后台自动执行，不增加手动检查步骤。`blocker` 或未处理 `warning` 存在时禁用生成按钮；问题必须显示证据、建议、是否可自动修复和处理状态。

#### 返回上一步/暂存/确认并生成成片

- `返回上一步`：返回第一步且不丢失第二步已生成内容。
- `暂存`：保存当前输入、方案版本和问题状态，不创建正式生成任务。
- `确认并生成成片`：仅在全部问题处理完成且用户有确认权限时可用；固化输入快照后创建正式生成任务。

### 7.4 商品营销视频字段

#### 商品主图

单文件上传。字段键：`product_main_asset_id`。JPG/PNG/WebP，必填；检查清晰度、主体完整、商品可识别和授权。失败提示具体原因并允许替换。

#### 模特图

单文件上传。字段键：`model_asset_id`。JPG/PNG/WebP，必填；检查清晰度、人物完整、肖像与生成使用授权。授权未知或人物严重遮挡时阻断。

#### 商品名称

单行文本。字段键：`product_name`。2–80 字符，必填，用于识别需要生成的具体商品，不替代公共标题。

#### 目标平台

单选。字段键：`target_platform`。取值同公共平台枚举，必填，默认继承最近使用平台。

#### 画面比例

单选。字段键：`aspect_ratio`。取值 `9:16/16:9/1:1`，默认 `9:16`。

#### 立即生成

主按钮。校验标题、商品名称、两张图片、平台、比例、素材授权和额度。通过后由系统自动路由模型并创建生成任务；不生成待确认脚本、CTA 或分镜，不进入第二步。

### 7.5 列表、详情和成片

- 列表字段键：`video_title/video_type/target_platform/current_stage/status/updated_at/actions`；默认按 `updated_at desc`，分页大小 20。
- 无任务时展示空状态和「创建营销视频」，不展示统计卡。
- 查看详情复用创建页面；字段只读，第一步和第二步可点击切换，商品营销只有单页。
- 查看成片仅展示实际视频、版本和生成信息；不显示模拟预览。
- 下载仅在 `completed` 且有下载权限时显示，返回带版本信息的文件。

## 8. 状态、权限与审计

状态机：

`draft → checking → review → queued → generating → completed`

`checking/review/queued/generating → failed`
商品营销视频：`draft → checking → queued → generating → completed | failed`。

- 同一任务更新必须携带 `input_version`；版本冲突返回 `VERSION_CONFLICT`，不覆盖他人修改。
- 创建、暂存、素材替换、自动修复、人工确认、取消、重试、查看和下载写审计日志。
- 内容运营无确认权限时可处理草稿和问题，但「确认并生成成片」不可用并提示需要审核角色。
- 运行中只读；失败任务允许从失败阶段重试，不重新执行已成功且输入未变化的阶段。
- 外部发布不属于本页，生成完成不自动创建发布任务。

## 9. 异常与边界

| 场景 | 页面行为 | 是否阻断 |
|---|---|---|
| 企业大脑无可用事实 | 使用本次标题和参考内容生成，标记知识不足；不得虚构硬事实 | 高风险表达阻断，普通创意不阻断 |
| 参考链接无授权/抓取失败 | 提示改为粘贴文案或重新输入 | 阻断方案生成，不影响暂存 |
| 模型不可用或不支持比例/时长 | 展示原因和可用模型/规格 | 阻断生成 |
| 额度不足 | 展示预计消耗和套餐入口 | 阻断正式生成 |
| 素材上传失败 | 保留其他字段，允许单文件重试 | 阻断依赖该素材的提交 |
| 素材授权未知 | 标记 blocker，不允许正式生成 | 阻断 |
| 分镜素材时长不足 | 在对应分镜显示缺口，允许补齐/替换/重新生成 | 阻断 |
| Prompt/Schema 校验失败 | 不展示半成品，保存输入并允许重试 | 阻断当前阶段 |
| 生成超时 | 状态进入 failed，保留供应商任务 ID 和已成功产物 | 可重试失败阶段 |
| 重复点击提交 | 使用幂等键返回同一任务 | 不重复计费/建任务 |
| 用户切换类型 | 保留公共标题和各类型草稿；不把 AI 字段提交给商品任务 | 不阻断 |
| 并发编辑 | 后提交者收到版本冲突并加载最新版本 | 阻断覆盖 |
| 成片文件暂不可用 | completed 不成立；进入 failed 或产物处理中 | 阻断查看/下载 |

## 10. 数据对象

### `marketing_video_task`

`task_id` PK、`tenant_id`、`video_title`、`video_type`、`status`、`current_stage`、`target_platforms`、`aspect_ratio`、`target_duration_seconds`、`actual_duration_seconds`、`model_id`、`knowledge_snapshot_id`、`input_snapshot_id`、`prompt_versions`、`created_by`、`confirmed_by`、`input_version`、`created_at`、`updated_at`、`completed_at`、`deleted_at`。唯一约束：`tenant_id + idempotency_key`。

### `marketing_video_plan`

`plan_id` PK、`task_id` FK、`version`、`inferred_scenario`、`inferred_customer`、`inference_confidence`、`evidence_refs`、`cover_asset_id`、`platform_copies`、`quality_status`、`created_at`。同一任务只有一个 current 版本，历史版本不可覆盖。

### `marketing_video_scene`

`scene_id` PK、`plan_id` FK、`order_no`、`start_ms`、`end_ms`、`narration`、`visual_intent`、`asset_id`、`asset_source`、`license_snapshot_id`、`required_duration_ms`、`available_duration_ms`、`first_frame_asset_id`、`last_frame_asset_id`、`quality_status`、`version`。

### `product_marketing_input`

`task_id` PK/FK、`product_name`、`product_main_asset_id`、`model_asset_id`、`asset_check_result`、`routing_model_id`、`license_snapshot_ids`。

### `marketing_video_quality_issue`

`issue_id` PK、`task_id`、`scene_id nullable`、`dimension`、`level`、`evidence`、`suggestion`、`auto_fixable`、`status`、`resolved_by`、`resolved_at`。

### `marketing_video_artifact`

`artifact_id` PK、`task_id`、`version`、`file_url`、`cover_url`、`duration_seconds`、`width`、`height`、`checksum`、`provider_job_id`、`created_at`、`expires_at nullable`。

所有对象按 `tenant_id` 隔离；素材 URL 使用短期签名地址；软删除不删除审计、授权和计费快照。

## 11. 接口草案

| 方法与路径 | 用途 | 关键请求 | 关键响应 |
|---|---|---|---|
| `GET /marketing-video-tasks` | 查询列表 | status/type/page/page_size | items、total、allowed_actions |
| `POST /marketing-video-tasks` | 创建/暂存任务 | video_title、video_type、配置、idempotency_key | task_id、status、input_version |
| `GET /marketing-video-tasks/{id}` | 查看详情 | task_id | task、plan、scenes、issues、artifacts、allowed_actions |
| `PATCH /marketing-video-tasks/{id}` | 更新草稿 | changed_fields、input_version | new_input_version |
| `POST /marketing-video-tasks/{id}/build-plan` | 生成 AI 内容方案 | input_version、idempotency_key | plan_id、status=checking |
| `PATCH /marketing-video-tasks/{id}/cover` | 替换封面 | asset_id/copy、input_version | cover、quality_status |
| `PATCH /marketing-video-tasks/{id}/scenes/{sceneId}` | 修改口播或素材 | changed_fields、input_version | scene、affected_issues |
| `POST /marketing-video-tasks/{id}/issues/{issueId}/auto-fix` | 自动修复允许的问题 | input_version | issue、scene、quality_summary |
| `POST /marketing-video-tasks/{id}/confirm-generation` | 确认并生成 AI 视频 | input_version、idempotency_key | status=queued、job_id |
| `POST /marketing-video-tasks/{id}/generate-product-video` | 生成商品营销视频 | product inputs、input_version、idempotency_key | status=queued、job_id |
| `POST /marketing-video-tasks/{id}/retry` | 重试失败阶段 | failed_stage、input_version、idempotency_key | status、job_id |
| `POST /marketing-video-tasks/{id}/cancel` | 取消未执行任务 | input_version | status=cancelled/错误码 |
| `GET /marketing-video-tasks/{id}/video` | 查看/下载成片 | artifact_version | signed_url、metadata |

通用错误码：`VALIDATION_ERROR`、`PERMISSION_DENIED`、`VERSION_CONFLICT`、`KNOWLEDGE_FACT_MISSING`、`REFERENCE_FETCH_FAILED`、`ASSET_INVALID`、`ASSET_LICENSE_UNKNOWN`、`MODEL_UNAVAILABLE`、`SPEC_UNSUPPORTED`、`QUOTA_INSUFFICIENT`、`QUALITY_GATE_BLOCKED`、`PROMPT_SCHEMA_INVALID`、`GENERATION_TIMEOUT`、`ARTIFACT_NOT_READY`。所有写接口必须校验租户、权限、`input_version` 和 `idempotency_key`。

## 12. Skill / Prompt

Skill 链：`marketing-context-resolver → marketing-direction-inferencer → marketing-video-plan-builder → marketing-video-quality-gate → model-generation-orchestrator`。商品营销使用 `product-marketing-input-validator → model-router → model-generation-orchestrator`，不调用脚本/分镜生成 Prompt。

Prompt 上下文优先级：

`platform_rules → industry_pack → confirmed_enterprise_facts/active_vi → task_input`。

每次运行固化 `prompt_id/prompt_version/model/input_snapshot_id/knowledge_snapshot_id/vi_version/output_schema_version`。Prompt 只输出 JSON；Schema、事实引用或合规校验失败不得进入下一阶段。

### 12.1 P-042 营销方向推断 `marketing-direction-v1.0.0`

触发：AI 生成视频第一步提交后、脚本和分镜生成前。人工门：不单独展示或确认；结果仅作为生成上下文和审计数据，不能写回企业大脑。

```text
你是企业营销视频的营销方向推断器。你的任务不是创作脚本，而是为后续脚本和分镜确定本次营销场景和目标客户。

输入包含 confirmed_enterprise_facts、video_title、reference_content、target_platforms、cta 和 industry_pack。
严格按以下优先级取值：
1. 企业大脑中已确认且与标题直接相关的企业事实；
2. 本次标题、经授权的参考内容、目标平台和已配置 CTA；
3. 行业知识包只能用于归类和措辞，不能补造企业经营事实或客户属性。

营销场景描述本次视频要解决的营销任务。目标客户只描述与标题直接相关的人群及其需求，不得臆测年龄、收入、家庭结构、地域或消费能力。
证据不足时输出宽泛描述，confidence=low、needs_confirmation=true，并列出 missing_inputs。不得把推断写回企业大脑，不得用参考内容覆盖企业事实。
只输出符合 Schema 的 JSON。
```

输出：`prompt_version/marketing_scenario/target_customer/scenario_type/confidence/evidence_refs/reason_summary/needs_confirmation/missing_inputs`。

### 12.2 P-043 AI 营销视频方案 `marketing-video-plan-v1.0.0`

触发：P-042 和参考内容解析完成后。人工门：输出只进入第二步确认，禁止直接生成成片。

```text
你是企业营销视频策划。基于 platform_rules、industry_pack、confirmed_enterprise_facts、active_vi、video_title、marketing_direction、reference_structure、target_platforms、aspect_ratio、target_duration_seconds、cta 和 model_capabilities，生成可执行的封面、平台文案、口播和分镜方案。

要求：
1. 企业价格、资质、案例、功效和服务承诺只能引用 confirmed_enterprise_facts，并在 evidence_refs 中给出事实 ID；缺失时写入 missing_inputs，不得补造。
2. 参考内容只提取结构、节奏和可迁移模式，不逐句复刻，不将其事实当作本企业事实。
3. 口播总时长适配 target_duration_seconds；每个分镜必须覆盖连续时间段并与口播语义直接匹配。
4. 每个分镜输出 visual_intent、asset_request、required_duration_seconds、source_preference 和 keyframe_requirement。AI 镜头默认只要首帧，仅动作连续、转场衔接或下一镜复用时要求尾帧。
5. CTA 仅在 cta.enabled=true 时生成独立收口分镜，否则自然收尾。
6. 封面遵循 active_vi；图片提示词不得要求模型直接生成 Logo、水印或大段中文，文字由排版层叠加。
7. 按目标平台分别输出标题和正文，不混用平台规则。
8. 只输出符合 Schema 的 JSON，不创建渲染任务。
```

输出：`prompt_version/summary/cover/platform_copies/narration_duration_seconds/scenes/asset_requests/evidence_refs/missing_inputs/risk_flags/needs_confirmation`。

### 12.3 P-044 营销视频质量门禁 `marketing-video-quality-v1.0.0`

触发：方案生成、口播修改、封面/素材替换、补齐或自动修复后。人工门：全部问题处理完成后仍需人工点击确认。

```text
你是营销视频生成前质量审核器。输入为 task_snapshot、confirmed_enterprise_facts、platform_rules、cover、platform_copies、scenes、assets、license_snapshots、model_capabilities 和 prompt_versions。

逐项检查：
1. content：口播逻辑、标题一致性、企业事实引用、CTA 和平台表达；
2. semantic：每个画面是否直接支持对应口播；
3. timeline：分镜连续、无重叠/越界，素材可用时长不少于所需时长；
4. visual：清晰度、主体完整、安全区、首尾帧和品牌视觉；
5. license：企业素材、人工上传素材和生成素材均有有效授权或生成记录；
6. capability：模型支持目标平台、比例和时长，且额度可用。

事实未确认、必需素材缺失、授权未知、时间轴不完整或规格不支持为 blocker。语义偏低、节奏或构图可优化为 warning；本期未处理 warning 也不得生成。
自动修复不得改变企业事实、价格、资质、案例、功效承诺或核心口播含义。
只输出符合 Schema 的 JSON。
```

输出：`prompt_version/render_allowed/overall_status/checks/issues/blockers/warnings/auto_fixes/needs_human_review`。每个 issue 必含 `scene_id nullable/dimension/level/evidence/suggestion/auto_fixable`。

### 12.4 商品营销生成约束

商品营销首版不使用开放式脚本 Prompt。系统将标题、商品名称、主图、模特图、平台、比例和授权快照组装为确定性任务；模型路由只在能力、成本和可用性范围内选择供应商，不改变商品身份。若供应商必须接收文本提示词，提示词由后台固定模板生成并保存版本，禁止加入输入中不存在的卖点、功效、价格或 CTA。

失败降级：P-042 证据不足时使用宽泛人群；P-043 缺硬事实时生成不含该事实的方案并标记缺失；P-044 或 Schema 失败时保持在检查/确认阶段；任何 Prompt 失败均保留输入，不创建正式生成任务。

## 13. 埋点事件

| 事件名 | 触发时机 | 关键属性 |
|---|---|---|
| `marketing_video_list_viewed` | 进入列表 | status_filter、task_count |
| `marketing_video_create_started` | 点击创建 | source_page |
| `marketing_video_type_selected` | 切换类型 | from_type、to_type |
| `marketing_video_draft_saved` | 暂存成功 | video_type、step、input_version |
| `marketing_video_plan_requested` | 请求 AI 内容方案 | platforms、ratio、duration、model_id、reference_type |
| `marketing_video_plan_ready` | 方案生成完成 | latency_ms、scene_count、issue_count、prompt_version |
| `marketing_video_asset_replaced` | 替换封面/分镜素材 | asset_type、scene_id、source |
| `marketing_video_issue_resolved` | 问题处理完成 | dimension、level、resolution_type |
| `marketing_video_generation_confirmed` | 人工确认生成 | role、scene_count、estimated_cost |
| `product_marketing_generation_requested` | 商品营销立即生成 | platform、ratio、asset_check_status |
| `marketing_video_generation_completed` | 成片成功 | video_type、model_id、duration、latency_ms |
| `marketing_video_generation_failed` | 任一阶段失败 | video_type、stage、error_code、retryable |
| `marketing_video_viewed` | 查看成片 | artifact_version |
| `marketing_video_downloaded` | 下载成功 | artifact_version、file_type |

禁止在埋点中记录完整口播、外部链接正文、签名 URL、个人敏感信息、密钥或 Cookie。

## 14. 验收标准

| ID | 场景 | 操作 | 预期结果 |
|---|---|---|---|
| MV-AC-001 | 进入营销视频 | 打开页面 | 先展示统一任务列表，无顶部统计卡 |
| MV-AC-002 | 创建任务 | 点击创建 | 标题位于视频类型上方，默认 AI 生成视频 |
| MV-AC-003 | 切换类型 | 填写标题后切换 | 标题保留；专属字段切换且草稿不串用 |
| MV-AC-004 | 标题为空 | 提交任一类型 | 阻断并提示「请填写标题」 |
| MV-AC-005 | AI 生成第一步 | 设置平台、比例、时长 | 三项独立保存，不出现「最终时长」 |
| MV-AC-006 | AI 生成 CTA 关闭 | 生成方案 | 不生成 CTA 分镜，视频自然收尾 |
| MV-AC-007 | AI 生成方案 | 点击进入下一步 | 只生成待确认方案，不创建正式成片任务 |
| MV-AC-008 | 查看封面 | 进入第二步 | 展示真实封面、文案、来源、授权和质量状态，可查看/重生成/本地替换 |
| MV-AC-009 | 查看分镜 | 展开任一分镜 | 同卡展示口播、真实素材、时段、所需/可用时长、来源、授权、首尾帧和问题 |
| MV-AC-010 | 分镜操作 | 查看操作区 | 可查看、替换、补齐或重生成，不出现裁剪 |
| MV-AC-011 | 质量问题存在 | 存在 blocker 或 warning | 问题显示在对应分镜，确认生成按钮禁用 |
| MV-AC-012 | 处理全部问题 | 修复后重新检查 | 按钮启用，点击后才创建正式生成任务 |
| MV-AC-013 | 商品营销创建 | 上传合格素材并填写标题/商品名 | 单页直接生成，不出现第二步、CTA、目标时长或模型选择 |
| MV-AC-014 | 商品素材不合格 | 上传低清或授权未知素材 | 明确显示原因并阻断立即生成 |
| MV-AC-015 | 查看详情 | 打开任意状态任务 | 复用创建页结构且字段/生成操作只读；AI 两步可切换 |
| MV-AC-016 | 生成中详情 | 打开详情 | 展示当前阶段，不显示虚假实时百分比 |
| MV-AC-017 | 已完成 | 点击查看成片/下载 | 只展示真实视频，下载返回当前版本文件，不自动发布 |
| MV-AC-018 | 并发修改 | 使用旧 input_version 保存 | 返回 VERSION_CONFLICT，不覆盖最新数据 |
| MV-AC-019 | 重复提交 | 使用同一幂等键重复请求 | 返回同一任务，不重复生成或计费 |
| MV-AC-020 | Prompt 追溯 | 查看审计数据 | 可追溯 Prompt、模型、输入、知识和素材授权版本 |

## 15. 依赖、风险与里程碑

### 15.1 依赖

| 依赖 | 责任方 | 当前状态 | 延迟影响 |
|---|---|---|---|
| 企业大脑正式知识与快照 | 企业大脑 | 已有原型/接口待联调 | 无法可靠引用企业事实 |
| 素材库、上传和授权快照 | 内容资产 | 待联调 | 无法完成素材确认和审计 |
| 参考链接抓取与授权校验 | 爆款追踪/采集服务 | 待接入 | 链接来源只能降级为粘贴文案 |
| 国产视频模型能力目录 | AI 能力平台 | 待接入 | 不能动态展示真实可用规格 |
| 生成队列、对象存储、计费 | 平台工程 | 待接入 | 不能稳定生成、下载和核算用量 |
| 平台规则与内容合规 | 合规/运营 | 持续维护 | 平台适配和上线规则不可靠 |

### 15.2 风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|---|---|---|---|
| AI 方案看似完整但事实错误 | 中 | 高 | 事实引用、缺失项、P-044 门禁和人工确认 |
| 分镜素材与口播不匹配 | 中 | 高 | 语义评分、分镜级问题、替换/补齐 |
| 供应商模型能力波动 | 高 | 中 | 能力目录、自动降级、幂等重试和阶段复用 |
| 商品图与生成结果不一致 | 中 | 高 | 商品身份一致性检查、失败不发布、保留输入重试 |
| 授权信息不完整 | 中 | 高 | 授权快照为生成前 blocker |
| 生成成本不可控 | 中 | 中 | 提交前估算、额度校验、后台模型路由和用量审计 |

### 15.3 里程碑

| 里程碑 | 交付内容 | 验收门 |
|---|---|---|
| M1 | 列表、公共标题、两类创建流程、只读详情 | MV-AC-001～006、013、015 |
| M2 | AI 封面/分镜卡、素材操作、P-042/P-043/P-044、质量门禁 | MV-AC-007～012、020 |
| M3 | 真实模型队列、商品生成、失败重试、成片查看下载、用量审计 | MV-AC-014、016～019 |

## 16. 开放项

- 国产模型的真实可用名单、时长、比例、价格和租户额度需由能力平台确认。
- 商品营销模型对主图/模特图数量和分辨率的生产约束需接入后固化。
- 成片 AI 标识、水印和各平台披露规则需在上线前按当期法规与平台政策复核。

## 17. 修订记录

| 版本 | 日期 | 说明 |
|---|---|---|
| v3.0 | 2026-08-17 | 按页面 PRD 统一规范补齐问题、目标、用户、流程、范围、逐字段契约、状态权限、异常、数据接口、P-042/P-043/P-044、埋点、指标、验收、依赖风险与里程碑 |
| v2.3 | 2026-08-17 | 将视频主题统一改为公共标题并移至视频类型上方；AI 生成与商品营销均必填 |
| v2.2 | 2026-08-17 | 删除营销场景与目标客户手填字段，新增 P-042 自动推断 |
