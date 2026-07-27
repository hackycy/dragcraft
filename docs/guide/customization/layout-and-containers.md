---
description: "用 LayoutPlan 和外部容器协议实现页面 chrome、浮层、分栏与受控 region。"
---

# 页面布局与容器

需要让一个业务组件承载子节点时，根节点的 `layout.placement` 决定它属于普通内容流、chrome 还是浮层。声明外部容器，而不是在组件里手动递归 Schema。

贯穿示例把单列和双列的转换写成显式迁移：

<<< ../../../examples/guide-project/src/domain/widgets/container.ts#tutorial-container-migration

容器组件使用 `ContainerRegionOutlet` 渲染 region。它接管子节点、拖放反馈和插入指示；业务组件只实现布局 DOM、CSS 与 `resolveDropIndex` 所需的几何。

| 框架负责 | 宿主负责 |
| --- | --- |
| region 所有权、约束、移动、迁移校验、历史和撤销 | flex/grid 几何、区域 CSS、插入轴与变体分配策略 |

容器只能位于 `root.children`，region 只能包含普通节点，当前不支持嵌套容器。迁移必须返回完整目标 state；无法安全分配子节点时返回稳定的拒绝 `code`。

**完成检查**：切换单列和双列时，子节点顺序保持可预测；容量超限时得到稳定拒绝 code，Schema 不变。

下一步：需要接入权限或确认时阅读 [动作与业务策略](/guide/customization/actions-and-policies)。`flow`、`chrome`、`layer` 的完整投影规则见 [布局系统 Architecture Map](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/08-layout-system.md)，公开 API 见 [@dragcraft/core](/reference/core) 与 [@dragcraft/renderer](/reference/renderer)。
