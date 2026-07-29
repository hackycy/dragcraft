---
description: "查找 DragCraft 公开包的入口、约束与对应开发者指南。"
---

# 参考总览

参考页用于确认公开类型、参数和精确调用形状。第一次接入请先完成 [从零构建活动页编辑器](/guide/learn/prerequisites)，不要从参考页拼接完整项目。

| Package | 何时查阅 | 对应指南 |
| --- | --- | --- |
| [@dragcraft/designer](/reference/designer) | 创建实例、Schema、命令、物料、字段、画布和主题 | [开始使用](/guide/learn/first-editor) 与 [按需扩展](/guide/customization/overview) |
| [@dragcraft/device-frames](/reference/device-frames) | 无状态设备定义、Container Shell 和受控选择器 | [主题、设备与国际化](/guide/customization/theme-device-and-i18n) |
| [@dragcraft/fields-ant-design-vue](/reference/fields-ant-design-vue) | Ant Design Vue 字段 adapter | [表单与字段](/guide/customization/forms-and-fields) |

字段 adapter 使用 `@dragcraft/fields-*` 命名并属于公开支持面；当前仅提供 Ant Design Vue adapter。

Designer 的聚合接口按能力拆分为 [Schema 与命令](/reference/designer-schema)、[渲染与容器](/reference/designer-rendering)、[表单与字段](/reference/designer-forms) 和 [样式与国际化](/reference/designer-styles)。私有 DOM class、内部包导入、内部 store 写入和编辑态画布的生产复用都不属于支持的集成方式。

| 你在参考中查找的内容 | 先阅读的教程 |
| --- | --- |
| `createDesigner`、`DcDesigner` 和物料注册 | [快速开始：挂载编辑器](/guide/learn/first-editor) |
| Schema、命令、快照和导入导出 | [保存 Schema，并通过命令写入](/guide/learn/schema-and-write-path) |
| 字段 adapter 和 `bindTo` | [添加物料、字段和页面设置](/guide/learn/material-and-property-panel) |
| placement、Container Shell 或 region | [页面布局](/guide/learn/page-layout) 与 [业务容器](/guide/learn/containers) |
| Schema 托管策略与节点动作 | [管理模板节点和工具栏动作](/guide/learn/schema-managed-actions) |
