# 包职责索引

本章提供所有 workspace package 的职责、主要导出、依赖方向和集成方式索引。

## 总览

| Package | 定位 |
| --- | --- |
| `@dragcraft/core` | 领域模型、状态机、命令、历史、事件、注册协议 |
| `@dragcraft/designer` | 对外 API、Vue3 设计器布局与交互编排 |
| `@dragcraft/renderer` | 将 schema 节点映射为 Vue 组件树 |
| `@dragcraft/form-generator` | 配置面板 schema 表单引擎 |
| `@dragcraft/fields-ant-design-vue` | Ant Design Vue 字段 adapter 包 |
| `@dragcraft/widgets` | 物料协议与通用工具函数 |
| `@dragcraft/themes` | 工作台主题聚合、令牌与视觉配方 |
| `@dragcraft/device-frames` | 设备容器框架 |
| `@dragcraft/icons` | SVG 图标组件库 |
| `@dragcraft/utils` | 跨包复用纯函数工具 |

## @dragcraft/core

职责：

- 管理 DesignerSchema 响应式状态。
- 提供 CommandBus、HistoryManager、Registry、EventHub。
- 提供 LayoutPlan 投影和位置锁定约束。
- 定义 `CoreWidgetMeta` 等 widget 行为控制协议。

主要入口：

- `createEngine()`。
- `CommandType`。
- `resolveBehavior()`。
- Schema、command、event、registry、widget 相关类型。

依赖与协作：

- 被 designer 创建并持有。
- 被 renderer 消费 store 和命令能力。
- 被 widgets 和业务物料复用基础 widget meta 类型；renderer 在此之上扩展 `RendererWidgetMeta`。

## @dragcraft/designer

职责：

- 标准业务接入入口。
- 组合 core、renderer、form-generator。
- 提供可折叠 Dock、可平移画布和 Inspector 的响应式 UI Shell。
- 管理基于容器宽度的 wide/compact 模式与互斥抽屉。
- 管理拖拽、属性绑定、扩展点和事件 hooks 透传。
- 通过 `bindings/field-binding.ts` 纯函数 helpers 翻译属性面板字段绑定。

主要入口：

- `createDesigner()`。
- `DcDesigner`。
- `useDesigner()`。
- Designer options、workspace controller 和 extensions 类型。

依赖与协作：

- 依赖 core、renderer、form-generator。
- 用户显式传入 widget meta、componentMap 和 fieldComponentMap。
- 必要结构样式由 renderer 包提供，工作台视觉由 themes 或业务主题差异提供。

## @dragcraft/renderer

职责：

- 把 `root.children` 渲染为 widget 节点列表。
- 管理节点 mask、handle、toolbar、fallback、empty state。
- 提供 renderer extensions、event hooks、node actions 与 composables。
- 处理节点交互状态，并持有 `RendererWidgetMeta` 的 UI 扩展字段；schema 写入回到 core command。

主要入口：

- `RootRenderer`。
- `createNodeActionRegistry()`。
- `createDefaultActions()`。
- `useWidgetNode()`、`useNodeActions()`、`useNodeDrag()`、`useToolbarPosition()`。

依赖与协作：

- 消费 core engine。
- 接收 designer 或业务传入的 componentMap。
- 通过 extensions 接入 device-frames 等容器。

## @dragcraft/form-generator

职责：

- 基于 FormSchema 渲染配置表单。
- 管理字段 visible、disabled、验证和变更事件。
- 定义字段 adapter 协议，并将 `componentProps` 原样透传给真实 UI 组件。
- 不直接依赖 core，不执行命令。

主要入口：

- `FormGenerator`。
- `useFieldState()`。
- `useFormValidation()`。
- FormSchema、FieldSchema、FieldComponentMap、TypedFormSchema 类型。

依赖与协作：

- 被 designer 右栏使用。
- 字段 adapter 由业务应用或内置字段包显式提供。
- 值变更由 designer 转为 core command。

## @dragcraft/fields-ant-design-vue

职责：

- 提供 Ant Design Vue 表单组件的 FieldComponentDefinition 注册表。
- 保持 `componentProps` 与 Ant Design Vue 原组件 props 一致。
- 提供 `AntDesignVueFieldComponentPropsMap` 用于 schema 类型提示。

