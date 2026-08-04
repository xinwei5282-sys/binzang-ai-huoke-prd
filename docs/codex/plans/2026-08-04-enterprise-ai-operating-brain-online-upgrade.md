# Enterprise AI Operating Brain Online Upgrade Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (- [ ]) syntax for tracking.

**Goal:** 在不重建现有线上系统的前提下，将“增长云台”升级为通用的“企业 AI 经营大脑”，补齐企业建档、品牌与经营成果、营销物料、AI 获客、爆款情报、真实 AI 视频和成果中心，并用行业包与客户配置承载格优殡葬大客户定制。

**Architecture:** 以 `/Users/xinwei/weiran-env/projects/merchant-ui` 为线上前端真源，保留现有身份、知识、内容、爆款、数字人、作品和用量契约；先用版本化 API 合同冻结新增领域对象，再由线上云端服务实现租户配置、任务、产物和 Provider 编排。本地文件执行器只领取最小必要任务，生成真实 DOCX/PPTX/PDF/PNG/MP4 后回传成果与质检报告。`prototype/index.html` 只作为样式和交互参考，不成为第二套运行时。

**Tech Stack:** Vue 3、TypeScript、Vite、Pinia、Vue Router、Axios、Node.js test runner、JSON Schema、现有 `/api/merchant/*` 服务、Codex 本地执行器、PPTX/DOCX/PDF/PNG 文件工具链、FFmpeg/视频 Provider。

---

## 文件责任图

### 产品真源仓库

根目录：`/Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品`

- Modify: `README.md` — 通用产品定位、真源关系、实现状态分级和工程入口。
- Create: `prd/PRD_企业AI经营大脑_通用1.0.md` — 1.0 总 PRD、角色、链路、范围、状态和验收。
- Create: `prd/迁移矩阵_殡葬V1到通用1.0.md` — 旧能力到通用模块、行业包或二期的唯一映射。
- Modify: `prd/PRD索引.md` — 将通用 1.0 设为当前总入口，历史殡葬规划降级为来源文档。
- Modify: `产品说明/AI获客产品说明-2026-07-24.md` — 产品名称、边界、线上基线和能力状态。
- Create: `contracts/enterprise-profile.v1.schema.json` — 企业档案、来源、确认状态和行业扩展字段。
- Create: `contracts/customer-pack.v1.schema.json` — 行业包、大客户包、组织、模板与审核策略。
- Create: `contracts/artifact-task.v1.schema.json` — 文件生成任务、状态、版本、额度与失败阶段。
- Create: `contracts/artifact-manifest.v1.schema.json` — 源文件、预览、检查报告、知识依据与版本清单。
- Create: `contracts/video-task.v1.schema.json` — 脚本、分镜、首帧、镜头、混剪、质检和交付状态。
- Create: `contracts/examples/*.json` — 通用企业与格优配置、报告任务、PPT 任务和视频任务合法样例。
- Create: `scripts/validate-product-contracts.mjs` — 无第三方依赖的 Schema/样例结构门禁。

### 线上商家端仓库

根目录：`/Users/xinwei/weiran-env/projects/merchant-ui`

