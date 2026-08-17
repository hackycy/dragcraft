---
description: "理解 Designer 的页面投影、viewport plane 和空间避让，并实现导航栏、Tab 栏与浮动物料。"
---

# 布局投影

这篇文档回答一个很具体的问题：一个节点如何在 Designer 里成为“固定顶部导航”“底部 Tab 栏”或“悬浮按钮”，同时仍然是普通的 Schema 节点？

先记住边界：`DocumentSchema` 只保存节点、节点顺序和 owner，不保存浏览器几何、固定定位、滚动避让或 z-index。布局投影是 Designer Presentation 的职责；业务组件的 DOM 和 CSS 才是组件内部布局的职责。

## 先画出边界

一次页面渲染可以简化为下面这棵树。名称是概念层，不要在业务 CSS 中依赖实现类名。

```text
Application Surface
├─ Frame Boundary
│  ├─ Container Shell / Device Frame（只包围一次）
│  │  └─ Canvas Surface
│  │     ├─ Scrollport
│  │     │  └─ Content Layout
│  │     │     └─ Content Surface（root 节点的默认挂载面）
│  │     └─ Viewport Plane（固定、浮层、viewport selection）
│  └─ Root Selection Plane（root 节点的选择投影）
└─ Interaction Plane（工具栏、拖放反馈等）
```

这棵树决定了三个常见结果：

| 需求 | 该放在哪里 | 是否占用内容空间 |
| --- | --- | --- |
| 普通页面物料 | `Content Surface` | 是，由节点和页面 CSS 决定 |
| 固定顶部或底部物料 | `PresentationFrame` + `DesignerViewportPortal` | Frame 自己不参与文档流；通过 reservation 给内容让出空间 |
| 浮动按钮、全屏提示 | `PresentationFrame` + `DesignerViewportPortal` | 否，覆盖 viewport；组件自己决定点击区域 |

`Canvas Surface` 是唯一的业务滚动和裁剪边界。Device Frame 或 Container Shell 只能渲染一次 default slot，不能在外面再创建一个业务 scrollport，也不能从 Schema 重建节点树。完整的外壳契约见 [Presentation 与容器](/reference/designer-rendering)。

## Schema 与投影是两回事

下面的 Schema 可以同时包含导航、正文、Tab 和浮动按钮：

```ts
const schema = {
  version: '1',
  globalConfig: {},
  page: { props: {}, style: { surface: { backgroundColor: '#f6f7f9' } } },
  nodes: [
    { id: 'navbar-1', type: 'navbar', props: { title: '商品详情' } },
    { id: 'content-1', type: 'text', props: { content: '商品介绍' } },
    { id: 'tabbar-1', type: 'tab-bar', props: { tabs: [], activeIndex: 0 } },
    { id: 'action-1', type: 'floating-button', props: { label: '+' } },
  ],
  structure: {
    root: ['navbar-1', 'content-1', 'tabbar-1', 'action-1'],
    containers: {},
  },
}
```

`root` 顺序仍然是 `navbar-1 -> content-1 -> tabbar-1 -> action-1`。当 `navbar` 的 material 声明了 `frame`，Application Surface 只是在渲染时把这个 root NodeHost 包进 frame；它不会移动节点、重写顺序或向 Schema 写入“顶部”字段。当前实现只对 root nodes 应用 `presentation.frame`，所以 frame 适合页面级物料。容器内部的节点应由容器自己的 DOM 和 CSS 管理空间。

## 三种投影策略

### 固定边缘：Portal 加 reservation

`DesignerViewportPortal` 把完整的 NodeHost slot Teleport 到 viewport plane。`useSurfaceReservation` 注册一个边缘空间，Application Surface 会测量元素尺寸并把所有同边缘的 reservation 累加到 inset 变量。元素还没有测量完成时，`fallbackSize` 提供初始值。

下面的工厂同时实现顶部导航和底部 Tab 栏。它只依赖公开入口，可以直接放进宿主的 material 注册文件：

