# 包职责索引

本章提供所有 workspace package 的职责、主要导出、依赖方向和集成方式索引。只有标记为“公开”的 package 属于业务支持面；内部 package 可以作为传递依赖发布，但业务应用不得直接导入。

## 总览

| Package | 支持级别 | 定位 |
| --- | --- | --- |
| `@dragcraft/designer` | 公开 | 唯一主入口、Vue3 工作台、聚合扩展接口与 Standard 主题 |
| `@dragcraft/device-frames` | 公开可选 | 设备容器框架 |
| `@dragcraft/fields-*` | 公开可选 | UI 库字段 adapter；当前实现为 `@dragcraft/fields-ant-design-vue` |
| `@dragcraft/core` | 内部 | 领域模型、状态机、命令、历史、事件、注册协议 |
| `@dragcraft/renderer` | 内部 | 将 schema 节点映射为 Vue 组件树 |
| `@dragcraft/form-generator` | 内部 | 配置面板 schema 表单引擎 |
| `@dragcraft/widgets` | 内部 | 物料协议与通用工具函数 |
| `@dragcraft/ui` | 内部 | 共享 Vue UI 模块与统一滚动区域 |
| `@dragcraft/icons` | 内部 | SVG 图标模块 |
| `@dragcraft/i18n` | 内部 | Vue UI 模块共享的响应式国际化上下文 |
| `@dragcraft/utils` | 内部 | 跨包复用纯函数工具 |

## @dragcraft/core

职责：

- 管理 DesignerSchema 响应式状态。
- 提供 CommandBus、HistoryManager、Registry、EventHub。
- 提供 LayoutPlan 投影和位置锁定约束。
- 集中解析 Authoring Policy，并在内置命令中强制执行创建、配置和结构操作限制。
- 定义 `CoreWidgetMeta` 等 widget 行为控制协议。

主要入口：

- `createEngine()`。
- `CommandType`。
- `resolveBehavior()`。
- `resolveAuthoringPolicy()`、`resolveWidgetCreation()`。
- `normalizeStyleValueMap()`。
- Schema、command、event、registry、widget 相关类型。

依赖与协作：

- 被 designer 创建并持有。
- 被 renderer 消费 store 和命令能力。
- 被 widgets 内部复用基础 widget meta 类型；业务物料从 Designer 使用聚合类型，renderer 在此之上扩展 `RendererWidgetMeta`。

## @dragcraft/designer

职责：

- 标准业务接入入口。
- 组合 core、renderer、form-generator。
- 提供可折叠 Dock、可平移画布和 Inspector 的响应式 Vue 可视化搭建工作台。
- 管理基于容器宽度的 wide/compact 模式与互斥抽屉。
- 管理拖拽、属性绑定、扩展点和事件 hooks 透传。
- 通过 `bindings/field-binding.ts` 纯函数 helpers 翻译属性面板字段绑定。

主要入口：

- `createDesigner()`。
- `DcDesigner`。
- `useDesigner()`。
- Designer options、workspace controller 和 extensions 类型。
- Schema、command、renderer、form、widget 与 i18n 的业务扩展接口。
- `@dragcraft/designer/styles`、`styles/structure` 与主题契约 JSON。

依赖与协作：

- 依赖 core、renderer、form-generator、widgets 等内部 implementation module。
- 用户显式传入 widget meta、componentMap 和 fieldComponentMap。
- Designer 聚合必要结构样式和唯一 Standard 工作台主题；业务通过 token 或公开 hook 覆盖差异。

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
- `hideNativeDragImage()`。
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

- 内部依赖 form-generator 类型和 Ant Design Vue 组件。
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
- designer 依赖并聚合本包的业务扩展接口；业务不直接导入本包。

## @dragcraft/ui

职责：

- 提供 designer、device-frames 与宿主扩展复用的基础 Vue UI 模块。
- 统一原生滚动 viewport、覆盖层 scrollbar、thumb 几何和 pointer 交互。
- 发布结构 CSS、视觉 recipe 与完整默认样式入口。

主要入口：

- `DcScrollArea`。
- `ScrollAreaProps` 与 `ScrollAreaType`。
- `@dragcraft/ui/styles`。
- `@dragcraft/ui/structure.css` 与 `@dragcraft/ui/recipe.css`。

依赖与协作：

- 只 peer 依赖 Vue，不依赖 designer、renderer 或 device-frames。
- 被 designer 的物料、结构树和属性面板消费，也被 device-frames 的内容 viewport 消费。
- Designer 的 Standard 主题聚合其结构层、视觉 recipe 和公开 token 契约。

## @dragcraft/device-frames

职责：

- 提供 iPhone 15 Pro、iPhone X、iPhone 8、普通与水滴屏 Android、Tablet、Desktop 画布设备容器。
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

- 依赖 Vue、`@dragcraft/core` layout/schema 类型、`@dragcraft/icons` 与 `@dragcraft/ui`，不依赖 designer 或 renderer。
- 设备选择器是可选宿主组件，由业务放在应用顶栏或其他产品区域；designer 默认不提供设备选择。
- 与 renderer 通过 `containerShell` 集成。
- 样式自包含，不依赖 Designer 的工作台主题。

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

## @dragcraft/i18n

职责：

- 提供 UI 包共享的响应式 locale 与翻译查询。
- 维护 Vue injection key 和运行时消息合并。
- 集中 designer、renderer、form-generator 使用的国际化协议与类型。

主要入口：

- `createI18n()`。
- `useI18n()`。
- `I18N_KEY`。
- `I18nInstance`、`LocaleMessages`、`MessageTree`。

依赖与协作：

- peer 依赖 Vue。
- 被 designer、renderer 和 form-generator 内部消费；业务通过 designer 聚合接口使用。
- 不包含具体产品文案；各消费包或宿主负责合并消息树。

## @dragcraft/utils

职责：

- 提供跨包复用纯函数。
- 保持无 UI、无业务领域耦合。

当前能力：

- 深拷贝。
- 事件分发器。
- uuid。

依赖与协作：

- 被 core 等内部上层模块复用，不属于业务接口。
- 不承载 schema 或业务语义。

## 依赖方向

推荐理解为：

```plaintext
业务应用
  -> @dragcraft/designer
  -> @dragcraft/fields-ant-design-vue (可选)
  -> @dragcraft/device-frames (可选)

@dragcraft/designer
  -> @dragcraft/core
  -> @dragcraft/renderer
  -> @dragcraft/form-generator
  -> @dragcraft/widgets
  -> @dragcraft/i18n
  -> @dragcraft/ui
  -> @dragcraft/icons
  -> @dragcraft/utils

@dragcraft/core -> @dragcraft/utils
@dragcraft/designer -> @dragcraft/ui
@dragcraft/designer -> @dragcraft/utils
@dragcraft/device-frames -> @dragcraft/ui
@dragcraft/renderer -> @dragcraft/utils
```

依赖规则：

- core 不依赖 UI 组件包。
- form-generator 不依赖 core。
- i18n 只依赖 Vue，不依赖任何 dragcraft UI 组件包。
- utils 不依赖 Vue 或 DOM。
- renderer 不直接持久化业务状态。
- designer 负责包组合与对外简化。
- README、公开文档、examples 和 playground 只能直接导入 Designer、Device Frames 和 `@dragcraft/fields-*` 字段 adapter package。
- 业务应用负责提供物料实现，并选择内置字段包或自定义字段 adapter。
