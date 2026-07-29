---
description: "管理 Schema 导入导出、版本迁移、草稿发布与生产只读运行时的宿主边界。"
---

# 生命周期与运行时

把 Schema 看成编辑器和业务服务之间的页面快照。编辑器负责产生和校验快照；你的服务负责版本、审核、发布、权限和生产运行时。

## 用导出和导入交换快照

保存时调用 `designer.engine.exportSchema()`，加载时在当前物料和容器注册完成后调用 `designer.engine.importSchema(schema)`。活动页的仓储契约用 revision 表示乐观锁：

`src/host/page-repository.ts`：

<<< ../../../examples/guide-project/src/host/page-repository.ts

编辑历史只服务当前浏览器会话。草稿、发布版本、审核记录、乐观锁和权限必须由服务端维护。

## 将版本演进写成显式迁移

当你修改持久化 `type`、props 形状、容器 variant 或 region 约束时，不能只发布新的前端组件。为旧 Schema 保留可识别的 `version`，在导入或服务端发布流程中迁移到当前结构，并对无法迁移的数据返回可观测错误。

迁移前后都要验证物料白名单、容器定义和资源引用。未识别物料不能静默丢失；选择明确阻断、替代组件或可审计的降级策略。

## 在业务运行时只读渲染

生产页面使用自己的运行时组件，而不是编辑 Renderer：

`src/runtime/RuntimePage.ts`：

<<< ../../../examples/guide-project/src/runtime/RuntimePage.ts

容器运行时组件接收预先递归生成的 `regions`，不依赖编辑器的容器上下文：

`src/runtime/RuntimeColumnContainer.ts`：

<<< ../../../examples/guide-project/src/runtime/RuntimeColumnContainer.ts

不要把 `RootRenderer`、`ContainerRegionOutlet`、`useContainerRuntime()` 或 `DcDesigner` 带到生产页面。它们是编辑态协议，包含选择、拖放或属性配置行为。

## 服务端最低校验

- 页面归属和调用者权限。
- `schema.version`、允许的 `node.type` 和 props 形状。
- 资源 ID、URL、租户归属和访问权限。
- 容器 variant、region 归属和容量约束。
- 发布状态与 revision，避免旧会话覆盖新草稿。

**完成检查**：保存使用 revision 拒绝旧版本；加载先通过当前注册表校验；生产运行时不导入编辑器组件。

下一步：按需查阅 [API 参考](/reference/overview)，相关入口见 [Schema 与命令](/reference/designer-schema)。Schema 快照与导入边界见 [Architecture Map 的 Schema 模型](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/02-schema-and-core.md#schema-模型)。
