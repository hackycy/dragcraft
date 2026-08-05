# 规范化 Schema 与布局关系模型

Status: resolved
Type: grilling
Blocked by: none

## Question

在不支持递归容器、布局关系独立于节点定义、结构顺序唯一的约束下，Schema 的规范化数据结构应如何表达节点身份、节点内容、root 所有权、一层容器区域所有权、页面布局关系和引用完整性？需要决定 `nodes` 使用树、索引表或混合结构，哪些关系是持久化事实，哪些由解析器派生，以及如何保证每个节点只属于一个有效位置。

## Answer

采用“节点定义数组 + 独立文档结构”。当前结构模型不包含 `flow`、`chrome`、`layer`、surface、锚点、避让、滚动或其他布局分类；现有功能只作为后续布局能力代数的验收场景。

```ts
interface DocumentSchema {
  version: string
  globalConfig: JsonObject
  page: PageDefinition
  nodes: NodeDefinition[]
  structure: DocumentStructure
}

interface PageDefinition {
  props: JsonObject
  style?: JsonObject
}

interface NodeDefinition {
  id: NodeId
  type: string
  props: JsonObject
  style?: JsonObject
}

interface DocumentStructure {
  root: NodeId[]
  containers: Record<NodeId, {
    regions: Record<RegionId, NodeId[]>
  }>
}
```

持久化事实与不变量：

1. `page` 是固定文档单例，不是普通节点，不拥有持久化节点 ID，也不参与移动、复制或删除。
2. `NodeDefinition.id` 是节点身份的唯一事实源；`nodes` 中的 ID 必须唯一，数组位置没有领域语义。
3. 每个 `nodes` 节点必须且只能被一个结构 owner 引用：`structure.root` 或一个 container region。孤立、重复或悬空引用都使结构无效。
4. owner 内数组位置是唯一结构顺序；不存在通用 `order` 或第二套结构顺序。
5. `structure.containers[id]` 的 key 必须引用一个 root-owned 容器节点；它描述该节点拥有 region，不算节点的第二次归属。
6. 容器显式保存其类型声明的完整稳定 region 集合，包括空数组。region-owned 节点不能再成为 container owner，从结构上禁止递归容器；视觉 variant 不属于文档结构。
7. 剪贴板、物料模板、拖拽临时节点和 detached 状态属于设计器运行时，不进入持久化 Schema。
8. 新增、移动、删除、复制和容器 unwrap 必须通过原子命令事务同时维护节点表与结构引用。
9. Schema 必须能无损经过 JSON 编解码；禁止函数、`undefined`、`Map`、类实例和循环引用。

结构解析分为两类结果：

- 严格结构校验不依赖 registry，验证 JSON 形态、引用完整性、唯一归属、顺序和一层容器限制。
- 定义解析校验物料类型、容器能力与 region。定义尚未注册时保留原始结构并标记 unresolved/read-only；定义存在但与 Schema 冲突时报告语义错误，不静默补写、删除或修复数据。

`nodesById: Map<NodeId, NodeDefinition>`、`locationsById`、owner/index、resolved container view 和诊断均由结构解析结果派生，不持久化。持久化数组服务 JSON 可读性、导入导出和稳定调试；内部 Map 服务高效查询。结构索引、owner 查找和容器结构解析应隐藏在同一个深 module 内；布局语义作为正交关系由下一张票决定。
