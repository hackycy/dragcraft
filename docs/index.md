---
layout: home
description: "dragcraft 是面向小程序装修场景的可视化页面搭建引擎，提供 Schema、设计器和可扩展渲染能力。"

hero:
  name: dragcraft
  text: 面向小程序装修场景的可视化页面搭建引擎
  tagline: 从新的 Vue 项目完成一个可保存、可预览的活动页编辑器，再按业务需要扩展页面结构与工作台。
  actions:
    - theme: brand
      text: 从零开始
      link: /guide/learn/prerequisites
    - theme: alt
      text: 按需扩展
      link: /guide/customization/overview
    - theme: alt
      text: 查看贯穿示例
      link: https://github.com/hackycy/dragcraft/tree/main/examples/guide-project
    - theme: alt
      text: 查看 API 参考
      link: /reference/overview

features:
  - title: 先完成可运行项目
    details: 从新的 Vite Vue 项目开始，依次完成物料、属性表单、草稿保存和只读运行时。
  - title: Schema 驱动页面表达
    details: 页面结构、属性、样式和布局意图保存在稳定 Schema 中，由业务运行时解释。
  - title: Core Engine 统一写入
    details: 新增、移动、删除和属性更新通过命令进入 Core，统一接入历史、事件和约束。
  - title: 按扩展边界开发
    details: 物料、字段、容器、动作、画布、主题和生命周期都有明确的公开入口与宿主职责。
---

## 先完成一条连续课程

文档围绕一个活动页编辑器展开。你会先挂载最小 Designer，再把业务物料、属性面板、草稿保存和只读运行时接入同一个项目。基础闭环完成后，课程继续解释布局、容器和 Schema 托管节点。

[`examples/guide-project`](https://github.com/hackycy/dragcraft/tree/main/examples/guide-project) 是最终可运行参考。教程中的完整源码块直接来自它的模块，因此你可以跟着搭建，再用示例核对完成态。

| 阶段 | 你完成的结果 |
| --- | --- |
| [快速开始：挂载编辑器](/guide/learn/first-editor) | 能拖入文本并编辑其属性。 |
| [理解 Dragcraft 的边界](/guide/learn/mental-model) | 能区分宿主、Designer、Core、Schema 与运行时职责。 |
| [添加物料、字段和页面设置](/guide/learn/material-and-property-panel) | 注册公告物料、业务字段和页面级配置。 |
| [保存草稿并预览运行时](/guide/learn/persistence-and-runtime) | 保存、重载 Schema，并以只读契约渲染页面。 |
| [安排内容、Chrome 和浮层](/guide/learn/page-layout) | 将页面节点放入正确的视觉 surface。 |
| [让业务容器承载子节点](/guide/learn/containers) | 用受控 region 表达分栏和变体迁移。 |
| [管理模板节点和工具栏动作](/guide/learn/schema-managed-actions) | 区分编辑态策略、宿主确认和服务端授权。 |

## 按业务目标继续

| 你的目标 | 建议入口 |
| --- | --- |
| 接入一个业务组件 | [业务物料](/guide/customization/materials) |
| 实现字段 adapter 或联动 | [表单与字段](/guide/customization/forms-and-fields) |
| 实现分栏、网格或复杂区域 | [页面布局与容器](/guide/customization/layout-and-containers) |
| 接入权限、确认与审计 | [动作与业务策略](/guide/customization/actions-and-policies) |
| 替换面板、画布或工作台视觉 | [面板与画布](/guide/customization/panels-and-canvas) |
| 接入设备、主题和语言包 | [主题、设备与国际化](/guide/customization/theme-device-and-i18n) |
| 对接草稿、发布和生产运行时 | [生命周期与运行时](/guide/customization/lifecycle-and-runtime) |
| 查某个 package 的入口 API | [参考总览](/reference/overview) |

教程用于完成项目和建立心智模型；参考页用于确认某个公开类型、参数或约束。完整的架构约束保留在 [Architecture Map](https://github.com/hackycy/dragcraft/tree/main/.github/architecture)。
