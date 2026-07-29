---
description: "检查编辑器接入、Schema 写入、草稿恢复和只读运行时是否形成完整闭环。"
---

# 检查集成结果

一个可继续开发的宿主编辑器应同时满足编辑、数据和运行时三组条件。

## 编辑工作台

- 物料 metadata、Vue component 和字段 adapter 使用一致的稳定键。
- 新增、属性修改、移动和删除都通过内置命令或字段绑定进入 Core。
- 撤销与重做能够恢复已提交的 Schema 快照。
- 组件卸载时调用 `designer.dispose()`。

## 页面数据

- 保存使用 `exportSchema()` 返回的深拷贝，不保存响应式 ref 或组件状态。
- 加载在物料和 migration 注册完成后调用 `importSchema()`。
- 导入失败会显示 diagnostics，并保留当前页面。
- 服务端使用修订号阻止旧编辑会话覆盖新草稿。

## 只读运行时

- 运行时拥有独立的组件注册表和未知物料 fallback。
- 普通节点、容器 regions、页面 surface 和 `flow/chrome/layer` 都有明确映射。
- 生产代码不导入设计态 Renderer、Container Shell 或拖拽组件。
- 发布服务重新校验业务数据，不把设计器校验当成安全边界。

运行以下命令验证贯穿示例：

```bash
pnpm --filter guide-project test
pnpm --filter guide-project build
```

测试覆盖注册顺序、命令 no-op 与拒绝、撤销、Schema migration、容器迁移、草稿冲突、布局投影、容器递归、样式作用域和未知物料 fallback。

需要继续开发时，按目标进入 [选择扩展点](/guide/customization/overview)；需要先补齐框架模型时，从 [框架如何协作](/guide/fundamentals/architecture) 开始。
