---
description: "从可运行示例开始，在 Vue 应用中完成 DragCraft 编辑器接入，并按任务扩展。"
---

# 开发指南

本指南面向第一次接入 DragCraft 的 Vue 开发者。阅读顺序围绕一个可验证的闭环组织：先运行示例，再创建最小编辑器，然后把业务物料、字段、容器和保存运行时逐项接入。

## 先选择一条路径

| 目标 | 从哪里开始 | 完成标准 |
| --- | --- | --- |
| 先确认框架能否运行 | [5 分钟跑通](/guide/learn/quickstart) | 能打开最小编辑器并完成一次属性修改 |
| 从空白 Vue 应用接入 | [创建可运行编辑器](/guide/learn/first-editor) | 能拖入一个物料、编辑属性并撤销 |
| 建立正确的数据模型 | [理解 Schema 与写入链路](/guide/learn/schema-and-write-path) | 知道保存什么、谁可以写入、如何处理导入失败 |
| 加入业务组件和配置 | [接入业务物料与属性配置](/guide/learn/material-and-property-panel) | 一个业务 `type` 同时拥有预览、Schema 和属性面板 |
| 接通草稿与生产页面 | [保存、加载与只读预览](/guide/learn/persistence-and-runtime) | `exportSchema()` 可以保存，独立 Runtime 可以渲染 |

## 学习顺序

### 1. 开始使用

- [5 分钟跑通](/guide/learn/quickstart)：运行仓库中的 `guide-project`，再把最小接入复制到自己的应用。
- [了解接入边界](/guide/learn/prerequisites)：确认 Designer、宿主应用和生产 Runtime 各自负责什么。
- [创建可运行编辑器](/guide/learn/first-editor)：逐步定义 Material、创建实例、加载样式并释放实例。

### 2. 核心概念

- [框架如何协作](/guide/fundamentals/architecture)：理解 Schema、Authoring、Presentation、Form 和宿主的关系。
- [DocumentSchema](/guide/fundamentals/schema)：理解节点、root、container region 和导入状态。
- [状态、动作、历史与事件](/guide/fundamentals/state-commands-and-history)：理解公开写入口、结果和 undo/redo。
- [展示与空间策略](/guide/fundamentals/layout-system)：区分 Designer 设计态展示与生产 Runtime 布局。

### 3. 按任务扩展

- [业务物料](/guide/customization/materials)
- [表单与字段](/guide/customization/forms-and-fields)
- [容器与 Region](/guide/customization/layout-and-containers)
- [动作与 Authoring Policy](/guide/customization/actions-and-policies)
- [面板与画布](/guide/customization/panels-and-canvas)
- [主题、设备与国际化](/guide/customization/theme-device-and-i18n)
- [草稿与生产运行时](/guide/customization/lifecycle-and-runtime)

## 公开接入边界

业务应用只直接导入以下包：

- `@dragcraft/designer`：Designer、MaterialDefinition、Schema 类型、字段绑定和设计态扩展。
- `@dragcraft/device-frames`：可选的设备外壳、设备目录和受控选择器。
- `@dragcraft/fields-*`：可选的 UI 库字段 adapter。

其他 workspace package 是实现细节，业务应用不需要直接依赖它们。要查精确类型和导出入口，进入 [参考总览](/reference/overview)；要理解稳定边界和约束，查看仓库的 [Architecture Map](https://github.com/hackycy/dragcraft/tree/main/.github/architecture)。
