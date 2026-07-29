---
description: "通过冻结快照、命令结果、历史事务和事件理解 DragCraft 的写入保证。"
---

# 状态、命令、历史与事件

Core 把每次 Schema 修改当成一次原子命令。成功且实际改变数据的命令才会提交新快照、写入历史并发出变更事件。

## 读取冻结快照

读取当前页面有三种常用入口：

| 入口 | 适用场景 |
| --- | --- |
| `engine.state.getSchema()` | 同步读取当前深只读快照 |
| `engine.state.getNodeById(id)` | 按 ID 读取当前节点 |
| `useDesigner(instance).schema` | 在 Vue 组件中响应 Schema 替换 |

快照引用在下一次有效提交前保持稳定。需要发送到服务端或在宿主代码中修改副本时，调用 `exportSchema()`；不要修改 `engine.state` 或 `engine.store.schema` 返回的对象。

## 判断命令结果

贯穿示例的测试覆盖 success、no-op 和 rejected 三条路径：

<<< ../../../examples/guide-project/src/editor/create-page-designer.test.ts

命令返回值的含义如下：

| 结果 | Schema | History | `schema:changed` |
| --- | --- | --- | --- |
| `{ ok: true, changed: true }` | 提交新快照 | 增加一条 | 发出 |
| `{ ok: true, changed: false }` | 保留当前快照 | 不增加 | 不发出 |
| `{ ok: false, code }` | 丢弃命令 draft | 不增加 | 不发出 |

对同一字段写入相同值属于 no-op。容器容量不足、节点不可配置、排序锁冲突和 handler 缺失会返回稳定拒绝码。宿主可以根据 `code` 显示业务提示，但不应在失败后手动补写 Schema。

## 使用内置命令

标准页面写入优先使用 `CommandType`：

```ts
const result = designer.engine.execute({
  type: CommandType.UPDATE_PROPS,
  payload: {
    nodeId: 'notice-1',
    props: { text: '新的公告内容' },
  },
})
```

字段绑定和节点 action 最终也会生成内置命令。只有领域操作无法表达为现有命令时，才注册 custom handler；custom command 是可信宿主能力，不是标准插件扩展面。

## 合并一组历史操作

多个命令需要作为一次撤销单元时，使用 History transaction：

```ts
designer.engine.history.beginTransaction('更新公告和页面标题')
designer.engine.execute(updateNoticeCommand)
designer.engine.execute(updatePageTitleCommand)
designer.engine.history.commitTransaction()
```

`commitTransaction()` 仅在快照实际变化时增加历史。执行中途需要回滚时调用 `discardTransaction()`；它恢复事务开始快照并发出一次 Schema 变更事件。

不要在事务外捕获可写引用，也不要把 undo/redo 当作重新执行命令。历史直接交换已经提交的冻结快照，因此不会重新运行 Authoring Policy。

## 订阅事件

`EventHub` 适合让宿主更新“未保存”状态、审计摘要或外围 UI：

```ts
function markDraftChanged() {
  status.value = '有未保存的更改'
}

designer.engine.eventHub.on(EventName.SCHEMA_CHANGED, markDraftChanged)
designer.engine.eventHub.off(EventName.SCHEMA_CHANGED, markDraftChanged)
```

`schema:changed` 表示已经提交的数据变化。选择、hover 和拖拽属于交互状态，各自使用对应事件；高频 hover 事件不适合触发保存。

## 验证写入保证

为业务命令至少测试以下场景：

- 有效修改只增加一条历史和一次 Schema 事件。
- 写入相同值返回 `changed: false`。
- 约束拒绝后 Schema、history 和成功事件都不变。
- transaction 提交后一次撤销恢复整组修改。
- 导入新页面会清空旧页面历史。

节点操作如何接入权限和确认，见 [动作与 Authoring Policy](/guide/customization/actions-and-policies)。
