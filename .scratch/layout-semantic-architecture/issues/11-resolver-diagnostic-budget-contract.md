# Schema Resolver 诊断预算契约

Status: resolved
Type: grilling
Blocked by: 03, 08, 09
Blocks: Phase 1

## Question

在不破坏 Schema Structure Resolver 单一深 module seam 的前提下，诊断预算从哪里进入 `resolveSchema()`，截断事实又通过什么结果类型返回？需要统一以下已经接受、但目前互不兼容的约束：

1. 票据 03 固定入口为 `resolveSchema(input, definitions)`；`SchemaDefinitionSnapshot` 只含 `revision` 与 type/container/region 结构声明。
2. 票据 03 固定 `SchemaResolution.diagnostics` 为 `readonly SchemaDiagnostic[]`。
3. 票据 08 要求 `limits.maxDiagnostics` 可调低或调高，并公开 `{ items, truncated }` 形态的 `DiagnosticReport`。
4. 票据 09 与 accepted implementation plan 要求通过 Resolver 权威测试面覆盖默认 200、硬上限 2000 和稳定截断。

当前 interface 没有位置传入调用级诊断预算。只保留数组也无法区分“恰好产生上限条诊断”和“仍有诊断被截断”，因而 Designer 后续不能准确构造 `DiagnosticReport.truncated`。

## Required Decision

必须先固定以下契约，再恢复 Phase 1 的第一个 red cycle：

1. 诊断预算属于 Resolver 调用 options、definition snapshot，还是 Core 固定硬上限与 Designer 二次截断的分层规则。
2. `SchemaResolution.diagnostics` 保持数组，还是改为能表达 `truncated` 的 `DiagnosticReport`。
3. 默认 200 与硬上限 2000 分别由 Core 还是 Designer 执行，以及 Resolver 的权威测试如何从公共 interface 触发两者。

## Pre-decision Guardrails

- 在决策完成前不给 `resolveSchema()` 增加未决的第三参数；这会自行改变票据 03 当时的已接受 interface。
- 不把 `limits` 偷渡进 `SchemaDefinitionSnapshot`；诊断预算不是节点 type、container、region 或结构约束。
- 不在 200 条处静默截断数组；这会丢失票据 08 要求的 `truncated` 事实。
- 不用模块级可变配置；它会破坏 Resolver 的无状态纯函数契约和并发调用隔离。
- 不固定返回最多 200 条并把 2000 视为空洞的“硬上限”；这不能覆盖可调高预算或票据 09 要求的硬上限测试。

## Comments

- 2026-08-06: Confirmed that the Core Resolver owns the diagnostic budget through an optional third `options` parameter. `SchemaDefinitionSnapshot` remains limited to immutable structural definitions. The default budget is 200 and the hard limit is 2000.
- 2026-08-06: Confirmed that every `SchemaResolution` state returns `diagnostics: DiagnosticReport`, with `items` and `truncated`, replacing the diagnostic array from the earlier Resolver ticket.
- 2026-08-06: Confirmed that a requested `maxDiagnostics` above 2000 is capped at 2000. This does not reject the Schema or by itself set `truncated`; `truncated` only reports omitted diagnostics.
- 2026-08-06: Confirmed that `maxDiagnostics: 0` is valid. It returns no diagnostic items and sets `truncated` exactly when at least one diagnostic was omitted.
- 2026-08-06: Confirmed that an invalid diagnostic budget silently falls back to the default 200 rather than throwing or changing the Schema status.

## Answer

Core Resolver owns the diagnostic budget through one optional immutable options value while keeping Schema definitions pure:

```ts
interface ResolveSchemaOptions {
  readonly maxDiagnostics?: number
}

interface DiagnosticReport {
  readonly items: readonly SchemaDiagnostic[]
  readonly truncated: boolean
}

function resolveSchema(
  input: unknown,
  definitions: SchemaDefinitionSnapshot,
  options?: ResolveSchemaOptions,
): SchemaResolution
```

Every `SchemaResolution` state returns `diagnostics: DiagnosticReport`; the earlier diagnostic array shape is superseded. The effective diagnostic budget is determined as follows:

1. An omitted `maxDiagnostics` uses 200.
2. A non-negative finite integer is valid, including 0.
3. A valid integer above 2000 is capped at the hard limit 2000.
4. Any other runtime value, including a negative number, fractional number, `NaN` or infinity, silently uses the default 200.

Diagnostics are ordered by the existing stable phase/path/code rule before bounded retention. `truncated` is true exactly when at least one generated diagnostic was omitted by the effective budget; capping or defaulting the requested value does not set it by itself. Schema status is computed from the complete validation outcome and is therefore independent of the retained items: for example, `maxDiagnostics: 0` may return `conflicted` with `{ items: [], truncated: true }`.

Invalid Resolver options never become `SchemaDiagnostic` data and never change a document to `rejected`. The implementation must not retain omitted diagnostics or rejected input merely to compute the report.
