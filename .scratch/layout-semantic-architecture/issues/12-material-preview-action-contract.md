# Material Preview 动作编译契约

Status: open
Type: grilling
Blocked by: 07, 08
Blocks: Phase 4

## Question

`MaterialPreviewContext.invokeAction(action, payload?)` 如何在不绕过 Authoring Policy、Schema Editor、提交与 history 的前提下，把物料声明的稳定动作名编译为已接受的封闭 `AuthoringAction`？需要统一以下已经接受、但当前无法同时实现的约束：

1. 票据 08 固定 Preview 的受控 interface 包含 `invokeAction(action: string, payload?: JsonValue): AuthoringResult`。
2. 票据 07 固定所有文档写入都从 `AuthoringEngine.execute(action: AuthoringAction)` 进入，并由它在 Policy 后编译为封闭 `SchemaOperation`。
3. Phase 3 已接受并实现的 `AuthoringAction` union 只包含 create、duplicate、move、remove、unwrap、update node/page/global config、batch、selection、hover、undo 和 redo。
4. Phase 3 已接受并实现的 `MaterialAuthoringDefinition` 只有 NodeBundle factory 与 policy，没有声明动作名、payload 契约或动作编译器。

因此 Phase 4 无法实现一个既有用又合规的 `invokeAction()`：直接执行回调会绕过 Engine；把字符串透传给 Core 会开放操作词汇；始终拒绝则不满足票据 08 已接受的 interface 行为。补上编译位置会改变已接受的公共 material 或 authoring interface。

## Required Decision

必须先固定以下契约，再恢复 Phase 4 的 `material-preview-context.ts` red cycle：

1. 动作名与 payload 契约由 `MaterialAuthoringDefinition` 声明，还是由一个新的封闭 `AuthoringAction` variant 交给 Material Catalog 内部解析。
2. 动作编译结果只能是现有 `SchemaAuthoringAction` / 非嵌套 batch，还是允许返回更低层的 `SchemaOperation`；后者会让物料越过 Authoring Policy seam。
3. 未知动作、非法 payload、read-only node、confirmation-required 和 no-op 分别返回什么稳定 `AuthoringResult`。
4. `invokeAction()` 是否仍保留在公开 `MaterialPreviewContext`；若删除或缩窄，票据 08 的已接受公共 interface 必须被明确取代。

## Pre-decision Guardrails

- 不给 Core 注册 custom command 或任意 operation handler；Schema Editor 的操作词汇保持封闭。
- 不让 Preview 接触 `AuthoringEngine`、Material Catalog、ResolvedDocument、history 或可写 Store。
- 不从 action 字符串猜测内置操作，也不把 payload 当作未经声明的 `AuthoringAction` 强制转换。
- 不通过 ApplicationSurface 私有回调直接修改 Schema；所有文档写入仍必须经过 Authoring Engine。
- 不在决策前扩展 `MaterialAuthoringDefinition` 或 `AuthoringAction`，也不把 `invokeAction()` 实现为永远拒绝的占位 interface。

## Implementation Stop Evidence

- 2026-08-06: Phase 4 reached this gap after the ApplicationSurface, NodeHost, material presentation paths, Region Outlet recovery, PresentationFrame recovery, Viewport Portal, and drop-anchor slices had passed their directed happy-dom tests.
- 2026-08-06: Development stopped before `material-preview-context.ts`, Geometry Registry, Surface Reservation, Interaction Plane behavior, structural CSS completion, or any Phase 5 work.
