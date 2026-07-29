---
description: "使用节点动作、拦截器、事件 hooks 和 Authoring Policy 接入业务规则。"
---

# 动作与 Authoring Policy

节点动作负责描述“用户可以发起什么操作”，Authoring Policy 负责裁决“当前节点是否允许该操作”。需要写 Schema 的动作应返回命令，确认、跳转和埋点则交给宿主 handler 或 interceptor。

## 增加业务动作

贯穿项目为公告增加“设为精选”，并为破坏性动作接入确认：

<<< ../../../examples/guide-project/src/editor/actions.ts

`command` 适合可撤销的 Schema 写入。`handler` 适合打开弹窗、跳转和发送埋点；如果 handler 还要改页面，应显式执行命令并处理结果。

动作的判断顺序是：

```text
visible
  -> available / Authoring Policy
  -> disabled
  -> beforeAction interceptors
  -> command 或 handler
  -> afterAction / onActionError
```

`actionInterceptors` 包裹内置动作和自定义动作，适合统一接入确认、权限检查、审计和错误上报。框架不会替宿主展示拒绝原因。

## 使用交互事件

选择、拖拽和 hover 不属于节点 action，使用 `eventHooks`：

| Hook | 能否取消 | 约束 |
| --- | --- | --- |
| `onBeforeSelect` | 可以 | 可以异步；执行期间重复选择会被丢弃 |
| `onAfterSelect` | 不可以 | 适合外围状态和埋点 |
| `onBeforeDrag` | 可以 | 必须同步，浏览器 DragEvent 不能等待 Promise |
| `onAfterDrag` | 不可以 | 异步错误不回滚已完成操作 |
| `onHoverChange` | 不可以 | 高频通知，不应触发保存 |

Schema 已提交后的数据通知使用 Engine `EventHub`，不要用 hover 或 selection hook 推断页面已经修改。

## 管理 Schema 托管物料

页头由初始 Schema 提供，但仍可在工作台中选中和配置：

<<< ../../../examples/guide-project/src/domain/widgets/page-header.ts

`authoring: 'schema-managed'` 的默认能力如下：

| 能力 | 默认 | 可显式开放 |
| --- | --- | --- |
| 物料面板、`ADD_NODE`、duplicate | 隐藏或拒绝 | 不可开放 |
| 选中 | 允许 | `selectable` |
| 修改 props/style | 允许 | `configurable` |
| 切换容器 variant | 拒绝 | `variantChangeable` |
| 拖拽、上移、下移 | 拒绝 | `draggable: true` |
| 锁定 sibling 下标 | 不启用 | `sortable: false` |
| 删除 | 拒绝 | `deletable: true` |

默认内置动作会保留在工具栏中并显示 disabled，使按钮位置稳定。`actions.only`、`actions.exclude` 和 action 自身的 `visible` 才改变显隐；它们不能绕过能力裁决，也不能重新开放 duplicate。

## 理解 fail closed

行为 predicate 接收只读 `node` 和 `schema`。predicate 抛错或返回非法值时，策略按拒绝处理：

- 命令 draft 被丢弃。
- 历史不增加。
- 成功事件不发出。
- UI 保留当前已提交快照。

创建、复制和容器迁移会校验完整候选子树。删除普通父节点时，所有 Schema 托管后代也必须允许删除。

> [!WARNING]
> Authoring Policy 约束标准设计态交互和内置命令，不是服务端授权。`importSchema()`、migration 和 custom command 是可信宿主入口；undo/redo 也不会重新执行策略。

精确类型和动作字段见 [Designer 渲染与容器参考](/reference/designer-rendering) 与 [Schema 与命令参考](/reference/designer-schema)。
