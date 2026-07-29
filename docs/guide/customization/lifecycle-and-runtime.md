---
description: "管理 Schema migration、草稿修订、发布校验和独立生产运行时。"
---

# 迁移、草稿与生产运行时

页面生命周期跨越编辑器、服务端和目标平台。DragCraft 负责交换和校验 Schema 快照，宿主负责记录、发布、授权和最终渲染。

## 按顺序加载页面

加载现有页面时遵循以下顺序：

1. 创建 Designer 和空 Engine。
2. 注册当前业务物料、容器、字段和组件。
3. 注册从旧 Schema 到当前 Schema 的 migration 链。
4. 从仓储加载页面记录。
5. 调用 `importSchema()`，处理 diagnostics。

贯穿项目的 migration 是一个纯转换：

<<< ../../../examples/guide-project/src/editor/schema-migrations.ts

Migration 不请求网络、不读取编辑器交互状态，也不静默删除无法识别的节点。每个步骤接收旧 Schema 并返回带目标 `version` 的完整 Schema。

## 保存草稿和发布版本

示例仓储使用 `revision` 拒绝过期保存：

<<< ../../../examples/guide-project/src/host/page-repository.ts

真实服务至少应保存：页面 ID、当前修订号、Schema、作者和更新时间。发布记录还需要不可变的发布快照、审核状态和回滚来源。

服务端必须重新校验：

- 页面归属和调用者权限。
- `node.type` 与允许的运行时组件。
- props、资源 URL 和业务字段。
- 容器 variant、region、容量和所有权。
- Schema version 与 migration 可达性。

编辑历史只服务当前浏览器会话，不能替代草稿修订、审核记录或发布版本。

## 建立运行时注册表

生产运行时不复用设计态组件树。Vue 参考实现使用判别联合区分普通物料和容器物料：

<<< ../../../examples/guide-project/src/runtime/registry.ts

注册表同时携带 `defaultLayout`，因为实例 Schema 只保存覆盖值。运行时注册表必须和发布服务的物料白名单一起演进。

## 渲染节点和页面 surface

`RuntimePage` 处理普通节点、容器递归、三种样式作用域和未知物料 fallback：

<<< ../../../examples/guide-project/src/runtime/RuntimePage.ts

未知 `type` 或容器能力不匹配时，默认 fallback 显示节点 ID 和 type。生产产品可以替换 fallback，但必须记录可观测错误；静默返回 `null` 会隐藏内容损失。

容器运行时只接收节点、variant 和递归 regions：

<<< ../../../examples/guide-project/src/runtime/RuntimeColumnContainer.ts

它不依赖 `ContainerRegionOutlet` 或编辑器注入上下文。小程序运行时可以使用同一份 region 数据，改为目标平台组件和样式系统。

## 解释布局而不是复制 Renderer

Vue 参考运行时实现自己的 `flow/chrome/layer` 投影和固定 inset。它只覆盖应用声明支持的 Schema 契约，不导入内部 Core layout helper。

当业务扩展新的 placement、样式字段或容器 variant 时，应同时更新：

- Designer 物料 metadata 和预览组件。
- 服务端白名单与发布校验。
- 每个目标平台的运行时注册表和解释器。
- migration、fallback 和契约测试。

## 发布前验证

- 旧 Schema 可以迁移到当前协议，并通过当前注册表校验。
- 过期 revision 保存被拒绝，不覆盖新草稿。
- 未知物料产生明确 fallback 或阻断发布。
- 设计态与生产运行时对 props、style、layout 和 regions 的解释一致。
- 生产 bundle 不导入 `RootRenderer`、`ContainerRegionOutlet` 或 Device Frame。

Schema 结构见 [Schema 与样式作用域](/guide/fundamentals/schema)，布局契约见 [布局投影](/guide/fundamentals/layout-system)。
