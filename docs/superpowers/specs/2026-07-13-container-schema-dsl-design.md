# Container Schema DSL 设计

## 摘要

dragcraft 需要支持可拖入、可选中、可配置的容器物料。容器可以是简单的横向或纵向排列，也可以是“左侧一块、右侧上下两块”之类的异形布局。

框架不实现任何 flex、grid 或异形布局。布局几何、响应式行为、变体和 DOM 结构全部由外部物料实现；框架只负责可持久化的容器结构、区域归属、约束、命令、历史和渲染桥接。

先看一个异形容器实例：

```ts
const node: SchemaNode = {
  id: 'layout-1',
  type: 'split-layout',
  props: {
    gap: 12,
    leftWidth: '40%',
  },
  layout: {
    placement: { kind: 'flow' },
  },
  container: {
    variant: 'left-one-right-two',
    regions: {
      left: [],
      rightTop: [],
      rightBottom: [],
    },
  },
}
```

`container` 只保存框架必须理解的结构状态。`gap`、比例、方向、换行规则和自适应策略仍是物料自己的 `props`。

## 当前问题的根因

当前 schema 是严格的两层扁平模型：`root.children` 保存全部 widget，查找、命令、排序、结构面板和 `LayoutPlan` 都只扫描这一层。

现有布局协议解决的是页面 surface 投影：

- `flow` 把 root 直接子节点放入内容流。
- `chrome` 把 root 直接子节点放入设备 chrome。
- `layer` 把 root 直接子节点放入浮层。

这套协议不知道某个业务物料内部有哪些承载区域，也不应知道。`containerShell` 同样是整页设备壳扩展点，不是可重复使用的业务容器协议。

旧的全局 slot manifest 曾让不透明 slot 同时承担页面挂载、空间分配和业务区域语义，还存在独立渲染通道。后续改成统一的 `flow/chrome/layer`，正是为了确保页面节点只进入一个 `LayoutPlan` 并只渲染一次。

因此，容器能力不能通过以下方式补上：

- 不能把 `display:flex` 或 grid 字段塞进 `style.container`，因为框架不拥有布局实现。
- 不能复用全局 `flow.region` 表示容器内部区域，因为两者的作用域和生命周期不同。
- 不能让物料直接维护 children 或调用 engine 写 schema，否则会绕过命令、历史和校验。

真正缺失的是一套实例级的子节点所有权协议，以及与它配套的物料注册和渲染接口。

## 目标与非目标

### 目标

- 容器是普通物料，可以从物料面板拖入、选中、配置、复制和删除。
- 外部物料可以注册任意具名区域和有限个布局变体。
- 普通 widget 可以在 root、容器区域和不同容器之间移动。
- 所有结构修改统一经过 Core 命令、约束、历史和事件。
- 容器及其子节点级联删除，并通过一次 undo 整体恢复。
- 现有页面 `flow/chrome/layer` 和 device frame 行为保持不变。
- 未注册容器物料时保留 schema 数据，不静默丢失内部节点。

### 非目标

- 首版不支持容器嵌套容器。
- 框架不提供 flex、grid 或任何默认布局容器。
- schema 不保存手机、平板和桌面三套布局覆盖。
- 不引入节点表、CRDT 或多人协同模型。
- 不允许异步的放置判断、初始状态创建或变体迁移。

## 核心设计原则

容器设计遵守四条边界：

1. 页面投影和容器编排正交。页面 placement 只处理 root 直接子节点，容器 region 只处理某个容器实例内部的子节点。
2. Schema 保存事实，注册协议保存代码。节点归属和当前变体进入 schema；resolver、谓词和迁移函数只存在于注册表。
3. 物料决定布局，框架决定一致性。物料负责区域几何和命中算法；框架负责唯一归属、原子命令和失败回滚。
4. Core 是最终裁决者。Designer 可以提前计算反馈，但执行命令时必须重新校验。

## 持久化 Schema

