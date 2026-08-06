# 包职责索引

本章提供所有 workspace package 的职责、主要导出、依赖方向和集成方式索引。只有标记为“公开”的 package 属于业务支持面；内部 package 可以作为传递依赖发布，但业务应用不得直接导入。

## 总览

| Package | 支持级别 | 定位 |
| --- | --- | --- |
| `@dragcraft/designer` | 公开 | 唯一主入口、Vue3 工作台、聚合扩展接口与 Standard 主题 |
| `@dragcraft/device-frames` | 公开可选 | 设备容器框架 |
| `@dragcraft/fields-*` | 公开可选 | UI 库字段 adapter；当前实现为 `@dragcraft/fields-ant-design-vue` |
| `@dragcraft/core` | 内部 | 纯数据文档、结构解析与原子 Schema 编辑 |
| `@dragcraft/form-generator` | 内部 | 配置面板 schema 表单引擎 |
| `@dragcraft/ui` | 内部 | 共享 Vue UI 模块与统一滚动区域 |
| `@dragcraft/icons` | 内部 | SVG 图标模块 |
| `@dragcraft/i18n` | 内部 | Vue UI 模块共享的响应式国际化上下文 |
| `@dragcraft/utils` | 内部 | 跨包复用纯函数工具 |

## @dragcraft/core

职责：

- 定义纯 JSON `DocumentSchema` 与不可变文档值类型。
- 通过 Schema Structure Resolver 校验结构并生成 `ResolvedDocument` 查询模型。
- 通过 Schema Editor 原子应用封闭的 `SchemaOperation` 与 `OperationBatch`。
- 保持平台无关，不持有 Vue 会话状态、history、material 展示或浏览器几何。

主要入口：

- `resolveSchema()`。
- `applySchemaOperation()`。
- `DocumentSchema`、`ResolvedDocument`、`SchemaDefinitionSnapshot`、`SchemaOperation` 与结构目的地类型。

依赖与协作：

- 只被 Designer 内部的 Material Catalog、Authoring Engine 与 Presentation 实现消费。
- 不依赖 Vue、Designer、form-generator、device-frames 或其他展示模块。

## @dragcraft/designer

职责：

- 标准业务接入入口。
- 组合 Core、Authoring Engine、ApplicationSurface 与 form-generator。
- 提供可折叠 Dock、可平移画布和 Inspector 的响应式 Vue 可视化搭建工作台。
- 管理基于容器宽度的 wide/compact 模式与互斥抽屉。
- 管理拖拽、属性绑定、受控 Authoring Action 与 Presentation 扩展。
- 通过 `bindings/field-binding.ts` 纯函数 helpers 翻译属性面板字段绑定。

主要入口：

- `createDesigner()`。
- `DcDesigner`。
- `useDesigner()`。
- `DesignerInstance`、`DocumentSchema`、`MaterialDefinition` 与 Presentation 扩展类型。
- Designer Region Outlet、Viewport Portal、Surface Reservation 与 form 接入 interface。
- `@dragcraft/designer/standard.css`、`@dragcraft/designer/structure.css` 与主题契约 JSON。

依赖与协作：

- 依赖 Core、form-generator、i18n、UI、icons 与 utils 等内部 implementation module。
- 用户只传入一个 `MaterialDefinition[]` 与可选 `fieldComponentMap`。
- Designer 聚合必要结构样式和唯一 Standard 工作台主题；业务通过 token 或公开 hook 覆盖差异。

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
- 值变更由 Designer 转为封闭的 Authoring Action。

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

## @dragcraft/ui

职责：

- 提供 designer 与宿主扩展复用的基础 Vue UI 模块。
- 统一原生滚动 viewport、覆盖层 scrollbar、thumb 几何和 pointer 交互。
- 发布结构 CSS、视觉 recipe 与完整默认样式入口。

主要入口：

- `DcScrollArea`。
- `ScrollAreaProps` 与 `ScrollAreaType`。
- `@dragcraft/ui/styles`。
- `@dragcraft/ui/structure.css` 与 `@dragcraft/ui/recipe.css`。

依赖与协作：

- 只 peer 依赖 Vue，不依赖 Designer 或 device-frames。
- 被 designer 的物料、结构树和属性面板消费。
- Designer 的 Standard 主题聚合其结构层、视觉 recipe 和公开 token 契约。

## @dragcraft/device-frames

职责：

- 提供 iPhone 15 Pro、iPhone X、iPhone 8、普通与水滴屏 Android、Tablet、Desktop 画布设备容器。
- 提供冻结且引用稳定的 Device Frame Definitions、有序只读目录和受控设备选择组件。
- 每个 definition 包含开放字符串 ID、展示元数据、可用 viewport 几何和 slot-only Container Shell。

主要入口：

- `IPHONE_DEVICE_FRAME` 等单个内置 definition constants。
- `BUILT_IN_DEVICE_FRAMES`。
- `DevicePicker`。
- `DeviceFrameDefinition`、`DeviceFrameGroup`、`DeviceFrameViewport`。
- `@dragcraft/device-frames/styles.css`。

依赖与协作：

- peer 依赖 Vue，workspace 依赖只有 `@dragcraft/icons`；不依赖 Designer、Core 或 UI。
- Active Device Frame 与 ID 解析由宿主持有；包内没有 context、controller 或路由 Shell。
- `DevicePicker` 接收 definitions/modelValue 并只发出 `update:modelValue`。
- 宿主把 definition 的 `containerShell` 或 readonly component ref 传给 Designer `containerShell` seam。
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
- 集中 Designer 与 form-generator 使用的国际化协议与类型。

主要入口：

- `createI18n()`。
- `useI18n()`。
- `I18N_KEY`。
- `I18nInstance`、`LocaleMessages`、`MessageTree`。

依赖与协作：

- peer 依赖 Vue。
- 被 Designer 和 form-generator 内部消费；业务通过 Designer 聚合 interface 使用。
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

- 被 Designer 等内部上层模块复用，不属于业务 interface。
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
  -> @dragcraft/form-generator
  -> @dragcraft/i18n
  -> @dragcraft/ui
  -> @dragcraft/icons
  -> @dragcraft/utils

@dragcraft/designer -> @dragcraft/ui
@dragcraft/designer -> @dragcraft/utils
@dragcraft/device-frames -> @dragcraft/icons
```

依赖规则：

- Core 不依赖 Vue 或 UI 模块。
- form-generator 不依赖 core。
- i18n 只依赖 Vue，不依赖任何 dragcraft UI 组件包。
- utils 不依赖 Vue 或 DOM。
- Designer 负责包组合与对外简化。
- README、公开文档、examples 和 playground 只能直接导入 Designer、Device Frames 和 `@dragcraft/fields-*` 字段 adapter package。
- 业务应用负责提供物料实现，并选择内置字段包或自定义字段 adapter。
