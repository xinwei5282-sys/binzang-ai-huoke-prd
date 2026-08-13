# 页面 PRD：企业大脑 / 企业 VI

> 页面 ID：`cognition`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_企业大脑]]

## 问题

企业选择 VI 方向时只看抽象名称无法判断实际效果，选定后也缺少可追溯、可下载的完整交付包。

## 目标

生成并展示三个可比较 VI 方向；确认方向后只保留所选方案并立即生成完整 VI；生成成功后自动成为唯一生效版本并支持下载全套 VI。

## 目标用户

企业负责人最终确认；品牌负责人比较和维护；设计/运营成员查看、下载和用于物料生成。

## 用户流程

进入企业VI → 查看三套方向卡 → 打开方向详情与场景展示 → 点击“确认此方向并生成 VI” → 系统只保留所选方向并禁止切换 → 自动确认推荐场景并创建完整 VI 异步生成任务 → 生成成功后自动生效 → 在线查看或下载全套VI → 后续修改偏好时重新生成新一批方向。

## 功能规则

- 方向数量默认3套，可重新生成但不覆盖历史。
- 每套至少展示Logo、色彩、字体、图形语言及名片/海报/公众号/PPT等应用场景。
- 点击“确认此方向并生成 VI”后立即锁定方向与Logo、自动选择相关度最高的4–6个推荐场景并创建完整VI生成任务，不再设置独立的“确认场景并开始生成”或“图片生成任务”板块。
- 方向确认后当前批次只保留所选方向，其他方向不再展示且不能切换；如需更换方向，只能修改偏好并重新生成新批次。
- 同一租户、方向、企业知识版本和生成批次使用同一幂等键；运行中重复点击复用原任务。
- 完整VI生成成功后自动创建active版本，立即供营销物料引用并开放全套VI下载，不再设置“确认并启用”。
- 下载全套VI时冻结版本，包内清单、文件和在线版本一致。
- 本页不展示Agent授权和上传资料入口。

## 异常与边界

企业信息不足时列出缺口；推荐场景为空时使用通用基础场景并明确标记；生成失败保留已选方向、Logo、推荐场景和成功资产，可查看失败阶段并重试；部分资产渲染失败不允许发布为active；下载包生成失败不影响在线查看；切换active版本需二次确认并记录影响范围。

## 字段交互 / 取值

### 当前生效版本
只读版本卡。字段键：`active_vi_version_id`。显示版本号、方向名、确认人、确认时间和引用物料数。

### VI方向卡
卡片列表。字段键：`directions[]`。每项含name、concept、logo_preview、palette、typography、status；固定展示3套最新候选。

### 查看完整展示
卡片按钮。字段键：`preview_direction`。打开详情页/弹层，支持场景缩略图切换和全屏，不改变选中状态。

### 方向名称
文本输入。字段键：`direction_name`。2–40字；默认由AI生成；确认前品牌负责人可改。

### 方向理念
多行文本。字段键：`concept`。20–500字；必须说明品牌特征与适用边界，AI输出可编辑。

### Logo方案
资产组。字段键：`logo_assets[]`。至少含主标、反白、单色和安全区说明；只接受通过渲染校验的文件。

### 标准色
颜色列表。字段键：`color_tokens[]`。每项含name、HEX、RGB、CMYK、usage；主色至少1个，HEX格式必校验。

### 字体规范
字体列表。字段键：`typography_tokens[]`。含中文/英文标题与正文字体、替代字体、字号层级；需标记授权来源。

### 03 · VI 应用场景
场景画廊。字段键：`application_mockups[]`。确认方向后按企业经营信息自动选择相关度最高的4–6项并立即生成；每个场景必须继承所选方向的Logo、标准色、字体、图片风格和版式，不得继续展示通用场景视觉。每张场景卡直接显示相关度、推荐原因、证据、生成次数及`queued/generating/review/failed/adopted/rejected`状态；根据状态就地提供重试、采用、不采用、查看和下载操作。Logo、色彩和字体等基础资产仅在区块头部汇总进度，不再单独展示“图片生成任务”板块。

