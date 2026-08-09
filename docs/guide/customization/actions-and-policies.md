---
description: "使用节点动作、拦截器、事件 hooks 和 authoring policy 接入业务规则。"
---

# 动作与 Authoring Policy

节点 action 描述用户可以发起的操作；material authoring policy 决定当前节点是否允许。持久化修改最终调用 `designer.execute(action)`。

## 自定义 Action

自定义 action 适合补充节点工具栏。它可以产生 `AuthoringAction`，或只执行宿主侧 UI、跳转与审计。确认、权限和错误处理通过 `actionInterceptors` 协调，不能绕过 material policy。

```text
visible -> available -> policy -> interceptor -> action -> result
```

结果为 `committed`、`unchanged`、`rejected` 或 `confirmation-required`。拒绝和无变化不增加 history。

## 交互 Hooks

selection、drag 和 hover 使用 `eventHooks`，不属于持久化 action。before drag 必须同步，以便浏览器接收 `preventDefault()`；hover 是高频通知，不能作为保存触发器。

宿主若要标记草稿已修改，应观察 `designer.document`，而不是从 selection 或 hover 推断数据变化。

## 物料策略

`authoring.policy` 可以分别控制 `create`、`duplicate`、`move`、`remove`、`unwrap` 与 `update`。策略可返回允许、需要确认或拒绝；异常或未知结果按拒绝处理。

策略仅约束设计态编辑，不取代服务端授权。import、导出、保存与发布仍由可信宿主负责。
