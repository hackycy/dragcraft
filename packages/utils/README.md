# @dragcraft/utils

`@dragcraft/utils` 提供跨包复用的纯函数工具集。

## 设计原则

- 纯函数优先、无副作用。
- 与 UI 框架无关。
- 小而稳定，避免引入领域耦合。

## 当前能力

- `clone`：深拷贝工具。
- `event-emitter`：轻量事件分发器。
- `uuid`：节点 ID 生成。

## 使用约束

- 可被 `core/designer/renderer/form-generator/widgets` 共同复用。
- 不承载业务语义逻辑；业务逻辑应留在上层包。
