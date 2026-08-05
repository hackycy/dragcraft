# 一层容器与 Region 约束模型

Status: resolved
Type: grilling
Blocked by: 01, 02

## Question

在明确不支持递归容器的产品边界下，决定容器、variant、region、子节点所有权和页面布局关系如何接入同一套语义解析；需要定义 region 声明、容量/类型约束、variant 切换结果、插入目标和节点在 root 与 region 间移动时的持久化规则，同时避免恢复旧的 `ContainerPlan` 与 `LayoutPlan` 双轨体系。

## Answer

容器是位于页面 root、拥有一组稳定语义 regions 的结构 owner。持久化结构不保存 `variant`；`single-column`、`two-column`、`stacked`、`tabs` 等视觉变化由 Designer Presentation Adapter 或外部消费端自行解释，不得改写 child 归属拓扑。

```ts
interface ContainerStructure {
  regions: Record<RegionId, NodeId[]>
}

interface ContainerDeclaration {
  regions: readonly RegionDeclaration[]
}

interface RegionDeclaration {
  id: RegionId
  accepts?: {
    types?: readonly NodeType[]
  }
  cardinality?: {
    min?: number
    max?: number
  }
}
```

结构不变量：

1. `structure.containers[containerId]` 必须引用一个 root-owned 节点；该节点的已注册 type 必须声明 container capability。
2. 已注册容器的 Schema region key 集合必须与类型声明完全一致，包括空数组；解析器不自动补 region。
3. Region 是稳定语义 child 序列，不描述 flex、grid、滚动、标签页或几何。
4. Region child 不能拥有 container capability；容器 owner 只能位于 root，从结构上禁止递归。
5. 未注册 container type 保留全部 regions 和 child 引用并进入 degraded/read-only；已注册定义冲突进入 conflicted。
6. 视觉 variant 不持久化；若一个模式真正改变业务语义，应使用不同 type 或普通业务 props，但不能改变 region 集合。

Region 约束是 Dragcraft Schema 的封闭纯数据结构规则：可按 type 限制接受集合，并声明 min/max cardinality。未声明 `accepts` 时接受所有非容器节点。Core 不执行任意 `canPlace()`；Designer 可增加交互提示或临时 authoring policy，但不能改变 Schema 合法性。外部消费端只接收验证后的结构数据，不依赖 Designer 的定义注册表。

新增或复制容器时，Authoring 层先生成完整纯数据 `NodeBundle`，包含 owner、所有 descendants 和完整 region 引用。Core 在一个操作中验证 ID、regions、type、cardinality 和唯一 owner 后原子提交；Schema 结构解析器不创建节点或调用 `createInitialState()`。Bundle 的统一插入 interface 由[设计器结构操作与历史模型](07-authoring-operations-model.md)定义。

解析结果统一使用真实 owner 序列位置：

```ts
type NodeLocation =
  | { kind: 'page-root', index: number }
  | { kind: 'container-region', containerId: NodeId, regionId: RegionId, index: number }
```

普通 region child 可以移动到 root、其他 region 或在本 region 重排；容器 owner 只能位于 root。移动只改变结构引用，节点定义不变，也没有 placement/order 清理。Authoring interface 使用 owner 与相对节点锚点，Core 再派生真实 index；Core 原子检查 source/target cardinality、accepts 和唯一 owner，Designer Authoring module 独立检查 authoring lock。

容器 owner 与其 region children 构成结构 aggregate：remove 级联删除完整 aggregate；duplicate Authoring Action 深复制并重新生成所有 ID，再通过统一 bundle 操作插入；显式 unwrap 删除 owner、保留 children，并按 region declaration 顺序提升到 root。是否在 UI 中确认删除属于 Designer policy。

`ResolvedDocument.containersById` 直接提供已解析 container/region view，不再存在独立 `ContainerPlan`。Core 结构协议删除 `variant`、`CHANGE_CONTAINER_VARIANT`、`migrateVariant()`、`createInitialState()` 与 `canPlace()`；presentation variant 不进入 Schema history。
