---
description: "用 Schema 托管物料、节点动作和拦截器控制编辑态操作，而不把权限逻辑写进组件。"
---

# 管理模板节点和工具栏动作

## 预期结果

有些节点来自页面模板或服务端迁移，设计者不应该从物料栏创建它们。`authoring: 'schema-managed'` 把这类节点保留在 Schema 中，同时单独定义能否选中、编辑、移动或删除。

完成本页后，活动页头会作为模板节点存在，公告会提供“设为精选”动作，删除操作会先经过宿主确认。

## 前置状态

你已经能编辑包含页头和分栏容器的页面，并理解容器迁移必须由 Core 原子提交。

## 完整文件

### 模板节点由 Schema 提供

`src/domain/widgets/page-header.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/page-header.ts

`schema-managed` 永久禁止标准物料栏创建和 duplicate。它不自动禁止选中或修改 props；这些能力分别由 `selectable`、`configurable`、`draggable` 和 `deletable` 控制。

页头实际由初始 Schema 提供，而不是由 `defaultProps` 自动生成。完整节点定义见 [活动页初始 Schema](/guide/learn/page-layout)。

### 动作仍然返回命令

工具栏动作可以执行宿主副作用，也可以返回命令。修改 Schema 时，返回内置 command，使 Core 继续处理校验、历史和事件。

`src/editor/page-actions.ts`：

<<< ../../../examples/guide-project/src/editor/page-actions.ts

`feature-notice` 只对公告显示，已经精选时禁用。确认拦截器包住默认删除和自定义动作；真实项目把 `window.confirm` 换成自己的对话框、权限和审计服务。

### 装配最终 Designer

`src/editor/create-page-designer.ts`：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts

## 立即可观察行为

最终 `createPageDesigner()` 会把页头、普通物料、容器、动作和确认拦截器装配在同一个实例中。页头不会出现在物料栏；公告动作会在第一次执行后变为不可用；取消删除不会修改 Schema。

## 设计原因

### 事件只用于观测

`actionInterceptors` 决定动作能否继续执行，事件则记录已经发生的交互或成功写入。最小的 Schema 变化监听如下：

```ts
import { onBeforeUnmount } from 'vue'
import { EventName, useDesigner } from '@dragcraft/designer'

const { on, off } = useDesigner(designer)
const reportSchemaChange = () => console.info('schema changed')

on(EventName.SCHEMA_CHANGED, reportSchemaChange)
onBeforeUnmount(() => off(EventName.SCHEMA_CHANGED, reportSchemaChange))
```

`eventHooks` 适合记录选中、拖拽和 hover。它们不能替代确认或授权，因为事件触发时操作可能已经完成。前端拦截器负责编辑器体验；保存和发布接口仍要由服务端根据页面归属、物料白名单、资源权限和 revision 重新授权。

## 限制与下一步

不要把 `schema-managed` 当作安全边界。导入、迁移和服务端接口仍必须验证允许的节点与操作，前端策略只决定编辑器怎样呈现和提交操作。

## 完成检查

- 页头不出现在标准物料栏，也不能被 duplicate。
- 公告工具栏可以执行“设为精选”，第二次执行时按钮禁用。
- 删除节点时，取消确认不会更改 Schema。
- `schema:changed` 可被宿主记录，但不能作为服务端授权的依据。

完整的能力矩阵和失败关闭规则见 [Schema 与 Core 的 Authoring Policy](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/02-schema-and-core.md#schema-托管物料与-authoring-policy)。