- Modify: `src/router.ts` — 新主导航对应路由与兼容跳转。
- Modify: `src/components/AppShell.vue` — 八个客户级入口、权限和模块开关。
- Modify: `src/styles.css` — 从原型迁入的 Token、页面骨架、响应式和状态样式。
- Modify: `src/types.ts` — 企业档案、配置包、经营成果、任务状态和版本类型。
- Create: `src/api/enterprise.ts` — 企业档案、公开信息候选和人工确认接口。
- Create: `src/api/artifacts.ts` — 品牌报告、经营计划、PPT、海报、图文和成果版本接口。
- Create: `src/api/operating.ts` — 获客计划、结果回填和周期复盘接口。
- Create: `src/config/productCapabilities.ts` — 通用模块、行业包和客户配置的前端解析。
- Create: `src/views/EnterpriseProfileView.vue` — 首次建档与事实确认。
- Create: `src/views/BrandPlanningView.vue` — 品牌报告与经营计划入口。
- Create: `src/views/MarketingMaterialsView.vue` — PPT、海报、公众号和朋友圈任务入口。
- Create: `src/views/AcquisitionView.vue` — 获客计划、趋势、内容和视频任务聚合入口。
- Modify: `src/views/HotView.vue` — 数据来源、基线、拆解版本和生成入口。
- Modify: `src/views/ContentView.vue` — 保留真实脚本、分镜、首帧和 AI 视频状态。
- Modify: `src/views/DigitalHumanView.vue` — 下沉为 AI 视频生产方式，保留授权管理。
- Modify: `src/views/WorksView.vue` — 升级为跨文件、图片、图文和视频的成果中心。
- Modify: `src/views/WorkbenchView.vue` — 首次成果链路、经营摘要、待审核和异常任务。
- Create: `scripts/enterprise_product_contract_test.mjs` — 定位、导航、路由和客户配置契约。
- Create: `scripts/artifact_center_contract_test.mjs` — 任务状态、版本、下载和失败态契约。
- Create: `scripts/acquisition_video_contract_test.mjs` — 爆款到视频成片的两道确认与失败镜头重试契约。
- Create: `scripts/capture_enterprise_product.mjs` — 桌面和移动端关键页截图、溢出和控制台检查。

### 线上后端与本地执行器

本机当前未发现 README 中所述 `client-boot` 服务端仓库。取得部署对应源码并核对分支前，不创建替代后端、不向生产接口写入。后端文件责任必须在 Task 4 的仓库门禁中由实际模块路径生成并提交到该后端仓库内的 `docs/architecture/enterprise-ai-operating-brain.md`；本计划不虚构未知包名。

---

## 全程状态与证据规则

- “已有接口契约”不等于“真实 Provider 已跑通”。
- “测试通过”与“真实渲染通过”分别报告。
- 线上验证只使用授权测试租户；无账号时只做 401、静态资源和无写入检查。
- 任何外发、发布、报价、企业事实确认和高成本生成都保留人工确认。
- 每个任务只提交列出的文件；执行前后运行 `git status --short`，不带入用户的无关改动。

### Task 1: 收口通用产品文档真源

**Files:**
- Create: `prd/PRD_企业AI经营大脑_通用1.0.md`
- Create: `prd/迁移矩阵_殡葬V1到通用1.0.md`
- Modify: `README.md`
- Modify: `prd/PRD索引.md`
- Modify: `产品说明/AI获客产品说明-2026-07-24.md`

- [ ] **Step 1: 写文档契约测试并确认失败**

在 `scripts/validate-product-contracts.mjs` 先加入文档断言：当前总 PRD 必须同时包含“企业 AI 经营大脑”“AI 获客是模块”“殡葬行业配置包”“格优大客户配置”“月度、季度、年度和自定义周期”；README 与索引必须指向该 PRD；旧的 `产品规划-殡葬V1.md` 不得再声明自己是全局真源。

Run:

```bash
cd /Users/xinwei/weiran-env/knowledge-hub/10-项目/AI获客产品
node scripts/validate-product-contracts.mjs
```

Expected: FAIL，原因是通用 1.0 PRD 和迁移矩阵尚不存在。

- [ ] **Step 2: 编写通用 1.0 PRD**

PRD 固定包含：定位、用户、首次建档链路、1.0 能力、二期边界、导航、通用底座/标准模块/行业包/大客户配置四层模型、任务状态、人工确认点、用量、验收和状态证据。经营计划周期使用枚举 `monthly | quarterly | annual | custom`，格优配置默认 `custom: 90 days`，产品主文案不再固定叫“90 天经营计划书”。

- [ ] **Step 3: 建立逐项迁移矩阵**

