# Designer 运行时本地化宿主契约

Status: resolved
Type: grilling
Blocked by: 08
Supersedes in part: 08 (`DesignerInstance` runtime localization only)

## Question

宿主如何在不销毁 `DesignerInstance` 的情况下切换 Designer 工作台语言，同时保留当前 Document、selection、hover、history、待确认状态和已挂载工作台会话？需要补齐 `createDesigner({ locale, messages })` 的初始化配置与 main 分支现有运行时 `setLocale()` 行为之间缺失的公共 seam。

## Conflict

1. accepted implementation plan 要求 Phase 5 保留 undo/redo、selection 和面板行为，Phase 7 保留 locale switching；本次重构只替换逻辑管线，不重新设计 UI。
2. main 分支的 Playground 在同一 Designer 会话上调用 `designer.i18n.setLocale(next)`，因此切换语言不会重建 document/history/selection 会话。
3. 票据 08 接受的 `DesignerInstance` interface 只提供 document、selection、history、execute、import/export 和 dispose；当前 `CreateDesignerOptions.locale` 只在创建时读取，公共实例没有 locale controller。
4. Phase 7 当前实现只能先 `exportSchema()`，再 `dispose()` 并 `createDesigner()`。Schema 可以保留，但 selection、hover、undo/redo history、待确认状态和 preview-local state 都被丢弃。
5. Playground 不能使用私有 `getDesignerInternals()`；公开它或直接公开内部 `I18nInstance` 都会扩大已接受 interface。让 locale option 接受响应式输入、给 `DesignerInstance` 增加 locale 方法，或增加新的宿主 controller 也都会改变票据 08 的公共 interface。

因此无法仅通过内部修复恢复 main 的 locale 行为。继续修改消费者会把会话丢失固化为新的 UI 行为，违反本次只做逻辑重构的边界。

## Required Decision

必须先固定以下契约，再恢复 Phase 7 UI parity 的第一个 red cycle：

1. 运行时 locale 由 `DesignerInstance` 的最小方法、`CreateDesignerOptions` 的响应式输入，还是独立的宿主 locale controller 提供。
2. 公共 surface 是否只接受 locale 标识，还是也允许运行时合并/替换 messages；不得直接泄漏 Designer 私有 i18n implementation。
3. locale 更新对已挂载 `DcDesigner`、Material title/titleKey、group label、字段文案、Device Frame 宿主翻译和 material preview 的一致性语义。
4. locale 更新期间 pending confirmation、selection、history、Schema reference 与 preview-local state 必须保持还是允许哪些明确失效。
5. `dispose()` 后 locale controller 的行为以及非法/未知 locale 的稳定 fallback。

## Pre-decision Guardrails

- 不让 Playground 或其他公共消费者导入 `getDesignerInternals()` 或 `@dragcraft/i18n` 私有实例。
- 不通过销毁并重建 Designer 来模拟 locale 更新，因为这会丢失既有工作台状态。
- 不恢复旧 `useDesigner()` 兼容层，也不重新公开完整 Engine 或 Store。
- 不在决策前扩展 `CreateDesignerOptions`、`DesignerInstance`、`DesignerExtensions` 或公共 exports。
- 不把 DevicePicker 或 Playground 产品文案耦合进 Designer implementation。

## Implementation Stop Evidence

- 2026-08-07: Phase 1-7 UI parity audit compared `origin/main` with the replacement path and found that main calls `designer.i18n.setLocale(next)`, while the replacement Playground disposes and recreates the Designer.
- 2026-08-07: Repository inspection confirmed `CreateDesignerOptions.locale?: string` is initialization-only, `DesignerInstance` exposes no locale operation, and the only mutable `I18nInstance` is stored in private `DesignerInternals`.
- 2026-08-07: Production development stopped after three completed internal red-green slices. No locale test or implementation change was made because the required test seam would depend on the unresolved public interface.

## Comments

