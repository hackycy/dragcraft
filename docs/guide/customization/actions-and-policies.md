---
description: "使用节点动作、拦截器和事件 hooks 接入权限、确认、审计和业务副作用。"
---

# 动作与业务策略

当操作需要业务规则时，节点动作应返回命令，让 Core 继续负责校验、历史和 Schema 事件。贯穿示例为公告增加“设为精选”，并在删除前走确认拦截器：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts#tutorial-actions

`command` 适合写 Schema，`handler` 适合跳转、打开宿主弹窗或埋点。`actionInterceptors` 包裹内置和自定义动作，适合确认、权限和错误上报。`eventHooks` 则用于选择、拖拽和 hover 的交互通知。

| 需求 | 入口 |
| --- | --- |
| 新增、覆盖或限制工具栏操作 | `customActions` 与 `meta.actions` |
| 确认、鉴权和审计 | `actionInterceptors` |
| 监听选择、拖拽和 hover | `eventHooks` |

| 框架负责 | 宿主负责 |
| --- | --- |
| 动作管线、内置 command、历史和交互事件 | 权限、确认 UI、审计、错误提示和服务端授权 |

框架不会替宿主显示拦截器返回的业务原因，也不会替你实现权限策略。不要把任意自定义 command 当作标准 Designer 扩展；优先使用内置 command 或字段绑定。

## Schema 托管物料

固定由页面模板、Schema import 或 migration 提供，但仍要在工作台中渲染、选中和配置的物料，使用 `authoring: 'schema-managed'`。它是设计态操作策略，不是对宿主代码或服务端的安全隔离。

先和普通物料一样注册 metadata 与组件：

<<< ../../../examples/guide-project/src/domain/widgets/page-header.ts#tutorial-schema-managed-header

然后由 Schema producer 显式提供节点。`defaultLayout` 只用于创建节点；既有或初始节点仍须把自己的 `layout` 写入 Schema：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts#tutorial-schema-managed-header-node

| 能力 | 默认值 | 显式 override |
| --- | --- | --- |
| 标准物料面板、`ADD_NODE`、duplicate | 隐藏或拒绝 | 不可开放 |
| 选中 | 允许 | `selectable` |
| `props` 与 `style` | 允许 | `configurable` |
| 容器 variant | 拒绝 | `variantChangeable` |
| 拖拽、上移、下移 | 拒绝 | `draggable: true` |
| sibling 下标锁 | 不启用 | `sortable: false` |
| 删除 | 拒绝 | `deletable: true` |

`creatable: true` 和同 key 的 duplicate extra action 都不会解除创建与复制禁令；注册时只会给出 warning。新增、复制与容器变体迁移会检查整棵候选子树；删除普通父节点也要求其所有 Schema 托管后代都允许删除。

这些 override 可以写成布尔值，或接收只读 `node`、`schema` 的 predicate。predicate 抛错或返回非法值时会 fail closed，命令、历史和成功事件都不会提交。`configurable` 只控制 `props` 和 `style`，`variantChangeable` 独立控制 `container.variant`；被拒绝的属性字段仍显示当前值但处于 disabled。移动限制只检查 `MOVE_NODE` 的直接 source，因此普通父容器可以携带 Schema 托管后代移动，其他 sibling 的被动下标变化也不会被拦截。

默认保留内置工具栏动作并全部显示为 disabled。Authoring Policy 未授权或因当前位置、容器约束暂不可用的内置动作都会保留并显示 disabled，使工具栏保持稳定。`draggable: true` 会启用拖拽和上下移动，`deletable: true` 会启用删除；`actions.only`、`actions.exclude` 或 action 自身的 `visible` 才会改变显隐。全局 custom action 需要被 `actions.only` 点名，物料自己的 `actions.extra` 视为显式授权。duplicate 无法重新开放。显式显隐配置后的最终 action 列表为空时，节点不会渲染工具栏。

`importSchema()`、注册的 migration 和 custom command 是可信宿主入口，不受该策略的隔离承诺；Undo/redo 恢复已提交的快照时也不会重新裁决策略。精确公开接口见 [Schema 与命令](/reference/designer-schema#schema-托管物料)。

**完成检查**：公告动作只能在允许的节点出现；删除时会先经过宿主确认，并且取消不会写入 Schema。

下一步：[面板与画布](/guide/customization/panels-and-canvas)；精确字段见 [Designer 渲染与容器](/reference/designer-rendering)。