```ts
import type { PresentationFrame } from '@dragcraft/designer'
import { DesignerViewportPortal, useSurfaceReservation } from '@dragcraft/designer'
import { defineComponent, h, ref } from 'vue'

function createEdgeFrame(
  edge: 'block-start' | 'block-end',
  fallbackSize: number,
  className: string,
): PresentationFrame {
  return defineComponent({
    name: `EdgeFrame_${edge}`,
    setup(_, { slots }) {
      const element = ref<HTMLElement | null>(null)
      useSurfaceReservation(element, { edge, fallbackSize })

      return () => h(DesignerViewportPortal, null, {
        default: () => h('div', {
          ref: element,
          class: ['app-presentation-frame', className],
        }, slots.default?.()),
      })
    },
  })
}

const TopNavigationFrame = createEdgeFrame(
  'block-start',
  44,
  'app-presentation-frame--top',
)

const BottomTabFrame = createEdgeFrame(
  'block-end',
  50,
  'app-presentation-frame--bottom',
)
```

对应的业务 CSS 只负责定位和视觉：

```css
.app-presentation-frame--top {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 0;
  z-index: 4;
  background: #fff;
}

.app-presentation-frame--bottom {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 2;
  min-height: 50px;
  background: #fff;
}
```

`fallbackSize` 不是最终布局值：元素挂载后由 `ResizeObserver` 测量，顶部和底部各注册多个 reservation 时会分别相加。不要在内容组件里手动再加一份同样的 padding，否则会出现双重避让。

物料定义只描述语义和 frame：

```ts
import type { MaterialDefinition } from '@dragcraft/designer'

export const navbarMaterial: MaterialDefinition = {
  type: 'navbar',
  panel: { title: '导航栏', group: 'navigation' },
  schema: { defaultProps: { title: '页面标题' } },
  authoring: {
    policy: { duplicate: 'denied', move: 'denied' },
  },
  presentation: {
    kind: 'visual',
    preview: NavbarPreview,
    frame: TopNavigationFrame,
  },
}

export const tabBarMaterial: MaterialDefinition = {
  type: 'tab-bar',
  panel: { title: 'Tab 栏', group: 'navigation' },
  schema: { defaultProps: { tabs: [], activeIndex: 0 } },
  authoring: {
    policy: { duplicate: 'denied', move: 'denied' },
  },
  presentation: {
    kind: 'visual',
    preview: TabBarPreview,
    frame: BottomTabFrame,
  },
}
```

如果页面只允许一个 Tab 栏，`create` policy 应根据当前 Schema 返回 `denied`；policy 解决的是可编辑性和业务规则，reservation 解决的是几何，两者不要混在 preview 里。

### 覆盖 viewport：Portal 不加 reservation

浮动按钮也使用 Portal，但它不应该改变内容的可用高度。按钮可以读取公开 inset 变量，避开底部 Tab 栏和设备安全区：

```ts
const FloatingActionFrame: PresentationFrame = defineComponent({
  name: 'FloatingActionFrame',
  setup(_, { slots }) {
    return () => h(DesignerViewportPortal, null, {
      default: () => h('div', {
        class: 'app-presentation-frame app-presentation-frame--floating',
      }, slots.default?.()),
    })
  },
})
```

```css
.app-presentation-frame--floating {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

/* 只有真正的操作控件恢复点击；透明覆盖层不能拦截画布事件。 */
.app-presentation-frame--floating .app-floating-button {
  pointer-events: auto;
}
```

预览组件可以这样计算位置：

```ts
const style = computed(() => ({
  right: `calc(var(--dc-inset-inline-end) + ${props.sideOffset}px)`,
  bottom: `calc(var(--dc-inset-block-end) + ${props.bottom}px)`,
}))
```

`--dc-inset-*` 已经包含设备安全区和所有已测量 reservation。浮动按钮本身的尺寸、边距和点击区域仍属于业务组件；Frame 不应读取 props 或直接绘制按钮。

