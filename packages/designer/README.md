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
    └── DcToolbar.ts                    # 顶部工具栏
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
- 采用事件委托模式处理拖放：通过 `data-node-id` DOM 属性定位目标容器。
- 支持画布容器壳自定义渲染（通过 `canvasContainerRenderer` 扩展点）。
- 支持拖拽过程高亮反馈：`dragOverNodeId` 传递至 `RootRenderer` 驱动 `DropIndicator`。
- 拖拽落地通过 core 命令提交（`ADD_NODE` / `MOVE_NODE`），不允许直接改 UI 本地状态。
- 点击画布空白处取消选中。

### 右栏：配置区 (`DcPropertyPanel`)

- 集成 `@dragcraft/form-generator` 的 `FormGenerator`。
- 固定两个 Tab：`Global`（全局配置）与 `Widget`（当前选中组件配置）。
- `Global` 永久可见；`Widget` 依赖当前选中节点。
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
  extensions: { canvasContainerRenderer: PhoneShell },
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
| `canvasContainerRenderer` | 替换中栏容器壳（手机壳等） |
| `propertyPanelRenderer` | 替换右栏配置区渲染 |
| `renderWidgetItem` | 自定义单个物料卡片渲染 `(meta: WidgetMeta) => Component` |
| `rendererExtensions` | 透传给 `@dragcraft/renderer` 的扩展（`containerShell`、`dropIndicator`） |

## 组件列表

| 组件 | CSS 类 | 说明 |
|------|--------|------|
| `DcDesigner` | `dc-designer`, `dc-designer__body`, `dc-designer__panel--left/center/right` | 根组件 |
| `DcMaterialPanel` | `dc-material-panel`, `dc-material-panel__search` | 左栏物料面板 |
| `DcMaterialGroup` | `dc-material-group`, `dc-material-group__header`, `dc-material-group__body` | 可折叠分组 |
| `DcMaterialItem` | `dc-material-item`, `dc-material-item__icon`, `dc-material-item__title` | 可拖拽卡片 |
| `DcCanvas` | `dc-canvas` | 画布区域 |
| `DcPropertyPanel` | `dc-property-panel`, `dc-property-panel__tabs`, `dc-property-panel__tab` | 属性面板 |
| `DcToolbar` | `dc-toolbar`, `dc-toolbar__btn` | 工具栏 |

## 包内依赖原则

- 对外只暴露 `@dragcraft/designer`。
- 其他包作为内部实现细节，但保持可单独开发与测试。
- 所有写操作必须通过核心命令系统，不允许直接修改 schema。

## 开箱即用默认能力

- 默认三栏布局。
- 默认拖拽交互与高亮态。
- 默认 widgets + 默认配置表单渲染。
- 默认导入导出 schema API。
- 默认 undo/redo 工具栏。

## 设计约束

- 所有组件使用 `defineComponent` + `h()` 渲染函数，不使用 SFC 模板。
- 仅使用 CSS class 名称，不包含内联样式。
- provide/inject 上下文模式传递数据。
- TypeScript-first，完整类型导出。