容器采用内嵌区域树。root 仍保存页面级子节点，容器实例在自身内部保存区域到普通 widget 数组的映射。

```ts
export type ContainerVariantId = string
export type ContainerRegionId = string

export interface ContainerState {
  /** 创建实例时显式写入，避免注册默认值变化后语义漂移。 */
  variant: ContainerVariantId

  /** 区域 ID 只在当前容器实例内有意义。 */
  regions: Record<ContainerRegionId, SchemaNode[]>
}

export interface SchemaNode {
  id: string
  type: string
  props: Record<string, unknown>
  style?: NodeStyle
  layout?: NodeLayout
  container?: ContainerState
}
```

区域数组顺序是该区域唯一的持久化排序来源。框架不再为区域子节点保存额外 `order`。

### Schema 不变量

- 容器只能出现在 `root.children`。
- `container.regions` 内只能放普通 widget。
- 非容器物料不能携带 `container`。
- 容器物料实例必须携带与注册协议一致的 `container`。
- 每个文档内的节点 ID 全局唯一，包括所有区域子节点。
- 每个节点只能出现一次，不能同时属于 root 和某个区域。
- 当前变体声明的每个区域都必须出现在 `regions`，即使数组为空。
- 已解析容器不能包含当前变体未声明的未知区域。
- 最大持久化深度为两层：root 到容器，再到普通 widget。
- `container` 必须可序列化，不能保存函数、组件、DOM 或 VNode。

容器子节点可以使用 `style.container`、`style.content` 和 `layout.visible`。区域数组顺序优先于物料 `defaultLayout.order`，区域渲染也不会解析物料默认的 page placement。

页面级 `layout.placement` 只对 root 直接子节点有效。进入容器区域的命令会移除实例级 page placement 和 page order；节点重新移回 root 时按物料默认 placement 和目标 root destination 解析。

### 为什么不使用 parentId

把所有节点继续放在 `root.children`，再增加 `parentId + regionId`，会让 `root.children` 不再表示真正的 children。区域顺序还需要额外字段，并容易产生悬空父引用和多份排序来源。

内嵌区域树让级联删除、复制、导出和 undo 都对应一个完整子树。首版虽然禁止嵌套，但未来如果产品需要，可以放宽校验并递归现有结构，不必先引入归一化图模型。

## Core 物料注册协议

`CoreWidgetMeta` 通过可选的 `container` capability 声明物料是否为容器。Schema 中单独出现 `container` 字段不能让普通物料变成容器。

```ts
export interface CoreWidgetMeta {
  // existing fields...
  container?: ContainerDefinition
}

export interface ContainerDefinition {
  defaultVariant: ContainerVariantId
  variants: Record<ContainerVariantId, ContainerVariantDefinition>

  createInitialState?: (
    ctx: ContainerInitContext,
  ) => ContainerState

  canPlace?: (
    ctx: ContainerPlacementContext,
  ) => PlacementDecision

  migrateVariant?: (
    ctx: ContainerVariantMigrationContext,
  ) => ContainerVariantMigrationResult
}

export interface ContainerVariantDefinition {
  title: string
  titleKey?: string
  regions: ContainerRegionDefinition[]
}

export interface ContainerRegionDefinition {
  id: ContainerRegionId
  title: string
  titleKey?: string
  constraints?: ContainerRegionConstraints
}

export interface ContainerRegionConstraints {
  includeTypes?: string[]
  excludeTypes?: string[]
  minItems?: number
  maxItems?: number
}
```

`regions` 是有序定义。框架使用这个顺序展示结构树和稳定地枚举区域，但不从顺序或名称推断几何。

### 一个完整的异形物料定义

