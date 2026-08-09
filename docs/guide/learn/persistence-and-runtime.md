---
description: "保存、加载 DocumentSchema，并通过独立运行时预览发布数据。"
---

# 保存、加载与只读预览

Designer 不自动持久化页面。宿主用 `exportSchema()` 获取可传输快照，用 `importSchema()` 恢复外部输入。

## 仓储边界

贯穿示例使用 revision 保护草稿：

<<< ../../../examples/guide-project/src/host/page-repository.ts

真实服务校验页面归属、revision、type 白名单、业务 props、资源 URL 与 region 约束。旧 revision 保存必须拒绝，不能覆盖新草稿。

## 恢复结果

```ts
const result = designer.importSchema(draft.schema)
if (result.status === 'rejected')
  showDiagnostics(result.diagnostics)
```

`degraded` 和 `conflicted` 保留文档，分别提示未知 type 或结构冲突；`rejected` 保留导入前的有效文档。

## 独立 Runtime

Runtime 按 type 解释 Schema，不使用 `DcDesigner`。Guide Project 的参考 Runtime 说明了将导出的纯数据交给宿主组件树的边界：

<<< ../../../examples/guide-project/src/runtime/RuntimePage.ts

小程序、原生应用或其他运行时可消费同一 Schema，但自行实现目标平台组件、布局和未知 type 策略。
