---
description: "DocumentSchema、MaterialDefinition 和 Designer 的导入导出契约。"
---

# Schema 与 Designer 操作

公开 Schema 是普通 JSON 结构，由 `DocumentSchema` 表示：

```ts
interface DocumentSchema {
  version: string
  globalConfig: JsonObject
  page: PageDefinition
  nodes: NodeDefinition[]
  structure: {
    root: string[]
    containers: Record<string, { regions: Record<string, string[]> }>
  }
}
```

节点的 `type` 是唯一物料语义键。Designer 使用同一份 `MaterialDefinition[]` 解析初始 Schema、导入 Schema 和编辑中的创建操作；业务运行时可以消费导出的纯 JSON，而不需要 Designer 的内部状态或 Presentation。

## 导入、导出和错误

```ts
const designer = createDesigner({ materials, schema })

const exported: DocumentSchema | null = designer.exportSchema()
const result = designer.importSchema(untrustedInput)
if (result.status === 'rejected') {
  // 当前文档保持不变，使用 result.diagnostics 展示恢复态
}
```

配置错误（重复 type、缺失 Presentation、非法 Region 等）在 `createDesigner()` 时抛出。Schema 解析状态是 `ready`、`degraded`、`conflicted` 或 `rejected`；诊断是有界、可排序的纯数据。

## AuthoringAction

所有写入都通过 `designer.execute(action)`：

```ts
designer.execute({ type: 'update-global-config', globalConfig: { title: '首页' } })
designer.execute({ type: 'undo' })
designer.execute({ type: 'redo' })
```

成功写入返回 `committed`，数据没有变化返回 `unchanged`，策略或结构约束拒绝时返回 `rejected`。只有 `committed` 写入进入 history；导入成功会安装新文档并重置该文档的 history。

| action | 必填数据 | 用途 |
| --- | --- | --- |
| `create-node` | `materialType`, `to` | 使用物料默认值创建节点或容器。 |
| `insert-bundle` | `bundle`, `to` | 一次插入节点及其容器结构。 |
| `move-node` | `nodeId`, `to` | 移动到 root 或 container region。 |
| `duplicate-node` | `nodeId`, `to` | 复制节点及其一层 region 子节点。 |
| `remove-node` | `nodeId` | 删除节点及其受管辖的结构。 |
| `unwrap-container` | `containerId` | 移除容器并按规则释放子节点。 |
| `update-node` | `nodeId`, `node` | 更新节点的完整 `type`、`props` 和可选 `style`。 |
| `update-page` | `page` | 更新页面 `props` 和可选 `style`。 |
| `update-global-config` | `globalConfig` | 替换页面级业务配置。 |
| `batch` | `actions` | 把多条 Schema action 合并成一次原子历史提交。 |
| `undo` / `redo` | 无 | 移动已提交的历史游标。 |

`select-node` 和 `hover-node` 也可以通过 `execute()` 调用，但它们只改变设计态交互状态，不进入 DocumentSchema 的保存数据。

## Headless 与容器

Headless Material 仍保留节点配置和 inspector，但不会渲染业务 UI。Container Material 在 `schema.container.regions` 声明区域，区域子节点通过 `structure.containers` 归属。Designer Presentation 负责设计态的 Region outlet、选择平面和拖放反馈；生产 Runtime 可以使用同一 `DocumentSchema` 实现自己的布局。
