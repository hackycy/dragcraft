---
description: "定义稳定的业务物料标识、默认 props、编辑行为、组件映射和物料栏展示。"
---

# 业务物料

一个普通物料同时声明三件事：Schema 如何保存它、工作台如何编辑它、Vue 如何渲染它。公告物料的完整定义如下：

<<< ../../../examples/guide-project/src/domain/widgets/notice.ts

## 先确定稳定标识

`meta.type` 是持久化标识。Vue 组件名、文件名和物料标题可以重构，`type` 改名则需要服务端和 Schema migration 一起处理。

`defaultProps` 只参与创建新节点。导入页面时，已有节点的 props 不会被默认值覆盖；生产运行时也不能假设缺省字段一定存在，应在注册表或组件边界补齐兼容默认值。

## 注册 metadata 和组件

从 definitions 生成两份输入：

<<< ../../../examples/guide-project/src/domain/widgets/index.ts

这保证左栏物料、Core registry 和画布组件使用同一组 type。`material` 只描述物料栏显示和搜索，它不会进入 Schema。

## 控制设计态行为

行为字段可以是布尔值，也可以接收只读节点和 Schema 的 predicate：

| 行为 | 影响 |
| --- | --- |
| `creatable` | 是否允许新增该类型 |
| `selectable` | 是否允许选中已有节点 |
| `draggable` | 是否允许拖拽和移动 |
| `sortable` | 是否允许改变 sibling 顺序 |
| `deletable` | 是否允许删除 |
| `configurable` | 是否允许修改 props 和 style |
| `mask` | 是否显示节点交互遮罩 |

这些规则会同时被物料栏、画布、结构树和 Core command 使用。UI 上的 disabled 只是反馈，Core 会再次裁决。

## 选择普通物料还是 Schema 托管物料

普通物料由设计者从物料面板创建。页头、导航栏等由模板或 import 提供的节点使用 `authoring: 'schema-managed'`：

<<< ../../../examples/guide-project/src/domain/widgets/page-header.ts

Schema 托管物料默认不能创建、复制、移动、删除或切换容器 variant；已有节点可以继续渲染、选中和配置。需要开放某个已有实例能力时，使用 `configurable`、`draggable`、`deletable` 等实例策略，但创建和复制禁令不能解除。

## 物料内部写入

物料需要改变自身可持久化样式或 props 时，使用 `useWidgetRuntime()`：

```ts
const runtime = useWidgetRuntime()
runtime.updateProps({ title: '新标题' })
runtime.updateContentStyle({ color: '#0f766e' })
```

这些调用仍然进入 `UPDATE_PROPS`，因此带有历史、事件和撤销语义。组件本地 ref 只适合临时交互状态。

## 常见失败

- `type` 在 metadata 和 component map 中不一致：左栏可以出现物料，但画布无法解析组件。
- 普通物料增加 `children`：它不会获得 region 所有权，应该改用 [容器协议](/guide/customization/layout-and-containers)。
- 把资源对象直接写进展示组件状态：保存的 Schema 无法还原，应该定义稳定 props 和字段 adapter。

复杂物料需要配置时，继续阅读 [表单与字段](/guide/customization/forms-and-fields)。