```ts
const splitLayoutMeta: CoreWidgetMeta = {
  type: 'split-layout',
  title: '异形布局',
  group: 'layout',
  defaultProps: {
    gap: 12,
    leftWidth: '40%',
  },
  formSchema: { sections: [] },
  container: {
    defaultVariant: 'left-one-right-two',
    variants: {
      'left-one-right-two': {
        title: '左一右二',
        regions: [
          { id: 'left', title: '左侧' },
          { id: 'rightTop', title: '右上', constraints: { maxItems: 1 } },
          { id: 'rightBottom', title: '右下', constraints: { maxItems: 1 } },
        ],
      },
      'top-one-bottom-two': {
        title: '上一下二',
        regions: [
          { id: 'top', title: '顶部' },
          { id: 'bottomLeft', title: '左下' },
          { id: 'bottomRight', title: '右下' },
        ],
      },
    },
    migrateVariant(ctx) {
      return migrateSplitLayout(ctx)
    },
  },
}
```

Flex 容器也使用同一协议。它通常只有一个 `default` 区域，方向、换行、间距和对齐全部由其 `props` 与外部实现解释。

### 静态约束

静态约束按以下顺序解释：

1. 容器节点始终被全局规则拒绝，首版不允许嵌套。
2. 如果存在 `includeTypes`，目标类型必须在其中。
3. 如果目标类型出现在 `excludeTypes`，即使也在 include 中仍然拒绝。
4. 新增或移入不能超过 `maxItems`。
5. 移出或删除不能低于 `minItems`。

如果某个区域声明 `minItems > 0`，物料必须通过 `createInitialState` 返回满足约束的初始子节点。初始化上下文提供受控的 `createNode()`，确保节点使用已注册默认值并获得全局唯一 ID。

```ts
export interface ContainerInitContext {
  containerNode: Readonly<SchemaNode>
  schema: Readonly<DesignerSchema>
  createNode: (
    type: string,
    overrides?: Partial<Pick<SchemaNode, 'props' | 'style' | 'layout'>>,
  ) => SchemaNode
}
```

### 动态放置约束

静态约束之后，Core 调用物料的 `canPlace`。它可以根据容器 props、目标区域、待放节点和整个 schema 判断业务规则。

```ts
export interface ContainerPlacementContext {
  operation: 'add' | 'move'
  schema: Readonly<DesignerSchema>
  container: Readonly<SchemaNode>
  variant: Readonly<ContainerVariantDefinition>
  region: Readonly<ContainerRegionDefinition>
  child: Readonly<SchemaNode>
  targetIndex: number
}

export interface PlacementDecision {
  allowed: boolean
  code?: string
  messageKey?: string
  message?: string
}
```

回调必须同步、纯净，不能修改入参、调用 engine 或触发嵌套命令。异常按拒绝处理，并转换为稳定错误码。

### 变体迁移

变体切换由物料决定区域如何迁移。迁移器接收只读快照，返回新的完整 `ContainerState` 或结构化拒绝。

```ts
export interface ContainerVariantMigrationContext {
  schema: Readonly<DesignerSchema>
  container: Readonly<SchemaNode>
  fromVariant: Readonly<ContainerVariantDefinition>
  toVariant: Readonly<ContainerVariantDefinition>
  state: Readonly<ContainerState>
}

export type ContainerVariantMigrationResult =
  | { allowed: true, state: ContainerState }
  | ({ allowed: false } & Omit<PlacementDecision, 'allowed'>)
```

如果新旧变体的区域 ID 集合完全一致，Core 可以默认原样保留。区域集合发生变化时，缺少迁移器、迁移器拒绝、抛错或返回非法结果都会阻止切换。

Core 在接受结果前重新校验节点唯一归属、区域完整性、数量约束和最大深度。迁移器永远不能通过返回值绕过结构不变量。

### 注册时校验

注册容器物料时立即检查：

- `defaultVariant` 是否存在。
- 变体 ID 是否为非空、非保留标识。
- 每个变体内的区域 ID 是否为非空、非保留标识且唯一。
- `minItems` 和 `maxItems` 是否为非负整数。
- `minItems` 是否不大于 `maxItems`。
- include/exclude 是否只包含非空类型标识。

保留标识至少包括会影响对象原型或框架内部命名空间的 `__proto__`、`prototype` 和 `constructor`。实现不能通过未转义的 region ID 拼接 CSS selector。

