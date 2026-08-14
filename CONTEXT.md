# Dragcraft Domain

Dragcraft 是把可持久化页面声明解释为可编辑界面的设计器领域，并向自主的外部消费端交付纯数据文档。

## Language

**文档 Schema（Document Schema）**:
Dragcraft 持久化和跨平台交付的纯 JSON 页面文档，包含 page、节点定义与文档结构；它不包含 Designer 内存索引、展示策略或生产 renderer。
_Avoid_: DesignerSchema、Runtime Schema、已解析文档

**页面（Page）**:
每份设计文档固定存在的配置单例，承载页面级属性与样式，但不参与普通节点的所有权、移动、复制或删除。
_Avoid_: Root Node、根节点

**文档结构（Document Structure）**:
Schema 中描述节点身份、唯一所有权与 owner 内结构顺序的纯数据关系；它只包含页面 root 和一层容器 region，不表达节点如何占据或叠放空间。
_Avoid_: 布局树、布局投影

**结构归属（Structural Ownership）**:
节点在文档结构中的唯一位置：页面 root 或某个一层容器 region；owner 内的引用序列同时定义节点的结构顺序。
_Avoid_: 布局位置、渲染位置

**结构目标（Structural Destination）**:
Authoring Action 对目标 owner 及其 start、end、before 或 after 锚点的纯数据描述；真实数组下标由 Core 根据当前 owner 序列派生。
_Avoid_: 投影下标、拖放像素位置、公开数组 index

**容器 owner（Container Owner）**:
位于页面 root 并在文档结构中拥有一组稳定 regions 的节点；由于不支持递归容器，它不能成为任何 region 的 child。
_Avoid_: 容器节点（当无法区分 owner 与内部节点时）

**Region child**:
结构归属于某个容器 region 的普通节点，可以在 root 与 regions 之间移动，但不能再拥有 regions。
_Avoid_: 容器内节点、嵌套节点

**Region**:
由容器类型声明的稳定语义 child 序列，同时表达 child 的结构归属与顺序；它不描述 flex、grid、标签页或其他空间展示。
_Avoid_: Slot、Surface、布局区域

**节点类型（Node Type）**:
节点所属物料及其数据契约的稳定语义标识，也是 Designer 选择设计态展示、外部消费端解释节点的唯一公共键。
_Avoid_: role、实例 name、节点 ID、布局分类

**物料定义（Material Definition）**:
框架使用者通过单一物料集合向 Designer 注册一个节点类型所需的聚合声明，集中包含纯数据结构契约、Authoring 行为和显式 visual/headless 设计态展示；它不进入 Schema，也不包含任何生产消费端 renderer。
_Avoid_: WidgetMeta 与 ComponentMap 双注册、Runtime Material、跨平台组件定义

**Headless Material**:
具有 Schema 节点和业务行为、但没有自身业务可视输出的物料；Designer 使用框架拥有的代理表示支持选择、配置和结构操作。
_Avoid_: preview 遗漏、未知物料、隐形节点

**Application Surface**:
Designer 内部承载应用页面预览、滚动、节点挂载、交互覆盖和浏览器几何的唯一画布表面；它是框架实现，不是 Schema 空间模型或使用者必须注册的 Adapter。
_Avoid_: MiniProgramSurfaceAdapter、LayoutPlan、业务 Runtime Surface

**Renderer Frame Boundary**:
每个 Designer 画布实例中稳定包围 Device Frame/Application Surface 并承载私有 Interaction Plane 的坐标边界，使业务预览接受设备裁剪而选区与 toolbar 不被裁剪。
_Avoid_: body portal、Device Frame interaction layer、全局 toolbar boundary

**Device Frame**:
宿主持有的只读设计态设备外壳定义，通过 `DcDesigner` 的 `deviceFrame` 展示属性包围唯一 Application Surface；它只渲染一次 surface slot，不读取 Schema、历史或 Renderer context，也不进入 DocumentSchema。
_Avoid_: ContainerShell public extension、RendererExtensions、Schema device field

**Presentation Frame**:
Visual Material 可选提供的设计态 Vue 包装，用于控制单个 NodeHost 在 Application Surface 中的 DOM 挂载与几何；它只渲染一次节点 slot，不定义 Schema 归属或顺序。
_Avoid_: Schema placement、layout kind、物料自行渲染 NodeHost

