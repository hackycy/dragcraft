# 布局系统

布局系统解决一个核心问题：**root 页面节点如何被投影到设备页面的内容区、固定 chrome 区和浮层中，并且只渲染一次**。容器 region 的普通子节点由独立的容器计划投影，不进入页面布局计划。

## 一句话总结

布局系统使用 `placement` 描述节点布局意图，把 `root.children` 投影为三类 surface：

- `flow`：普通内容流，进入内容 scrollport，可参与拖拽排序。
- `chrome`：页面结构 chrome，例如导航栏、底部标签栏。视觉上固定在 viewport 边缘，同时向内容区贡献 inset，避免内容被遮挡。
- `layer`：浮层，例如 FAB、气泡、助手。可以由框架按 anchor 定位，也可以由物料在框架提供的坐标系中自行定位。

旧的 slot manifest、positioned overlay 和独立 position 通道已移除。框架不再让某些节点绕过 `LayoutPlan`，所有节点都在同一个 plan 中出现一次。

`flow/chrome/layer` 是设备页面内部的业务布局层。设计器自身的选区外框、节点工具栏、左右面板和应用弹窗使用主题 z-index token 管理，不通过业务 layout 提升或压低。

`flow/chrome/layer` 保持 root-only。`root.children` 包含页面节点；容器必须直接位于 root，区域拥有普通子节点，当前协议拒绝嵌套容器。区域子节点没有 page placement 或 root sort scope。

## 整体数据流

```text
schema.root.children
        │
        ▼
  resolveNodeLayout()
        │  归一化 placement / sortScope / visible / order
        ▼
  createLayoutPlan()
        │  生成 regions / chrome / layers / sortScopes / insets
        ▼
  RootRenderer
        │  为每个 plan entry 创建 WidgetRenderer vnode
        │  再按 plan 分发为 regionVNodes / chromeVNodes / layerVNodes
        ▼
  ContainerShell / DeviceFrame
        │  content scrollport + fixed chrome + layer surfaces
        ▼
  rendered page
```

## NodeLayout

```ts
interface NodeLayout {
  placement?: NodePlacement
  order?: number
  visible?: boolean | ((ctx: { node: SchemaNode, schema: DesignerSchema }) => boolean)
}

type NodePlacement =
  | { kind: 'flow', region?: string, sortScope?: string | false }
  | {
      kind: 'chrome'
      edge: 'block-start' | 'block-end' | 'inline-start' | 'inline-end'
      position?: 'fixed' | 'sticky' | 'flow'
      reserve?: { mode?: 'measure' | 'size' | 'none', size?: string | number }
      avoidContent?: boolean
    }
  | {
      kind: 'layer'
      layer?: string
      mode?: 'framework' | 'self'
      anchor?: { block?: 'start' | 'center' | 'end', inline?: 'start' | 'center' | 'end' }
      offset?: {
        blockStart?: string | number
        blockEnd?: string | number
        inlineStart?: string | number
        inlineEnd?: string | number
      }
      avoid?: Array<'safe-area' | 'chrome' | 'viewport'>
    }
```

默认规则：

| 字段 | 默认值 |
| --- | --- |
| `placement` | `{ kind: 'flow', region: 'content', sortScope: 'content' }` |
| `flow.region` | `'content'` |
| `flow.sortScope` | `region === 'content' ? 'content' : false` |
| `chrome.position` | `'fixed'` |
| `chrome.reserve.mode` | `'measure'` |
| `chrome.reserve.size` | 无；在 `measure` 模式下可作为首帧 fallback |
| `chrome.avoidContent` | `true` |
| `layer.layer` | `'float'` |
| `layer.mode` | 有 `anchor` 时为 `'framework'`，否则为 `'self'` |
| `layer.anchor` | `{ block: 'end', inline: 'end' }` |
| `layer.avoid` | `['safe-area', 'chrome']` |
| `visible` | `true` |

节点实例 layout 覆盖物料默认 layout：

```ts
const layout = {
  ...widgetMeta.defaultLayout,
  ...node.layout,
}
```

## LayoutPlan

