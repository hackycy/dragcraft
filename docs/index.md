---
layout: home

hero:
  name: dragcraft
  text: 面向小程序装修场景的可视化页面搭建引擎
  tagline: 用可视化设计器、结构化 Schema、命令式内核和可替换 UI Shell，帮业务团队搭建可扩展、可维护的装修后台。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 理解心智模型
      link: /guide/mental-model
    - theme: alt
      text: 保存与发布
      link: /guide/saving-and-publishing
    - theme: alt
      text: 查看 API 参考
      link: /reference/overview

features:
  - title: 为小程序装修而设计
    details: 围绕物料拖拽、页面配置、设备预览、导航栏、Tab 栏和浮层等装修场景建模，而不是只提供一个通用拖拽容器。
  - title: Schema 驱动页面表达
    details: 页面顶层节点由 root.children 描述，再通过 LayoutPlan 投影到内容流、结构 chrome 和浮层；外部容器把普通子节点保存在自己的 regions 中。
  - title: Core Engine 统一写入
    details: 新增、移动、删除、属性更新和全局配置都通过 engine.execute() 进入命令系统，天然接入历史、事件和行为约束。
  - title: 设计器开箱接入
    details: '@dragcraft/designer 负责组合 core、renderer 和 form-generator，业务侧只需要传入物料、组件映射和字段 adapter。'
  - title: Headless 视觉体系
    details: '组件逻辑只输出稳定 dc-* class，主题由 @dragcraft/themes 或业务 CSS 接管，可以使用内置皮肤，也可以完全自定义。'
  - title: 面向平台化扩展
    details: 物料展示、画布容器、节点动作、属性面板、字段组件、设备框架和主题变量都通过显式扩展点接入。
---

## dragcraft 解决什么问题

dragcraft 适合用来建设小程序装修后台：运营或业务同学在设计器里拖拽物料、配置属性、预览不同设备形态，研发侧则把页面保存为稳定的 Schema，并在自己的运行时中解释和渲染。

它的重点不是把 DOM 任意拖来拖去，而是把装修页面拆成三件可治理的事情：

- 用 `WidgetMeta` 描述业务物料能不能创建、移动、删除、配置和展示。
- 用 `DesignerSchema` 保存页面结构、属性、样式 DSL 和布局意图。
- 用 `LayoutPlan` 把 root 节点投影到内容区、固定 chrome 和浮层，保证每个节点只渲染一次；外部容器单独管理自己的 region 子树。

## 推荐接入路径

第一次接入时，从 `@dragcraft/designer` 开始最省心。它已经把核心引擎、画布渲染和属性表单组合成标准设计器入口。

```ts
import '@dragcraft/themes'
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designer = createDesigner({
  widgetMetas: myWidgetMetas,
  componentMap: myComponentMap,
  fieldComponentMap: createAntDesignVueFields(),
  globalConfigSchema: myGlobalConfigSchema,
})
```

你需要准备三份业务输入：

| 输入 | 负责什么 | 常见来源 |
| --- | --- | --- |
| `widgetMetas` | 左侧能拖什么、节点有哪些行为约束、右侧表单 schema 怎么生成 | 业务物料定义或 `@dragcraft/widgets` 工具函数 |
| `componentMap` | schema 节点的 `type` 渲染成哪个 Vue 组件 | 业务物料组件 |
| `fieldComponentMap` | 表单字段使用哪个真实 UI 组件和值绑定协议 | `@dragcraft/fields-ant-design-vue` 或业务字段 adapter |

如果你只想先跑起来，直接阅读 [快速开始](/guide/getting-started)。如果你要设计一套可长期演进的装修平台，建议先看 [核心心智模型](/guide/mental-model)。

## 架构一眼看懂

dragcraft 的架构边界刻意保持清晰：core 管状态和命令，designer 管产品化设计器交互，renderer 管 schema 到组件树的渲染，form-generator 管属性表单，themes 和 device-frames 分别承接视觉皮肤与设备外壳。

```text
业务应用
  -> @dragcraft/designer
      -> @dragcraft/core
      -> @dragcraft/renderer
      -> @dragcraft/form-generator
  -> @dragcraft/widgets
  -> @dragcraft/fields-ant-design-vue
  -> @dragcraft/themes
  -> @dragcraft/device-frames
```

这套分层带来几个关键结果：

- 业务写入统一经过 `engine.execute()`，撤销重做、事件通知和命令校验不会散落在 UI 里。
- `form-generator` 不依赖 core，只负责字段渲染和值变更，字段到命令的翻译由 designer 承担。
- `renderer` 不持久化业务状态，只消费 schema、组件映射、扩展点和事件 hooks。
- `themes` 不改变组件逻辑，只覆盖稳定 class 和 CSS 变量。
- `device-frames` 通过 renderer 的 `containerShell` 接入，让手机、平板、桌面预览成为可替换外壳。

完整设计约束可以继续阅读 [技术架构文档](https://github.com/hackycy/dragcraft/tree/main/.github/architecture)。

## 按目标继续阅读

| 你的目标 | 建议下一页 |
| --- | --- |
| 把设计器挂到 Vue 应用里 | [快速开始](/guide/getting-started) |
| 理解 schema、命令和包分层 | [核心心智模型](/guide/mental-model) |
| 设计页面结构、chrome 和浮层 | [Schema 与布局](/guide/schema-and-layout) |
| 接入业务物料和右侧属性表单 | [物料与字段](/guide/materials-and-fields) |
| 实现 flex、grid 或分栏等可承载子节点的物料 | [外部容器物料](/guide/container-materials) |
| 自定义字段 adapter、联动与 Schema 绑定 | [配置表单与字段](/guide/forms-and-fields) |
| 替换面板、扩展 rail 或节点动作 | [扩展设计器交互](/guide/extending-the-designer) |
| 增加设备预览和主题皮肤 | [主题与设备框架](/guide/themes-and-device-frames) |
| 接入编辑器语言包 | [编辑器国际化](/guide/i18n) |
| 保存草稿、处理版本冲突并发布 | [保存草稿与发布](/guide/saving-and-publishing) |
| 确认生产运行时的消费边界 | [运行时集成边界](/guide/runtime-integration) |
| 查某个 package 的入口 API | [参考总览](/reference/overview) |

## 适合从这里开始的团队

- 正在建设小程序、H5 或营销页装修后台，希望沉淀可导入导出的页面 Schema。
- 需要把运营配置、页面预览、设备外壳、物料管理和属性面板放进同一个设计器体验里。
- 希望 UI 逻辑、主题皮肤、字段组件和业务物料保持解耦，避免后期扩展时牵一发动全身。
- 希望核心写入链路可测试、可审计、可拦截，并天然支持历史记录和事件订阅。
