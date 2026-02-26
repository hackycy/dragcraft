# @dragcraft/designer

`@dragcraft/designer` 是 dragcraft 的唯一对外入口包。

## 对外定位

- 业务方仅需引入本包即可使用设计器。
- 本包统一导出：组件、API、类型、默认插件、默认物料。
- 内部协调 `core/renderer/form-generator/widgets`，对外屏蔽复杂度。

## 技术栈

- Vue 3（Composition API）
- 依赖 `@dragcraft/core` 作为唯一状态与命令来源

## 目录结构

```
src/
├── index.ts                            # 公共 API 统一导出
├── types.ts                            # 所有 designer 专属类型
├── context.ts                          # provide/inject 上下文
├── factory.ts                          # createDesigner() 工厂函数
├── composables/
│   ├── index.ts
│   ├── useDesigner.ts                  # 响应式 API 包装
│   ├── useDragDrop.ts                  # HTML5 拖放协调
│   └── usePropertyBinding.ts           # 选中节点 ↔ 表单属性桥接
└── components/
    ├── index.ts
    ├── DcDesigner.ts                   # 根组件：三栏布局
    ├── DcMaterialPanel.ts              # 左栏：物料面板
    ├── DcMaterialGroup.ts              # 可折叠物料分组
    ├── DcMaterialItem.ts               # 可拖拽物料卡片
    ├── DcCanvas.ts                     # 中栏：画布区域
    ├── DcPropertyPanel.ts              # 右栏：属性配置面板
    └── DcToolbar.ts                    # 画布内 slot 工具栏
```

## UI 结构（左-中-右）

### 左栏：物料区 (`DcMaterialPanel`)

- 支持 widget 分组展示（`DcMaterialGroup`）。
- 支持模糊搜索（按 title/type 过滤）。
- 支持拖拽源创建（drag start 时设置 `engine.store.setDragTarget`）。
- 支持 `renderWidgetItem` 自定义渲染物料卡片。
- 支持读取 widget 自带 form schema 供右侧配置联动。

### 中栏：画布区 (`DcCanvas`)

- 集成 `@dragcraft/renderer` 的 `RootRenderer`。
- 扁平模型：所有 widget 直接添加到 root.children 列表。
- 拖拽始终 drop 到 root 节点（无容器查找逻辑）。
- 支持拖拽过程高亮反馈：`dragOverNodeId` + `dragOverIndex` 传递至 `RootRenderer`，驱动 `DropIndicator` 在精确位置渲染。
- 拖拽位置通过鼠标 Y 坐标与各 widget 垂直中点比较实时计算，实现任意位置插入。
- 拖拽落地通过 core 命令提交（`ADD_NODE` / `MOVE_NODE`），不允许直接改 UI 本地状态。
- 新 widget 添加后自动选中。
- 点击画布空白处（包括 widget 之间的间隙区域）取消选中。利用 `data-node-id` 属性判断点击是否落在 widget 节点内。
- 画布内集成 `DcToolbar`，通过 `toolbarRenderer` 扩展点渲染自定义工具栏内容（详见下方 Toolbar 章节）。

### 右栏：配置区 (`DcPropertyPanel`)

- 集成 `@dragcraft/form-generator` 的 `FormGenerator`。
- 固定两个 Tab：`Global`（全局配置）与 `Widget`（当前选中组件配置）。
- `Global` 永久可见；`Widget` 依赖当前选中节点。
- 选中 widget 时自动切换到 `Widget` Tab，确保用户立即看到该组件的配置项。
- 属性变更通过 `UPDATE_PROPS` / `SET_GLOBAL_CONFIG` 命令提交。
- 节点切换时通过 `key` 强制重新挂载表单。

## 公开 API

### 工厂函数

```ts
import { createDesigner } from '@dragcraft/designer'

const designer = createDesigner({
  // 可选：核心引擎选项
  engineOptions: { initialSchema, maxHistorySize: 50 },
  // 可选：是否注册内置物料（默认 true）
  registerDefaultWidgets: true,
  // 可选：额外物料
  extraWidgets: [myCustomWidgetMeta],
  // 可选：额外组件映射
  extraComponentMap: { 'my-widget': MyWidgetComponent },
  // 可选：自定义表单字段组件
  fieldComponentMap: { 'code-editor': CodeEditorField },
  // 可选：全局配置表单 schema
  globalConfigSchema: myGlobalFormSchema,
  // 可选：扩展点
  extensions: { materialPanelRenderer: CustomPanel },
  // 可选：事件拦截钩子（选中/删除/移动/拖拽）
  eventHooks: {
    onBeforeDelete: ({ nodeId }) => confirm(`确认删除 ${nodeId}？`),
    onAfterSelect: ({ nodeId }) => console.log('选中:', nodeId),
  },
  // 可选：自定义节点工具栏动作（追加到默认 4 个内置动作）
  customActions: [
    {
      key: 'duplicate',
      label: '复制',
      icon: '📋',
      type: 'button',
      order: 350,
      handler: (ctx) => { /* 复制逻辑 */ },
    },
  ],
})
```

### Composable

