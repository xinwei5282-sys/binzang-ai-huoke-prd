# 页面 PRD：企业大脑 / 企业 VI

> 页面 ID：`cognition`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_企业大脑]]

## 问题

企业选择 VI 方向时只看抽象名称无法判断实际效果，选定后也缺少可追溯、可下载的完整交付包。

## 目标

生成并展示三个可比较 VI 方向；选择前可查看完整场景；确认后形成唯一生效版本并支持下载全套 VI。

## 目标用户

企业负责人最终确认；品牌负责人比较和维护；设计/运营成员查看、下载和用于物料生成。

## 用户流程

进入企业VI → 查看三套方向卡 → 打开方向详情与场景展示 → 选择方向 → 人工确认 → 系统生成正式VI版本 → 在线查看或下载全套VI → 后续迭代产生新版本。

## 功能规则

- 方向数量默认3套，可重新生成但不覆盖历史。
- 每套至少展示Logo、色彩、字体、图形语言及名片/海报/公众号/PPT等应用场景。
- 只有人工确认的active版本可被营销物料引用。
- 下载全套VI时冻结版本，包内清单、文件和在线版本一致。
- 本页不展示Agent授权和上传资料入口。

## 异常与边界

企业信息不足时列出缺口；生成失败可查看阶段并重试；部分资产渲染失败不允许发布为active；下载包生成失败不影响在线查看；切换active版本需二次确认并记录影响范围。

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

### 应用场景
场景画廊。字段键：`application_mockups[]`。至少名片、海报、公众号封面、PPT封面；点击放大并显示所用token。

### 选择该方向
按钮。字段键：`select_direction`。写入selected候选，不直接active；同一批次只能选择1项。

### 确认并启用
主按钮。字段键：`activate_vi_direction`。仅负责人/品牌管理员可用；确认影响后生成不可变正式版本。

### 重新生成方向
次按钮。字段键：`regenerate_directions`。需填写调整要求，创建新批次；旧批次保留。

### 下载全套VI
按钮。字段键：`download_vi_package`。仅active版本可用；格式ZIP，包含PDF规范、SVG/PNG资产、字体清单和manifest。

## 状态与权限

方向：`generating → candidate → selected → active | archived | failed`；包：`packaging → ready | failed`。负责人启用，品牌人员编辑候选，运营只读/下载。

## 数据与接口

对象：`vi_generation_batch`、`vi_direction`、`vi_version`、`vi_asset`、`vi_package`。接口：`GET/POST /enterprise-vi/batches`、`GET/PATCH /enterprise-vi/directions/{id}`、`POST /{id}/select|activate`、`POST /vi-versions/{id}/package`。错误码：`PROFILE_INCOMPLETE`、`ASSET_RENDER_FAILED`、`LICENSE_MISSING`、`VERSION_NOT_ACTIVE`。

## Skill / Prompt

```text
你是企业VI方向设计师。输入仅限 confirmed_brand_facts、approved_positioning 和 licensed_assets。生成3个差异明确的方向，每个输出理念、logo规则、色彩、字体、图形语言、应用场景、适用与不适用条件。不得使用无授权字体或素材；输出token与资产manifest。
```

## 埋点事件

`vi_page_viewed`、`vi_direction_previewed`、`vi_direction_selected`、`vi_version_activated`、`vi_package_requested/downloaded`；属性含batch_id、direction_id、version_id、scene。

## 验收标准

1. 选择前可查看每套方向的完整场景。
2. 同一时刻只有一个active版本。
3. 物料只能引用active版本。
4. 下载包清单和在线版本一致且不含未授权资产。
5. 页面无Agent授权和上传资料入口。

## 核心指标

方向完整展示率100%；active版本唯一性100%；下载包成功率≥98%；未授权资产进入正式包数0。
