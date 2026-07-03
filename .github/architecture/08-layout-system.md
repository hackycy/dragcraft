# 布局系统

本文档解释 dragcraft 布局系统的工作原理。布局系统解决一个核心问题：**schema 中的节点如何被放置到设备框架的正确位置上**。

## 一句话总结

布局系统把扁平的节点列表转换成两层渲染结果：**slot 布局层**（节点按挂载点分组，占据设备框架的结构区域）和 **position 覆盖层**（节点按锚点定位，浮动在框架之上）。

## 整体数据流

```
schema.root.children (扁平节点列表)
        │
        ▼
  resolveNodeLayout()    ← 为每个节点解析出 slot / sortScope / visible / position
        │
        ▼
  createLayoutPlan()     ← 按 slot 分组、按 sortScope 分组、聚合 slotManifests
        │
        ▼
  renderFrameViewport()  ← 设备框架读取 LayoutPlan，分层渲染
        │
        ▼
  ┌─────────────────────────────────────────────┐
  │  reserve tracks   (顶部/底部/左侧/右侧 dock) │
  │  content area     (主内容区)                  │
  │  overlay layer    (slot 声明的浮动层)         │
  │  positioned layer (节点 position 锚点层)      │
  └─────────────────────────────────────────────┘
```

## 节点布局字段

每个节点可以通过 `layout` 字段声明自己的布局意图：

```ts
interface NodeLayout {
  slot?: string                    // 挂载到哪个 slot
  sortScope?: string | false       // 属于哪个排序域，false = 不参与拖拽排序
  order?: number                   // 同 slot 内的排序权重
  visible?: boolean | Predicate    // 是否可见，支持静态值或运行时谓词
  position?: NodePosition          // 锚点定位（独立于 slot 体系）
}
```

这些字段都是可选的。节点可以只声明其中一部分，其余由物料默认值或框架默认值补全。

### 默认值规则

| 字段 | 未声明时的默认值 |
|------|-----------------|
| `slot` | `'content'`（如果节点没有 `position`） |
| `sortScope` | `'content'`（仅当 slot 为 `'content'` 时） |
| `order` | 按节点在 `children` 数组中的原始顺序 |
| `visible` | `true` |
| `position` | 无 |

### 字段合并

节点的布局是**物料默认布局**和**节点实例布局**的合并结果：

```ts
const layout = {
  ...widgetMeta.defaultLayout,   // 物料注册时声明的默认值
  ...node.layout,                // 节点实例上的覆盖值
}
```

节点实例的 `layout` 优先级更高，可以覆盖物料的任何默认布局。

## Slot 体系

Slot 是布局系统的核心抽象。它是一个**不透明的字符串**，框架不从名称推断业务语义。

### 工作方式

1. 物料通过 `layoutManifest` 声明自己提供了哪些 slot，以及每个 slot 的布局行为
2. 节点通过 `layout.slot` 声明自己要挂载到哪个 slot
3. Core 的 `createLayoutPlan` 把所有节点按 slot 分组
4. 设备框架读取分组结果，在对应位置渲染内容

### Slot Manifest

物料声明 slot 的空间分配方式：

```ts
interface LayoutSlotManifest {
  allocation: 'reserve' | 'overlay'  // reserve = 占据结构空间，overlay = 浮动覆盖
  axis?: 'block' | 'inline'          // 排列方向（仅 reserve 生效）
  edge?: 'start' | 'end'             // 靠近哪一端（仅 reserve 生效）
  order?: number                     // 同区域多个 slot 的排序
}
```

**reserve** 模式：slot 占据设备框架的结构空间。设备框架会为它分配一个 dock 区域：

```
┌──────────────────────────┐
│  block-start dock        │  ← axis: block, edge: start
│  (如导航栏)               │
├────┬────────────────┬────┤
│ i  │                │ i  │  ← inline-start / inline-end
│ n  │   content 区   │ n  │
│ l  │                │ l  │
│ e  │                │ e  │
├────┴────────────────┴────┤
│  block-end dock          │  ← axis: block, edge: end
│  (如底部标签栏)           │
└──────────────────────────┘
```

**overlay** 模式：slot 浮动在 content 区之上，不占据结构空间。适合弹窗、助手等元素。

### 示例

一个底部标签栏物料的声明：

```ts
const TabBarWidget: WidgetMeta = {
  type: 'tab-bar',
  defaultLayout: { slot: 'tab-bar.surface' },
  layoutManifest: {
    slots: {
      'tab-bar.surface': {
        allocation: 'reserve',
        axis: 'block',
        edge: 'end',
        order: 10,
      },
    },
  },
}
```

