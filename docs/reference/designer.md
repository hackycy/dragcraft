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

`MaterialDefinition.presentation.kind` 必须是 `visual` 或 `headless`。Headless 物料没有画布预览，但仍可以拥有 Schema 默认值和 inspector；拖拽释放后只创建配置节点。

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

## 样式与设备

Designer 拥有工作台 Presentation 的结构 CSS。宿主把 `@dragcraft/device-frames` 的当前 definition 传给 `DcDesigner.deviceFrame`；Device Frame 只提供 slot 外壳，不读取或写入 Schema。
