# Schema 结构解析器的阶段与输出接口

Status: resolved
Type: grilling
Blocked by: 01, 02

## Question

在规范化 Schema 和消费端展示边界确定后，定义 Schema 结构解析器的最小公共 interface：输入依赖（Schema、结构/物料声明、只读上下文）、纯数据校验、节点身份与 owner 索引、稳定结构顺序、语义标识诊断和输出结果；明确哪些结果是纯函数可缓存的，以及如何让 Designer 使用派生查询而外部平台只依赖纯数据 Schema。

## Answer

Schema 结构解析器是一个深 module，只公开一个无状态纯函数入口；JSON 解码、结构校验、索引、定义绑定和诊断生成都是内部阶段，不再分别公开 validator、indexer、finder 或 container resolver。

```ts
function resolveSchema(
  input: unknown,
  definitions: SchemaDefinitionSnapshot,
): SchemaResolution
```

`SchemaDefinitionSnapshot` 是 registry 投影出的不可变纯数据视图，通过 `revision` 标识版本。它只包含节点 type、容器 capability、region 和结构约束；不包含 Vue 组件、Designer Preview、Runtime Renderer、表单、图标、DOM/空间策略或可执行回调。

```ts
interface SchemaDefinitionSnapshot {
  readonly revision: number
  readonly types: ReadonlyMap<NodeType, SchemaTypeDeclaration>
}
```

结果使用四态而不是含混的 `valid: boolean`：

```ts
type SchemaResolution =
  | {
      readonly status: 'rejected'
      readonly diagnostics: readonly SchemaDiagnostic[]
    }
  | {
      readonly status: 'ready' | 'degraded' | 'conflicted'
      readonly document: ResolvedDocument
      readonly diagnostics: readonly SchemaDiagnostic[]
    }
```

- `rejected`：纯 JSON 或文档结构无效，不返回部分 document 或索引。
- `ready`：结构与当前定义快照完全一致。
- `degraded`：只存在未注册 type；原数据完整保留，相应节点 unresolved/read-only。
- `conflicted`：结构有效，但与已注册 type、container 或 region 定义冲突；返回 document 供 Designer 诊断展示，但设计器不得提交受影响的结构变更。外部消费端是否接受该 Schema 不由 Dragcraft 裁决。

`ResolvedDocument` 拥有与输入隔离的不可变 Schema 快照，并公开唯一查询面：

```ts
interface ResolvedDocument {
  readonly schema: DeepReadonly<DocumentSchema>
  readonly nodesById: ReadonlyMap<NodeId, ResolvedNode>
  readonly locationsById: ReadonlyMap<NodeId, NodeLocation>
  readonly root: readonly ResolvedNode[]
  readonly containersById: ReadonlyMap<NodeId, ResolvedContainer>
}
```

解析器不修改、补全或修复输入。`ResolvedNode`、owner/location、root sequence 和 container/region view 都引用模块拥有的快照；Map 和派生 view 只存在于内存，不序列化回 Schema。现有 `buildSchemaIndex()`、`findIndexedNode()`、`collectSchemaStructuralDiagnostics()`、`validateSchema()` 和 `createContainerPlan()` 收回 module implementation，调用者统一消费 `ResolvedDocument`。

内部阶段固定为：

1. 解码并验证纯 JSON，创建模块拥有的不可变快照。
2. 校验节点 ID、唯一 owner、root/region 引用、结构顺序和一层容器限制，并建立索引。
3. 使用定义快照解析 type、container capability、region 和结构约束。
4. 生成不可变查询结果与稳定排序的诊断。

诊断是稳定机器数据：

```ts
interface SchemaDiagnostic {
  readonly code: SchemaDiagnosticCode
  readonly phase: 'decode' | 'structure' | 'definition'
  readonly severity: 'warning' | 'error'
  readonly path: string
  readonly nodeId?: NodeId
  readonly containerId?: NodeId
  readonly regionId?: RegionId
  readonly details?: DeepReadonly<JsonObject>
}
```

`path` 使用 JSON Pointer；`details` 必须是纯 JSON；诊断按 phase、path、code 稳定排序。Core 不生成最终文案，Designer 根据 code 映射文案和国际化；外部消费端不依赖这套内存诊断 interface。

解析器本身不持有全局缓存。Engine/Store 以不可变 Schema snapshot identity 与 `definitions.revision` 为键保存当前结果；展示策略变化不使结构缓存失效。第一版不公开 cache、invalidate、incremental parse 或内容 hash interface，内部将来可以分阶段缓存而不改变公共入口。
