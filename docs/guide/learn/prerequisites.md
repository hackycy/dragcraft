---
description: "确认 DragCraft 的接入边界，并运行最小编辑器和完整活动页示例。"
---

# 了解接入边界

DragCraft 提供页面编辑能力，不替你的应用定义业务物料、保存接口或生产运行时。接入完成后，你会拥有一个能够编辑 Schema 的 Vue 工作台，以及一份可以交给服务端和多端运行时消费的页面数据。

这套指南假设你已经会使用 Vue 3 和 TypeScript。你不需要了解 DragCraft 的内部 package，也不需要先阅读架构文档。

## 先看两个可运行结果

仓库中的 `guide-project` 同时提供最小接入和完整活动页编辑器：

```bash
pnpm install
pnpm --filter guide-project dev
```

打开以下地址：

- `http://localhost:9982/minimal.html`：只有一个文本物料，用于确认安装和挂载过程。
- `http://localhost:9982/`：包含业务物料、属性配置、容器、设备预览、草稿保存和 Vue 只读运行时。

在最小编辑器中拖入“文本”，选中节点，再修改右侧的“文本内容”。画布更新后，使用工具栏撤销这次修改。

在完整编辑器中可以观察四种页面结构：

| 页面内容 | Schema 表达 | 设计态结果 |
| --- | --- | --- |
| 公告、文本 | `flow` 节点 | 进入可滚动内容区 |
| 活动页头 | `chrome` 节点 | 固定在页面顶部并让内容避让 |
| 浮动操作 | `layer` 节点 | 位于内容上方，不参与正文排序 |
| 分栏容器 | `container.regions` | 由业务容器拥有并排列子节点 |

## 先划清职责

| DragCraft 负责 | 你的应用负责 |
| --- | --- |
| DocumentSchema、AuthoringAction、history 和导入校验 | 页面记录、草稿修订、发布和审核 |
| 物料拖放、选择和属性绑定 | 业务 Vue 组件、资源选择器和内容主题 |
| 设计态布局投影和交互反馈 | 生产端的组件注册表与布局解释 |
| 字段 adapter 协议和表单状态 | UI 库、异步选项、权限和服务端校验 |

> [!IMPORTANT]
> `DcDesigner`、`ContainerRegionOutlet` 和编辑器的 Container Shell 都包含设计态语义。生产页面应读取 Schema，并使用自己的只读运行时渲染。

## 选择阅读入口

- 需要从空白 Vue 应用接入时，继续 [创建可运行编辑器](/guide/learn/first-editor)。
- 已经挂载编辑器，需要理解数据流时，阅读 [Schema 与样式作用域](/guide/fundamentals/schema)。
- 正在评估业务扩展边界时，查看 [框架如何协作](/guide/fundamentals/architecture)。

完整的内部设计依据保留在 [Architecture Map](https://github.com/hackycy/dragcraft/tree/main/.github/architecture)。公开应用只能直接导入 `@dragcraft/designer`、`@dragcraft/device-frames` 和匹配的 `@dragcraft/fields-*` 字段 adapter。
