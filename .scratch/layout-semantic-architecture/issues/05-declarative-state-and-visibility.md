# 纯数据可见性与外部状态上下文

Status: resolved
Type: grilling
Blocked by: 01, 03

## Question

在 Schema 纯数据化前提下，决定动态可见性、设备/运行时状态和业务条件如何进入布局解析：使用受限表达式、命名条件、外部已解析上下文还是其他机制；需要明确确定性、可序列化、安全性、设计态隐藏反馈与生产运行时跳过渲染之间的契约。

## Answer

Core Schema 不提供通用可见性语义，不保存 `visible`、函数 predicate、条件 AST 或命名显示规则。节点存在于 `nodes[]` 并被 structure owner 引用，表示它属于文档；是否在某个消费场景渲染，由消费端展示策略决定。

如果业务需要持久化条件，例如“仅会员展示”，条件作为该物料的普通纯数据 props：

```ts
{
  id: 'member-offer',
  type: 'promotion',
  props: { audience: 'member' },
}
```

Core 只验证 props 是纯 JSON，不解释 `audience`。Designer Preview 与生产消费端分别按自身实现解释它；Dragcraft 不提供通用可见性、场景模拟或 Runtime Renderer Policy interface。

Dragcraft 不定义 Designer `previewState` 或生产业务 context。Designer 本身就是当前物料实现的展示；如果框架使用者还需要模拟会员、访客、路由、设备、购物车或其他场景，应由其注册的 Vue Preview 通过普通 props 闭包、provide/inject、Pinia 或其他宿主机制自行实现。该状态不进入 `MaterialPreviewContext`、`resolveSchema()`、Schema 或 history，Dragcraft 也不负责其 UI 与生命周期。

生产消费端可以按真实业务状态选择跳过节点、替换组件或执行其他行为；它与 Designer 只共享序列化 Schema，不共享 `ResolvedDocument`、context 或最终可见结果。Designer 不提供通用的隐藏占位、半透明反馈或场景切换控件。

相应删除 `NodeLayout.visible`、Core visibility resolver 和固定的“设计态隐藏节点半透明”规则。永久不属于文档的节点应从结构中删除；临时预览隐藏由 adapter state 表达。
