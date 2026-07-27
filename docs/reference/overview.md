---
description: "按 package 查找 DragCraft 的公开入口、约束与对应的开发者指南。"
---

# 参考总览

参考页用于确认公开类型和精确调用形状。第一次接入请先完成 [从零搭建页面编辑器](/guide/learn/prerequisites)。

| Package | 何时查阅 | 对应指南 |
| --- | --- | --- |
| [@dragcraft/designer](/reference/designer) | 创建实例、控制工作台、注册动作和扩展 | [面板与画布](/guide/customization/panels-and-canvas) |
| [@dragcraft/core](/reference/core) | Schema、命令、历史、事件、容器和迁移 | [生命周期与运行时](/guide/customization/lifecycle-and-runtime) |
| [@dragcraft/renderer](/reference/renderer) | 设计态画布、节点交互、region 和选择投影 | [页面布局与容器](/guide/customization/layout-and-containers) |
| [@dragcraft/form-generator](/reference/form-generator) | 表单字段、adapter、联动和 render factory | [表单与字段](/guide/customization/forms-and-fields) |
| [@dragcraft/device-frames](/reference/device-frames) | 设备壳、设备选择器和选择平面 | [主题、设备与国际化](/guide/customization/theme-device-and-i18n) |
| [widgets 与 fields](/reference/widgets-and-fields) | 物料定义整理和 Ant Design Vue 字段 | [业务物料](/guide/customization/materials) |
| [themes、i18n 与 utils](/reference/themes-and-utils) | 主题契约、国际化与纯工具函数 | [主题、设备与国际化](/guide/customization/theme-device-and-i18n) |
| [@dragcraft/ui](/reference/ui) | 共享滚动区域组件 | [面板与画布](/guide/customization/panels-and-canvas) |

这些页面只描述公开入口。私有 DOM class、内部 store 写入和编辑态 Renderer 的生产复用都不属于支持的集成方式。