```ts
interface LayoutPlan {
  entries: LayoutNodeEntry[]
  regions: Map<string, LayoutNodeEntry[]>
  chrome: LayoutNodeEntry[]
  layers: Map<string, LayoutNodeEntry[]>
  sortScopes: Map<string, LayoutNodeEntry[]>
  insets: {
    contributors: Array<{
      edge: LayoutEdge
      sourceNodeId: string
      reserve: { mode: 'measure' | 'size' | 'none', size?: string | number }
    }>
  }
}
```

生成规则：

1. 遍历 `schema.root.children`。
2. 合并物料默认 layout 和节点实例 layout。
3. 调用 `resolveNodeLayout()` 得到归一化布局。
4. 所有节点都进入 `entries`。
5. `flow` 节点进入 `regions`；只有 `flow` 节点可进入 `sortScopes`。
6. `chrome` 节点进入 `chrome`；当 `avoidContent !== false` 时贡献 `insets`。
7. `layer` 节点进入 `layers`。
8. 每个分组按 `order ?? arrayIndex` 排序，order 相同保持 schema 原始顺序。

## ContainerPlan 与外部几何

`createLayoutPlan()` 不递归容器。`createContainerPlan()` 只按注册 meta 投影当前 variant 的 region definitions 和各 region 的普通子节点；schema version 保持不变。

框架 package 不定义 flex/grid geometry，也不会从 metadata 猜测方向、断点或轨道。外部容器 meta 注册 variants、regions、constraints 和 migration；外部组件创建 DOM/CSS，并为 renderer region outlet 提供 insertion geometry adapter。物料可以是单区域 flex、网格、异形分栏或其他布局，而 Core 只校验所有权和约束。

root 与 region 的结构修改都使用显式 `NodeDestination`。容器节点只能发往 root；普通节点可以在 root 和 regions 间移动，进入 region 时移除实例级 page placement/order，移回 root 时恢复物料默认 page layout。

## Flow

`flow` 是普通内容流，适合正文、卡片、轮播、表单等内容节点。

```ts
{
  layout: {
    placement: { kind: 'flow' },
  },
}
```

默认进入 `content` region 和 `content` sort scope。非 content region 默认不参与排序：

```ts
{
  layout: {
    placement: { kind: 'flow', region: 'hero' },
  },
}
```

## Chrome

`chrome` 表示页面结构 chrome。典型场景是顶部导航栏和底部标签栏。

```ts
const navbarLayout = {
  placement: {
    kind: 'chrome',
    edge: 'block-start',
    position: 'fixed',
    reserve: { mode: 'measure', size: 44 },
    avoidContent: true,
  },
}

const tabbarLayout = {
  placement: {
    kind: 'chrome',
    edge: 'block-end',
    position: 'fixed',
    reserve: { mode: 'measure', size: 50 },
    avoidContent: true,
  },
}
```

设备框架把 chrome 渲染在 `dc-device-frame__chrome` 层中。`reserve.mode` 控制内容避让：

- `measure`：使用 `ResizeObserver` 测量 chrome 实际高度或宽度；如果提供 `size`，先用它作为首帧 fallback，测量完成后用真实尺寸覆盖。
- `size`：使用物料声明的固定尺寸。
- `none`：不向内容区贡献 inset。

内容 scrollport 自身通过 CSS variables 避让 chrome：

```css
top: var(--dc-inset-block-start);
right: var(--dc-inset-inline-end);
bottom: var(--dc-inset-block-end);
left: var(--dc-inset-inline-start);
```

这使导航栏、底部标签栏可以视觉固定，同时内容滚动区和滚动条轨道都不会进入 chrome 覆盖区域。禁止把 scrollport 做成全 viewport 再用 padding 避让，因为那会让滚动条仍然落在 navbar/tabbar 下面。

## Layer

`layer` 表示浮层。它有两种模式。

### Framework Mode

框架根据 anchor 和 offset 定位外壳：

```ts
{
  layout: {
    placement: {
      kind: 'layer',
      layer: 'float',
      mode: 'framework',
      anchor: { block: 'end', inline: 'end' },
    },
  },
}
```

适合简单 FAB、角标、固定提示。

### Self Mode

框架只提供全 viewport 的 layer 坐标系和 inset CSS variables，物料自己决定内部元素位置：

