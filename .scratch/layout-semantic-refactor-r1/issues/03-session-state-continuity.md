Status: resolved
Type: grilling
Blocked by: 01

## Question

哪些 Designer 会话状态必须与 Schema 写入状态分离，哪些状态必须在底层替换前后保持连续，才能避免选择、悬停、拖放、默认容器 UI、pan/scroll、Frame 和 history 在接入新 Authoring Engine 时丢失？

## Answer

连续性按状态所有权定义，不要求所有响应式状态都跨后端搬运。

### 必须保留的会话核心事实

- 当前 Document 快照与 Resolver diagnostics：新实现从同一快照接管，不能重建为空文档。
- Schema History 时间线与游标：不能清空 undo/redo，也不能改变 redo 分支。
- Selection：按稳定 node id 保留；节点不再存在时才修复为空。

### 可重算或清空的会话投影

- Hover：DOM 重挂载后重新命中或清空，不能保留悬空 id。
- Drop Destination、drop indicator、Selection geometry、Geometry Registry、Surface Reservation：不迁移，切换后重新测量和推导。

### 宿主会话状态

- pan、application scroll、Frame、sidebar、locale、pending confirmation、workspace 必须由 Designer identity 持有，不因 Authoring backend 接管而重建。
- Frame 真正重挂载时允许按既有交互契约复位 pan；其余宿主状态保持。

### Cutover Fence

active HTML5 native drag 期间禁止切换后端。切换只能发生在交互空闲点；若被强制触发，必须取消 drag 并清除 feedback，不伪造或重放 pointer/drop 事件。
