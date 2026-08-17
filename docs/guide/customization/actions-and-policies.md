---
description: "使用节点动作、拦截器、事件 hooks 和 authoring policy 接入业务规则。"
---

# 动作与 Authoring Policy

节点 action 描述用户可以发起的操作；material authoring policy 决定当前节点是否允许。持久化修改最终调用 `designer.execute(action)`。

## 自定义 Action

自定义 action 适合补充节点工具栏。它可以产生 `AuthoringAction`，或只执行宿主侧 UI、跳转与审计。确认、权限和错误处理通过 `actionInterceptors` 协调，不能绕过 material policy。`customActions` 与 `actionInterceptors` 是非 Renderer 的 authoring 扩展，不接收 Schema、几何或 Renderer context；Application Surface 的唯一几何展示 seam 是 `PresentationFrame`。

```text
visible -> available -> policy -> interceptor -> action -> result
```

例如，给公告节点增加“设为精选”按钮：

```ts
import type { NodeActionDefinition } from '@dragcraft/designer'

export const customActions: NodeActionDefinition[] = [{
  key: 'feature-notice',
  label: '设为精选',
  type: 'button',
  visible: ctx => ctx.node.type === 'notice',
  disabled: ctx => ctx.node.props.featured === true,
  action: ctx => ({
    type: 'node.update',
    nodeId: ctx.node.id,
    props: { featured: true },
  }),
}]
```

这里的 `node.update` 是节点工具栏向 Designer session 提交的语义 action；宿主不需要自己改 Schema。完整的确认拦截器示例见 [`examples/guide-project/src/editor/actions.ts`](https://github.com/hackycy/dragcraft/blob/main/examples/guide-project/src/editor/actions.ts)。

结果为 `committed`、`unchanged`、`rejected` 或 `confirmation-required`。拒绝和无变化不增加 history。

宿主若要标记草稿已修改，应观察 `designer.document`，而不是从 selection、drag 或 hover 推断数据变化；这些交互由 Designer 自己拥有，不是公共事件 hook。

## 物料策略

`authoring.policy` 可以分别控制 `create`、`duplicate`、`move`、`remove`、`unwrap` 与 `update`。策略可返回允许、需要确认或拒绝；异常或未知结果按拒绝处理。

```ts
authoring: {
  policy: {
    create: ({ schema }) => schema.nodes.some(node => node.type === 'page-header')
      ? 'denied'
      : 'allowed',
    duplicate: 'denied',
    remove: 'denied',
  },
},
```

策略只决定当前设计态 action 能否执行。创建时传入 `confirmed: true` 只用于完成一次已经获得宿主确认的 action；它不代表服务端已经授权。

策略仅约束设计态编辑，不取代服务端授权。import、导出、保存与发布仍由可信宿主负责。
