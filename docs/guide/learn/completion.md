---
description: "检查编辑器接入、Schema 写入、草稿恢复和生产运行时是否形成闭环。"
---

# 检查集成结果

## 编辑工作台

- 每个 type 只由一个 `MaterialDefinition` 注册。
- 创建、属性修改、移动和删除都进入 `designer.execute(action)` 或字段绑定。
- undo/redo 恢复已提交的 DocumentSchema。
- headless 物料在物料栏有标识，拖入时只显示中性说明并在释放后创建可编辑配置。
- 组件卸载时调用 `designer.dispose()`。

## 页面数据

- 保存 `exportSchema()` 返回的纯数据，不保存响应式 ref 或组件状态。
- `importSchema()` 的 rejected 结果保留当前文档并展示 diagnostics。
- 服务端以 revision 阻止旧会话覆盖新草稿。

## 生产 Runtime

- Runtime 按 type 维护独立组件和未知 type 策略。
- root、container regions 与样式作用域有明确业务映射。
- 生产代码不导入 Designer Presentation。
- 发布服务重新校验业务数据和授权。