这意味着：
- `tab-bar.surface` 这个 slot 以 `reserve` 方式占据 `block-end` 区域（底部）
- `order: 10` 表示在底部区域排第 10 位（数字越小越靠前）

## Position 体系

Position 是独立于 slot 的第二套定位机制。它解决的问题是：**某些节点不需要占据 slot 空间，只需要在设备框架上有一个固定的锚点位置**。

典型场景：浮动操作按钮（FAB）、角标、提示气泡。

### 工作方式

```ts
interface NodePosition {
  anchor: {
    block?: 'start' | 'center' | 'end'   // 垂直方向锚点
    inline?: 'start' | 'center' | 'end'  // 水平方向锚点
  }
}
```

节点声明 `position` 后：
- 如果没有显式声明 `slot`，则**不分配默认 slot**（不会进入 content 区）
- 节点**不参与 LayoutPlan 的 entries**（不进入 slot 分组和排序域）
- 设备框架的 `positionedOverlay` 函数独立渲染这些节点

### 锚点映射

```
┌──────────────────────────────┐
│ block-start, inline-start    │ block-start, inline-center    │ block-start, inline-end    │
│                              │                               │                            │
├──────────────────────────────┼───────────────────────────────┼────────────────────────────┤
│ block-center, inline-start   │ block-center, inline-center   │ block-center, inline-end   │
│                              │                               │                            │
├──────────────────────────────┼───────────────────────────────┼────────────────────────────┤
│ block-end, inline-start      │ block-end, inline-center      │ block-end, inline-end      │
│                              │                               │                            │
└──────────────────────────────┴───────────────────────────────┴────────────────────────────┘
```

默认值：`block: 'end'`, `inline: 'end'`（右下角）。

### 示例

一个浮动操作按钮：

```ts
const fabNode: SchemaNode = {
  id: 'fab-1',
  type: 'fab',
  props: { icon: 'plus' },
  layout: {
    position: { anchor: { block: 'end', inline: 'end' } },
  },
}
```

这个节点会被渲染到设备框架的 `dc-device-frame__positioned` 容器中，CSS 类 `dc-device-frame__overlay-item--block-end dc-device-frame__overlay-item--inline-end` 将它定位到右下角。

### Position + Slot 的组合

节点可以同时声明 `position` 和 `slot`，此时：
- 节点**会**进入 LayoutPlan（参与 slot 分组）
- 节点**也会**被 `positionedOverlay` 渲染（按锚点定位）

这是一个高级用法，适用于需要同时出现在内容流中又需要锚点定位的场景。

## 可见性控制

`visible` 字段控制节点是否渲染：

```ts
// 静态：始终隐藏
{ visible: false }

// 动态：根据 schema 状态决定
{
  visible: (ctx) => {
    return ctx.schema.root.children.length < 5
  }
}
```

可见性在 `resolveNodeLayout` 阶段求值。如果 `visible` 是函数，需要传入 `schema` 才能求值；未传入 `schema` 时函数类型默认返回 `false`。

不可见节点在设计模式下显示为半透明虚线轮廓（`dc-node--hidden`），在预览模式下完全不渲染。

## LayoutPlan

`createLayoutPlan` 是布局系统的核心函数，它把扁平的节点列表转换成结构化的布局计划：

```ts
interface LayoutPlan {
  entries: LayoutNodeEntry[]                        // 所有参与布局的节点
  slots: Map<string, LayoutNodeEntry[]>             // 按 slot 名分组
  sortScopes: Map<string, LayoutNodeEntry[]>        // 按排序域分组
  slotManifests: Map<string, ResolvedLayoutSlotManifest>  // 聚合后的 slot 声明
}
```

### 生成过程

1. 遍历 `schema.root.children`
2. 对每个节点调用 `resolveNodeLayout`，得到 `slot`、`sortScope`、`visible`、`position`
3. **跳过 `slot === undefined` 的节点**（position-only 节点不进入 plan）
4. 按 slot 分组到 `slots` Map
5. 按 sortScope 分组到 `sortScopes` Map
6. 聚合所有物料的 `layoutManifest` 到 `slotManifests` Map
7. 每个分组内按 `order` 排序，order 相同则保持原始数组顺序

### 用途

