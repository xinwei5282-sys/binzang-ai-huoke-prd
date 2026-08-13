# 页面 PRD：AI 获客 / 短视频创作

> 页面 ID：`create`｜版本：v1.0｜优先级：P0｜上位：[[../PRD_AI获客]]

## 问题

短视频脚本需要结合企业事实和渠道表达，直接出片成本高且错误难以返工。

## 目标

完成选题、脚本、分镜、首帧两级确认，并将确认结果交给AI视频/数字人成片；本页面不直接发布。

## 目标用户

内容运营创建；企业负责人审核事实；视频人员调整分镜；审核人确认首帧。

## 用户流程

选择选题/输入目标 → 选平台/时长/风格 → 生成脚本 → 编辑确认 → 生成分镜首帧 → 编辑确认 → 创建AI视频或数字人任务。

## 功能规则

脚本确认后才生成首帧；首帧确认后才允许高成本视频。任何脚本、产品、价格、Logo或场景修改使下游确认失效。事实只能来自正式知识。

## 异常与边界

事实缺失留空；脚本Schema失败可重试；单镜首帧失败可单独重试；素材授权不明阻止确认；预算超限阻止进入成片。

## 字段交互 / 取值

### 选题/目标
选择已有topic或文本输入。字段键：`topic_id/goal`。二选一必填；文本5–300字。

### 目标平台
多选。字段键：`platforms`。douyin/xiaohongshu/video_channel等；至少1项，仅用于适配，不选择账号。

### 视频时长
单选。字段键：`target_duration`。15/30/60秒或自定义5–180秒；默认30秒。

### 风格/出镜方式
下拉。字段键：`tone/presentation_type`。口播/混剪/产品讲解/剧情；数字人方式联动要求授权形象和声音。

### 脚本字段
标题、钩子、逐段口播、CTA、事实引用、风险。字段键：`script.*`；逐段可编辑并自动保存。

### 确认脚本
审核按钮；显示事实、价格、承诺和合规检查。通过冻结script_version。

### 分镜字段
每镜含序号、时长、画面、口播、产品/素材引用、首帧、状态。字段键：`shots[]`；总时长误差≤1秒。

### 重生成/替换首帧
只影响当前镜；保留旧版本；授权素材可上传替换。

### 确认分镜
所有必需首帧ready且授权通过时可用；冻结storyboard_version。

### 创建成片任务
选择AI视频或数字人；提交前显示成本预估，不发布到平台。

## 状态与权限

`draft → script_generating → script_review → storyboard_generating → storyboard_review → ready_for_render | failed`。运营编辑；事实审核/首帧确认按权限；确认动作审计。

## 数据与接口

对象：`short_video_project`、`script_version`、`storyboard_version`、`shot`、`frame_asset`。接口：创建、生成脚本、确认脚本、生成分镜、单镜重试、确认分镜、创建render任务。错误码：`FACT_GAP`、`SCRIPT_NOT_CONFIRMED`、`FRAME_NOT_CONFIRMED`、`ASSET_UNAUTHORIZED`、`BUDGET_EXCEEDED`。

## Skill / Prompt

```text
你是企业短视频编导。基于confirmed_facts、topic、platforms、duration、tone输出hook、script_segments、shots。每镜含duration、voiceover、visual_prompt、product_refs、source_refs、risk_flags。不得编造硬事实；首帧提示词禁止文字、Logo、水印和业务数字。
```

## 埋点事件

`short_video_created`、`script_generated/confirmed`、`storyboard_generated/confirmed`、`frame_retried`、`render_task_created`。

## 验收标准

未确认脚本不能生成分镜；未确认首帧不能创建成片；单镜失败可重试；修改上游使下游确认失效；无发布账号字段。

## 核心指标

脚本可用率、首帧确认率上线后建立基线；两级门禁绕过次数0；单镜重试不重复生成成功镜头率100%。
