---
description: "管理 Schema 导入导出、版本迁移、草稿发布与生产只读运行时的宿主边界。"
---

# 生命周期与运行时

当编辑能力需要接入草稿、发布或线上页面时，把 Schema 看成编辑器和业务服务之间的页面快照。保存时使用 `exportSchema()`；加载时先注册物料，再调用 `engine.importSchema()`，让当前注册表验证节点和容器。

贯穿示例的仓储契约提供 revision：

<<< ../../../examples/guide-project/src/host/page-repository.ts#tutorial-page-repository

编辑历史只服务当前浏览器会话。草稿、发布版本、审核记录、乐观锁和权限必须由服务端维护。

生产页面使用自己的运行时组件，而不是编辑 Renderer：

<<< ../../../examples/guide-project/src/runtime/RuntimePage.ts#tutorial-runtime-renderer

容器运行时组件接收预先递归生成的 `regions`，不依赖编辑器的容器上下文：

<<< ../../../examples/guide-project/src/runtime/RuntimeColumnContainer.ts#tutorial-runtime-container

| 框架负责 | 宿主负责 |
| --- | --- |
| 快照导入导出、迁移注册、命令校验与编辑历史 | 数据库存储、版本冲突、发布、审核、资源安全与跨端渲染 |

服务端至少校验 `node.type`、props、资源 URL、页面归属、容器变体和 region 约束。未识别物料必须有可观测的降级或阻断策略，不能静默丢失内容。

**完成检查**：保存使用 revision 拒绝旧版本；加载先通过当前注册表校验；生产运行时不导入 `RootRenderer`、`ContainerRegionOutlet` 或编辑器容器组件。

下一步：按需查阅 [API 参考](/reference/overview)，相关入口见 [Designer Schema 与命令](/reference/designer-schema)。
