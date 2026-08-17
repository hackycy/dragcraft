---
description: "从 Schema、Region 声明和 DesignerRegionOutlet 开发单区域、多区域和可恢复的容器物料。"
---

# 容器与 Region

容器物料的难点不是写一个 `display: flex`，而是同时维护三件事：Schema 中的 owner 和顺序、业务 DOM 中的多个插槽，以及拖放时的插入几何。DragCraft 把三件事分开：Schema 和 Designer 管理结构，容器 preview 管理 DOM/CSS，`DesignerRegionOutlet` 负责把两者接起来。

本文的读者已经能创建普通 visual material，现在要实现类似 Playground 的 Flex 容器、三分区容器、卡片布局或带固定插槽的页面模块。

## 先理解 Schema owner

一个最小的单区域容器如下：

```ts
const schema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [
    { id: 'layout-1', type: 'flex-container', props: { direction: 'column' } },
    { id: 'text-1', type: 'text', props: { content: '标题' } },
  ],
  structure: {
    // 容器 owner 必须在 root。
    root: ['layout-1'],
    containers: {
      // Region children 不进入 root，也不写进 layout-1 节点对象。
      'layout-1': {
        regions: {
          default: ['text-1'],
        },
      },
    },
  },
}
```

规则只有几条，但每一条都影响拖放和恢复：

- 容器节点必须是 `structure.root` 的直接成员。
- `structure.containers[containerId].regions[regionId]` 保存直接 children 的顺序；每个节点只能有一个 owner。
- Region child 不能再次成为容器 owner。当前 Schema 协议不支持容器嵌套，因此不要把容器节点放进另一个 Region。
- `nodes` 只保存节点对象；不要在节点对象上增加 `children`、`regions` 或依赖 Vue 组件实例的字段。

结构树可以这样读：

```text
root
└─ layout-1 (type: flex-container)
   └─ region: default
      └─ text-1 (type: text)
```

Designer 的 action 会同时维护 owner、顺序和 history。preview 不直接 push `structure.containers`，也不应在拖放事件中自行调用 `node.add`。

## 在 MaterialDefinition 中声明 Region

Region 是 material 的能力声明，不是 CSS 布局声明。它可以声明 ID、容量和允许的 type：

```ts
import type { MaterialDefinition } from '@dragcraft/designer'

export const cardMaterial: MaterialDefinition = {
  type: 'card',
  panel: { title: '卡片', group: 'layout' },
  schema: {
    defaultProps: { title: '标题' },
    container: {
      regions: [{
        id: 'content',
        cardinality: { min: 0, max: 4 },
        accepts: { types: ['text', 'image', 'button'] },
      }],
    },
  },
  presentation: {
    kind: 'visual',
    preview: CardPreview,
  },
}
```

| 声明 | 作用 | 不应该放在这里 |
| --- | --- | --- |
| `id` | Schema owner 和 outlet 的稳定键 | CSS class、grid area 名称的实现细节 |
| `cardinality.min` | Region 至少需要的 child 数 | “空态是否显示”的视觉判断 |
| `cardinality.max` | Region 最多允许的 child 数 | 拖放指示器的位置 |
| `accepts.types` | 允许放入的 material `type` 白名单 | Vue 组件名或运行时实例 |