迁移矩阵每行必须有：旧文档、旧能力、目标模块、处理方式、1.0 状态、实现证据、客户配置归属。将数字人归入 AI 视频生产方式，将 AI 销售/CRM 归入二期，将本地 Codex 和 Provider 参数归入内部执行能力。

- [ ] **Step 4: 更新入口文档并运行门禁**

Run:

```bash
node scripts/validate-product-contracts.mjs
rg -n "全局真源|默认.*90 天|殡葬 AI 获客产品" README.md prd/PRD索引.md 产品说明/AI获客产品说明-2026-07-24.md prd/PRD_企业AI经营大脑_通用1.0.md
git diff --check
```

Expected: 合同测试 PASS；搜索结果只出现在历史说明或明确否定语境；无空白错误。

- [ ] **Step 5: 提交文档真源**

```bash
git add README.md prd/PRD索引.md 产品说明/AI获客产品说明-2026-07-24.md prd/PRD_企业AI经营大脑_通用1.0.md prd/迁移矩阵_殡葬V1到通用1.0.md scripts/validate-product-contracts.mjs
git diff --cached --check
git commit -m "docs: establish enterprise AI operating brain source of truth"
```

### Task 2: 冻结跨端领域合同

**Files:**
- Create: `contracts/enterprise-profile.v1.schema.json`
- Create: `contracts/customer-pack.v1.schema.json`
- Create: `contracts/artifact-task.v1.schema.json`
- Create: `contracts/artifact-manifest.v1.schema.json`
- Create: `contracts/video-task.v1.schema.json`
- Create: `contracts/examples/*.json`
- Modify: `scripts/validate-product-contracts.mjs`

- [ ] **Step 1: 先写失败的样例验证**

验证脚本必须检查：所有合同含 `$id`、`schemaVersion`、必填字段和枚举；所有样例引用存在的合同；格优差异只能位于 `industryPack` 或 `customerPack`；任务状态必须覆盖 `queued | waiting_executor | running | review_required | completed | failed | cancelled`。

Expected: FAIL，原因是五份合同尚不存在。

- [ ] **Step 2: 定义企业档案与配置包**

企业事实统一携带 `value`、`sourceType`、`sourceRef`、`verificationStatus`、`verifiedBy`、`verifiedAt`。客户配置使用 `baseModules`、`industryPack`、`customerPack` 三段合并，禁止在通用字段中出现 `funeral`、`geyou` 或门店专属硬编码。

- [ ] **Step 3: 定义成果与视频任务**

成果任务固定携带企业、操作者、知识版本、模板版本、周期、格式、用途、额度预算、审核要求和失败阶段；Manifest 区分可编辑源文件、预览、缩略图、检查报告。视频任务明确脚本确认和分镜确认两个门禁，镜头可独立失败与重试。

- [ ] **Step 4: 加入通用与格优合法样例及非法样例**

合法样例至少覆盖普通零售企业季度经营计划、格优 90 天试点 PPT、朋友圈内容包、爆款拆解到 AI 视频；非法样例覆盖未经确认的公开事实、未授权数字人、跳过分镜确认、完成任务缺少质检报告。

- [ ] **Step 5: 运行并提交**

```bash
node scripts/validate-product-contracts.mjs
node scripts/validate-product-contracts.mjs --reject-placeholders
git diff --check
git add contracts scripts/validate-product-contracts.mjs
git commit -m "docs: define enterprise operating task contracts"
```

Expected: 验证 PASS；占位符搜索无结果。

### Task 3: 建立线上前端通用产品骨架

