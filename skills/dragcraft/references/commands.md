# 状态、动作、history 与事件

读取 [commands resources](resources/commands.json)，再检查当前版本的 Schema `AuthoringAction`、Presentation 语义 action、结果、history 和事件类型。

## 实施

1. 将 `designer.document`、`designer.selection` 和 `designer.history` 作为只读状态；业务写入统一调用 `designer.execute(action)` 或由表单绑定生成 action。
2. 区分核心 Schema action（如 `create-node`、`update-node`、`update-page`、`batch`）与节点工具栏的语义 action（如 `node.update`）；不要把 Presentation action 当成另一套持久化入口。
3. 分别处理 `committed`、`unchanged`、`rejected` 和 `confirmation-required`。只有实际产生 Schema 变化的 action 进入 history 并发出 `schema:changed`。
4. 让一项用户意图对应一个历史事务；多条 Schema 写入使用公开 `batch`，不用多次独立写入模拟原子操作。
5. 业务动作返回公开 `AuthoringAction`；确认、权限和审计放入 `actionInterceptors`，观察性逻辑观察 Designer 状态。

## 完成标准

测试同时证明成功、no-op 与拒绝结果的 Schema、history 和事件语义；undo/redo 恢复同一事务；失败路径不产生部分写入。