**Designer Mount Plane**:
Application Surface 为业务节点提供的两种浏览器挂载关系：Document Plane 随唯一内容 scrollport 滚动，Viewport Plane 相对当前应用 viewport 定位；Designer 的 Interaction Plane 不属于物料挂载面。
_Avoid_: flow、chrome、layer、浏览器 body portal

**Surface Reservation**:
Presentation Frame 在 Designer 会话中向 Application Surface 声明的 viewport 边缘占用；Surface 根据实际 DOM 尺寸与结构顺序计算避让，只影响设计态 scrollport 几何。
_Avoid_: Schema reserve、静态 inset 字段、物料直接修改全局 CSS

**NodeHost**:
Designer 为每个 Schema 节点拥有的唯一设计态 DOM、几何与交互实体，内部承载 material preview、headless proxy 或 unknown fallback，并向 Interaction Plane 提供选区和 toolbar 锚点。
_Avoid_: Preview 自管选区、Frame 重复渲染节点、全局 DOM selector

**Designer 交互契约（Designer Interaction Contract）**:
现有工作台和画布对使用者可观察的行为、默认容器 UI 与会话状态连续性；底层重构必须以当前实现为可执行基线保持等价，但不承诺保留旧 Core 或内部接口。
_Avoid_: 旧 UI 实现、视觉近似、最终人工验收项

**重构过渡 Adapter（Refactoring Transition Adapter）**:
仅在重构分支内部把现有 Designer/Renderer 读写接口连接到新 Document、Resolver、Schema Editor 与 Authoring Engine 的临时模块；完成调用方切换后删除，不构成公共兼容契约。
_Avoid_: v2 兼容层、双写、公共 migration adapter、永久 facade

**Material Preview Context**:
Designer 向当前 material preview 提供的只读节点、页面、归属和交互状态，以及经过 Authoring Engine 的受控自更新与 action 入口；它不承载额外的场景模拟或 Runtime 状态。
_Avoid_: Engine、可写 Store、完整文档遍历、previewState、生产 Runtime context

**Drop Geometry Resolver**:
Designer 将浏览器指针与 NodeHost 几何解释为结构锚点的纯展示逻辑；它不计算持久化 index，也不裁决 Schema 约束或 Authoring Policy。
_Avoid_: sortScope、视觉 order、canPlace

**Designer Region Outlet**:
Visual Container Preview 中挂载一个稳定 region 的框架入口，负责按真实结构顺序渲染 child NodeHost，并提供空态、拖放和诊断；Preview 只决定 Outlet 的 DOM 位置。
_Avoid_: Preview 直接接收 children、手工 renderNode、动态 region slot

**NodeBundle**:
Authoring 层为新增或复制动作构造的自包含纯数据节点 aggregate；它声明唯一入口节点及完整内部归属，但不包含最终放置位置，由 Core 作为一个整体插入。
_Avoid_: createInitialState 回调、部分容器状态

**Schema Operation**:
Authoring 层提交给 Core 的纯数据文档变更意图，由 Core 按封闭的操作词汇原子校验和提交。
_Avoid_: 自定义 Core Command、JSON Patch、可变 Schema draft

**Operation Batch**:
一次提交中的有序 Schema Operation 集合；它在私有工作快照上整体执行，成功后只产生一个提交，任一操作失败则整体不生效。
_Avoid_: 有状态事务、嵌套事务、跨调用 transaction

**Schema History**:
设计器中有容量上限的不可变 Schema 提交时间线；撤销和重做只移动时间线游标，不重新执行操作或 Authoring Policy。
_Avoid_: inverse operation、命令重放、无界历史

**Authoring Action**:
设计器宿主中的一次交互意图，可以包含界面副作用或产生一个 Schema Operation，但无权扩展 Core 的结构写入规则。
_Avoid_: Schema Operation、Core Command

**Authoring Policy**:
设计器根据物料能力与设计态 context 对 Authoring Action 作出的交互许可决定；它不定义 Schema 合法性，也不参与生产运行时解析。
_Avoid_: Schema 结构约束、运行时权限、安全边界

**Schema Editor**:
Core 中把 Schema Operation 原子应用到已解析文档并返回新不可变文档的纯变换模块，只裁决文档不变量，不管理设计器状态。
_Avoid_: Command Bus、可变 draft、Designer Store

**Authoring Engine**:
设计器中协调 Authoring Action、Policy、Schema Editor、提交与 Schema History 的有状态模块，现有交互入口通过它读写文档。
_Avoid_: Schema Structure Resolver、Runtime Renderer

