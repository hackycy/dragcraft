# 包职责索引

本章提供所有 workspace package 的职责、主要导出、依赖方向和集成方式索引。

## 总览

| Package | 定位 |
| --- | --- |
| `@dragcraft/core` | 领域模型、状态机、命令、历史、事件、注册协议 |
| `@dragcraft/designer` | 对外 API、Vue3 设计器布局与交互编排 |
| `@dragcraft/renderer` | 将 schema 节点映射为 Vue 组件树 |
| `@dragcraft/form-generator` | 配置面板 schema 表单引擎 |
| `@dragcraft/widgets` | 物料协议与通用工具函数 |
| `@dragcraft/builtin-fields` | 内置表单字段组件 |
| `@dragcraft/builtin-widgets` | 内置物料实现 |
| `@dragcraft/themes` | CSS 皮肤包 |
| `@dragcraft/device-frames` | 设备容器框架 |
| `@dragcraft/icons` | SVG 图标组件库 |
| `@dragcraft/utils` | 跨包复用纯函数工具 |

## @dragcraft/core

职责：

- 管理 DesignerSchema 响应式状态。
- 提供 CommandBus、HistoryManager、Registry、EventHub。
- 提供 LayoutPlan 投影和位置锁定约束。
- 定义 widget 行为控制协议。

主要入口：

- `createEngine()`。
- `CommandType`。
- `resolveBehavior()`。
- Schema、command、event、registry、widget 相关类型。

依赖与协作：

- 被 designer 创建并持有。
- 被 renderer 消费 store 和命令能力。
- 被 widgets 和 builtin-widgets 复用 `WidgetMeta` 类型。

## @dragcraft/designer

职责：

- 标准业务接入入口。
- 组合 core、renderer、form-generator。
- 提供三栏设计器 UI Shell。
- 管理拖拽、属性绑定、扩展点和事件 hooks 透传。

主要入口：

- `createDesigner()`。
- `DcDesigner`。
- `useDesigner()`。
- Designer options、extensions、toolbar API 类型。

依赖与协作：

- 依赖 core、renderer、form-generator。
- 用户显式传入 widget meta、componentMap 和 fieldComponentMap。
- 主题样式由 themes 或业务 CSS 提供。

## @dragcraft/renderer

职责：

- 把 `root.children` 渲染为 widget 节点列表。
- 管理节点 mask、handle、toolbar、fallback、empty state。
- 提供 renderer extensions、event hooks、node actions 与 composables。
- 处理节点交互状态，但 schema 写入回到 core command。

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
- 不直接依赖 core，不执行命令。

主要入口：

- `FormGenerator`。
- `useFieldState()`。
- `useFormValidation()`。
- FormSchema、FieldSchema、FieldComponentMap 类型。

依赖与协作：

- 被 designer 右栏使用。
- 字段组件由 builtin-fields 或业务自定义组件提供。
- 值变更由 designer 转为 core command。

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
- 被 builtin-widgets 复用。
- designer 不强依赖本包，业务可以直接传入 meta 和 componentMap。

## @dragcraft/builtin-widgets

职责：

- 提供基础展示和表单交互两组内置物料。
- 生成默认 widget meta 和 componentMap。

主要入口：

- `getAllWidgetMetas()`。
- `getDefaultComponentMap()`。
- `registerAllWidgets()`。
- `getWidgetsByGroup()`。
- `allWidgetDefinitions`。
- `widgetGroups`。

依赖与协作：

- 依赖 core 的 WidgetMeta 与 DesignerEngine 类型。
- 依赖 widgets 的 WidgetDefinition 和分组类型。
- 通过 designer options 显式传入。

## @dragcraft/builtin-fields

职责：

- 提供 input、number、textarea、select、switch、color、slider 七个内置字段组件。
- 构建默认 fieldComponentMap。

主要入口：

- `buildDefaultFieldComponentMap()`。
- `InputField`、`NumberField`、`TextareaField`、`SelectField`、`SwitchField`、`ColorField`、`SliderField`。

依赖与协作：

- 依赖 form-generator 的字段类型。
- 通过 designer options 或 FormGenerator prop 显式传入。

## @dragcraft/themes

职责：

- 为 Headless UI 包提供 CSS 皮肤。
- 基于 CSS 变量提供 antd 与 material 两套 light 主题。
- 覆盖 designer、renderer、form-generator、widgets 等 class。

主要入口：

- `@dragcraft/themes/antd`。
- `@dragcraft/themes/material`。

依赖与协作：

- 不改变组件逻辑。
- 业务可覆盖 CSS 变量或完全自定义样式。

## @dragcraft/device-frames

职责：

- 提供 iPhone、Android、Tablet、Desktop 画布设备容器。
- 提供设备上下文和 toolbar 切换器工厂。
- 作为 renderer `containerShell` 扩展点使用。

主要入口：

- `createDeviceFrameContext()`。
- `DeviceFrameShell`。
- `DEVICE_FRAME_CONTEXT_KEY`。
- `createDeviceToolbarRenderer()`。
- `useDeviceFrame()`。
- `@dragcraft/device-frames/styles`。

依赖与协作：

- 仅依赖 Vue。
- 与 designer 通过 `toolbarRenderer` 集成。
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
  -> @dragcraft/themes
  -> @dragcraft/builtin-widgets
      -> @dragcraft/widgets
  -> @dragcraft/builtin-fields
  -> @dragcraft/device-frames
  -> @dragcraft/icons

@dragcraft/utils 可被多个基础包复用
```

依赖规则：

- core 不依赖 UI 组件包。
- form-generator 不依赖 core。
- renderer 不直接持久化业务状态。
- designer 负责包组合与对外简化。
- 内置物料和字段都是可选依赖，业务可完全替换。
