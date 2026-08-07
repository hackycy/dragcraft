# Designer 空态展示扩展契约

Status: open
Type: grilling
Blocked by: 06, 08
Blocks: Phase 4 / Phase 7 UI parity completion

## Question

宿主如何在不接管 Application Surface、Interaction Plane、drop feedback 或结构操作的情况下，自定义 Designer 空文档的业务展示，并同时接收 idle 与 drag-over 状态？需要决定当前框架默认 empty state 与 main 分支 Playground 原有小程序 phone/arrow 空态之间缺失的最小公共 seam。

## Conflict

1. accepted implementation plan 和架构 map 要求保留现有画布交互与 Playground UI，本次 Phase 1-7 重构只替换逻辑管线，不重新设计 Designer 交互。
2. main 分支通过 `DesignerExtensions.rendererExtensions.emptyState` 注入 `MiniProgramEmptyState`，使用 phone/arrow icon，并在 drag-over 时切换样式与“松开放置组件”文案。
3. 票据 06 接受的 Application Surface 由 Designer 统一拥有 empty/drop feedback 与 Interaction Plane；旧 `@dragcraft/renderer` 已删除，不能恢复 `rendererExtensions` 兼容层。
4. 当前公开 `DesignerExtensions` 只有 rail、material item、material panel 与 property panel renderer，没有 empty-state Adapter。框架默认 DOM 只提供单一文本，Playground 可以覆盖 message 和 CSS，但不能合法挂载原有 Vue icon 或读取 drag-over 状态。
5. 直接给 `DesignerExtensions` 增加 renderer、给 `CreateDesignerOptions` 增加 empty state、或把内部 drag state 暴露给 Playground，都会改变票据 08 接受的公共 interface。

因此无法仅通过消费者 CSS 或内部修复精确恢复 main 的自定义空态。继续实现会自行扩大 accepted public interface，违反本次架构缺口必须先停下决策的约束。

## Required Decision

1. 是否需要公共 empty-state Adapter；若需要，它属于 `DesignerExtensions`、Application Surface 的专用配置，还是其他更小的 module interface。
2. Adapter 的输入是否只包含 `idle | drag-over` 展示状态，还是还需要 forbidden reason、locale translation 或 drop destination；不得泄漏内部 drag controller、Geometry Registry 或 Authoring Engine。
3. Designer 是否继续拥有 outer DOM、可访问性语义、drop events 与 feedback layering，宿主只返回内容 VNode。
4. 自定义空态与框架默认 empty/drop/forbidden feedback 的互斥、fallback 和 theme contract。
5. locale 切换、dispose、多个 Designer 实例和 compact/wide workspace 下的稳定行为。

## Pre-decision Guardrails

- 不恢复旧 `rendererExtensions`、`@dragcraft/renderer` 或兼容别名。
- 不让 Playground 导入 `getDesignerInternals()`、drag context、Geometry Registry 或 Interaction Plane implementation。
- 不让宿主替换整个 Application Surface，也不把 drop event ownership 移出 Designer。
- 不用 CSS 伪元素仿造业务 icon 来声称精确 UI parity。
- 决策前不扩展 `CreateDesignerOptions`、`DesignerInstance`、`DesignerExtensions` 或公共 exports。

## Implementation Stop Evidence

- 2026-08-07: Phase 1-7 UI parity implementation restored framework default empty state, but comparison with `origin/main` showed the Playground-specific `MiniProgramEmptyState` still missing.
- 2026-08-07: Repository inspection confirmed main registered `rendererExtensions.emptyState`, while current `DesignerExtensions` exposes no empty-state renderer and Application Surface hard-codes the default empty-state VNode.
- 2026-08-07: Product implementation stopped after the remaining UI parity slices were green. No empty-state public test, interface, export or implementation was added.

## Comments

<!-- Wayfinder decision discussion is recorded here before implementation resumes. -->
