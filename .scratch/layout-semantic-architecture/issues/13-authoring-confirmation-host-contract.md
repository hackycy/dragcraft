# Authoring 确认与宿主交互契约

Status: resolved
Type: grilling
Blocked by: 07, 08
Blocks: Phase 7
Supersedes in part: 07, 08

## Question

当 `DcDesigner` 内部的 structure tree、Interaction Plane 或其他工作台入口发起一个被 `AuthoringPolicy` 判定为 `confirmation-required` 的 `AuthoringAction` 时，Designer 如何让宿主展示自己的确认 UX，并在确认后以 `confirmed: true` 重新执行同一封闭 Action？需要在不恢复旧 action interceptor/custom command 体系的前提下，补齐 Engine 的确认结果与工作台交互之间缺失的协调契约。

## Conflict

1. 票据 07 固定确认必须由 Designer 在生成 `SchemaOperation` 前处理，`AuthoringEngine.execute()` 对未确认的受保护 Action 返回 `confirmation-required`。
2. 票据 08 固定 `DesignerInstance.execute(action): AuthoringResult` 和 `createDesigner({ schema?, materials, ... })` 公共 seam，但没有固定宿主确认回调或工作台 Action interception interface。
3. Phase 5 已实现的 `DcStructurePanel` 和 `InteractionPlane` 直接调用 `DesignerInstance.execute()`，没有消费 `confirmation-required` 结果，也没有向宿主请求确认后重试。
4. Phase 7 明确要求保留 Playground 的 Ant Design 确认框和 Guide 的宿主确认 UX；两个旧消费者均通过已删除的 `createConfirmActionInterceptor()` 提供该行为。

因此 Phase 7 无法只靠消费者改写保留确认 UX。把 policy 全部改为 `allowed` 会删除既有行为；让工作台静默重试 `confirmed: true` 会绕过确认；直接使用 `window.confirm()` 不能承载宿主拥有的确认 UX；重新导出旧 interceptor 则违反直接替换和无兼容层约束。任何可用的新宿主入口都会改变票据 08 已接受的公共 interface。

## Required Decision

必须先固定以下契约，再开始 Phase 7 的第一个 red cycle：

1. 确认协调由 `createDesigner()` option、`DesignerExtensions`，还是另一个已明确归属 Designer 的宿主 seam 提供。
2. 宿主确认是否允许异步；若允许，工作台 Action execution 的返回与重试生命周期如何表达，同时保持 `AuthoringEngine.execute()` 的同步纯协调语义。
3. 确认请求向宿主暴露哪些最小纯数据 context，例如 Action、material type、node id 和稳定 reason code；不得泄漏 `ResolvedDocument`、Material Catalog 或内部 Store。
4. 拒绝确认、确认期间重复触发、目标在等待期间失效、batch/unwrap/remove 等场景分别产生什么稳定可观察结果。
5. 直接调用 `DesignerInstance.execute()` 的程序化宿主是否仍自行处理 `confirmation-required`，以及 `DcDesigner` 内部交互如何复用同一确认 seam 而不形成第二条写入通道。

## Pre-decision Guardrails

- 不恢复 `createConfirmActionInterceptor()`、任意 custom action/command 或兼容 alias。
- 不让消费者替换、修改或包裹被冻结的 `DesignerInstance.execute()`。
- 不让 `DcStructurePanel`、Interaction Plane 或 drag/drop 绕过 `AuthoringPolicy`，也不让它们直接提交 `SchemaOperation`。
- 不把 Ant Design、浏览器 `window.confirm()` 或某个产品文案固化进 Designer implementation。
- 不在决策前扩展 `CreateDesignerOptions`、`DesignerExtensions`、`DesignerInstance`、`AuthoringAction` 或 `AuthoringResult`。

## Implementation Stop Evidence

- 2026-08-06: Phase 7 consumer inventory found that both product consumers still configure removed confirmation interceptors, while the replacement public interface has no host confirmation entry.
- 2026-08-06: Repository search found direct remove execution in both `DcStructurePanel` and `InteractionPlane`; neither call site inspects `confirmation-required` or retries with `confirmed: true`.
- 2026-08-06: The existing directed Authoring Engine test passed and confirms the lower module intentionally returns `confirmation-required` until the caller supplies `confirmed: true`.
- 2026-08-06: Phase 7 implementation stopped before any test or production code was written. No accepted public interface was changed.