- 2026-08-07: Confirmed that the public seam is a dedicated `DesignerInstance.localization` module, not the internal `I18nInstance`, a top-level `setLocale()` method or a caller-owned reactive locale option.
- 2026-08-07: Confirmed that this module owns a read-only current locale, `setLocale(locale)` and message translation. It does not expose a writable locale ref or runtime `mergeMessages()` merely because the private implementation has them.
- 2026-08-07: Confirmed that locale updates cover all Designer-owned workbench text, Material panel title/description keys, Structure and Property panels, and Form Generator title/label keys. Material group labels resolve `group.${group}` with the raw group as fallback.
- 2026-08-07: Confirmed that `localization.translate` uses the same active locale for host UI such as DevicePicker, and `DesignerRailSlotAPI.t` retains the same behavior. Material Preview remains user-owned and receives no locale or translation addition to `MaterialPreviewContext`; literals without keys remain unchanged.
- 2026-08-07: Confirmed that `setLocale()` is a synchronous presentation-session update. It preserves Designer identity, the immutable Document reference, selection, hover, history, pending confirmation and mounted Preview instances; it creates no Action, Operation, history entry or diagnostic.
- 2026-08-07: Confirmed that locale changes neither cancel nor stale a pending confirmation and do not re-invoke the host callback. The new read-only locale and translation result are observable before `setLocale()` returns, and setting the current locale is a no-op.
- 2026-08-07: Confirmed exact, case-sensitive locale keys with no normalization or parent-locale inference. An unknown non-empty locale is accepted and translation returns the supplied fallback or key; empty or runtime non-string input throws `TypeError` without changing state.
- 2026-08-07: Confirmed that `setLocale()` returns `void`. After `dispose()`, the last locale and translation remain readable while `setLocale()` is a no-op; this ticket adds no general disposed error or new lifecycle rule for other Designer operations.

## Answer

`DesignerInstance` exposes one dedicated deep module for Designer Localization:

```ts
interface DesignerLocalization {
  readonly locale: Readonly<Ref<string>>
  setLocale(locale: string): void
  translate(key: string, fallback?: string): string
}

interface DesignerInstance {
  readonly localization: DesignerLocalization
  // existing document, selection, history, execute, import/export and dispose
}
```

`DesignerLocalization` is a public type exported by `@dragcraft/designer`. It is not an alias for the private `I18nInstance` and does not expose a writable locale ref, runtime message mutation, the message store or `@dragcraft/i18n`. `CreateDesignerOptions.locale` and `messages` remain the only initialization inputs; all user messages are merged before the frozen Designer instance is returned.

The module owns the active Designer workbench locale and message resolution. `setLocale()` updates the read-only locale synchronously, and `translate()` resolves against that same locale. `DesignerRailSlotAPI.t` retains the same resolution behavior. Host UI such as `DevicePicker` receives `designer.localization.translate`, so the host and mounted Designer do not maintain separate localization stores.

Locale changes update all Designer-owned text that uses message keys: workbench controls, toolbar actions, Material panel titles and descriptions, Structure and Property panels, and Form Generator section/field labels. A Material group `group` is resolved through `group.${group}` with the raw group as fallback. Literal text without a key remains unchanged.

Material Preview remains user-owned. `MaterialPreviewContext` gains no locale or translation member, and Designer Localization does not define production Runtime localization or product state. Material Vue implementations continue to consume their host's state directly when they need product-specific localization.

`setLocale()` is a presentation-session update, not an Authoring Action. It preserves the `DesignerInstance`, immutable Document reference, selection, hover, history cursor, pending confirmation and mounted Preview instances. It creates no Schema Operation, history entry or diagnostic. A pending confirmation is neither cancelled nor stale, and its host callback is not invoked again; an already-open host prompt remains host-owned. Setting the current locale is a no-op.

Locale keys are exact and case-sensitive. Designer performs no case normalization or parent inference such as `en-US` to `en`. Any non-empty string is accepted, including a locale without registered messages; `translate()` then returns its explicit fallback or, when absent, the key. Empty strings and runtime non-string values throw `TypeError` synchronously without changing the active locale. The same validation applies to the initial `CreateDesignerOptions.locale`; the omitted default remains `zh-CN`.

After `dispose()`, the last locale and `translate()` remain readable, while `setLocale()` is a no-op. This ticket adds no general disposed error and does not redefine lifecycle behavior for the other `DesignerInstance` operations.

This decision supersedes only the runtime localization portion of ticket 08. It does not restore the old public `i18n` object, `useDesigner()` compatibility behavior, runtime `mergeMessages()`, Preview localization context or any production renderer interface.