配置错误直接拒绝注册，避免错误延迟到拖放阶段。

## Core 命令模型

现有命令假设所有节点都位于 root。新协议使用显式 destination 描述目标所有者。

```ts
export type NodeDestination =
  | {
      kind: 'root'
      sortScope?: string
      index?: number
    }
  | {
      kind: 'container'
      containerId: string
      regionId: string
      index?: number
    }
```

命令调整为：

```ts
ADD_NODE {
  node: SchemaNode
  destination: NodeDestination
}

MOVE_NODE {
  nodeId: string
  destination: NodeDestination
}

REMOVE_NODE {
  nodeId: string
}

CHANGE_CONTAINER_VARIANT {
  containerId: string
  variant: string
}
```

source 不由 UI 传入。Core 从当前 schema 解析真实位置，防止过期 UI 状态或伪造 source 破坏所有权。

创建容器时，调用方可以不提供 `node.container`。Core 根据已注册 definition 写入 `defaultVariant` 和完整空区域；如果物料提供 `createInitialState`，Core 改用其返回值。调用方显式提供了 `node.container` 时，Core 不覆盖它，但必须在提交前完成同样的 registry-aware 校验。

### 命令执行结果

为了让执行阶段的拒绝原因能够回到 Designer，`engine.execute()` 返回结构化结果。现有不读取返回值的调用方可以继续忽略它。

```ts
export type CommandExecutionResult =
  | { ok: true }
  | {
      ok: false
      code: string
      messageKey?: string
      message?: string
      details?: Record<string, unknown>
    }
```

失败命令不修改 schema、不写 history、不发成功事件。

### 新增和移动

`MOVE_NODE` 统一覆盖以下操作：

- root 同一 sort scope 内排序。
- 容器同一区域内排序。
- root 与容器区域互移。
- 同一容器不同区域互移。
- 不同容器区域互移。

执行移动时依次检查 source、目标位置、节点行为、源区域最小数量、目标区域最大数量、静态类型规则和动态谓词。容器节点的 destination 必须是 root。

进入容器区域时，Core 移除实例级 page placement 和 page order，使持久化状态满足“placement 只属于 root 直接子节点”的不变量。移回 root 时，未显式提供实例 placement 的节点重新使用物料 `defaultLayout`。

### 删除与复制

删除普通区域子节点时必须满足 source region 的 `minItems`。删除容器时，整个容器子树作为一次命令删除，不逐个执行子节点删除。

复制容器时深拷贝全部区域内容，并为容器和每个子节点生成新 ID。复制结果再次经过 schema 校验，作为一次 history 记录提交。

如果选中或 hover 的节点位于被删除子树中，相关运行时状态一并清空。Undo 恢复 schema，但不自动恢复旧选中态。

### 切换变体

变体只能通过 `CHANGE_CONTAINER_VARIANT` 修改。`UPDATE_PROPS` 和 transient patch 不能写 `container.variant` 或 `container.regions`。

命令在一个事务内完成：

```text
确认目标变体
→ 克隆当前状态
→ 调用物料迁移器
→ 规范化目标区域
→ 重新校验完整结果
→ 原子替换 ContainerState
→ 写入一条 history 和事件
```

## SchemaIndex 与投影

Core 新增纯逻辑 `SchemaIndex`，一次扫描建立全部节点的位置索引。

```ts
export interface IndexedNodeLocation {
  node: SchemaNode
  owner: 'root' | string
  regionId?: string
  index: number
  depth: 1 | 2
}

export type SchemaIndex = Map<string, IndexedNodeLocation>
```

所有查找、父级定位、唯一 ID 校验和命令都使用该索引，替换目前只扫描 `root.children` 的 flat helpers。索引不持久化，也不跨 schema 版本缓存，避免失效状态成为第二事实来源。

### 页面 LayoutPlan 保持稳定

`createLayoutPlan()` 继续只投影 root 直接子节点：

