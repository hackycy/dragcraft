---
description: "查找 DragCraft 三个公开包的入口、约束与对应开发者指南。"
---

# 参考总览

参考页用于确认公开类型和精确调用形状。第一次接入请先完成 [从零搭建页面编辑器](/guide/learn/prerequisites)。

| Package | 何时查阅 | 对应指南 |
| --- | --- | --- |
| [@dragcraft/designer](/reference/designer) | 创建实例、Schema、命令、物料、字段、画布和主题 | [高级自定义](/guide/customization/overview) |
| [@dragcraft/device-frames](/reference/device-frames) | 设备壳、设备选择器和选择平面 | [主题、设备与国际化](/guide/customization/theme-device-and-i18n) |
| [@dragcraft/fields-ant-design-vue](/reference/fields-ant-design-vue) | Ant Design Vue 字段 adapter | [表单与字段](/guide/customization/forms-and-fields) |

Designer 的聚合接口按能力拆分为 [Schema 与命令](/reference/designer-schema)、[渲染与容器](/reference/designer-rendering)、[表单与字段](/reference/designer-forms) 和 [样式与国际化](/reference/designer-styles)。私有 DOM class、内部包导入、内部 store 写入和编辑态画布的生产复用都不属于支持的集成方式。
