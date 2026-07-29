---
description: "理解页面 root、节点、样式作用域、布局、容器状态和 Schema migration。"
---

# Schema 与样式作用域

Schema 是编辑器、服务端和生产运行时之间的页面契约。它保存页面结构和业务数据，不保存 Vue 组件实例、选中状态或撤销栈。

贯穿项目的初始页面包含正文、固定页头、分栏容器和浮动操作：

<<< ../../../examples/guide-project/src/editor/initial-schema.ts

## 读取页面结构

`DesignerSchema` 顶层只有三个稳定入口：

| 字段 | 内容 |
| --- | --- |
| `version` | Schema 协议版本，用于选择 migration；它不是 DragCraft 发布版本 |
| `globalConfig` | 页面标题、业务开关等开放的页面级业务数据 |
| `root` | 页面 surface 和 root-owned 节点 |

`root.children` 保存页面级节点。普通节点至少包含唯一 `id`、稳定 `type` 和 `props`；`type` 必须能由编辑器和生产运行时的注册表解析。

容器的子节点不进入 `root.children`。它们由 `container.regions` 拥有：

```ts
{
  id: 'layout-1',
  type: 'column-container',
  props: { gap: 12 },
  container: {
    variant: 'single',
    regions: {
      content: [
        { id: 'text-1', type: 'guide-text', props: { content: '活动内容' } },
      ],
    },
  },
}
```

当前协议只允许容器直接属于 root，并拒绝容器嵌套。region 子节点不再声明页面级 placement。

## 区分三种样式

样式对象是跨端 DSL，按承载位置拆分：

| 作用域 | 设计态位置 | 示例 |
| --- | --- | --- |
| `style.container` | Renderer 拥有的节点外层盒子 | 外边距、宽度、布局占位 |
| `style.content` | 实际业务组件 | 字色、字号、组件外观 |
| `style.surface` | root 或容器拥有的承载面 | 页面背景、容器区域背景 |

运行时必须在相同语义位置解释这些对象。不要把外边距传给业务组件，也不要把页面背景存入 `globalConfig` 后依赖某个 Web 组件偶然解释它。

## 区分默认布局和实例布局

`WidgetMeta.defaultLayout` 定义新物料的默认意图，`node.layout` 覆盖当前实例。生产运行时需要同时拥有 Schema 和匹配的运行时注册表，才能解析没有实例覆盖的默认布局。

`layout` 只描述意图：

- `flow` 进入页面内容流。
- `chrome` 进入页面结构区域，可以固定并贡献内容 inset。
- `layer` 进入浮层坐标系。

flex、grid、分栏轨道等几何不写入框架固定字段，而由业务容器组件实现。

## 迁移后再校验

贯穿项目注册一个明确的 Schema migration：

<<< ../../../examples/guide-project/src/editor/schema-migrations.ts

加载旧页面时，Engine 先检查 `root` 和 `version` 等基础结构，再按版本链执行 migration，最后使用当前物料和容器注册表校验结果。

`importSchema()` 返回两类结果：

```ts
{ ok: true, diagnostics: [...] }
{ ok: false, diagnostics: [...] }
```

失败结果不会替换当前 Schema，也不会产生可撤销历史。宿主应记录 diagnostic code，并向用户提供阻断或修复入口。

> [!IMPORTANT]
> Schema migration 和 `importSchema()` 是可信宿主入口。它们可以引入 Schema 托管物料，因此不能当成不可信插件的安全沙箱。

## 验证你的 Schema 契约

保存和发布前至少检查：

- 每个节点 ID 唯一，`type` 在允许列表中。
- props 与资源 URL 符合业务协议。
- 容器 variant、region 和容量满足当前定义。
- Schema version 存在可达的 migration 路径。
- 未知物料采用明确阻断或 fallback，不静默丢弃。

写入这份数据时必须使用命令。继续阅读 [状态、命令、历史与事件](/guide/fundamentals/state-commands-and-history)。
