---
description: "@dragcraft/designer 的实例创建、物料注册、工作台和公开操作 API。"
---

# @dragcraft/designer

业务应用只需要从 `@dragcraft/designer` 创建一个实例，并提供最终 `MaterialDefinition[]`。Schema、物料校验、编辑历史和 Presentation 都由 Designer 统一管理。

```ts
import { createDesigner, DcDesigner } from '@dragcraft/designer'

const designer = createDesigner({
  schema,
  materials: [textMaterial, noticeMaterial],
  fieldComponentMap,
})
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `createDesigner({ schema?, materials, ... })` | 创建 Next Designer 实例；`materials` 必须提供且可以为空。 |
| `DcDesigner` | 挂载标准工作台。 |
| `useDesigner(instance)` | 读取文档、选择、历史以及导入导出操作。 |
| `MaterialDefinition` | 聚合一个稳定 `type` 的 Schema、authoring、inspector 与 Presentation。 |
| `DesignerExtensions` | 扩展面板、物料项和 rail。 |
| `DesignerDeviceFrame` | `DcDesigner.deviceFrame` 的只读设计态设备外壳定义。 |
| `AuthoringAction` | 执行节点、页面、历史和 Schema 操作。 |
| `@dragcraft/designer/standard.css` | 加载完整 Standard 工作台主题。 |

`PresentationFrame` 是 Application Surface 唯一的几何展示 seam，可选包装单个 NodeHost。`DesignerExtensions`、`actionInterceptors` 与 `customActions` 只用于工作台面板/rail、物料项和 authoring action 协调，是不接收 Schema、几何或 Renderer context 的非 Renderer 宿主扩展。

`MaterialDefinition.presentation.kind` 必须是 `visual` 或 `headless`。Headless 物料没有画布预览，但仍可以拥有 Schema 默认值和 inspector；拖拽释放后只创建配置节点。

## `createDesigner` 选项

| 选项 | 默认值 | 作用 |
| --- | --- | --- |
| `schema` | 空文档 | 初始 `DocumentSchema`；创建时会立即解析。 |
| `materials` | 必填 | 当前页面可解析、创建和编辑的物料集合；可以为空数组。 |
| `maxHistoryEntries` | `50` | 限制可撤销的文档快照数量；设置为 `0` 可停用新增快照。 |
| `fieldComponentMap` | 空映射 | 将 `FormSchema` 的字段键映射到 Vue 控件。 |
| `globalConfigSchema` | 无 | 为右侧“全局配置”页签提供表单。 |
| `extensions` | 无 | 替换面板、物料项或追加 rail 内容。 |
| `customActions` | 默认动作 | 添加或覆盖节点工具栏动作。 |
| `actionInterceptors` | 无 | 在 action 执行前实现确认、权限或审计协调。 |
| `locale` / `messages` | `zh-CN` / 内置消息 | 设置工作台语言并合并业务覆盖文案。 |
| `workspace` | 默认宽屏/窄屏阈值 | 设置面板宽度、断点和键盘快捷键。 |

`materials` 是唯一的物料注册输入；不要让 `schema`、面板和生产 Runtime 各自维护一套互不校验的类型列表。

## 实例控制

```ts
designer.execute({ type: 'select-node', nodeId: 'notice-1' })
designer.execute({
  type: 'update-node',
  nodeId: 'notice-1',
  node: { type: 'notice', props: { text: '新的公告' } },
})

const snapshot = designer.exportSchema()
const load = designer.importSchema(input)
designer.setLocale('en')
designer.dispose()
```

`document`、`selection` 和 `history` 是只读响应式状态。配置错误在创建时抛出 `DesignerConfigurationError`；外部 Schema 错误由 `importSchema()` 返回 `rejected`、`degraded` 或 `conflicted` 状态，并且 rejected 输入不会覆盖当前文档。

| 实例属性/方法 | 行为 |
| --- | --- |
| `document` | 当前文档状态；成功状态带 `schema` 和 `diagnostics`。 |
| `selection` | 只读的 selected/hovered 节点 ref。 |
| `history` | 只读的 undo/redo 能力与计数。 |
| `execute(action)` | 执行 Schema action 或 undo/redo，返回 `committed`、`unchanged`、`rejected` 或 `confirmation-required`。 |
| `exportSchema()` | 返回可 JSON round-trip 的独立快照；文档不可用时返回 `null`。 |
| `importSchema(input)` | 解析并安装外部输入；成功安装会重置该文档的 history。 |
| `setLocale(locale)` | 切换工作台消息语言，不改变 Schema。 |
| `dispose()` | 释放实例资源；组件卸载时调用。 |

## 样式与设备

Designer 拥有工作台 Presentation 的结构 CSS。宿主把 `@dragcraft/device-frames` 的当前 definition 传给 `DcDesigner.deviceFrame`；Device Frame 只提供 slot 外壳，不读取或写入 Schema。