Playground 中的完整对照实现位于 [`next-fixtures.ts`](https://github.com/hackycy/dragcraft/blob/main/playground/src/config/next-fixtures.ts) 和 [`mini-program.ts`](https://github.com/hackycy/dragcraft/blob/main/playground/src/components/widgets/mini-program.ts)。其中导航栏、Tab 栏和浮动按钮共享同一条 NodeHost 投影链路，差别只有“是否 reservation”和自己的定位 CSS。

## 样式应该写到哪里

一个节点有三类常用样式目标：

| 目标 | 写入路径 | 作用 | 适合的内容 |
| --- | --- | --- | --- |
| 页面背景或整体内边距 | `page.style.surface` | 直接应用到 Content Surface | 页面级背景、内容区域的统一 padding |
| 节点外层盒子 | `node.style.container` | 应用到 Designer NodeHost 外层 wrapper | 外边距、参与父容器排列的宽高、外层定位 |
| 业务内容 | `node.style.content` | 作为 `style` 传给 preview 组件 | 文字、按钮、图片等内容的尺寸和颜色 |

例如物料属性面板可以把“容器内边距”和“内容内边距”分开绑定：

```ts
const formSchema = {
  sections: [{
    title: '布局样式',
    fields: [
      {
        key: 'containerPadding',
        label: '外层内边距',
        component: 'Spacing',
        bindTo: { scope: 'node', path: 'style.container' },
        componentProps: { type: 'padding', min: 0, max: 120 },
      },
      {
        key: 'contentPadding',
        label: '内容内边距',
        component: 'Spacing',
        bindTo: { scope: 'node', path: 'style.content' },
        componentProps: { type: 'padding', min: 0, max: 120 },
      },
    ],
  }],
}
```

不要用 `style.content` 代替 reservation：content style 只影响一个 NodeHost 的 preview，不会让 Canvas Surface 为固定元素留空间；也不要让 preview 直接修改 Schema，持久化样式必须经字段绑定或 authoring action。

## 选择正确的扩展点

遇到布局问题时按下面的顺序判断：

1. 节点是不是页面级 root？是固定、浮层还是普通内容？只有 root-level fixed/overlay 才考虑 `frame`。
2. 需要不需要让内容避开它？需要就注册 `useSurfaceReservation`；不需要就只使用 Portal。
3. 需要改变的是节点外层、业务内容还是整页 surface？分别写入 `style.container`、`style.content` 或 `page.style.surface`。
4. 节点是否是容器？容器内部 children 不使用 frame，而是在 preview 中使用 `DesignerRegionOutlet`。
5. 是不是生产页面？生产 Runtime 不复用 Frame、Portal、Device Frame、Canvas Surface 或 Designer 的交互层。

### 与生产 Runtime 对接

生产渲染器只需要稳定的 `type`、props、style 和结构 owner：

```ts
function renderRoot(schema: DocumentSchema) {
  return schema.structure.root.map(nodeId => renderNode(nodeId, schema))
}

function renderNode(nodeId: string, schema: DocumentSchema) {
  const node = schema.nodes.find(item => item.id === nodeId)
  if (!node)
    return null

  // 生产端自己决定：导航是否 fixed、如何处理 safe area、如何滚动。
  return componentRegistry[node.type]?.({ node, schema }) ?? renderUnknown(node)
}
```

生产端可以把 `navbar` 映射成平台导航组件，把 `tab-bar` 映射成自己的底部导航，把 `floating-button` 放在自己的 viewport overlay；这些实现不需要、也不应该导入 Designer Presentation。Schema 到生产布局的映射规则由宿主的 registry 和发布协议拥有。

## 验收清单

- 顶部和底部固定物料在 resize 后仍能避让内容，多个同边缘 reservation 不会覆盖彼此。
- 浮动按钮不扩大内容高度，透明覆盖层不拦截正文点击，按钮本身可以点击。
- frame 只包装完整 NodeHost slot；没有在 frame 中重复渲染 preview 或手动创建 NodeHost。
- root 结构顺序、撤销历史和导出的 Schema 与加入 frame 前一致。
- 容器内部布局由容器 preview 处理，不依赖 root frame。
- 生产预览使用自己的组件 registry，不把 Designer 的 viewport plane 或设备外壳带入发布包。

下一步阅读 [容器与 Region](/guide/customization/layout-and-containers)，学习如何把同样的边界应用到 Flex、Grid 和多区域物料。
