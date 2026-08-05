# 设计器结构操作与历史模型

Status: resolved
Type: grilling
Blocked by: 01, 03, 04

## Question

决定新增、移动、删除、复制、容器 unwrap、排序、拖放插入和撤销重做如何基于新的所有权与结构关系工作；需要确定命令的最小 interface、NodeBundle、索引/查询模型、锁定和 authoring policy 的位置，以及如何让结构操作只使用真实 owner 序列索引。

## Answer

设计器写入拆成两个深 module：有状态 `AuthoringEngine` 保留现有 toolbar、画布拖放、结构树、选中反馈和撤销重做交互；纯 `SchemaEditor` 只负责封闭的 Schema 变换。现有 UI 不重新设计，交互产生 `AuthoringAction`，经 Designer `AuthoringPolicy` 裁决后编译为纯数据 `SchemaOperation` 或 `OperationBatch`。

```ts
authoringEngine.execute(action: AuthoringAction): AuthoringResult

function applySchemaOperation(
  document: ResolvedDocument,
  request: SchemaOperation | OperationBatch,
  definitions: SchemaDefinitionSnapshot,
): SchemaEditResult
```

Core 不再暴露可注册 custom handler、可变 Schema draft、JSON Patch 或每种操作一个公共方法。`applySchemaOperation()` 是唯一结构写入 interface，不读取或修改 Vue Store、selection、hover、history、DOM 或 EventHub，也不修改传入 document。结果为三态：

```ts
type SchemaEditResult =
  | {
      status: 'rejected'
      code: SchemaEditErrorCode
      diagnostics?: readonly SchemaDiagnostic[]
      details?: JsonObject
    }
  | { status: 'unchanged', document: ResolvedDocument }
  | { status: 'committed', document: ResolvedDocument }
```

`unchanged` 保持原 document 引用；`rejected` 不返回半成品；`committed` 返回拥有新不可变 Schema 快照和索引的 `ResolvedDocument`。只有 Authoring Engine 可以安装 committed 结果，并在一次提交中更新 Store、history、事件和交互状态。

Core 的封闭操作词汇至少包含 `insert-bundle`、`move`、`remove`、`unwrap`、`update-node`、`update-page` 与 `update-global-config`。新增和复制不是两套 Core 实现：它们是不同 Authoring Action，但都生成完整 `NodeBundle` 并编译为 `insert-bundle`。

```ts
interface NodeBundle {
  entryId: NodeId
  nodes: NodeDefinition[]
  containers: Record<NodeId, ContainerStructure>
}

interface InsertBundleOperation {
  type: 'insert-bundle'
  bundle: NodeBundle
  to: StructuralDestination
}
```

Bundle 是与放置位置无关的自包含 aggregate。Authoring factory 负责首次创建的默认 props、children 和全部新 ID；通用 Authoring clone helper 负责复制现有 aggregate 并完整重映射 ID。Core 不调用物料初始化回调、不生成 ID、不补 child：它验证 `entryId`、内部唯一 owner、regions、引用、type、cardinality 和全局 ID 后整体插入或整体拒绝。普通节点 bundle 只有 entry；容器 bundle 包含 owner、全部 region children 与完整 region 引用。

结构目的地不公开数字下标，而使用真实 owner 与相对锚点：

```ts
type OwnerRef =
  | { kind: 'page-root' }
  | { kind: 'container-region', containerId: NodeId, regionId: RegionId }

type InsertPosition =
  | { kind: 'start' }
  | { kind: 'end' }
  | { kind: 'before', nodeId: NodeId }
  | { kind: 'after', nodeId: NodeId }

interface StructuralDestination {
  owner: OwnerRef
  position: InsertPosition
}
```

Core 通过 `ResolvedDocument.locationsById` 和 owner 查询验证锚点属于目标序列，再派生实际 index。锚点不存在或不属于目标 owner 时明确拒绝，不静默 clamp。这样 toolbar 上移/下移和拖放前后位置保持原交互，却不再由调用者处理同 owner 移动的 index 偏移；Schema 仍只保存 owner 数组顺序。

`move`、`remove` 与 `unwrap` 都是不可拆分的领域操作，而不是要求调用者组合数组修改：move 原子更新 source/target owner；删除容器级联删除完整 aggregate；unwrap 按 region declaration 顺序把 children 提升到 root 后删除 owner。任何操作都验证最终唯一 owner、引用、region constraints 和一层容器限制，失败不产生部分修改。

跨多个独立意图使用一次性纯数据 `OperationBatch`，删除 `beginTransaction()`、`commitTransaction()` 与 `discardTransaction()`：

```ts
interface OperationBatch {
  type: 'batch'
  operations: readonly SchemaOperation[]
}
```

Batch 在一个私有工作快照上顺序执行且禁止嵌套；每个子操作都必须产生合法结构，后一个可读取前一个结果。任一子操作失败则整体丢弃；成功只安装一次 Schema、写一条 history 并发一次 Schema change。move/remove/unwrap 的内部多关系修改不展开成 batch。

History 使用有界不可变 Schema 快照时间线与游标，不保存 inverse operation，也不重放 Schema Operation。`maxHistoryEntries` 必须配置上限，默认 50，`0` 表示关闭；时间线最多保留 `maxHistoryEntries + 1` 个 Schema 快照。undo/redo 只移动游标；在 undo 后产生新提交会先丢弃 redo 分支，再按上限裁剪最旧记录。no-op、rejected operation 不写 history，OperationBatch 只写一条。selection、hover、弹窗、预览与外部状态不进入 history；恢复快照后用当前 definition snapshot 重新解析，可能得到 ready、degraded 或 conflicted，但不重新执行 Authoring Policy。

Schema 合法性与设计态许可严格分离。Schema Structure Resolver 与 Schema Editor 始终执行纯数据结构不变量；Designer `AuthoringPolicy` 根据物料能力和设计态 context 决定 action 是 allowed、denied 或 confirmation-required。Policy 不能放行非法 Schema，也不使合法 Schema 因锁定状态而 conflicted。确认由 Designer 在产生 Schema Operation 前处理；可信导入、history restore 和测试工具可绕过 Authoring Policy，但不能绕过 Schema 结构校验。