### 确认此方向并生成 VI
卡片及完整展示中的主按钮。字段键：`confirm_direction_and_generate`。点击后锁定该方向与Logo、删除当前批次其他候选、生成推荐场景、创建`generating_vi`异步任务并滚动到生成进度；按钮进入运行态防重复。同一幂等键重复点击返回原任务。权限：企业负责人/品牌管理员。

### 完整VI生成状态
状态卡。字段键：`vi_generation_status`。取值queued/generating_vi/active/generation_failed；显示方向名、当前阶段、更新时间和脱敏失败原因；生成成功自动进入active；失败时“重试本阶段”复用原方向、场景和成功资产。

### 重新生成方向
次按钮。字段键：`regenerate_directions`。需填写调整要求，创建新批次；旧批次保留。

### 下载全套VI
按钮。字段键：`download_vi_package`。仅active版本可用；格式ZIP，包含PDF规范、SVG/PNG资产、字体清单和manifest。

## 状态与权限

方向与版本：`generating_directions → candidate → generating_vi → active | generation_failed`；进入`generating_vi`时当前批次只保留一个方向；失败可回到`generating_vi`，旧active版本不受影响；成功自动替换为新active并把旧版本归档。包：`packaging → ready | failed`。负责人/品牌管理员确认方向，运营只读/下载。

## 数据与接口

对象：`vi_generation_batch`、`vi_direction`、`vi_generation_job`、`vi_version`、`vi_asset`、`vi_package`。接口：`GET/POST /enterprise-vi/batches`、`GET/PATCH /enterprise-vi/directions/{id}`、`POST /directions/{id}/confirm-and-generate`（要求Idempotency-Key，成功任务自动创建active版本）、`POST /vi-jobs/{id}/retry`、`POST /vi-versions/{id}/package`。错误码：`PROFILE_INCOMPLETE`、`DIRECTION_INVALID`、`GENERATION_ALREADY_RUNNING`、`ASSET_RENDER_FAILED`、`LICENSE_MISSING`、`VERSION_NOT_ACTIVE`。

## Skill / Prompt

```text
你是企业VI方向设计师。输入仅限 confirmed_brand_facts、approved_positioning 和 licensed_assets。生成3个差异明确的方向，每个输出理念、logo规则、色彩、字体、图形语言、应用场景、适用与不适用条件。不得使用无授权字体或素材；输出token与资产manifest。
```

## 埋点事件

`vi_page_viewed`、`vi_direction_previewed`、`vi_direction_confirmed`、`vi_alternative_directions_removed`、`vi_generation_started/completed/failed/retried`、`vi_version_auto_activated`、`vi_package_requested/downloaded`；属性含batch_id、direction_id、job_id、version_id、scene_count、failed_stage、idempotency_reused。

## 验收标准

1. 选择前可查看每套方向的完整场景。
2. 卡片和完整展示两个确认入口点击后都立即进入完整VI生成状态，不再出现独立的场景确认门。
3. 同一方向运行中重复点击不会创建第二个任务。
4. 确认方向后当前批次只显示所选方向，不能切换到其他方向。
5. 页面只保留“03 · VI 应用场景”，不再单独显示“根据企业情况推荐”和“图片生成任务”两个板块；所有场景显示当前所选方向的Logo、标准色、字体、图片风格及单图生成状态与操作。
6. 生成成功后自动成为唯一active版本并立即显示“下载全套VI”，页面不存在“确认并启用”。
7. 失败后方向、Logo、推荐场景和成功资产保留，可重试当前阶段。
8. 物料只引用生成成功的active版本。
9. 下载包清单和在线版本一致且不含未授权资产。
10. 页面无Agent授权和上传资料入口。

## 核心指标

方向确认后任务创建成功率≥99%；重复生成任务数0；方向完整展示率100%；active版本唯一性100%；下载包成功率≥98%；未授权资产进入正式包数0。