**Files:**
- Modify: `src/router.ts`
- Modify: `src/components/AppShell.vue`
- Modify: `src/styles.css`
- Create: `src/config/productCapabilities.ts`
- Create: `scripts/enterprise_product_contract_test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 写导航与路由失败测试**

测试断言八个客户入口：`首页、企业档案、品牌与经营、营销物料、AI 获客、成果中心、企业知识、设置`；不在主导航显示“提示词管理”“数字人”“本地 Codex”“Agent 中心”。旧 `/hot`、`/content`、`/digital-human`、`/works` 路由必须继续可访问或兼容跳转。

Run:

```bash
cd /Users/xinwei/weiran-env/projects/merchant-ui
node scripts/enterprise_product_contract_test.mjs
```

Expected: FAIL，缺少新导航和配置解析器。

- [ ] **Step 2: 实现能力配置解析器**

定义通用模块键、行业包键、客户包键和 `enabled/required/reviewPolicy/defaultTemplate`。合并顺序固定为平台默认值 → 行业包 → 客户包；客户包不能删除底层审计、权限、版本和人工确认规则。

- [ ] **Step 3: 收敛壳层和兼容路由**

新入口指向新的聚合页；旧页面作为子流程继续工作。提示词管理仅管理员通过设置页进入；数字人由 AI 视频流程进入；已有接口调用、字段和 Pinia 会话保持不变。

- [ ] **Step 4: 迁入公共视觉语言**

只迁入 `prototype/index.html` 的已确认 Token、导航密度、页头、面板、表格、状态和响应式规则；不复制演示数据、计时器或“设备在线”等假状态。

- [ ] **Step 5: 验证并提交**

```bash
node scripts/enterprise_product_contract_test.mjs
pnpm test:runtime
pnpm test:ui
pnpm typecheck
pnpm build
git diff --check
git add package.json src/router.ts src/components/AppShell.vue src/styles.css src/config/productCapabilities.ts scripts/enterprise_product_contract_test.mjs
git commit -m "feat: establish enterprise operating brain shell"
```

Expected: 所有命令 PASS，构建产出 `dist/`，旧内容与爆款入口仍可达。

### Task 4: 获取并核准线上后端实施基线

**Files:**
- Create in actual backend repo: `docs/architecture/enterprise-ai-operating-brain.md`
- Modify in product repo: `prd/PRD_企业AI经营大脑_通用1.0.md`

- [ ] **Step 1: 只读核对部署对应仓库**

取得 `client-boot` 实际仓库地址和只读权限后，核对当前生产 commit、启动模块、数据库迁移目录、鉴权中间件、对象存储、队列、回调、用量扣减和 `/api/merchant/*` Controller。若任一项无法映射，停止后端实施并记录为“缺少部署源码证据”，不得新建替代服务。

- [ ] **Step 2: 运行现有后端测试基线**

使用该仓库 README 声明的测试命令，不猜测 Maven、Gradle 或其他栈。Expected: 现有测试 PASS；若失败，保存原始失败日志并先区分基线问题与本次计划。

- [ ] **Step 3: 生成实际文件责任图**

在后端仓库的架构文档中列出实际路径：企业档案 Controller/Service/Repository/迁移、配置包解析、成果任务、执行器租约、对象存储、Provider 适配、用量和审计；每项附现有复用点和新增点。

- [ ] **Step 4: 回写已验证基线**

只把能够由源码、测试或授权账号证明的能力更新为“已实现”；接口声明仍保持“已有契约”。

- [ ] **Step 5: 独立提交基线文档**

在后端仓库只提交架构基线文档；在产品仓库只提交 PRD 状态更新，不混合业务代码。

### Task 5: 实现企业建档与公开信息确认前端

**Files:**
- Modify: `src/types.ts`
- Create: `src/api/enterprise.ts`
- Create: `src/views/EnterpriseProfileView.vue`
- Modify: `src/router.ts`
- Modify: `src/views/WorkbenchView.vue`
- Modify: `scripts/enterprise_product_contract_test.mjs`

- [ ] **Step 1: 写失败契约**

断言首次登录缺少已确认档案时跳转 `/enterprise-profile`；公开信息只能进入“候选”区；用户可确认、纠错、拒绝并查看来源；加载、空态、失败和保存中状态均存在。

- [ ] **Step 2: 增加严格类型与 API 封装**

前端只调用版本化企业档案端点；候选信息与正式事实使用不同类型，禁止通过类型断言把候选直接写成正式事实。

- [ ] **Step 3: 实现建档页面和首次使用门禁**

最小字段包括企业名称、主营业务、产品/服务、目标客户、经营目标、品牌语气和素材授权。行业扩展字段从配置包渲染；格优门店字段只在对应客户包启用。

- [ ] **Step 4: 验证真实状态**

```bash
node scripts/enterprise_product_contract_test.mjs
pnpm typecheck
pnpm build
```

Expected: PASS；API 401、空候选、部分候选、保存失败和成功确认均有用户可理解反馈。

- [ ] **Step 5: 提交**

```bash
git add src/types.ts src/api/enterprise.ts src/views/EnterpriseProfileView.vue src/router.ts src/views/WorkbenchView.vue scripts/enterprise_product_contract_test.mjs
git commit -m "feat: add verified enterprise onboarding"
```

### Task 6: 实现品牌、经营和营销成果任务前端

**Files:**
- Create: `src/api/artifacts.ts`
- Create: `src/views/BrandPlanningView.vue`
- Create: `src/views/MarketingMaterialsView.vue`
- Modify: `src/views/WorksView.vue`
- Create: `scripts/artifact_center_contract_test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 写成果中心失败测试**

断言支持 `brand_report | operating_plan | presentation | poster | wechat_article | moments_pack | video`；经营周期不固定为 90 天；任务状态区分等待执行器、执行、待审核、失败和完成；成果显示版本、知识依据、源文件、预览、检查报告和重新生成。

- [ ] **Step 2: 实现任务表单**

品牌与经营页生成报告和经营计划；营销物料页生成 PPT、海报、公众号和朋友圈包。高成本任务提交前显示预计用量并要求确认，失败后显示失败阶段而非统一“生成失败”。

- [ ] **Step 3: 将作品库升级为成果中心**

复用现有作品查询、导出、合规和效果回填，增加文件类成果筛选与版本侧栏。完成状态必须来自服务端 Manifest，不用定时器伪造。

- [ ] **Step 4: 验证并提交**

```bash
node scripts/artifact_center_contract_test.mjs
pnpm test:content
pnpm typecheck
pnpm build
git diff --check
git add package.json src/api/artifacts.ts src/views/BrandPlanningView.vue src/views/MarketingMaterialsView.vue src/views/WorksView.vue scripts/artifact_center_contract_test.mjs
git commit -m "feat: add business artifact task center"
```

### Task 7: 收口爆款到内容的真实链路

**Files:**
- Modify: `src/types.ts`
- Modify: `src/api/burst.ts`
- Modify: `src/views/HotView.vue`
- Modify: `src/views/AcquisitionView.vue`
- Create: `scripts/acquisition_video_contract_test.mjs`

- [ ] **Step 1: 写来源与基线失败测试**

断言每条结果显示授权数据供应商、采集时间、原内容标识、账号/类目基线和爆款倍数；拆解显示版本、八个维度和可迁移公式；页面不得宣称自爬实时全网数据。

- [ ] **Step 2: 扩展类型与降级表达**

在兼容现有字段的前提下增加 `capturedAt`、`baselineType`、`baselineValue`、`dissectionVersion` 和 `dimensions`。服务不可用时展示历史批次和人工导入入口，不生成虚假热度。

- [ ] **Step 3: 串联 AI 获客聚合页**

聚合页展示获客目标、周计划、爆款情报、内容任务、视频任务和结果复盘；点击“按此公式创作”继续复用现有草稿与生成接口。

- [ ] **Step 4: 验证并提交**

```bash
node scripts/acquisition_video_contract_test.mjs
pnpm test:hot
pnpm test:content
pnpm typecheck
pnpm build
git add src/types.ts src/api/burst.ts src/views/HotView.vue src/views/AcquisitionView.vue scripts/acquisition_video_contract_test.mjs
git commit -m "feat: connect traceable trends to acquisition"
```

### Task 8: 跑通 AI 视频两道确认和真实成片状态

**Files:**
- Modify: `src/types.ts`
- Modify: `src/api/content.ts`
- Modify: `src/views/ContentView.vue`
- Modify: `src/views/DigitalHumanView.vue`
- Modify: `src/views/WorksView.vue`
- Modify: `scripts/acquisition_video_contract_test.mjs`

- [ ] **Step 1: 补齐失败契约**

断言顺序固定为“确认脚本 → 生成/匹配首帧 → 确认分镜 → 生成缺失镜头 → 混剪质检 → MP4”；脚本或分镜未确认时不能提交高成本视频；失败镜头可单独重做；数字人必须显示授权状态。

- [ ] **Step 2: 复用现有 API 状态机**

以现有 `confirm-script`、`first-frame`、`shots/confirm`、`ai-video`、`shots/{shotNo}/regenerate` 接口为主，不另建重复前端流程。为每个阶段补齐排队、运行、失败、重试和费用提示。

- [ ] **Step 3: 下沉数字人入口**

主导航移除数字人，但视频任务可选择已授权形象与声音；形象训练和声音复刻仍进入现有数字人管理页。无授权素材时阻止提交并给出明确修复入口。

- [ ] **Step 4: 增加成片验收显示**

成果中心显示 MP4、封面、字幕、发布文案和质检项：可播放、分辨率、时长、音画同步、黑帧、缺失片段、字幕溢出和 AI 标识。

- [ ] **Step 5: 验证并提交**

```bash
node scripts/acquisition_video_contract_test.mjs
pnpm test:content
pnpm test:digital-human
pnpm typecheck
pnpm build
git add src/types.ts src/api/content.ts src/views/ContentView.vue src/views/DigitalHumanView.vue src/views/WorksView.vue scripts/acquisition_video_contract_test.mjs
git commit -m "feat: enforce review gates for AI video delivery"
```

### Task 9: 实现云端任务与本地执行器最小闭环

**Files:**
- Modify in actual backend repo: Task 4 实际文件责任图列出的成果任务、租约、存储、用量和审计文件。
- Create in approved local executor repo: `src/protocol/`、`src/runner/`、`src/renderers/`、`src/quality/`、`tests/`。
- Test: `contracts/artifact-task.v1.schema.json`
- Test: `contracts/artifact-manifest.v1.schema.json`

- [ ] **Step 1: 后端先写失败的集成测试**

覆盖：创建任务、权限与额度校验、等待执行器、原子领取、租约续期、超时回收、取消、分阶段重试、Manifest 回传、旧版本保留、未授权知识拒绝。Expected: 新端点测试 FAIL，现有测试保持 PASS。

- [ ] **Step 2: 实现云端任务状态机**

服务端以数据库状态和租约为真源；任务完成必须同时存在源文件、预览和检查报告；额度只在成功领取或明确的 Provider 消耗点扣减，并具备幂等键。

- [ ] **Step 3: 建立经过批准的本地执行器仓库**

执行器仓库位置和权限由用户确认后创建；不得把执行器塞进 `merchant-ui`。执行器只接受签名任务、写入独立临时目录、调用本机 Codex 和已批准工具、上传结果后按保留策略清理。

- [ ] **Step 4: 先跑 DOCX/PDF 最小闭环**

用非敏感测试企业生成品牌报告 DOCX，渲染 PDF，检查可打开、页数、空页、缺图、溢出和字体替换；上传两者和 JSON 检查报告。任何检查失败时任务保持 `failed` 或 `review_required`，不得标为完成。

- [ ] **Step 5: 依次扩展 PPTX、海报和图文包**

PPTX 必须产出 PDF 和逐页 PNG；海报必须保留可编辑配置记录；图文包必须包含标题、正文、配图和发布建议。每类先写失败测试再实现。

- [ ] **Step 6: 运行断线恢复与权限测试**

断开执行器后任务进入 `waiting_executor`；恢复后继续而不重复生成；跨企业领取返回 403；任务日志不得包含完整敏感知识正文。

- [ ] **Step 7: 分仓提交**

后端、执行器和合同更新分别提交；不把密钥、生产文件、客户原始资料或生成临时文件加入 Git。

### Task 10: 接入视频 Provider 与本地混剪质检

**Files:**
- Modify in actual backend repo: Task 4 映射出的 Provider 适配、回调、用量和视频任务文件。
- Modify in approved executor repo: `src/runner/`、`src/renderers/video/`、`src/quality/video/`、`tests/`。
- Test: `contracts/video-task.v1.schema.json`

- [ ] **Step 1: 写 Provider 合同测试**

统一适配层覆盖提交、查询、回调验签、取消、费用、原始供应商状态映射和幂等；用假 Provider 测试成功、超时、单镜头失败、回调重复和费用超限。

- [ ] **Step 2: 实现素材优先策略**

镜头按“授权企业素材 → 模板镜头 → 图片/i2v → 文生视频兜底”选择；只有缺失或重点镜头调用高成本生成。每个镜头记录来源、授权和 Provider 成本。

- [ ] **Step 3: 实现本地混剪**

下载已完成镜头，在独立任务目录完成拼接、字幕、配音、转场、音乐、封面和 AI 标识；生成 MP4、字幕文件、发布文案和质检 JSON。

- [ ] **Step 4: 实现可重试边界**

只重试失败镜头；连续失败后允许切换为企业素材、静态画面或人工处理；已确认脚本、分镜和已通过镜头不重做。

- [ ] **Step 5: 真实样片验收**

用授权测试素材生成一条短样片，逐项验证播放、音画同步、分辨率、黑帧、字幕安全区、缺失片段、AI 标识和成果中心下载。记录真实 Provider、耗时、费用和失败次数，不用模拟值冒充结果。

### Task 11: 配置格优大客户包并完成试点门禁

**Files:**
- Create: `contracts/examples/geyou-customer-pack.json`
- Create: `contracts/examples/geyou-90-day-pilot-task.json`
- Create: `validation/geyou-pilot-acceptance.md`
- Modify: `prd/PRD_企业AI经营大脑_通用1.0.md`

- [ ] **Step 1: 写配置隔离失败测试**

通用产品测试环境不得出现殡葬字段；格优租户启用后才显示总部/区域/门店、寿衣/殡仪场景、强制合规审核和 90 天试点模板。切换租户不能改变通用 Schema。

- [ ] **Step 2: 配置而非硬编码格优差异**

客户包包含组织、品牌模板、门店本地化字段、敏感词、风险等级、强制审核、专属报告目录和试点指标；所有条目保留版本和生效时间。

- [ ] **Step 3: 跑一套真实非生产演练**

在格优测试租户完成建档、品牌报告、90 天试点计划、PPT、海报/图文和一条 AI 视频；每项保留审核人、版本、源文件、预览、质检和用量记录。

- [ ] **Step 4: 启动真实门店前检查**

必须具备授权账号、资料授权、3–5 家种子门店名单、审核负责人、发布方式、线索来源字段、服务响应与验收标准。缺少任一项时只完成测试租户演练，不宣称客户试点已经开始。

### Task 12: 全量回归、真实渲染与灰度发布

**Files:**
- Create: `validation/enterprise-product/*.png`
- Create: `validation/enterprise-product/render-audit.json`
- Create: `validation/enterprise-product/api-e2e.md`
- Create: `validation/enterprise-product/release-checklist.md`
- Create: `scripts/capture_enterprise_product.mjs`

- [ ] **Step 1: 运行前端全量自动检查**

```bash
cd /Users/xinwei/weiran-env/projects/merchant-ui
pnpm test:content
pnpm test:digital-human
pnpm test:usage
pnpm test:workbench
pnpm test:hot
pnpm test:prompt
pnpm test:knowledge
pnpm test:members
pnpm test:runtime
pnpm test:ui
node scripts/enterprise_product_contract_test.mjs
node scripts/artifact_center_contract_test.mjs
node scripts/acquisition_video_contract_test.mjs
pnpm typecheck
pnpm build
```

Expected: 全部 PASS；任何失败必须保留命令与原始错误，不以其他测试通过抵消。

- [ ] **Step 2: 真实渲染关键页**

在 1440×900、1024×768、390×844 三种视口截图：首页、企业建档、品牌与经营、营销物料、AI 获客、爆款详情、脚本确认、分镜确认、视频任务、成果中心和格优配置态。检查横向溢出、遮挡、焦点、空态、错误态、长标题和控制台错误。

- [ ] **Step 3: 授权账号端到端验证**

记录每个接口的请求 ID、输入摘要、终态和产物：建档确认、品牌报告 DOCX/PDF、经营计划、PPTX/PDF/PNG、海报、图文包、爆款数据、拆解、AI 视频、下载、版本、重新生成、额度和审计。只有真实成功项可升级为“已端到端验证”。

- [ ] **Step 4: 安全与恢复演练**

验证跨租户 403、未授权知识拒绝、执行器断线恢复、Provider 超时、重复回调、费用上限、人工取消、文件损坏、发布前审核和日志脱敏。

- [ ] **Step 5: 灰度与回滚**

先对内部测试租户开启新导航，再对格优测试租户开启客户包；保留旧路由和功能开关一个发布周期。错误率、任务失败率、文件质检失败率或跨租户异常触发关闭新模块开关并回滚前端版本。

- [ ] **Step 6: 发布后证据收口**

发布清单分别列出：已设计、原型可演示、已部署/有接口契约、已端到端验证、已客户验收。没有客户签字或确认记录时，“已客户验收”保持为空。

---

## 里程碑与停止条件

1. **M1 产品真源完成：** Task 1–2 完成；名称、范围、配置层级和跨端合同唯一。
2. **M2 线上前端骨架完成：** Task 3、5–8 完成；构建、契约测试与真实渲染通过，但不自动宣称后端已实现。
3. **M3 真实成果闭环完成：** Task 4、9 完成；至少一份 DOCX/PDF 从云端任务到本地生成再回传成功。
4. **M4 爆款与 AI 视频完成：** Task 7、8、10 完成；授权数据可追溯，一条真实 MP4 通过质检。
5. **M5 格优试点可启动：** Task 11–12 的测试租户、权限、安全、回滚和验收资料全部通过。

遇到以下情况立即停止对应实施，不通过模拟绕过：未取得部署后端源码、无授权测试账号、无企业资料/肖像/声音授权、Provider 合同或算法合规未确认、无法区分生产与测试租户、真实文件或视频质检失败。

## 最终完成定义

- 通用企业与格优共用同一套代码和数据模型，差异来自版本化配置。
- 线上导航和首用链路符合通用产品定位，旧路由与真实 API 不被样式迁移破坏。
- 品牌报告、经营计划、PPT、海报、图文包和视频均有真实任务、版本、预览、下载、质检与用量记录。
- 爆款数据来源、基线、拆解和生成依据可追溯。
- AI 视频存在脚本与分镜确认，失败镜头可独立重试，真实 MP4 通过质量检查。
- 本地 Codex 只作为受控执行器，不在客户界面暴露，不持久化超出任务所需的客户资料。
- 自动测试、真实渲染、授权 API 端到端和客户验收分别出具证据，不互相替代。