```text
root.children
→ flow regions
→ chrome
→ layers
→ root sort scopes
```

它不递归进入容器，device frame 只看到一个普通的 root 容器节点。

容器内部由单独的 `createContainerPlan(containerNode, meta)` 投影：

```ts
export interface ContainerPlan {
  containerId: string
  variant: ContainerVariantDefinition
  regions: Array<{
    definition: ContainerRegionDefinition
    nodes: SchemaNode[]
    isEmpty: boolean
  }>
}
```

页面 region 和容器 region 使用不同类型与 API，不共享字符串命名空间。

## Renderer 协议

容器继续通过现有 `componentMap` 提供 Vue 组件。`WidgetRenderer` 发现 `meta.container` 后建立只读容器运行时上下文，并把区域子节点交给框架出口渲染。

```ts
export interface ContainerRuntime {
  nodeId: Readonly<Ref<string>>
  variant: Readonly<Ref<string>>
  regionDefinitions: Readonly<ComputedRef<ContainerRegionDefinition[]>>
  getRegionNodes: (regionId: string) => readonly SchemaNode[]
  requestVariantChange: (variant: string) => CommandExecutionResult
}
```

外部容器使用 `ContainerRegionOutlet` 放置区域：

```ts
const SplitLayout = defineComponent({
  setup() {
    const container = useContainerRuntime()

    return () => h('div', {
      class: `my-layout my-layout--${container.variant.value}`,
    }, [
      h(ContainerRegionOutlet, {
        regionId: 'left',
        class: 'my-layout__left',
        resolveDropIndex: resolveLeftDropIndex,
      }),
      h('div', { class: 'my-layout__right' }, [
        h(ContainerRegionOutlet, {
          regionId: 'rightTop',
          class: 'my-layout__right-top',
          resolveDropIndex: resolveRightTopDropIndex,
        }),
        h(ContainerRegionOutlet, {
          regionId: 'rightBottom',
          class: 'my-layout__right-bottom',
          resolveDropIndex: resolveRightBottomDropIndex,
        }),
      ]),
    ])
  },
})
```

物料创建 DOM、CSS 和布局几何。`ContainerRegionOutlet` 只负责：

- 取得并渲染该区域的普通 widget。
- 建立稳定的 drop target 和可访问性属性。
- 渲染区域空态、插入指示器和禁止原因。
- 把 DOM、指针位置和已有子节点元素传给物料的插入索引 resolver。

### 插入索引适配器

框架不能假设区域是水平、垂直、网格或自由布局。物料通过 renderer 侧适配器计算视觉插入位置。

```ts
export interface ResolveContainerDropIndexContext {
  event: DragEvent
  regionElement: HTMLElement
  itemElements: readonly HTMLElement[]
  nodes: readonly SchemaNode[]
}

export type ResolveContainerDropIndex = (
  ctx: ResolveContainerDropIndexContext,
) => number | null
```

适配器可以注册为 `RendererWidgetMeta` 的容器默认值，也可以由某个 outlet 覆盖，以适配不同变体或区域。框架可以提供线性和最近中心点等 helper，但 helper 不进入 schema，也不构成默认布局实现。

缺少适配器、适配器抛错或返回非法索引时，该区域保持可渲染但禁止 drop。框架不猜测 append 或几何方向。

### 单次渲染保证

RootRenderer 为容器创建一个 root 级 `WidgetRenderer`。区域 outlet 再为其直接子节点创建 `WidgetRenderer`，每个 schema 节点只从一个所有者路径进入组件树。

容器节点不能使用覆盖整个内容面的阻塞式 mask，否则会挡住子节点交互。Renderer 为容器使用非阻塞边界；点击容器空白或结构树可以选择容器，点击子节点仍选择子节点。子节点完全覆盖容器时，结构树是选择父容器的确定性入口，不增加重复点击或修饰键切换层级。