```ts
{
  layout: {
    placement: {
      kind: 'layer',
      layer: 'float',
      mode: 'self',
      avoid: ['safe-area', 'chrome'],
    },
  },
}
```

物料可直接使用变量：

```css
.my-fab {
  position: absolute;
  right: calc(var(--dc-inset-inline-end) + 16px);
  bottom: calc(var(--dc-inset-block-end) + 16px);
}
```

`self` 模式用于复杂浮动交互，例如可配置方位、吸附 chrome、响应内容状态、多个浮层协同等场景。

## Renderer 与 Shell 分工

`RootRenderer` 负责：

- 调用 `createLayoutPlan()`。
- 为每个 entry 创建一次 `WidgetRenderer` vnode。
- 按 plan 生成 `regionVNodes`、`chromeVNodes`、`layerVNodes`。
- 把这些 vnode 与 `LayoutPlan` 传给 `containerShell`。

`ContainerShell` 或 device frame 负责：

- 渲染 content scrollport。
- 渲染 fixed/sticky chrome layer。
- 测量 chrome 并写入 inset CSS variables。
- 渲染 layer surfaces。

Shell 不读取 schema、不重新 resolve 节点、不创建业务 widget vnode。

## 拖拽排序

拖拽排序只发生在 `flow` 节点的 `sortScope` 中。

- 默认内容节点属于 `content` sort scope。
- `chrome` 和 `layer` 默认 `sortScope: false`。
- 物料从面板拖入时，如果默认 placement 不是 `flow`，不需要内容区插入索引，直接按自身 placement 追加到 schema。
- `getSortableArrayIndexForInsert()` 把视觉 sort-scope 索引映射回 `root.children` 数组索引。

## 可见性

`visible` 支持静态布尔值或谓词：

```ts
{
  visible: (ctx) => ctx.schema.root.children.length < 5,
}
```

设计模式下不可见节点仍渲染，并通过 `[data-dc-component="node"][data-dc-state~="hidden"]` 暴露主题状态，方便选中和编辑；运行时预览可以基于同一 resolved layout 决定是否完全跳过节点。内部用于结构行为的 class 不属于公共契约。

## 完整示例

```ts
const schema: DesignerSchema = {
  version: '1',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      {
        id: 'navbar',
        type: 'navbar',
        props: { title: 'My App' },
        layout: {
          placement: {
            kind: 'chrome',
            edge: 'block-start',
            position: 'fixed',
            reserve: { mode: 'measure', size: 44 },
            avoidContent: true,
          },
        },
      },
      { id: 'header', type: 'text', props: { content: 'Hello' } },
      { id: 'card', type: 'card', props: {} },
      {
        id: 'tabbar',
        type: 'tab-bar',
        props: {},
        layout: {
          placement: {
            kind: 'chrome',
            edge: 'block-end',
            position: 'fixed',
            reserve: { mode: 'measure', size: 50 },
            avoidContent: true,
          },
        },
      },
      {
        id: 'fab',
        type: 'floating-button',
        props: { label: '+' },
        layout: {
          placement: {
            kind: 'layer',
            layer: 'float',
            mode: 'self',
            avoid: ['safe-area', 'chrome'],
          },
        },
      },
    ],
  },
}
```

渲染结构：

```text
device viewport
  content scrollport
    top    = safe area + navbar reserve
    bottom = safe area + tabbar reserve
    header
    card
  chrome layer
    navbar fixed block-start
    tabbar fixed block-end
  float layer
    floating-button self-positioned by material
```

## 设计原则

1. **节点只渲染一次**：所有节点都进入 `LayoutPlan.entries`，renderer 创建 vnode 后按 plan 分发。

2. **布局意图一等化**：`flow`、`chrome`、`layer` 是明确的 placement，不再用 slot 名称或 position 字段间接推断行为。

3. **固定与避让分离**：chrome 可以视觉 fixed，同时通过 inset 让内容区避让，解决移动端顶部/底部固定栏遮挡内容的问题。

4. **物料拥有最终表达权**：framework layer 适合简单定位；self layer 给物料完整坐标系和 CSS variables，由物料自行实现复杂位置策略。

5. **排序与布局解耦**：排序只属于 flow sort scope；chrome/layer 不依赖排序副作用退出内容流。
