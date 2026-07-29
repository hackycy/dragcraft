---
description: "通过 ContainerDefinition 和 ContainerRegionOutlet 让业务布局组件安全承载页面节点。"
---

# 让业务容器承载子节点

## 预期结果

分栏、网格和卡片分区需要承载其他节点，但它们不能通过普通 `children` 递归实现。Dragcraft 用容器的 `regions` 明确子节点归属，Core 负责结构校验和迁移，业务组件负责实际布局。

完成本页后，你会得到一个可以在单列和双列间切换的分栏容器。

## 前置状态

你已经让页头使用 `chrome`，并能区分页面 placement 和普通内容排序。现在需要的是节点内部的结构所有权。

## 完整文件

### 容器要同时声明结构和视觉

`ContainerDefinition` 描述变体、区域和容量约束。Vue 容器组件使用 `ContainerRegionOutlet` 渲染区域中的子节点，并提供拖放插入位置所需的几何信息。

`src/domain/widgets/container.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/container.ts

新建 `src/editor/create-container-designer.ts`，在上一阶段的页头、文本和公告之外注册分栏容器：

<<< ../../../examples/guide-project/src/editor/create-container-designer.ts

在宿主 `App.vue` 中把 `createLayoutDesigner()` 替换为 `createContainerDesigner()`。这样容器只在读者已经理解顶层 layout 后才进入物料栏。

这里有两类责任：

| Core 维护 | 业务组件维护 |
| --- | --- |
| `regions` 所有权、容量、移动、撤销和迁移提交 | flex/grid DOM、区域 CSS、插入方向和 `resolveDropIndex` |

`ContainerRegionOutlet` 不是运行时组件。它只在编辑器中把某个 region 交给 Renderer，使拖放、选中和子节点渲染遵守同一套所有权规则。

## 立即可观察行为

在宿主 `App.vue` 中把 `createLayoutDesigner()` 替换为 `createContainerDesigner()`。拖入“分栏容器”后，可以把文本或公告放进它的 region，并从右侧切换单列和双列。

## 设计原因

### 切换变体时必须迁移完整状态

单列改双列会改变可用区域，框架无法替业务决定如何分配已有子节点。因此 `migrateVariant()` 返回完整的新 `variant` 和 `regions`；无法安全迁移时返回稳定的拒绝 `code`。

示例按当前顺序把前半部分节点放到左列，后半部分放到右列。单列可以先容纳五个节点；切换双列时，节点超过四个会返回 `GUIDE_CONTAINER_CAPACITY_EXCEEDED`，命令不会写入 Schema 或 history。

不要在迁移函数中直接修改旧的 `ctx.state`。它是命令开始时的只读输入；返回的新 state 会在命令成功后原子提交。

### 当前协议的限制

容器只能位于 `root.children`。容器区域只能包含普通节点，不能再嵌套容器。这个限制让每个节点只有一个 owner，Renderer 只会从一条路径渲染它一次。

如果你的布局需要复杂的几何，仍由业务容器写 DOM 和 CSS；不要试图把 flex/grid 轨道保存成框架固定字段。Schema 保存结构所有权和变体，业务组件保存视觉表达。

## 限制与下一步

容器不支持嵌套，也不能替代页面 placement。下一页会在完整的页面编辑器上引入由 Schema 提供的模板节点和受控动作。

## 完成检查

- 拖入“分栏容器”后，可以把普通物料放入它的区域。
- 切换单列和双列时，已有子节点顺序可预测。
- 在单列中放入五个节点后切换双列，变体切换被拒绝，Schema 和撤销栈不发生变化。

精确的容器协议见 [Schema 与 Core](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/02-schema-and-core.md#container-schema-与-core-module-interface)。下一步：[管理模板节点和工具栏动作](/guide/learn/schema-managed-actions)。