主要入口：

- `createAntDesignVueFields()`。
- `antDesignVueFieldComponents`。
- `AntDesignVueFieldComponentType`。
- `AntDesignVueFieldComponentPropsMap`。

依赖与协作：

- 依赖 form-generator 类型和 Ant Design Vue 组件。
- 被业务应用或 playground 合并进 `fieldComponentMap`。
- 不承载业务特化字段；`Color`、`Array`、`NavbarTitle` 等由业务侧维护。

## @dragcraft/widgets

职责：

- 定义 `WidgetDefinition`、`WidgetGroup`、`WidgetGroupConfig`。
- 提供物料注册、组件映射和分组过滤工具。
- 不包含具体物料组件。

主要入口：

- `registerWidgets()`。
- `buildComponentMap()`。
- `getWidgetMetas()`。
- `filterByGroup()`。

依赖与协作：

- 依赖 core 类型和 Vue Component 类型。
- designer 不强依赖本包，业务可以直接传入 meta 和 componentMap。

## @dragcraft/themes

职责：

- 聚合 designer、renderer 与 form-generator 的必要结构 CSS。
- 提供完整 Standard 默认令牌、共享基线视觉配方与 Material 差异。
- 发布机器可读主题契约；不负责画布内业务 widget 的内容主题。

主要入口：

- `@dragcraft/themes` 或 `@dragcraft/themes/standard`。
- `@dragcraft/themes/material`。
- `@dragcraft/themes/structure`。
- `@dragcraft/themes/theme-contract.json` 与 `@dragcraft/themes/css-custom-data.json`。

依赖与协作：

- 不改变组件逻辑。
- 构建时通过 designer、renderer、form-generator 的公开 `structure.css` 子路径聚合结构层；发布的每个主题 CSS 都是可独立导入的完整文件。
- 业务优先增量覆盖 token，必要时使用公开 component/part/state 编写差异配方。

## @dragcraft/device-frames

职责：

- 提供 iPhone、Android、Tablet、Desktop 画布设备容器。
- 提供设备上下文和独立设备选择组件。
- 作为 renderer `containerShell` 扩展点使用。

主要入口：

- `createDeviceFrameContext()`。
- `DeviceFrameShell`。
- `DEVICE_FRAME_CONTEXT_KEY`。
- `DevicePicker`。
- `useDeviceFrame()`。
- `@dragcraft/device-frames/styles`。

依赖与协作：

- 依赖 Vue、`@dragcraft/core` layout/schema 类型和 `@dragcraft/icons`，不依赖 designer 或 renderer。
- 设备选择器是可选宿主组件，由业务放在应用顶栏或其他产品区域；designer 默认不提供设备选择。
- 与 renderer 通过 `containerShell` 集成。
- 样式自包含，不依赖 themes。

## @dragcraft/icons

职责：

- 提供 SVG 图标 Vue 组件。
- 被 designer、device-frames 等 UI 包消费。

主要入口：

- `icons/*` 中的具体图标组件。
- `IconProps` 等公共类型。

依赖与协作：

- peer 依赖 Vue。
- 不承载业务逻辑。

## @dragcraft/utils

职责：

- 提供跨包复用纯函数。
- 保持无 UI、无业务领域耦合。

当前能力：

- 深拷贝。
- 事件分发器。
- uuid。

依赖与协作：

- 被 core 等上层包复用。
- 不承载 schema 或业务语义。

## 依赖方向

推荐理解为：

```plaintext
业务应用
  -> @dragcraft/designer
      -> @dragcraft/core
      -> @dragcraft/renderer
  -> @dragcraft/form-generator
  -> @dragcraft/fields-ant-design-vue
  -> @dragcraft/themes
  -> @dragcraft/widgets
  -> @dragcraft/device-frames
  -> @dragcraft/icons

@dragcraft/utils 可被多个基础包复用
```

依赖规则：

- core 不依赖 UI 组件包。
- form-generator 不依赖 core。
- renderer 不直接持久化业务状态。
- designer 负责包组合与对外简化。
- 业务应用负责提供物料实现，并选择内置字段包或自定义字段 adapter。
