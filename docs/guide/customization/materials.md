---
description: "定义稳定的业务物料标识、默认属性、行为约束、组件映射和物料栏展示。"
---

# 业务物料

当页面需要新的业务组件时，一个物料需要同时声明编辑协议和实际 Vue 组件。公告物料的完整定义在贯穿示例中：

<<< ../../../examples/guide-project/src/domain/widgets/notice.ts#tutorial-notice-widget

`creatable`、`selectable`、`draggable`、`sortable`、`deletable` 和 `mask` 可以写成布尔值或 predicate。把规则放在 metadata，物料栏、画布和结构树才会得到同一套判断。

物料注册表把 metadata 和组件映射一起生成：

<<< ../../../examples/guide-project/src/domain/widgets/index.ts#tutorial-widget-registry

| 框架负责 | 宿主负责 |
| --- | --- |
| 创建节点、复制默认值、行为约束和画布交互 | 组件实现、props 语义、资产协议和业务内容主题 |

`type` 是持久化标识。改名需要服务端和 Schema 迁移策略，不能只改 Vue 组件名称。需要承载其他物料时，不要给普通物料增加 `children`；使用 [页面布局与容器](/guide/customization/layout-and-containers)。

**完成检查**：新 `type` 出现在物料栏，拖入后按默认 props 渲染，且右侧只显示该物料声明的字段。

下一步：[表单与字段](/guide/customization/forms-and-fields)；公开类型见 [@dragcraft/designer](/reference/designer)。
