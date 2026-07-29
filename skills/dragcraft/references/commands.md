# 状态、命令、历史与事件

读取 [commands resources](resources/commands.json)，再检查当前版本的命令、结果、历史和事件类型。

## 实施

1. 将 `engine.state` 和 `useDesigner()` 返回值作为只读快照；业务写入统一调用 `execute()` 或由表单绑定生成命令。
2. 分别处理成功、no-op 和拒绝结果。只有成功且产生 Schema 变化的命令进入历史并发出 `schema:changed`。
3. 让一项用户意图对应一个历史事务；批量更新使用当前公开事务能力，不用多次独立写入模拟原子操作。
4. 业务动作返回公开 Schema command；确认、权限和审计放入 interceptor，观察性逻辑放入事件订阅。

## 完成标准

测试同时证明成功、no-op 与拒绝结果的 Schema、history 和事件语义；undo/redo 恢复同一事务；失败路径不产生部分写入。
