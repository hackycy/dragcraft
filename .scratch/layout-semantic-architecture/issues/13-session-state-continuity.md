# 会话状态如何保持连续

Status: resolved
Type: grilling
Blocked by: 11

## Question

哪些 Designer 会话状态必须与 Schema 写入状态分离，哪些状态必须在底层替换前后保持连续，才能避免选择、悬停、拖放、默认容器 UI、pan/scroll、Frame 和 history 在接入新 Authoring Engine 时丢失？

## Answer

连续性按状态所有权定义，不要求所有响应式状态都跨后端搬运。

### 同一实例内必须保留的会话核心事实

- 当前 Document 快照与 Resolver diagnostics：UI/Presentation 切片替换不得重建为空文档。
- Schema History 时间线与游标：UI/Presentation 切片替换不能清空 undo/redo，也不能改变 redo 分支。
- Selection：按稳定 node id 保留；节点不再存在时才修复为空。

### 可重算或清空的会话投影

- Hover：DOM 重挂载后重新命中或清空，不能保留悬空 id。
- Drop Destination、drop indicator、Selection geometry、Geometry Registry、Surface Reservation：不迁移，切换后重新测量和推导。

### 宿主会话状态

- pan、application scroll、Frame、sidebar、locale、pending confirmation、workspace 必须由 Designer identity 持有，不因 UI/Presentation implementation 切片替换而重建。
- Frame 真正重挂载时允许按既有交互契约复位 pan；其余宿主状态保持。

### Cutover Fence

backend 在 Designer 实例创建时确定，并在该实例生命周期内保持不变；不支持把已挂载的 Legacy 实例热切为 Next 实例。开发期实现选择通过分别创建的独立实例完成，同一时刻每个实例仍只有一个 Document 和一个 history，因此不需要旧 Schema 到新 Schema 的运行时转换，也不会产生双写。任何仅用于开发的 backend selector 都通过重新创建实例生效，并在 active HTML5 native drag 时禁用；不伪造或重放 pointer/drop 事件。

连续性约束适用于同一实例内的 UI/Presentation 切片替换：这些切片不得重建 session、清空 history 或丢失仍然有效的 Selection。最终 backend cutover 是实例创建路径的代码切换；旧持久化 Schema 和瞬态 history 不在本次无迁移重构中转换。Cutover Fence 因 backend 不可热切而由构造保证。