```ts
import { useDesigner } from '@dragcraft/designer'

const {
  schema,            // ShallowRef<DesignerSchema>
  selectedNodeId,    // Ref<string | null>
  hoveredNodeId,     // Ref<string | null>
  execute,           // (command) => void
  undo,              // () => void
  redo,              // () => void
  canUndo,           // () => boolean
  canRedo,           // () => boolean
  importSchema,      // (schema) => void
  exportSchema,      // () => DesignerSchema
  on,                // (event, listener) => void
  off,               // (event, listener) => void
} = useDesigner(designer)
```

### Vue 组件

```vue
<template>
  <DcDesigner :instance="designer" />
</template>
```

## 扩展点设计 (`DesignerExtensions`)

| 扩展点 | 说明 |
|--------|------|
| `materialPanelRenderer` | 替换左栏整体渲染 |
| `propertyPanelRenderer` | 替换右栏配置区渲染 |
| `renderWidgetItem` | 自定义单个物料卡片渲染 `(meta: WidgetMeta) => Component` |
| `rendererExtensions` | 透传给 `@dragcraft/renderer` 的扩展点（共 8 个：`containerShell`、`dropIndicator`、`nodeWrapper`、`nodeToolbar`、`nodeMask`、`nodeHandle`、`emptyState`、`widgetFallback`） |
| `toolbarRenderer` | 画布内工具栏自定义渲染 `(api: ToolbarSlotAPI) => VNodeChild` |

### 画布内 Toolbar（Slot-Based）

工具栏位于画布区域内部顶部（`position: sticky`），采用 slot 模式渲染。
默认不显示工具栏，需通过 `toolbarRenderer` 扩展点传入自定义渲染函数。

```ts
import { h } from 'vue'
import type { ToolbarSlotAPI } from '@dragcraft/designer'

const designer = createDesigner({
  extensions: {
    toolbarRenderer: (api: ToolbarSlotAPI) => [
      h('button', {
        class: 'dc-toolbar__btn',
        onClick: () => api.undo(),
        disabled: !api.canUndo(),
      }, 'Undo'),
      h('button', {
        class: 'dc-toolbar__btn',
        onClick: () => api.redo(),
        disabled: !api.canRedo(),
      }, 'Redo'),
    ],
  },
})
```

`ToolbarSlotAPI` 提供以下操作：

| 属性 | 类型 | 说明 |
|------|------|------|
| `undo` | `() => void` | 撤销上一步操作 |
| `redo` | `() => void` | 重做上一步撤销 |
| `canUndo` | `() => boolean` | 是否可撤销 |
| `canRedo` | `() => boolean` | 是否可重做 |
| `execute` | `(command) => void` | 执行引擎命令 |
| `engine` | `DesignerEngine` | 引擎实例（高级用途） |

## 组件列表

| 组件 | CSS 类 | 说明 |
|------|--------|------|
| `DcDesigner` | `dc-designer`, `dc-designer__body`, `dc-designer__panel--left/center/right` | 根组件 |
| `DcMaterialPanel` | `dc-material-panel`, `dc-material-panel__search` | 左栏物料面板 |
| `DcMaterialGroup` | `dc-material-group`, `dc-material-group__header`, `dc-material-group__body` | 可折叠分组 |
| `DcMaterialItem` | `dc-material-item`, `dc-material-item__icon`, `dc-material-item__title` | 可拖拽卡片 |
| `DcCanvas` | `dc-canvas`, `dc-canvas__content` | 画布区域 |
| `DcPropertyPanel` | `dc-property-panel`, `dc-property-panel__tabs`, `dc-property-panel__tab` | 属性面板 |
| `DcToolbar` | `dc-toolbar`, `dc-toolbar__btn`, `dc-toolbar__spacer` | 画布内 slot 工具栏 |

## 包内依赖原则

- 对外只暴露 `@dragcraft/designer`。
- 其他包作为内部实现细节，但保持可单独开发与测试。
- 所有写操作必须通过核心命令系统，不允许直接修改 schema。

## 开箱即用默认能力

- 默认三栏布局。
- 默认拖拽交互与高亮态。
- 默认 widgets + 默认配置表单渲染。
- 默认导入导出 schema API。
- 画布内 slot 工具栏，通过 `toolbarRenderer` 扩展点自定义内容。

## 设计约束

- 所有组件使用 `defineComponent` + `h()` 渲染函数，不使用 SFC 模板。
- 仅使用 CSS class 名称，不包含内联样式。
- provide/inject 上下文模式传递数据。
- TypeScript-first，完整类型导出。

## 无头设计（Headless Design）

本包采用无头组件模式：所有组件仅输出语义化 BEM CSS 类名（`dc-*`），不捆绑任何 CSS 样式文件。

视觉样式由独立的 `@dragcraft/themes` 包提供，支持以下使用模式：

- **开箱即用**：`import '@dragcraft/themes/antd'` 或 `import '@dragcraft/themes/material'`
- **无头模式**：不导入皮肤，自行编写全部 CSS
- **自定义换肤**：导入皮肤后覆盖 CSS 变量
