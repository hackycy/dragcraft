# 状态、动作、history 与事件

读取 [commands resources](resources/commands.json)，再检查当前版本的 action、结果、history 和事件类型。

## 实施

1. 将 `designer.document`、`designer.selection` 和 `useDesigner()` 返回值作为只读状态；业务写入统一调用 `designer.execute(action)` 或由表单绑定生成 action。
2. 分别处理 committed、unchanged 和 rejected 结果。只有实际产生 Schema 变化的 action 进入 history 并发出 `schema:changed`。
3. 让一项用户意图对应一个历史事务；批量更新使用当前公开事务能力，不用多次独立写入模拟原子操作。
4. 业务动作返回公开 `AuthoringAction`；确认、权限和审计放入 interceptor，观察性逻辑观察 Designer 状态。

## 完成标准

测试同时证明成功、no-op 与拒绝结果的 Schema、history 和事件语义；undo/redo 恢复同一事务；失败路径不产生部分写入。