节点 owner 决定默认的 Designer selected 投影。root-owned 节点保留物料完整 border box，默认 presenter 在外侧绘制四边并由 Frame 提供左右边框覆盖宽度；container-owned 节点使用其 framework wrapper 的完整 border box。两者进入 shell-owned 内容/视口平面并由原生 overflow 裁剪。hover 仍参与命中和 handle，但不生成范围高亮。frame 左侧纵向工具栏与 container 右上方横向工具栏继续走独立全局呈现通道。上方空间不足时工具栏翻转到右下方，最终限制在画布可见区域内。

父子命中遵循最深可选节点优先。指针位于子节点时父容器不显示 hover；移到容器空白时 hover 直接回到容器。普通子节点仍遵守自己的 `mask`：blocking mask 以整个节点盒作为选择面，unmasked 内容继续接收业务交互并通过 handle 或结构树选中。

## Designer 协议

Designer 把 root 和每个容器区域统一看作 drop destination，但保留不同的视觉索引适配器。

```text
drag event
→ root drop target 或 ContainerRegionOutlet
→ 物料 resolveDropIndex
→ placement 预判
→ 区域级反馈
→ ADD_NODE / MOVE_NODE
→ Core 重新校验并提交
```

UI 预判只用于及时反馈。命令执行失败时，Designer 使用 Core 返回的最终原因更新提示。

### 结构面板

结构面板显示浅层树：

```text
页面
├─ 普通 widget
└─ 异形容器
   ├─ 左侧
   │  └─ 图片
   ├─ 右上
   └─ 右下
```

区域来自注册定义，是虚拟结构项，不是 schema 节点。区域没有独立 props、选择状态或历史记录；空区域仍显示并作为 drop target。

### 属性面板

物料通过 form schema 显式声明变体字段：

```ts
{
  key: 'variant',
  component: 'Select',
  bindTo: {
    scope: 'container',
    path: 'variant',
  },
}
```

Designer 从注册协议派生选项和值，并把变更转译为 `CHANGE_CONTAINER_VARIANT`。框架不自动注入某个具体字段组件，物料也不需要在 `props` 中保存重复 variant。

## 校验、导入与故障恢复

导入流程改成：

```text
clone
→ structural validation
→ registry-aware validation
→ safe canonicalization
→ setSchema
```

当前架构尚未稳定发布，因此本设计不升级 schema version，也不增加迁移步骤。`container` 是可选字段，现有非容器 schema 可以直接通过新校验。

### 结构错误

以下错误拒绝导入或命令：

- 重复节点 ID。
- 节点多重归属。
- 容器嵌套。
- 普通物料携带容器状态。
- 已解析容器出现未知变体或未知区域。
- 区域缺少必需节点或超过容量。
- 迁移结果引用非法节点结构。

允许的自动规范化只有一项：为当前变体补齐缺失的空区域。框架不会静默删除未知区域、移动节点或替换 variant。

### 未解析容器

如果 schema 节点带有 `container`，且对应物料类型完全未注册，框架保留完整数据并产生 `UNRESOLVED_CONTAINER_TYPE` diagnostic。

如果物料类型已经注册，但 meta 没有 container capability，该 schema 与明确的物料契约冲突，属于 `CONTAINER_CAPABILITY_MISMATCH` 结构错误，不能按 unresolved 容器继续编辑。

未解析容器禁止结构修改。Designer 使用恢复型 fallback 展示容器 ID、区域 ID 和内部节点，避免子节点不可见或丢失；物料注册完成后重新做 registry-aware validation，结构合法即可恢复正常编辑。

普通未知 widget 继续沿用现有 widget fallback。

### 回调异常

`createInitialState`、`canPlace`、`migrateVariant` 和 `resolveDropIndex` 的异常必须被框架捕获，并包含稳定错误码、节点 ID、容器 ID 和区域 ID。异常不能越过命令边界留下部分修改。

### 初始化顺序

`createDesigner` 必须先创建 engine、注册 widget metas，再导入 initial schema。当前直接把 initial schema 交给空 registry 的 engine 顺序不再适用。

## 事件

现有节点事件需要携带位置变化：

