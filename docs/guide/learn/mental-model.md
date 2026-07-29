---
description: "用宿主、Designer、Core、Schema 和运行时的职责边界理解 Dragcraft。"
---

# 理解 Dragcraft 的边界

## 预期结果

Dragcraft 负责编辑页面，不负责替你的业务发布页面。你把业务组件、字段、草稿服务和线上运行时交给它，它返回一份可以保存的 Schema，并在编辑器中维护可靠的修改过程。

完成本页后，你应该能回答三个问题：页面数据放在哪里、谁可以修改它、线上页面由谁渲染。

## 前置状态

你已经运行了最小编辑器，并观察过选中节点、属性修改和撤销。

## 完整文件

这一页不替换任何文件。继续使用上一页的 `src/editor/minimal-designer.ts` 和 `src/App.vue`；这里先确定它们与宿主应用之间的责任边界。

## 立即可观察行为

编辑一个文本节点后，画布和属性面板会读取同一个 Schema 快照，撤销会恢复该快照。保存、发布和线上渲染尚未发生，因为它们仍在宿主应用一侧。

## 设计原因

### 先记住这五个角色

| 角色 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| 宿主应用 | 物料组件、资源权限、草稿、发布、业务运行时 | 画布拖放和历史记录 |
| `DcDesigner` | 三栏工作台、物料栏、画布和属性面板 | 业务页面的持久化 |
| Core Engine | Schema、命令、历史、注册表和事件 | Vue 组件和 DOM |
| Schema | 页面结构、属性、样式和布局意图 | 业务接口调用和线上状态 |
| 业务运行时 | 读取已发布 Schema 并渲染真实页面 | 编辑态选中、拖放和工具栏 |

你可以把 `createDesigner()` 看作一次装配：宿主传入物料 metadata、组件映射和字段 adapter，Designer 注册它们，再创建 Engine。之后画布和属性面板都读取同一个 Schema 快照。

### 写入和读取走不同的入口

读取当前页面时，使用 `useDesigner()` 返回的 `schema`，或在非 Vue 代码中使用 `engine.state`。它们暴露的是只读提交快照。

修改页面时，使用属性表单、节点动作，或 `engine.execute()`。所有结构和属性修改都会经过 Core 命令，因此撤销、事件和行为约束看到的是同一条写入链路。

```ts
import { CommandType } from '@dragcraft/designer'

designer.engine.execute({
  type: CommandType.UPDATE_PROPS,
  payload: {
    nodeId: 'welcome-text',
    props: { content: '已通过命令更新文本。' },
  },
})
```

不要修改 `engine.store.schema.value`。它不是可写 store；即使 TypeScript 没有阻止你，也会绕过命令、历史和校验的设计边界。

### 三个容易混淆的边界

#### 编辑器不是生产运行时

`RootRenderer`、`DcDesigner` 和 `ContainerRegionOutlet` 包含选中态、拖放和编辑交互。线上页面应使用业务组件读取 Schema，按业务规则决定如何渲染、鉴权和加载资源。

#### Container Shell 不是业务容器

Container Shell 包住整个编辑画布，例如手机设备外壳。业务容器是页面中的一个节点，例如分栏组件，它拥有自己的 `regions`。前者只渲染一次 slot；后者负责自己的 flex、grid 和区域 DOM。

#### Schema 托管不等于服务端安全

`authoring: 'schema-managed'` 可以让模板节点不能从物料栏创建，也可以限制删除和编辑。它只约束编辑态操作；服务端仍必须验证页面归属、物料白名单、资源和发布权限。

### 为什么边界要这样划分

Core 不依赖 UI，因此命令和 Schema 可以独立测试。宿主持有业务组件和运行时，因此同一份 Schema 可以服务编辑预览、发布页或其他端。扩展点是显式输入，避免业务代码依赖工作台内部 DOM 或私有 class。

## 限制与下一步

需要完整约束时，查看 [项目总览的分层架构](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/01-overview.md#分层架构)、[Schema 与 Core 的设计边界](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/02-schema-and-core.md#设计边界) 和 [Designer 定位](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/03-designer-and-renderer.md#designer-定位)。

## 完成检查

你能区分宿主、Designer、Core、Schema 和业务运行时各自负责的行为，并能解释为什么线上页面不能复用编辑态 Renderer。

下一步：[保存 Schema，并通过命令写入](/guide/learn/schema-and-write-path)。
