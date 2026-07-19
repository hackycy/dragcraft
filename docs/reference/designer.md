# @dragcraft/designer

这是默认入口包。

需要实现容器的变体字段、结构树或拖放交互时，先阅读 [外部容器物料](/guide/container-materials)；本页说明 Designer 的容器 API。

先看最常用的导出：

```ts
import { createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
```

大多数业务接入先理解这三个入口。它们分别负责“创建实例”“渲染设计器”“在业务层读取和调用能力”。

`createDesigner()` 的 `customActions` 注册或覆盖节点工具栏动作，`actionInterceptors` 在动作执行前后处理确认、权限和审计，`extensions` 用于替换物料栏、属性栏、rail 或 Renderer 视觉部件。完整的字段、组件 props 与执行顺序见 [动作与视图扩展](/guide/extending-the-designer)。

## 你通常会从这里取什么

- `createDesigner`
- `DcDesigner`
- `useDesigner`
- `createDesignerWorkspace`
- `DesignerWorkspaceController`
- 常用的 core、renderer、form-generator 类型重导出

设计器实例的业务输入和挂载方式见 [集成设计器](/guide/designer-integration)。

## 容器设计器 API

Designer 结构树把 root 容器、注册定义中的虚拟 regions 和各 region 的普通子节点显示为浅层树。拖放目标使用 `NodeDestination`，root 和 region 的插入索引分别解析；命令执行仍由 Core 最终校验并返回结构化拒绝。

容器 variant 字段必须显式声明 `bindTo: { scope: 'container', path: 'variant' }`。`createBindingCommand()` 将它转为 `CHANGE_CONTAINER_VARIANT`，从而调用物料 migration，而不是把 variant 当成普通 props。默认入口也重导出 `ContainerRegionOutlet`、`useContainerRuntime()` 及相关 public types，方便 playground 或应用在不增加运行时依赖的情况下实现外部容器。
