---
description: "在已完成的活动页上添加稳定的业务物料、行为约束和物料栏展示信息。"
---

# 业务物料

当页面需要新的业务组件时，一个普通物料需要同时声明编辑协议和实际 Vue 组件。完成入门课程中的公告物料后，可以按同一结构添加卡片、轮播或业务区块。

## 从一份完整定义开始

`src/domain/widgets/notice.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/notice.ts

`defaultProps` 是创建节点时复制的初始值，不能代替对旧 Schema 的默认值兼容。运行时组件仍应为每个 prop 定义安全默认值，这样导入较早草稿时不会因为字段缺失而崩溃。

`creatable`、`selectable`、`draggable`、`sortable`、`deletable` 和 `mask` 可以写成布尔值或 predicate。把规则放在 metadata，物料栏、画布和结构树才会得到同一套判断。

## 同时注册 metadata 和组件映射

`src/domain/widgets/index.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/index.ts

`getWidgetMetas()` 交给 Core 注册表，`buildComponentMap()` 交给 Renderer 解析 Vue 组件。两者都必须包含同一个 `type`；只注册其中之一会分别导致“不能创建”或“节点不能渲染”。

## 先设计保存的标识，再写组件

`type` 是持久化标识。改名需要 Schema migration 和服务端兼容策略，不能只改 Vue 组件名称。发布前至少决定以下内容：

- `type` 是否能长期保留，以及怎样识别旧类型。
- 哪些 props 必须保存，哪些可以由运行时默认。
- 资源 ID 或 URL 是否要在服务端校验。
- 组件是否需要承载其他节点；需要时使用容器协议，而不是普通 `children`。

由页面模板、Schema import 或 migration 提供，而不能由设计者创建的物料，改用 `authoring: 'schema-managed'`。完整能力矩阵见 [动作与业务策略](/guide/customization/actions-and-policies#schema-托管物料)。

**完成检查**：新 `type` 出现在物料栏，拖入后按默认 props 渲染，且右侧只显示该物料声明的字段。

下一步：[表单与字段](/guide/customization/forms-and-fields)；公开类型见 [@dragcraft/designer](/reference/designer)，物料协议的完整分层见 [Architecture Map 的物料协议包](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/05-widgets-fields-and-utils.md#物料协议包)。
