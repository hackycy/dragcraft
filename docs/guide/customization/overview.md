---
description: "根据要改变的产品行为选择 DragCraft 的公开扩展点，并区分框架职责与宿主职责。"
---

# 选择扩展点

完成基础闭环后，按要改变的结果选择扩展点。不要因为需要业务行为就绕过 Schema 或修改组件私有 DOM。

| 目标 | 公开扩展 | 宿主仍要实现 |
| --- | --- | --- |
| 新增页面组件 | `WidgetDefinition`、`DesignerWidgetMeta`、`componentMap` | Vue 组件、props、资源与内容样式 |
| 改变属性编辑 | `FormSchema`、`FieldComponentMap`、`bindTo` | 字段 UI、异步数据和业务校验 |
| 承载子节点 | `ContainerDefinition`、`ContainerRegionOutlet`、变体迁移 | DOM、CSS、放置几何和迁移策略 |
| 增加业务操作 | `customActions`、`actionInterceptors`、`eventHooks` | 权限、确认、审计和错误提示 |
| 改变工作台 UI | `DesignerExtensions`、`RendererExtensions` | 面板、rail、画布部件与产品布局 |
| 改变视觉或语言 | 主题 token、公开 data hook、Device Frame、messages | 品牌主题、内容主题和业务文案 |
| 保存并上线页面 | 命令、事件、导入导出和 Schema 校验 | 服务端、版本、发布、生产运行时 |

所有高级路径都遵守五个边界：

- 不直接修改 `engine.store.schema`。
- 不把编辑态 `RootRenderer` 当作生产运行时。
- 不依赖私有 `.dc-*` class；主题只使用公开 token 与 `data-dc-*` hook。
- 不嵌套容器；当前协议只允许容器位于 `root.children`。
- 不把任意 `createEngine().registerHandler()` 自定义 command 当作标准 Designer 扩展路径。

`createEngine().registerHandler()` 是 Core 的低层能力。业务页面写入优先返回内置 command，或使用字段绑定。

**完成检查**：你能为当前需求选择一个公开扩展点，并写出仍由宿主负责的一项行为。

从 [业务物料](/guide/customization/materials) 开始，或直接进入与你的目标对应的章节。
