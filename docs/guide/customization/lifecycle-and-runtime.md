---
description: "管理草稿修订、Schema 导入状态、发布校验和独立生产运行时。"
---

# 草稿与生产运行时

DragCraft 交换和校验 DocumentSchema；宿主负责页面权限、修订、持久化、发布和生产渲染。

## 加载与保存

创建 Designer 时提供当前 `materials` 与初始 `schema`。恢复外部草稿时调用 `designer.importSchema(input)`，并处理 `ready`、`degraded`、`conflicted` 与 `rejected` 状态。rejected 输入不能覆盖当前编辑会话。

```ts
const snapshot = designer.exportSchema()
await repository.save({ id: pageId, revision, schema: snapshot })
```

真实服务至少保存页面 ID、修订号、Schema、作者和更新时间。保存时以 revision 拒绝过期会话，发布时保存不可变快照与审核信息。

服务端重新校验页面归属、type 白名单、props、资源 URL、region 约束和业务规则。Designer 的解析不能充当服务端授权边界。

## 生产运行时

生产 Runtime 不复用 `DcDesigner`、Container Shell 或 Designer Presentation。它按稳定 type 维护平台组件、未知 type 策略、布局和业务状态。

```text
DocumentSchema -> host runtime registry -> target-platform components
```

未知 type 必须明确阻断、显示 fallback 或延迟加载，不能静默丢弃节点。当前 Schema 只支持一层容器，Runtime 应按同一所有权模型处理 root 与 regions。

## 发布前验证

- 导入错误不会覆盖有效草稿。
- 过期 revision 保存被拒绝。
- 未知 type 有可观察的处理策略。
- 编辑器与 Runtime 对 props、样式作用域和 region 所有权的业务约定一致。
- 生产 bundle 不导入设计态 Presentation。
