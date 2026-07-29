---
layout: home
description: "dragcraft 是面向小程序装修场景的可视化页面搭建引擎，提供 Schema、设计器和可扩展运行时契约。"

hero:
  name: dragcraft
  text: 可视化页面搭建引擎
  tagline: 从可运行的 Vue 编辑器开始，逐步掌握 Schema、命令、物料、布局、容器和生产运行时。
  actions:
    - theme: brand
      text: 创建可运行编辑器
      link: /guide/learn/first-editor
    - theme: alt
      text: 了解接入边界
      link: /guide/learn/prerequisites
    - theme: alt
      text: 查看 API 参考
      link: /reference/overview

features:
  - title: Schema 驱动页面数据
    details: 页面结构、属性、样式和布局意图保存为可迁移、可校验的 Schema。
  - title: 命令统一写入
    details: 字段、拖放和节点动作共享历史、约束、失败结果与事件语义。
  - title: 业务拥有运行时
    details: Designer 负责编辑态，宿主为 Web、小程序或其他平台实现只读运行时。
  - title: 扩展边界明确
    details: 物料、字段、容器、动作、面板、主题和设备使用独立的公开入口。
---

## 从可运行结果开始

同一个贯穿项目提供最小接入和完整活动页编辑器。你可以先确认安装与挂载，再查看业务物料、容器、设备、保存和运行时如何协作。

### 最小编辑器

![只包含文本物料和属性面板的最小编辑器](/images/guide/minimal-editor.png)

[创建可运行编辑器](/guide/learn/first-editor) 给出物料、实例工厂、Vue 页面和样式入口的完整源码。

### 完整活动页工作台

![包含业务物料、页面结构和设备预览的活动页编辑器](/images/guide/complete-editor.png)

[接入业务物料与属性配置](/guide/learn/material-and-property-panel) 继续加入公告、自定义字段、页面设置和完整注册表。

### 独立 Vue 运行时

![解释固定页头、正文、容器和浮层的 Vue 只读运行时](/images/guide/runtime-preview.png)

[保存、加载与只读预览](/guide/learn/persistence-and-runtime) 说明草稿修订、导入校验和生产运行时边界。

## 建立核心模型

| 需要理解的问题 | 阅读入口 |
| --- | --- |
| Designer、Core、Renderer 和宿主如何协作 | [框架如何协作](/guide/fundamentals/architecture) |
| 页面究竟保存什么 | [Schema 与样式作用域](/guide/fundamentals/schema) |
| 为什么不能直接修改 Schema | [状态、命令、历史与事件](/guide/fundamentals/state-commands-and-history) |
| 物料 metadata、组件和字段如何配合 | [业务物料](/guide/customization/materials) |
| 页面正文、固定区域和浮层如何分开 | [布局投影](/guide/fundamentals/layout-system) |
| 分栏和网格如何拥有子节点 | [容器与 region](/guide/customization/layout-and-containers) |

## 按开发目标继续

| 你的目标 | 开发指南 |
| --- | --- |
| 实现字段 adapter、联动和验证 | [表单与字段](/guide/customization/forms-and-fields) |
| 接入确认、权限和 Authoring Policy | [动作与业务策略](/guide/customization/actions-and-policies) |
| 替换面板、画布或 Container Shell | [面板与画布](/guide/customization/panels-and-canvas) |
| 定制品牌、设备和编辑器消息 | [主题、设备与国际化](/guide/customization/theme-device-and-i18n) |
| 对接 migration、草稿、发布和生产运行时 | [迁移、草稿与生产运行时](/guide/customization/lifecycle-and-runtime) |
| 确认公开类型和调用形状 | [API 参考](/reference/overview) |
