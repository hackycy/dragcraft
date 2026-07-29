---
description: "使用 ContainerDefinition、region outlet 和变体迁移实现分栏、网格和受控子节点区域。"
---

# 容器与 region

需要让一个业务组件拥有子节点时，使用 ContainerDefinition 描述所有权和约束，使用 `ContainerRegionOutlet` 把这些节点放入业务 DOM。不要在普通物料里增加 `children`，也不要在组件内部自行递归整个 Schema。

## 声明 variant 和 region

贯穿项目的分栏容器同时定义单列和双列状态：

<<< ../../../examples/guide-project/src/domain/widgets/container.ts

`regions` 只声明区域和静态约束；容器组件的 flex/grid 结构仍由宿主编写。`resolveDropIndex` 只负责把鼠标几何转换为插入位置，不修改 Schema。

## 使用 region outlet

设计态容器组件必须在业务 DOM 中渲染 outlet：

```ts
function outlet(regionId: string) {
  return h(ContainerRegionOutlet, {
    regionId,
    class: 'guide-column-container__region',
    resolveDropIndex: resolveVerticalDropIndex,
  })
}
```

Outlet 接管该 region 的子节点渲染、拖放反馈和插入指示。业务组件只决定区域的布局 DOM、CSS 和插入轴。

## 处理 variant 迁移

切换 variant 不是简单地修改一个字符串。迁移器必须返回完整目标 state，包含每个目标 region 的节点数组：

<<< ../../../examples/guide-project/src/domain/widgets/container.ts#tutorial-container-migration

示例在单列转双列时保持原顺序，并在超过总容量时返回稳定的 `GUIDE_CONTAINER_CAPACITY_EXCEEDED`。拒绝时当前容器状态、历史和成功事件都保持不变。

## 了解结构边界

当前协议有以下限制：

- 容器只能直接位于 `root.children`。
- region 只能拥有普通节点，不能再放容器。
- 节点进入 region 后移除页面级 placement 和 order。
- 节点从 region 移回 root 时恢复物料默认布局。
- 删除或复制包含 Schema 托管后代的子树时，Core 会检查整棵候选树。

这些限制让 owner、排序和撤销保持可预测。需要实现嵌套容器时，先确认公共协议是否已经支持，不要通过自定义 DOM 递归绕开校验。

## 设计态与运行时分开

设计态使用 `ContainerRegionOutlet`，生产 Vue 运行时接收递归后的 `regions`：

<<< ../../../examples/guide-project/src/runtime/RuntimeColumnContainer.ts

运行时容器可以实现完全不同的 CSS 或平台组件，只要继续解释 `variant` 和 region 数据。

## 验证容器

- 单列放入三个节点后切换双列，节点顺序可预测。
- 放入第五个节点时，获得稳定拒绝码，Schema 不变。
- 容器 region 中拖入普通物料成功，拖入另一个容器被拒绝。
- 运行时切换 variant 后，递归子节点仍位于正确 region。

完整的 `flow/chrome/layer` 页面投影见 [布局投影](/guide/fundamentals/layout-system)。