**Designer Session**:
Designer 内部长期保留的会话接口，向工作台与画布提供只读文档查询、物料展示查询、selection/hover/drag/history 状态以及 `evaluate`/`execute` 写入入口；它不暴露旧 Engine、Command、Registry、LayoutPlan 或 EventHub。
_Avoid_: DesignerEngine facade、Renderer context、UI Store

**会话核心事实（Session Core Facts）**:
Designer Session 中必须跨底层实现切换保留的当前 Document 快照、Resolver diagnostics、Schema History 时间线与游标，以及按稳定 node id 维护的 Selection；这些事实不能因后端接管而重建或清空。
_Avoid_: Schema 持久化字段、完整 UI 状态、临时渲染快照

**会话投影（Session Projection）**:
由当前 DOM、浏览器几何或指针推导的 Hover、Drop Destination、Selection geometry、Drop indicator、Surface Reservation 等短暂状态；后端切换后可重新测量、重新命中或清空，不能保存悬空引用。
_Avoid_: 可持久化 layout、Schema state、拖放历史

**Cutover Fence**:
Designer 后端实现切换的交互闸门；切换只能发生在 active drag 之外的空闲点，若被强制触发必须取消 drag 并清除 feedback，不重放 native pointer 或 drop 事件。
_Avoid_: 双后端拖放、事件重放、并行 Schema 状态

**交互耦合簇（Interaction Cluster）**:
必须作为一个可验证切片共同替换的 Designer 交互职责集合，因为其中任一职责的行为依赖其余职责的状态、DOM 或坐标系；节点交互、Container Region 和 Root Surface 是不同的交互耦合簇。
_Avoid_: 按文件逐个重写、按组件名拆分、跨切片共享临时状态

**切片级回退（Slice Rollback）**:
在同一 seam 处将一个完整交互耦合簇切回其旧实现；同一节点和同一交互事件始终只有一个 active implementation，不通过双渲染、双写或事件复制实现回退。
_Avoid_: shadow renderer、双 DOM 对比、双 Schema commit

**删除闸门（Deletion Gate）**:
允许删除旧 Renderer、旧 Engine Adapter 与旧 Core 协议前必须同时满足的依赖、交互基线、产品场景、状态恢复、CSS/发布和静态边界证据集合；它是不可逆清理的前置条件，不是删除后的补测清单。
_Avoid_: 最终人工验收项、import 清理、代码覆盖率门槛

**清理提交（Cleanup Commit）**:
只删除已被新实现替代的旧 Renderer、Adapter、协议、测试和依赖的独立提交；不在其中新增交互行为或修复产品偏差，使删除动作可以单独审查和回退。
_Avoid_: 混合重构提交、删除时顺便改行为、不可区分的最终合并

**布局语义（Layout Semantics）**:
描述节点如何占据空间、依附参照物、参与滚动与避让以及形成叠放关系的声明；它独立于文档结构。
_Avoid_: 节点所有权、文档层级

**消费端展示策略（Consumer Presentation Policy）**:
Designer 或外部 Schema 消费端根据节点类型解释展示与空间关系的宿主规则；外部消费策略不属于 Dragcraft interface，任何消费策略都不进入持久化 Schema。
_Avoid_: Schema 布局字段、Dragcraft Runtime、共享跨平台 renderer

**外部状态（External State）**:
不属于文档事实、会随消费场景变化的数据，例如登录用户、权限、路由或设备；Dragcraft 不定义这类状态的 Designer 或生产 Runtime interface，额外展示模拟由框架使用者在物料实现外部自行拥有。
_Avoid_: Schema 全局配置、解析器上下文、Designer previewState

**Schema 结构解析器（Schema Structure Resolver）**:
读取纯数据 Schema，校验节点身份、结构归属、顺序和语义标识，并生成供 Core 与 Designer 内部消费的派生索引；它不解释页面空间、DOM、浏览器测量或 CSS 定位。
_Avoid_: 布局语义解析器、布局编译器、布局投影、运行时布局解析器

**Schema 定义快照（Schema Definition Snapshot）**:
注册表面向 Schema 结构解析器提供的不可变纯数据视图，包含节点类型、容器 region 和结构约束，不包含展示模块或可执行回调。
_Avoid_: RegistryInstance、物料注册表

**已解析文档（Resolved Document）**:
Schema 结构解析器拥有的不可变文档快照及其节点、owner、顺序和容器查询索引；它是 Core 与 Designer 内部的内存查询模型，不是公共 Schema 契约或新的持久化格式。
_Avoid_: LayoutPlan、Schema 副本
