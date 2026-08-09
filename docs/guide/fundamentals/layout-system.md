---
description: "理解 Designer Presentation 的 flow、chrome、layer 与生产运行时边界。"
---

# 布局与 Presentation

Designer 的 `MaterialDefinition.presentation.layout` 描述设计态物料的布局意图。它不是生产 Runtime 协议，也不改变 DocumentSchema 的节点所有权。

| placement | 设计态位置 | 典型物料 |
| --- | --- | --- |
| `flow` | 业务内容流 | 文本、公告、图片。 |
| `chrome` | 业务页面边缘 | 页头、固定底栏。 |
| `layer` | 业务预览浮层 | 浮动操作、角标。 |

```ts
presentation: {
  kind: 'visual',
  preview: FloatingActionPreview,
  layout: {
    placement: {
      kind: 'layer',
      layer: 'float',
      mode: 'framework',
      anchor: { block: 'end', inline: 'end' },
      offset: { blockEnd: 16, inlineEnd: 16 },
    },
  },
}
```

`flow` 节点按 `schema.structure.root` 的顺序出现。`chrome` 和 `layer` 是同一业务预览中的不同 Presentation plane，不能通过提高业务 z-index 覆盖 Designer 工具栏或 Device Frame。

容器 region 的节点由业务容器组件排列，不参与页面级 placement。flex、grid、分栏轨道和响应式断点由业务组件定义。

生产运行时独立按 type 决定布局和平台组件。它读取 DocumentSchema，但不导入或复用 Designer 的 Presentation、Canvas Surface 或 Device Frame 交互。
