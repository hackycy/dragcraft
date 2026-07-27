---
layout: home
description: "dragcraft 是面向小程序装修场景的可视化页面搭建引擎，提供 Schema、设计器和可扩展渲染能力。"

hero:
  name: dragcraft
  text: 面向小程序装修场景的可视化页面搭建引擎
  tagline: 先完成一个可保存、可预览的页面编辑器，再按业务需要扩展物料、布局、工作台和运行时。
  actions:
    - theme: brand
      text: 从零开始
      link: /guide/learn/prerequisites
    - theme: alt
      text: 高级自定义
      link: /guide/customization/overview
    - theme: alt
      text: 查看贯穿示例
      link: https://github.com/hackycy/dragcraft/tree/main/examples/guide-project
    - theme: alt
      text: 查看 API 参考
      link: /reference/overview

features:
  - title: 先完成完整闭环
    details: 从最小编辑器开始，继续完成物料、属性表单、草稿保存和只读运行时预览。
  - title: Schema 驱动页面表达
    details: 页面结构、属性、样式和布局意图保存在稳定 Schema 中，由业务运行时解释。
  - title: Core Engine 统一写入
    details: 新增、移动、删除和属性更新通过命令进入 Core，统一接入历史、事件和约束。
  - title: 按扩展边界开发
    details: 物料、字段、容器、动作、画布、主题和生命周期都有明确的公开入口与宿主职责。
---

## 先完成一个完整闭环

文档围绕一个活动页编辑器展开。你会先挂载设计器，再把业务物料和属性面板接入其中，最后保存草稿并用自己的只读运行时渲染页面。

`examples/guide-project` 是每一步的可运行参考。教程中的代码块直接来自它的源码，因此你可以先跟着搭建，再用示例核对最终结构。

| 阶段 | 你完成的结果 |
| --- | --- |
| [挂载最小编辑器](/guide/learn/first-editor) | 能拖入文本并编辑其属性。 |
| [理解 Schema 与写入链路](/guide/learn/schema-and-write-path) | 知道哪些数据可保存，以及为什么所有写入都经过命令。 |
| [添加物料与属性面板](/guide/learn/material-and-property-panel) | 注册公告物料、业务字段和页面级配置。 |
| [保存草稿并预览运行时](/guide/learn/persistence-and-runtime) | 保存、重载 Schema，并以只读契约渲染页面。 |

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
