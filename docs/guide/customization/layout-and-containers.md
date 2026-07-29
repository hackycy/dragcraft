---
description: "在完成核心布局课程后，扩展页面 placement 和业务容器的结构约束。"
---

# 页面布局与容器

入门课程已经让页头使用 `chrome`，并实现了一个分栏容器。本页用于扩展这两套机制，而不是绕过它们手动递归 Schema。

## 页面 placement 和容器 region 是两层结构

页面顶层节点通过 `layout.placement` 进入 `flow`、`chrome` 或 `layer`。容器区域中的节点由容器拥有，不再声明页面 placement。

| 需要改变的结果 | 使用的协议 |
| --- | --- |
| 内容应该进入哪块页面 surface | `defaultLayout` 或节点 `layout.placement` |
| 容器有几个区域、每个区域能放多少节点 | `ContainerDefinition.variants` |
| 切换网格、列数或模板时如何安排已有节点 | `migrateVariant()` |
| 指针落在区域哪里时插入 | `ContainerRegionOutlet` 和 `resolveDropIndex` |

## 声明外部容器

贯穿示例把单列和双列的转换写成显式迁移：

<<< ../../../examples/guide-project/src/domain/widgets/container.ts

容器组件使用 `ContainerRegionOutlet` 渲染 region。它接管子节点、拖放反馈和插入指示；业务组件只实现布局 DOM、CSS 与 `resolveDropIndex` 所需的几何。

| 框架负责 | 宿主负责 |
| --- | --- |
| region 所有权、约束、移动、迁移校验、历史和撤销 | flex/grid 几何、区域 CSS、插入轴与变体分配策略 |

容器只能位于 `root.children`，region 只能包含普通节点，当前不支持嵌套容器。迁移必须返回完整目标 state；无法安全分配子节点时返回稳定的拒绝 `code`。拒绝结果不会修改当前快照、history 或成功事件，因此宿主可以按 `code` 显示可理解的提示。

## 添加一个浮层时不要进入容器协议

FAB、气泡和浮动助手属于页面 `layer`，不是容器区域。给物料定义默认布局：

```ts
defaultLayout: {
  placement: {
    kind: 'layer',
    layer: 'float',
    mode: 'self',
    avoid: ['safe-area', 'chrome'],
  },
},
```

`self` 模式会提供 layer 坐标系和 inset CSS variables，物料自己决定复杂定位。普通内容和固定导航仍分别使用 `flow` 与 `chrome`。

**完成检查**：切换单列和双列时，子节点顺序保持可预测；在单列中放入五个节点再切换双列时，得到稳定拒绝 code，Schema 不变。

下一步：需要接入权限或确认时阅读 [动作与业务策略](/guide/customization/actions-and-policies)。`flow`、`chrome`、`layer` 的完整投影规则见 [布局系统的 LayoutPlan](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/08-layout-system.md#layoutplan)，业务容器边界见 [外部容器物料](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/05-widgets-fields-and-utils.md#外部容器物料)。
