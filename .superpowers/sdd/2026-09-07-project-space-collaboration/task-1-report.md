# Task 1 实施报告：项目关系与两阶段授权

## RED / GREEN 证据

先将测试收紧为检查实际 `AI_HUOKE_PERMISSION_MODULES` 声明块及 `role.dataScope` 契约，运行：

```bash
node --test --test-reporter=spec --test-name-pattern='work hub project actions|project access and material ACL' prototype/tests/ai-huoke-system-management.test.mjs prototype/tests/enterprise-work-hub.test.mjs
```

RED：2 tests failed；RBAC 声明块没有 `workhub`，页面没有 `role.dataScope`。

实现后运行：

```bash
node --test --test-reporter=spec prototype/tests/enterprise-work-hub.test.mjs prototype/tests/ai-huoke-system-management.test.mjs
git diff --check
```

GREEN：29 tests passed, 0 failed；`git diff --check` 无输出且退出码为 0。

## 改动

- 将工作中枢正式加入系统权限模块与各角色 grant；角色使用 `all`、`team_self`、`self` 数据范围。
- 账号与系统成员建立稳定 `tenantId` / `accountId` 映射；新增成员沿用当前租户并生成独立账号 ID。
- 项目、任务、会议补齐租户关系；项目补充创建者、负责人、成员、更新时间与 AI 洞察；项目关联任务补充 due 值。
- 建立项目成员和六条材料 ACL fixture，支持 `project`、`selected_members`、`private` 三种材料可见性。
- 实现当前账号角色并集、数据范围排序、项目访问、材料访问和可见材料查询；工作项访问同时校验租户、私有所有者、选定成员和项目关系。
- 权限编辑器使用稳定枚举值渲染并在保存时 round-trip `role.dataScope`。
- 删除了位于文档闭合标签外的无效 `PROJECT_AUTHORIZATION_CONTRACT` 文本。
- 修正 RBAC 测试，断言实际权限注册表声明块，而非整份 HTML。

## 自检与顾虑

- 真源仍为 `prototype/index.html`，所有能力为本地原型演示数据，未接真实服务。
- 本轮验证覆盖两套完整相关 Node 测试和脚本语法解析；未执行浏览器验收（本任务要求的相关测试范围未要求浏览器）。
- 部分历史会议/任务 fixture 通过初始化阶段统一补 tenant/due 字段，而不是重复改写长对象字面量；运行时行为与租户边界一致。