## Comments

- 2026-08-06: Confirmed that host confirmation is an optional `createDesigner()` option, not a `DesignerExtensions` presentation hook and not a restored action interceptor.
- 2026-08-06: Confirmed that the host callback accepts a minimal immutable request and may return either `boolean` or `Promise<boolean>`.
- 2026-08-06: Confirmed that `DesignerInstance.execute()` remains synchronous and never invokes host confirmation automatically; only Actions originating inside `DcDesigner` use the private confirmation coordinator.
- 2026-08-06: Confirmed fail-closed, single-flight, stale-document, cancellation, callback-failure, batch and disposal behavior before Phase 7 resumes.

## Answer

`createDesigner()` gains one optional host confirmation seam:

```ts
interface AuthoringConfirmationRequest {
  readonly action: MaterialAuthoringPolicyAction
  readonly code: 'POLICY_CONFIRMATION_REQUIRED'
  readonly materialType: NodeType
  readonly nodeId?: NodeId
}

type ConfirmAuthoringAction = (
  request: AuthoringConfirmationRequest,
) => boolean | Promise<boolean>

interface CreateDesignerOptions {
  readonly confirmAuthoringAction?: ConfirmAuthoringAction
}
```

The request contains only the material policy action kind (`create`, `duplicate`, `move`, `remove`, `unwrap` or `update`), stable reason code, material type and optional node ID. The private coordinator retains the complete `AuthoringAction`; the callback does not receive props, Schema, `ResolvedDocument`, Material Catalog, internal Store or a retry function.

`DesignerInstance.execute(action)` remains the synchronous programmatic Authoring Engine interface. It does not call `confirmAuthoringAction`; a programmatic caller continues to inspect `confirmation-required` and explicitly retries its own closed action with `confirmed: true`. `DcDesigner` routes all of its own Schema Action sources through one private coordinator, including structure tree, Interaction Plane, drag/drop, inspector/property edits and `MaterialPreviewContext.updateSelf()`. Selection and hover remain immediate; undo and redo never request confirmation.

The coordinator first calls the same synchronous `execute()` interface. When the result is `confirmation-required`, it returns that initial result to the immediate caller, retains the complete action privately and invokes `confirmAuthoringAction`. A truthy confirmation retries the same closed action with `confirmed: true`; there is no second write path. If no callback is configured, or the callback returns `false`, throws or rejects, the action is not retried and nothing is committed. Designer does not provide a `window.confirm()` fallback or own product modal copy.

Confirmation is single-flight per Designer instance. While one request is pending, further `DcDesigner` Schema and history Actions are not executed; selection and hover may still change. The coordinator captures the current immutable Schema reference before requesting confirmation. If programmatic execution, import or another path changes that reference before confirmation resolves, the retained action is stale and is discarded. `dispose()` also invalidates pending confirmation so later callback completion cannot commit. Pending state, request IDs, cancellation and queues are not added to `DesignerInstance`; the host owns only its callback Promise and modal lifecycle.

Batch confirmation remains atomic. `AuthoringResult` identifies the first unconfirmed batch child without exposing its payload:

```ts
type AuthoringResult =
  | {
      readonly status: 'confirmation-required'
      readonly code: 'POLICY_CONFIRMATION_REQUIRED'
      readonly actionIndex?: number
    }
  | // existing committed, unchanged and rejected states
```

A single Action omits `actionIndex`; a batch returns the exact child index. The coordinator confirms that child, marks only it `confirmed: true`, and retries the complete batch. Further protected children are confirmed in order. The batch commits once and writes one history entry only after every required confirmation succeeds; cancellation, callback failure, staleness or disposal leaves the whole batch uncommitted. Programmatic batch callers use the same `actionIndex` to perform their own explicit retries.

This decision changes only the host confirmation portions of tickets 07 and 08. It does not restore generic interceptors, custom commands, custom Core handlers or arbitrary Action middleware, and it does not move Authoring Policy or confirmation state into Schema or history.
