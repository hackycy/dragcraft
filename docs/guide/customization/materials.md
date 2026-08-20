---
description: "使用单一 MaterialDefinition 定义业务节点、属性面板和设计态展示。"
---

# 业务物料

`MaterialDefinition` 是一个业务 type 的唯一 Designer 注册面。它将 Schema 声明、authoring 能力、属性面板和设计态 Presentation 放在一起。

```ts
const noticeMaterial = defineMaterial({
  type: 'notice',
  panel: { title: '公告', group: 'marketing', groupTitle: '营销' },
  schema: { defaultProps: { text: '新公告' } },
  inspector: { formSchema: noticeFormSchema },
  presentation: { kind: 'visual', preview: NoticePreview },
})
```

`type` 是写入 DocumentSchema 的稳定语义键。Vue 组件名、文件名和物料栏标题可以改变；改变 type 时由宿主离线重写已有数据。

## 物料部分

| 部分 | 用途 |
| --- | --- |
| `schema` | 默认 props、默认样式和容器 region 声明。 |
| `authoring` | NodeBundle 创建方式以及 create、move、remove、update 策略。 |
| `inspector` | 属性面板的 FormSchema。 |
| `panel` | 物料栏标题、分组、标签、搜索词和可见性。 |
| `presentation` | visual preview 或显式 headless 行为。 |

同一 materials 数组中的 type 不得重复。visual 物料必须有 preview；headless 物料不提供 preview，但仍能拥有 inspector 和默认 props。

模板固定提供的物料可以通过 `panel.visible: false` 从标准物料栏隐藏；也可以传入接收 `{ schema, materialType }` 的函数，按当前文档动态决定是否显示。隐藏只影响物料栏，节点仍可在结构树中选择并通过 inspector 编辑。

## Headless 物料

Headless 适合只产生配置、不需要业务预览的物料。它仍出现在物料栏，并带有无画布预览标识。拖入 Canvas 时只显示中性全屏说明；松开后创建可编辑的 Schema 节点，不显示摆放位置，也不在属性面板重复提示。

## 容器与组件内写入

需要 children 的物料在 `schema.container` 中声明 region。业务 preview 通过 `DesignerRegionOutlet` 呈现 child 节点；容器 DOM 与几何属于业务组件。

物料的属性表单可以把布局字段显式绑定到节点样式：

```ts
const formSchema = {
  sections: [{
    title: '布局样式',
    fields: [
      {
        key: 'containerMargin',
        label: '容器外边距',
        component: 'Spacing',
        bindTo: { scope: 'node', path: 'style.container' },
        componentProps: { type: 'margin', min: -120, max: 120 },
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

`style.container` 会作用于 Designer 的物料外层容器，`style.content` 会作用于物料内容；数值长度（包括负的 `marginTop`）会在展示时规范化为 CSS 长度。在普通文档流中，`style.content.margin` 会成为 NodeHost 的内部布局 footprint，Designer 的 mask 和命中区域会覆盖这部分留白；`style.container.margin` 是 NodeHost 外部间距，不计入 NodeHost 几何。绝对定位等脱离文档流的 Preview 由对应的 Frame 或 Portal 处理：Frame 提供定位上下文，NodeHost 对齐 Preview 的实际矩形；`style.container.margin` 不会写入 viewport NodeHost anchor，viewport 内的定位和间距应由 Frame 或 Preview 根元素负责。root-owned 节点的选中态会在 root plane 绘制横向贯穿的视觉段，但不会扩大 NodeHost、mask 或点击区域；container-owned 节点的选中框严格跟随 NodeHost。业务 preview 不直接修改 DOM 或 Schema；可持久化修改始终通过受控 Authoring Action。

字段配置见 [表单与字段](/guide/customization/forms-and-fields)，容器见 [容器与 region](/guide/customization/layout-and-containers)。
