# Schema 与 Authoring Engine

`DocumentSchema` 是编辑器、持久化服务和生产运行时之间的纯数据契约。它不保存 Vue 实例、选中状态、拖拽状态或 history。

## 文档模型

```ts
interface DocumentSchema {
  version: string
  globalConfig: JsonObject
  page: PageDefinition
  nodes: NodeDefinition[]
  structure: {
    root: NodeId[]
    containers: Record<NodeId, ContainerStructure>
  }
}
```

节点由 `nodes` 保存；页面节点顺序由 `structure.root` 保存。容器的 region 顺序由 `structure.containers[containerId]` 保存。节点 `type` 是唯一稳定语义键，`id` 只标识该次实例。

## 解析结果

Designer 对初始输入和 `importSchema(input)` 使用同一解析管线。结果是：

| 状态 | 含义 |
| --- | --- |
| `ready` | 输入完整符合当前物料声明。 |
| `degraded` | 保留未知 type，设计态使用只读 fallback。 |
| `conflicted` | 保留数据，但受影响结构不能写入。 |
| `rejected` | 输入不能安装，当前文档保持不变。 |

diagnostics 是有界、稳定排序的纯数据；宿主应按 code 本地化文案，而不是依赖实现细节。

## 写入与历史

`DesignerInstance.execute(action)` 是公开写入口。action 返回 `committed`、`unchanged`、`rejected` 或 `confirmation-required`。无变化和拒绝结果不进入 history。

```ts
designer.execute({
  type: 'move-node',
  nodeId: 'notice-1',
  to: { kind: 'root', index: 0 },
})
```

`batch` 将一组 schema action 原子化为一个 history 条目。undo/redo 恢复已提交文档，不会重新运行 authoring policy。

## Material 投影

`MaterialDefinition[]` 只在 Designer 创建时注册。内部会将其投影为解析、authoring 和 Presentation 所需的数据，但这些投影不是公开 API，也不交付给生产运行时。

重复 type、缺少 `presentation`、visual 物料缺少 preview、或非法容器/region 声明均为宿主配置错误。未知 type 是 Schema 数据状态，和显式 `headless` 物料不同。
