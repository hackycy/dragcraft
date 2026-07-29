---
description: "在完成 Schema 托管课程后，用节点动作、拦截器和事件 hooks 接入业务流程。"
---

# 动作与业务策略

入门课程已经为公告增加“设为精选”，并让删除操作经过确认。本页说明如何把这些动作连接到权限、审计和宿主副作用。

## 让动作返回命令

`src/editor/page-actions.ts`：

<<< ../../../examples/guide-project/src/editor/page-actions.ts

`command` 适合写 Schema，`handler` 适合跳转、打开宿主弹窗或埋点。`actionInterceptors` 包裹内置和自定义动作，适合确认、权限和错误上报。`eventHooks` 用于选择、拖拽和 hover 的交互通知。

| 需求 | 入口 |
| --- | --- |
| 新增、覆盖或限制工具栏操作 | `customActions` 与 `meta.actions` |
| 确认、鉴权和审计 | `actionInterceptors` |
| 监听选择、拖拽和 hover | `eventHooks` |

框架不会替宿主显示拦截器返回的业务原因，也不会替你实现权限策略。不要把任意自定义 command 当作标准 Designer 扩展；优先使用内置 command 或字段绑定。

## Schema 托管物料

固定由页面模板、Schema import 或 migration 提供，但仍要在工作台中渲染、选中和配置的物料，使用 `authoring: 'schema-managed'`。它是设计态操作策略，不是对宿主代码或服务端的安全隔离。

`src/domain/widgets/page-header.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/page-header.ts

然后由 Schema producer 显式提供节点。`defaultLayout` 只用于创建节点；既有或初始节点仍须把自己的 `layout` 写入 Schema：

<<< ../../../examples/guide-project/src/editor/create-guide-schema.ts

| 能力 | 默认值 | 显式 override |
| --- | --- | --- |
| 标准物料面板、`ADD_NODE`、duplicate | 隐藏或拒绝 | 不可开放 |
| 选中 | 允许 | `selectable` |
| `props` 与 `style` | 允许 | `configurable` |
| 容器 variant | 拒绝 | `variantChangeable` |
| 拖拽、上移、下移 | 拒绝 | `draggable: true` |
| sibling 下标锁 | 不启用 | `sortable: false` |
| 删除 | 拒绝 | `deletable: true` |

这些 override 可以写成布尔值或接收只读 `node`、`schema` 的 predicate。predicate 抛错或返回非法值时会 fail closed，命令、history 和成功事件都不会提交。

`importSchema()`、注册的 migration 和 custom command 是可信宿主入口，不受该策略隔离；服务端仍要校验最终请求。

**完成检查**：公告动作只能在允许的节点出现；删除时会先经过宿主确认，并且取消不会写入 Schema。

下一步：[面板与画布](/guide/customization/panels-and-canvas)；精确字段见 [Designer 渲染与容器](/reference/designer-rendering)。动作和事件的完整时序见 [Node Action 与 Action Runtime](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/03-designer-and-renderer.md#node-action-与-action-runtime) 与 [Event Hooks](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/03-designer-and-renderer.md#event-hooks)。