| 消费者 | 使用的数据 |
|--------|-----------|
| Renderer | `slots` — 按 slot 分组渲染节点 |
| 拖拽排序 | `sortScopes` — 确定同排序域内的节点顺序 |
| 设备框架 | `slotManifests` — 确定 reserve/overlay 区域的布局 |
| 设备框架 | `schema` + `registry` — 独立渲染 position 节点 |

## 设备框架渲染

`renderFrameViewport` 是设备框架的渲染入口，它读取 LayoutPlan 并输出最终的 VNode 树：

```
renderFrameViewport(slots, plan, schema, registry)
  │
  ├── reserveTrack(block-start)    ← 顶部 dock 区域
  ├── reserveTrack(inline-start)   ← 左侧 dock 区域
  ├── content area                 ← 主内容区（default slot + 未消费的 slot）
  ├── reserveTrack(inline-end)     ← 右侧 dock 区域
  ├── reserveTrack(block-end)      ← 底部 dock 区域
  ├── overlayLayer                 ← overlay 类型的 slot 浮动层
  └── positionedOverlay            ← position 锚点定位层
```

### 渲染层次

1. **Reserve tracks**：占据结构空间的 slot，按 `axis` + `edge` 分成四个 dock 区域
2. **Content area**：默认 slot 的内容，加上没有被 dock 或 overlay 消费的其他 slot 内容
3. **Overlay layer**：`allocation: 'overlay'` 的 slot，浮动在 content 之上
4. **Positioned layer**：带有 `position` 的节点，按 `anchor` 锚点定位

## 排序

排序发生在两个维度：

### Slot 内排序

同一 slot 内的节点按 `order` 字段排序：

```ts
entries.sort((a, b) => {
  const orderA = a.layout.order ?? a.arrayIndex
  const orderB = b.layout.order ?? b.arrayIndex
  if (orderA !== orderB) return orderA - orderB
  return a.arrayIndex - b.arrayIndex  // order 相同保持原始顺序
})
```

### 拖拽排序

拖拽排序在 `sortScope` 维度工作。同一 `sortScope` 内的节点可以通过拖拽改变顺序。

`sortScope: false` 表示节点退出拖拽排序，其位置被锁定。

`getSortableArrayIndexForInsert` 把视觉排序索引映射回 `root.children` 的数组索引，确保拖拽操作修改的是正确的数组位置。

## 完整示例

一个典型的移动应用 schema：

```ts
const schema: DesignerSchema = {
  version: '1',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      // 顶部导航栏 — reserve 到 block-start
      {
        id: 'navbar',
        type: 'navbar',
        props: { title: 'My App' },
        layout: { slot: 'navbar.surface' },
      },
      // 普通内容 — 默认 slot = 'content'
      { id: 'header', type: 'text', props: { content: 'Hello' } },
      { id: 'card',   type: 'card',  props: {} },
      // 底部标签栏 — reserve 到 block-end
      {
        id: 'tabbar',
        type: 'tab-bar',
        props: {},
        layout: { slot: 'tab-bar.surface' },
      },
      // 浮动操作按钮 — position 定位，不占 slot
      {
        id: 'fab',
        type: 'fab',
        props: { icon: 'plus' },
        layout: {
          position: { anchor: { block: 'end', inline: 'end' } },
        },
      },
    ],
  },
}
```

渲染结果：

```
┌──────────────────────────┐
│  navbar (reserve, top)   │
├──────────────────────────┤
│                          │
│  header (content)        │
│  card (content)          │
│                          │
│                          │                          ┌───┐
│                          │                          │ F │ ← positioned
├──────────────────────────┤                          │ A │   (block-end,
│  tabbar (reserve, bottom)│                          │ B │    inline-end)
└──────────────────────────┘                          └───┘
```

## 设计原则

1. **Slot 名称是不透明字符串**：框架不从 `navbar.surface` 或 `tab-bar.surface` 推断任何语义。名称只用于分组匹配。

2. **两层分离**：slot 负责结构布局，position 负责锚点定位。两者互不干扰，可以组合使用。

3. **默认值补全**：节点不需要声明所有字段。未声明的字段由物料默认值或框架默认值补全，最简节点只需 `{ id, type, props }`。

4. **物料驱动布局**：slot 的空间分配方式（reserve/overlay、axis/edge）由物料的 `layoutManifest` 声明，设备框架只执行这些声明，不硬编码任何布局策略。

5. **排序与布局解耦**：`sortScope` 控制拖拽排序域，`slot` 控制渲染分组。一个节点可以属于某个 slot 但退出排序（`sortScope: false`）。
