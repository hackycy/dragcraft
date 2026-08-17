---
description: "查找 DragCraft 公开包的入口、约束与对应开发者指南。"
---

# 参考总览

参考页用于确认公开类型和精确调用形状。第一次接入请先完成 [5 分钟跑通](/guide/learn/quickstart)，再回到这里查参数和边界。

| Package | 何时查阅 | 对应指南 |
| --- | --- | --- |
| [@dragcraft/designer](/reference/designer) | 创建实例、DocumentSchema、AuthoringAction、物料、字段、画布和主题 | [框架如何协作](/guide/fundamentals/architecture) |
| [@dragcraft/device-frames](/reference/device-frames) | 无状态设备定义、Container Shell 和受控选择器 | [主题、设备与国际化](/guide/customization/theme-device-and-i18n) |
| [@dragcraft/fields-ant-design-vue](/reference/fields-ant-design-vue) | Ant Design Vue 字段 adapter | [表单与字段](/guide/customization/forms-and-fields) |

字段 adapter 使用 `@dragcraft/fields-*` 命名并属于公开支持面；当前仅提供 Ant Design Vue adapter。

Designer 的聚合接口按能力拆分为 [Schema 与动作](/reference/designer-schema)、[Presentation 与容器](/reference/designer-rendering)、[表单与字段](/reference/designer-forms) 和 [样式与国际化](/reference/designer-styles)。私有 DOM class、内部包导入、内部 store 写入和编辑态画布的生产复用都不属于支持的集成方式。

需要按任务查阅时，从 [选择扩展点](/guide/customization/overview) 进入；需要建立数据与写入模型时，阅读 [Schema 与样式作用域](/guide/fundamentals/schema) 和 [状态、动作、历史与事件](/guide/fundamentals/state-commands-and-history)。