Region 声明决定 Designer 的能力检查。Flex 的方向、wrap、gap、Grid 的轨道和 Split 的排列都应该由 preview props 和 CSS 决定，而不是写进 `container.regions`。Playground 用这种方式验证了 Flex 与 Split 的 schema 声明没有混入 `display`、`gridTemplate` 或 breakpoint 字段，参见 [`container.ts`](https://github.com/hackycy/dragcraft/blob/main/playground/src/components/widgets/container.ts)。

## 单 Region Flex：完整实现

### 1. 让插入位置可计算

`DesignerRegionOutlet` 不猜测你的布局方向。它在 `dragover` 时把事件、Region 元素、直接子节点元素和只读节点列表交给 `resolveDropIndex`。回调必须返回 `0..nodes.length` 的整数，或者返回 `null` 表示没有放置目标。

下面的类型是应用侧的结构化最小类型，不依赖 Designer 的内部类型：

```ts
interface DropIndexContext {
  event: DragEvent
  regionElement: HTMLElement
  itemElements: readonly HTMLElement[]
  nodes: readonly unknown[]
}

function resolveLinearDropIndex(
  ctx: DropIndexContext,
  axis: 'x' | 'y',
): number {
  const pointer = axis === 'x' ? ctx.event.clientX : ctx.event.clientY

  for (const [index, element] of ctx.itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    const midpoint = axis === 'x'
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2

    if (pointer < midpoint)
      return index
  }

  // 指针在所有 item 的中点之后，插入到末尾。
  return ctx.itemElements.length
}
```

算法的关键是“中点”，而不是元素的左上角：指针越过一个 item 的中点才进入下一个 index。对于横向 Flex 传 `x`，对于纵向 Flex 传 `y`。不要用 `querySelectorAll('*')` 自己收集元素；outlet 已经把直接 NodeHost 元素过滤到 `itemElements`，空态和 drop indicator 不会污染顺序。

### 2. 渲染 outlet

```ts
import { DesignerRegionOutlet } from '@dragcraft/designer'
import { defineComponent, h, type PropType } from 'vue'

type Direction = 'row' | 'column'

export const FlexContainer = defineComponent({
  name: 'FlexContainer',
  props: {
    direction: { type: String as PropType<Direction>, default: 'column' },
    wrap: { type: Boolean, default: false },
    gap: { type: Number, default: 12 },
    align: { type: String, default: 'stretch' },
  },
  setup(props) {
    return () => h(DesignerRegionOutlet, {
      regionId: 'default',
      resolveDropIndex: (ctx: DropIndexContext) =>
        resolveLinearDropIndex(ctx, props.direction === 'row' ? 'x' : 'y'),
      class: 'app-flex-container',
      style: {
        '--app-flex-direction': props.direction,
        '--app-flex-wrap': props.wrap ? 'wrap' : 'nowrap',
        '--app-flex-gap': `${props.gap}px`,
        '--app-flex-align': props.align,
      },
    })
  },
})
```

```css
.app-flex-container {
  display: flex;
  flex-direction: var(--app-flex-direction);
  flex-wrap: var(--app-flex-wrap);
  align-items: var(--app-flex-align);
  gap: var(--app-flex-gap);
  min-width: 0;
  min-height: 72px;
}

.app-flex-container > * {
  min-width: 0;
}
```

这里的直接子元素就是 outlet 投影的节点盒子；该规则只约束业务布局，不依赖 Designer 的实现类名。`DesignerRegionOutlet` 本身会：

1. 从当前容器 runtime 读取 `default` Region 的节点序列。
2. 为每个节点创建一次 NodeHost，并把 owner 标记为 `{ kind: 'container', containerId, regionId }`。
3. 在拖放时调用 `resolveDropIndex`，把 index 交回 Designer 的 policy、容量和 type 检查。
4. 在空 Region 中渲染空态，在有效目标处插入 drop indicator，在禁止目标处渲染 forbidden overlay。

因此 Flex preview 不需要也不应该把 children 作为 props 接收，更不能自己再次循环 Schema。

对应 material 可以很小：

```ts
export const flexContainerMaterial: MaterialDefinition = {
  type: 'flex-container',
  panel: { title: 'Flex 容器', group: 'layout' },
  schema: {
    defaultProps: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
    container: {
      regions: [{ id: 'default', cardinality: { max: 12 } }],
    },
  },
  presentation: { kind: 'visual', preview: FlexContainer },
}
```

### 3. 属性字段只改 props

`direction`、`wrap` 和 `gap` 是容器的业务 props，所以表单字段默认写入 `props`。只有可复用的外层间距才应绑定到 `style.container`：

```ts
const flexFormSchema = {
  sections: [{
    title: '布局',
    fields: [
      {
        key: 'direction',
        label: '方向',
        component: 'Select',
        componentProps: {
          options: [
            { label: '横向', value: 'row' },
            { label: '纵向', value: 'column' },
          ],
        },
      },
      { key: 'wrap', label: '自动换行', component: 'Switch' },
      { key: 'gap', label: '间距', component: 'InputNumber' },
    ],
  }],
}
```

## 多 Region Split：DOM 决定几何

多 Region 容器先声明固定的插槽，再由 preview 决定这些插槽如何拼成 Grid。下面的 Split 有 `top`、`bottomLeft`、`bottomRight` 三个 Region：

```ts
function region(regionId: string, className: string) {
  return h(DesignerRegionOutlet, {
    regionId,
    class: className,
    resolveDropIndex: (ctx: DropIndexContext) =>
      resolveLinearDropIndex(ctx, 'y'),
  })
}

export const SplitContainer = defineComponent({
  name: 'SplitContainer',
  props: {
    gap: { type: Number, default: 12 },
    primarySize: { type: String, default: '40%' },
  },
  setup(props) {
    return () => h('div', {
      class: 'app-split app-split--top-one-bottom-two',
      style: {
        '--app-split-gap': `${props.gap}px`,
        '--app-split-primary-size': props.primarySize,
      },
    }, [
      region('top', 'app-split__top'),
      h('div', { class: 'app-split__bottom' }, [
        region('bottomLeft', 'app-split__bottom-left'),
        region('bottomRight', 'app-split__bottom-right'),
      ]),
    ])
  },
})
```

```css
.app-split {
  display: grid;
  grid-template-rows: minmax(0, var(--app-split-primary-size)) minmax(0, 1fr);
  gap: var(--app-split-gap);
  width: 100%;
  min-height: 240px;
}

.app-split__bottom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-split-gap);
  min-width: 0;
  min-height: 0;
}

.app-split__top,
.app-split__bottom-left,
.app-split__bottom-right {
  min-width: 0;
  min-height: 96px;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #dfe8e2;
}
```

Material declaration 与 DOM 必须一一对应：

```ts
export const splitContainerMaterial: MaterialDefinition = {
  type: 'split-container',
  panel: { title: '异形容器', group: 'layout' },
  schema: {
    defaultProps: { gap: 12, primarySize: '40%' },
    container: {
      regions: [
        { id: 'top', cardinality: { max: 8 } },
        { id: 'bottomLeft', cardinality: { max: 8 } },
        { id: 'bottomRight', cardinality: { max: 8 } },
      ],
    },
  },
  presentation: { kind: 'visual', preview: SplitContainer },
}
```

`top`、`bottomLeft`、`bottomRight` 是持久化契约；`app-split__bottom` 和 Grid 轨道只是展示实现。将来把布局改成“左一右二”时，可以改变 DOM 和 CSS，但只要 Region ID 不变，已有 Schema 不需要迁移。若确实要重命名 Region，必须在宿主导入前执行离线 Schema migration。

## Drop index 的完整链路

一个 Region 的拖放不是“组件收到 drop 后直接 push”：

```text
HTML5 dragover
  -> DesignerRegionOutlet.resolveDropIndex()
  -> ContainerDropTarget
  -> Designer 检查 authoring policy、Region capacity、accepted types
  -> NodeDestination { kind: 'container', containerId, regionId, index }
  -> node.add / node.move action
  -> Schema structure 更新
  -> history 记录
  -> Region 重新投影
```

outlet 已经负责阻止浏览器默认行为、阻止嵌套 Region 的事件冒泡和发布 drop target。resolver 只负责几何：

- 返回 `0` 表示插入到第一个 child 前。
- 返回 `nodes.length` 表示插入到末尾。
- 返回 `null` 表示当前指针没有有效区域，例如异形布局的空白区域。
- 返回非整数、负数或大于 `nodes.length` 的值会产生 `CONTAINER_DROP_ADAPTER_INVALID`。
- 没有提供 resolver、resolver 抛错或没有命中目标时，分别产生 `CONTAINER_DROP_ADAPTER_MISSING`、`CONTAINER_DROP_ADAPTER_FAILED` 或 `CONTAINER_DROP_NO_TARGET`。

区域是二维布局时，不要把“最近距离”硬编码成通用算法。对于 Grid，可以先根据 row/column 轨道找到候选 Region，再在该 Region 内沿其主轴计算 index；对于 Masonry 或自由布局，可以返回 `null`，让宿主提供明确的 drop affordance。框架只要求最终得到一个 Region 内的线性 index。

## `useContainerRuntime`：需要时再使用

简单容器只要渲染 `DesignerRegionOutlet`，不需要直接访问 runtime。需要展示 Region 标题、统计数量或根据当前解析状态切换业务 UI 时，可以在已解析的容器 material 内使用 `useContainerRuntime()`：

```ts
import { useContainerRuntime } from '@dragcraft/designer'
import { computed, defineComponent, h } from 'vue'

export const RegionSummary = defineComponent({
  setup() {
    // 该组件必须运行在 Designer 已解析的容器 preview 内。
    const runtime = useContainerRuntime()
    const count = computed(() => runtime.getRegionNodes('content').length)
    const regionTitle = computed(() =>
      runtime.regionDefinitions.value.find(item => item.id === 'content')?.title ?? '内容',
    )

    return () => h('span', `${regionTitle.value}: ${count.value}`)
  },
})
```

公开的 runtime 能力包括：

| API | 用途 |
| --- | --- |
| `nodeId` | 当前容器节点 ID |
| `regionDefinitions` | 已解析的 Region ID、标题和约束 |
| `getRegionNodes(regionId)` | 读取该 Region 当前的只读节点序列 |
| `registerOutlet` / `getOutletState` | outlet 自己使用；可用于诊断自定义渲染 |
| `recoveryRegionIds` | 哪些声明 Region 没有 outlet，需要保留 children |

不要从 runtime 取得 nodes 后自己渲染 NodeHost；这会造成重复投影、重复选择和重复 drop target。children 的唯一渲染入口仍然是对应 Region 的 `DesignerRegionOutlet`。

## 约束、policy 与诊断

### 约束在哪里生效

Region 的 `cardinality` 和 `accepts.types` 是 Designer 的结构能力约束，拖放前会检查，导入和 Schema resolution 也会再次检查。容器 material 的 `authoring.policy` 则是节点级规则，例如导航栏禁止移动、页面只允许创建一个 Tab 栏；它们是两个独立的决策层。

常见的 Schema diagnostics 如下：

| code | 含义 |
| --- | --- |
| `CONTAINER_OWNER_MISSING` | `structure.containers` 引用了不存在的节点 |
| `CONTAINER_OWNER_NOT_ROOT` | 容器 owner 不在 `structure.root` |
| `CONTAINER_STRUCTURE_MISSING` | material 声明了容器，但节点没有对应结构 |
| `CONTAINER_CAPABILITY_MISMATCH` | 结构声明为容器，但当前 material 没有 container 能力 |
| `CONTAINER_REGION_UNKNOWN` / `CONTAINER_REGION_MISSING` | Schema 的 Region 与 material 声明不一致 |
| `REGION_CARDINALITY_MIN` / `REGION_CARDINALITY_MAX` | child 数量超出最小或最大容量 |
| `REGION_TYPE_NOT_ACCEPTED` | child 的 `type` 不在 Region 白名单 |
| `REGION_CHILD_CONTAINER_FORBIDDEN` | 当前协议中把容器放进了另一个 Region |

这些诊断属于 Schema resolution，不要在 preview 里用 `if (!children.length)` 伪造校验结果。导入时如果状态是 `rejected`，宿主应保留原数据并报告 diagnostics；如果文档可渲染但部分结构 `degraded` 或 `conflicted`，再让 Designer 提供恢复视图。

### outlet 配置错误如何恢复

每个声明 Region 必须有且只有一个 primary outlet：

- 声明的 Region 没有 outlet：Designer 显示 `CONTAINER_REGION_OUTLET_MISSING` recovery，并把该 Region 的所有 children 保留在恢复视图中。
- 同一个 Region 渲染两个 outlet：第一个是 primary，重复 outlet 显示 `CONTAINER_REGION_DUPLICATE_OUTLET` 诊断，不会再渲染一份 children。
- outlet 使用未声明的 Region ID：显示 unknown outlet recovery，不会静默创建新的 Schema Region。
- 未解析的 container material：显示 container fallback/recovery；不要让业务 preview 自己吞掉 children。

恢复视图的目的，是让用户还能看到并迁移已有数据。修复 material 声明或 preview 后，重新解析即可回到正常 outlet；不要通过删除 Region children 来“消除”诊断。

## 测试容器的三个层次

### Schema 与 material 契约

```ts
import { expect, it } from 'vitest'

it('keeps Split Region IDs stable and layout-free', () => {
  expect(splitContainerMaterial.schema?.container?.regions.map(region => region.id))
    .toEqual(['top', 'bottomLeft', 'bottomRight'])

  expect(JSON.stringify(splitContainerMaterial.schema?.container))
    .not.toMatch(/display|gridTemplate|breakpoint|flexDirection/)
})
```

### 几何算法

```ts
it('inserts before the first midpoint and after the last item', () => {
  const item = (left: number, top: number): HTMLElement => ({
    getBoundingClientRect: () => ({ left, top, width: 20, height: 20 }) as DOMRect,
  } as HTMLElement)

  const ctx: DropIndexContext = {
    event: { clientX: 35, clientY: 5 } as DragEvent,
    regionElement: {} as HTMLElement,
    itemElements: [item(0, 100), item(40, 40)],
    nodes: [],
  }

  expect(resolveLinearDropIndex(ctx, 'x')).toBe(1)
  expect(resolveLinearDropIndex(ctx, 'y')).toBe(0)
  expect(resolveLinearDropIndex({
    ...ctx,
    event: { clientX: 80, clientY: 80 } as DragEvent,
  }, 'x')).toBe(2)
})
```

### Presentation 恢复

至少覆盖以下渲染测试：

- 正常容器为每个声明 Region 渲染一个 outlet，children 每个只出现一次。
- 缺少 outlet 时出现 `CONTAINER_REGION_OUTLET_MISSING`，原 children 仍可见。
- 重复 outlet 时出现 `CONTAINER_REGION_DUPLICATE_OUTLET`，不会复制 children。
- Region 拖放的 forbidden overlay 会在 capacity 或 accepted type 不满足时出现。

Playground 的 [`container.test.ts`](https://github.com/hackycy/dragcraft/blob/main/playground/src/components/widgets/container.test.ts) 覆盖了 Region ID、声明与 CSS 解耦以及线性插入中点；Designer 的 container tests 还覆盖了 missing/duplicate outlet recovery。

## 生产 Runtime 的对接方式

生产端不渲染 `DesignerRegionOutlet`，也不导入 `useContainerRuntime`。它应使用自己的 registry，根据 Schema owner 递归（当前协议只需要 root 加一层 Region）渲染：

```ts
function renderProductionRoot(schema: DocumentSchema) {
  return schema.structure.root.map(nodeId => renderProductionNode(nodeId, schema))
}

function renderProductionNode(nodeId: string, schema: DocumentSchema) {
  const node = schema.nodes.find(item => item.id === nodeId)
  if (!node)
    return null

  const container = schema.structure.containers[node.id]
  if (!container)
    return renderLeaf(node)

  const regions = Object.fromEntries(
    Object.entries(container.regions).map(([regionId, childIds]) => [
      regionId,
      childIds.map(childId => renderProductionNode(childId, schema)),
    ]),
  )

  return productionRegistry[node.type]?.({ node, regions }) ?? renderUnknown(node)
}
```

生产组件自己决定 Region 的 DOM、滚动、响应式和 fixed overlay。Designer 中的 reservation、viewport plane、selection、drop indicator 和 recovery 只属于编辑器；发布时只保留稳定的 `type`、props、style 和结构数据。

## 开发前检查

- 先画出 root 和每个 Region 的 owner，不要先写 CSS。
- 为每个声明 Region 写一个且仅一个 `DesignerRegionOutlet`。
- 为每种几何写独立的 `resolveDropIndex`，明确主轴和空白区域行为。
- 将容量与 accepted types 放在 material schema，将 flex/grid 放在 preview CSS。
- 用正常、空态、满容量、禁止 type、missing outlet、duplicate outlet 六种状态检查画布。
- 导出并重新导入 Schema，确认 Region children 顺序和 diagnostics 与预期一致。
- 生产 Runtime 使用独立 registry；不要把 Designer Presentation 组件带入生产包。

继续阅读 [布局投影](/guide/fundamentals/layout-system) 了解页面级 fixed/overlay，或查看 [渲染与容器参考](/reference/designer-rendering) 查询公开入口。
