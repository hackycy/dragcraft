# 外部容器物料

外部容器物料让业务组件自己定义布局几何，同时把子节点的持久化、约束校验、拖放和渲染交给 dragcraft。它适合 flex、grid、分栏和其他业务定义的布局；只有自身属性、没有独立子区域的组件仍按普通物料实现。

先看一个只有一个纵向区域的容器：

```ts
import type {
  ContainerDefinition,
  DesignerWidgetMeta,
  ResolveContainerDropIndexContext,
} from '@dragcraft/designer'
import { ContainerRegionOutlet } from '@dragcraft/designer'
import { defineContainerWidget } from '@dragcraft/widgets'
import { defineComponent, h } from 'vue'

function resolveVerticalDropIndex(
  { event, itemElements }: ResolveContainerDropIndexContext,
): number {
  for (const [index, element] of itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    if (event.clientY < rect.top + rect.height / 2)
      return index
  }
  return itemElements.length
}

const columnMeta: DesignerWidgetMeta & { container: ContainerDefinition } = {
  type: 'column-container',
  title: '纵向容器',
  group: 'layout',
  defaultProps: {},
  formSchema: { sections: [] },
  material: { description: '按纵向排列子物料', tags: ['布局'] },
  container: {
    defaultVariant: 'single',
    variants: {
      single: {
        title: '单列',
        regions: [{ id: 'content', title: '内容' }],
      },
    },
  },
}

const ColumnContainer = defineComponent({
  name: 'ColumnContainer',
  setup() {
    return () => h(ContainerRegionOutlet, {
      regionId: 'content',
      class: 'app-column-container',
      resolveDropIndex: resolveVerticalDropIndex,
    })
  },
})

export const columnContainer = defineContainerWidget({
  meta: columnMeta,
  component: ColumnContainer,
})
```

`container.variants` 声明稳定的区域 ID。`ContainerRegionOutlet` 根据 `content` 读取该区域的节点、渲染子物料和拖放反馈；容器组件只负责它的 DOM 与 CSS。`resolveVerticalDropIndex()` 返回插入边界，从 `0` 到当前子节点数量。指针在所有节点之后时返回 `itemElements.length`。

把这个物料拖到页面后，容器节点仍位于 `root.children`，但它的普通子节点存放在 `container.regions`：

```ts
{
  id: 'layout-1',
  type: 'column-container',
  props: {},
  container: {
    variant: 'single',
    regions: {
      content: [
        { id: 'text-1', type: 'text', props: { content: '欢迎' } },
      ],
    },
  },
}
```

不要在容器组件中手动渲染 `WidgetRenderer`，也不要把子节点写进普通的 `children` 字段。这样会绕过 region 所有权、拖放目标与结构命令。

## 声明区域约束

静态约束写在 region 上；动态业务判断写在 `canPlace`。Core 会在拖放预览和真正执行 `ADD_NODE`、`MOVE_NODE` 时重新校验它们。

```ts
container: {
  defaultVariant: 'single',
  variants: {
    single: {
      title: '单列',
      regions: [{
        id: 'content',
        title: '内容',
        constraints: {
          includeTypes: ['text', 'image'],
          maxItems: 12,
        },
      }],
    },
  },
  canPlace: ({ child }) => child.type === 'image' && child.props.format === 'gif'
    ? { allowed: false, code: 'ANIMATED_IMAGE_UNSUPPORTED' }
    : { allowed: true },
},
```

`includeTypes`、`excludeTypes`、`minItems` 和 `maxItems` 适合不依赖当前页面状态的规则。需要读取当前容器、目标 region 或候选节点属性时使用 `canPlace`，并返回稳定的 `code`，让宿主可以显示对应的业务提示。

## 计算插入位置

`ContainerRegionOutlet` 不猜测 flex、grid 或异形区域的插入方向。你可以把固定的策略放在 `containerAdapter.resolveDropIndex`，或像前面的示例一样直接传给 outlet。

| 场景 | 放置位置 |
| --- | --- |
| 所有实例使用同一种插入几何 | `meta.containerAdapter.resolveDropIndex` |
| 插入方向由当前 props 或当前 variant 决定 | `ContainerRegionOutlet` 的 `resolveDropIndex` prop |

resolver 收到 `event`、region 元素、直属子节点元素和当前 region 节点。它必须返回有效的整数插入边界；无法确定目标时返回 `null`。缺少、抛错或返回越界索引时，框架拒绝这次放置，不会把节点猜测追加到末尾。

## 切换容器变体

不同变体使用相同的一组 region ID 时，框架可以保留已有 `regions`。变体新增、删除或重命名 region 时，物料必须提供 `migrateVariant`，返回完整的目标状态。

```ts
import type {
  ContainerVariantMigrationContext,
  ContainerVariantMigrationResult,
} from '@dragcraft/designer'

function migrateVariant(
  ctx: ContainerVariantMigrationContext,
): ContainerVariantMigrationResult {
  const nodes = ctx.fromVariant.regions.flatMap(
    region => ctx.state.regions[region.id] ?? [],
  )

  if (nodes.length > 2)
    return { allowed: false, code: 'TWO_COLUMN_CAPACITY_EXCEEDED' }

  return {
    allowed: true,
    state: {
      variant: ctx.toVariantId,
      regions: {
        left: nodes.slice(0, 1),
        right: nodes.slice(1),
      },
    },
  }
}
```

变体字段要绑定到 `container.variant`，不要把它当作普通 props。Designer 会把这个绑定翻译成 `CHANGE_CONTAINER_VARIANT`，随后由 Core 执行迁移、校验和历史记录。

```ts
{
  key: 'variant',
  label: '布局',
  component: 'Select',
  bindTo: { scope: 'container', path: 'variant' },
  componentProps: {
    options: [
      { label: '单列', value: 'single' },
      { label: '两列', value: 'two-column' },
    ],
  },
}
```

## 理解所有权和交互

容器与页面布局各自管理不同层次的数据。先按下面的边界设计，能避免把业务几何放进框架协议：

| 内容 | 由谁负责 |
| --- | --- |
| 容器节点在页面中的 `flow`、`chrome` 或 `layer` 布局 | root `LayoutPlan` |
| 容器内部的 region 和普通子节点 | `container.regions` 与 `ContainerRegionOutlet` |
| flex/grid/分栏 DOM、CSS 和插入轴 | 容器物料 |
| region 约束、跨 region 移动、撤销和校验 | Core 命令系统 |
| 区域空态、插入指示与禁止状态 | Renderer |

容器只能作为 root 节点存在，region 只能包含普通节点，当前不支持嵌套容器。已解析容器在未选中时使用画布外的选择 handle；容器自身不通过 hover 抢占子节点。子节点完全遮住容器时，可以从结构面板选中容器。

未注册对应物料的容器仍会保留原始 region 数据并显示恢复态，但不能进行结构修改。接入新版本时先注册相应的 `ContainerDefinition`，再允许用户编辑该页面。

容器的公开 API 见 [@dragcraft/core](/reference/core)、[@dragcraft/renderer](/reference/renderer) 和 [@dragcraft/designer](/reference/designer)。需要处理自定义选中投影或设备 Frame 时，继续阅读 [主题与设备框架](/guide/themes-and-device-frames)。
