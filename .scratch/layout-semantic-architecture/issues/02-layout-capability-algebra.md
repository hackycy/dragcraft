# 布局能力代数与空间关系模型

Status: resolved
Type: grilling
Blocked by: none

## Question

从空间能力而不是现有分类出发，确定新的布局语义代数：如何组合参照物、空间占用、滚动关系、坐标系、边缘依附、锚点、偏移、避让和叠放，并把这些纯数据语义正交关联到文档结构中的节点；现有正文、固定页面结构和浮层只是验收场景，不预设 `flow/chrome/layer`、surface 或 sort scope 必须继续存在。

## Answer

本票的结论是：持久化 Schema 不保存空间语义，因此不在 Schema 中建立空间关系代数，也不把 `flow`、`chrome`、`layer`、surface、anchor、reserve、avoid 或坐标系作为文档字段。

Schema 只保存：

- 节点定义数组、稳定的节点 `id`、`type`、props 和纯数据 style。
- 页面 root 与一层容器 region 的结构归属和顺序。
- 消费端能够识别的语义标识；语义标识不是位置或几何描述。

空间关系由消费端展示策略解释：

```text
Schema node type
        │
        ├── Designer Presentation Adapter
        │     Vue 预览组件、画布区域、选中与拖放几何
        │
        └── External Schema Consumer
              自主实现组件、页面空间、滚动、定位和设备适配
```

`navigation` 可以在一个运行时被放入顶部区域，在另一个运行时作为普通内容渲染；`floating-action` 可以由设计器以画布中的普通预览节点展示，而生产运行时把它锚定到自己的交互层。Schema 不需要记录这些差异。

因此 `Schema 结构解析器` 的职责只包括 Designer/Core 所需的 Schema 结构和语义标识解析；它不输出跨平台的 page/chrome/layer 空间计划。外部消费端不依赖 `ResolvedDocument` 或 Dragcraft adapter，只消费纯数据 Schema，也不能以复用为由把空间字段重新塞回 Schema。

边界与取舍：

1. 内容顺序、容器归属和语义标识属于文档事实，必须跨消费端稳定。
2. 空间位置、避让、滚动和叠放属于展示策略，可以按宿主不同而不同。
3. `type` 是唯一消费端展示绑定键；不同语义使用不同 type，同类型实例差异使用普通业务 props，不增加 role 或几何字段。
4. 设计器使用者负责提供 Designer Presentation Adapter；Core 不强迫物料通过某个页面空间模型展示。
5. Flutter、原生、Web 或其他生产消费端只需消费同一份纯数据 Schema，其 renderer、行为注册与未知 type 策略完全位于 Dragcraft 之外。