```ts
interface NodeMovedEvent {
  nodeId: string
  source: NodeDestination
  destination: NodeDestination
}
```

新增容器变体事件：

```ts
interface ContainerVariantChangedEvent {
  containerId: string
  fromVariant: string
  toVariant: string
}
```

只有命令成功后才发事件。级联删除仍发一个容器级 `NODE_REMOVED`，payload 可以包含被删除子树快照供审计使用，但不会把一次用户操作拆成多个历史动作。

## 包职责

| Package | 新职责 |
| --- | --- |
| `@dragcraft/core` | 容器 schema、注册契约、SchemaIndex、校验、计划、放置决策和命令 |
| `@dragcraft/renderer` | ContainerRuntime、ContainerRegionOutlet、子节点渲染和区域反馈 |
| `@dragcraft/designer` | 跨所有者拖放、结构树、属性绑定和正确初始化顺序 |
| `@dragcraft/widgets` | `defineContainerWidget()` 等类型辅助与契约测试工具 |
| `@dragcraft/themes` | 区域空态、hover、禁止和插入指示器的基础样式 |
| `@dragcraft/device-frames` | 无新增容器职责 |

Core 应公开以下纯逻辑入口：

```ts
validateContainerDefinition()
createContainerState()
createContainerPlan()
resolvePlacementDecision()
buildSchemaIndex()
validateSchema()
```

## 测试策略

### Core 单元测试

覆盖以下成功路径：

- 创建带空区域或初始子节点的容器。
- 区域内排序。
- root 与区域互移。
- 同容器跨区域移动。
- 不同容器跨区域移动。
- 容器级联删除和整体 undo。
- 容器深复制与 ID 重建。
- 变体成功迁移。

覆盖以下拒绝路径：

- 容器进入容器。
- 目标区域不存在。
- 类型不被接受。
- 超过 max 或移出后低于 min。
- 动态谓词拒绝或抛错。
- 初始状态或迁移结果非法。
- 失败命令写入 schema、history 或成功事件。

使用随机命令序列反复验证五个不变量：ID 唯一、单一归属、区域有效、深度不超过两层、失败命令不改变 schema。

### Renderer 集成测试

使用两个真实测试物料：

- 单区域外部 flex 容器。
- 三个区域、两个变体的异形容器。

测试区域 outlet、插入索引适配器、空态、禁止反馈、容器非阻塞选区，以及每个节点只渲染一次。

### Designer 集成测试

测试根与区域命中、跨区域拖放、结构树层级、变体字段命令转译、级联删除后的选择清理，以及 unresolved container 恢复。

### 回归测试

现有非容器 schema、root 排序、chrome、layer、inset 和 device frame 测试必须保持通过。Device frame 应继续把整个容器视为一个 root 节点。

## 性能与演进

首版的 `SchemaIndex` 和各类 plan 都是 O(N)。索引不持久化，历史继续使用完整 schema 快照。最大深度固定为两层，因此不会引入无界递归。

未来演进遵守以下规则：

- 已发布变体可以新增，但区域 ID 的改名或删除必须通过物料迁移器处理。
- Web、小程序和 RN 复用 schema 与 Core 契约，各运行时提供自己的容器实现和交互适配器。
- 如果未来支持容器嵌套，应放宽结构校验并扩展递归命令，不把布局几何收回 Core。
- 只有出现真实的多人协同或大文档需求时，才重新评估节点表、结构共享或增量索引。

## 验收标准

- 新增一种外部 flex 容器不修改 Core、Renderer 或 Designer。
- 新增一种任意具名区域和有限变体的异形容器不修改框架。
- 框架 schema 中不存在 flex、grid、方向、轨道或断点语义。
- 所有结构写入都经过统一命令、约束、history 和事件。
- 任何失败路径都不会产生孤儿节点、重复渲染或部分提交。
- 容器及其子节点可以整体复制、删除和 undo。
- 现有非容器 schema、页面 placement 和 device frame 行为保持兼容。
