# 核心心智模型

你先不用理解所有内部实现，但要先知道 dragcraft 由哪几层组成。

dragcraft 可以先看成三层：`core` 管状态和命令，`designer` 负责三栏 UI，`themes` 决定默认视觉。

先看标准接入里的三样东西：

- `widgetMetas`：告诉设计器有哪些物料，以及这些物料能不能创建、移动、删除。
- `componentMap`：把 schema 里的 `type` 映射成真正的 Vue 组件。
- `fieldComponentMap`：告诉右侧属性面板该用什么字段组件。

## 标准入口是什么

默认入口是 `@dragcraft/designer`。

它已经重新导出了最常用的 core、renderer 和 form-generator 类型，所以大多数业务接入不需要分别从多个包里取基础 API。

## 写入为什么要走命令

dragcraft 把 schema 写操作集中到 `engine.execute()`。

这样做的好处是，新增、移动、删除、属性更新和历史记录会走同一条路径，设计器 UI 不需要直接改 schema。

## 什么时候再看别的包

- 你只想接入设计器：优先看 `@dragcraft/designer`
- 你想理解 schema 与历史记录：再看 `@dragcraft/core`
- 你想替换画布节点表现：再看 `@dragcraft/renderer`
- 你想替换右侧表单字段：再看 `@dragcraft/form-generator`

关于整体分层，目前知道这些就够了。准备好之后，继续阅读 [Schema 与布局](/guide/schema-and-layout)。
