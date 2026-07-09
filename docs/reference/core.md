# @dragcraft/core

这个包负责 schema、命令、历史记录和事件语义。

最常见的入口是 `createEngine()`、`CommandType` 和布局相关类型。业务侧通常不需要直接操作 store，而是通过 `engine.state` 读取、通过 `engine.execute()` 写入。
