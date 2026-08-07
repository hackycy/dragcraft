# Renderer 如何按切片替换

Status: resolved
Type: grilling
Blocked by: 12, 13

## Question

Renderer 内部交互应按什么可验证切片逐步替换：每个切片的 seam、前置不变量、回退方式和通过条件是什么，才能避免 Phase 4 整体重写导致画布不可用？

## Answer

Renderer 按交互耦合簇替换，不按文件名或组件层级替换。每个切片始终只有一个 active rendering implementation；回退只能在 seam 处切回整个切片，禁止双渲染、双写或复制事件/Schema/history。

### Slice 0：切换护栏

前置条件是 `DesignerSession`、交互基线、Cutover Fence 和唯一旧状态源。只增加宿主级实现选择，不改变画布 DOM，也不允许新旧实现同时渲染同一节点。

### Slice 1：只读数据投影

Renderer 读取改为 `DesignerSession` 的 Document、节点/owner/root/Region、物料展示与 authoring capability、selection/hover/drag/history 状态；现有 DOM、CSS、几何和事件处理保持不变。

通过条件：空画布、普通节点、Container Owner、Region child 原样渲染；新旧读取投影等价。回退到旧 Renderer context，不转换文档或复制状态。

### Slice 2：统一写入路径

toolbar、structure tree、property panel、material create、root/Region drag/drop、container variant、undo/redo 全部改为 `evaluate/execute(action)`；Renderer DOM 与几何仍保持旧实现。

通过条件：一次交互最多一次 history commit；rejected/unchanged 不进 history；undo/redo、redo 分支、confirmation 和最终 Schema 等价。

### Slice 3：节点交互耦合簇

NodeHost、mask/direct-hit policy、hover handle、selection projection、toolbar、node geometry 以及 root-owned/Region child 几何策略作为一个整体替换。

通过条件：root-segment 与 material-bounds、Container Owner 外部选择入口、toolbar orientation、masked/unmasked/self-positioned/container 输入策略、action visible/disabled 全部保持。回退整个节点交互簇。

### Slice 4：Container Region 交互耦合簇

Region Outlet、child 顺序、empty Region、drop geometry、forbidden、unresolved/recovery container 和 container runtime context 共同替换。

通过条件：默认容器 Region 正确挂载；empty/active/forbidden/recovery 互斥；Region drop 不冒泡为 root drop；Region 排序和 root/Region 移动正确；失配容器不吞 children。

### Slice 5：Root Surface 与 Drop Geometry

替换 root document plane、root destination、start/end/before/after feedback、empty canvas、单一 application scrollport 与 selection plane 挂载。

通过条件：root/Region target 互斥；反馈与 geometry 正确；scroll 后重新测量；无重复渲染或节点丢失。

### Slice 6：Frame、Reservation 与 Canvas 几何

最后替换 Application Surface、Presentation Frame、Device Frame 裁剪、Surface Reservation、Geometry Registry、pan/reset 与 viewport plane。

通过条件：Frame 只裁剪业务预览；Designer feedback 不被裁剪；无第二滚动条；Frame 切换与 Cutover Fence 符合既有契约。

### Slice 7：删除旧实现

Slice 1 至 Slice 6 全部通过后，才允许删除旧 Renderer context、旧 Core Engine/Command/Registry、旧 Engine Adapter 和旧 Presentation/CSS。

总体顺序为：先换读取，再换写入，再换节点交互，再换 Region，再换 Root Surface，最后换 Frame 与几何。
