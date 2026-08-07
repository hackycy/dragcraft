# 下一代布局语义架构：交互保真重构路线

Status: resolved
Type: map

## Destination

形成一份可直接交给实施的重构规格：新 Document Schema、Resolver、Schema Editor 与 Authoring Engine 在现有 Designer 画布和工作台交互下面逐步接入；每个阶段通过可观察交互基线，最终再决定是否以及如何替换 Renderer 内部实现。

## Notes

- 领域：Dragcraft Schema、Authoring、Designer 工作台、画布交互、默认容器 UI、浏览器几何与重构验证。
- 本地图只产出架构决策和实施顺序，不直接实施重构。
- 每张票使用 `grilling` 与 `domain-modeling`；涉及模块接口时使用 `codebase-design` 的 module、interface、seam、adapter、depth、locality 术语。
- 现有 Designer 交互是可执行基线；允许内部 DOM 改变，不以像素级截图相等作为默认目标。
- 重构过渡 Adapter 只存在于重构分支内部，调用方切换后删除；不做公共兼容层、双写或长期 facade。
- 已确认新底层方向：纯数据 Document Schema、Schema Structure Resolver、Schema Editor、Authoring Engine；不支持递归容器。

## Decisions so far

- 目的地：先完成底层替换且交互等价，再讨论 Renderer 内部重构。
- 交互基线闸门：当前 `main` 的 Designer 交互契约必须成为每个底层切换阶段的硬验收；验证行为和状态转移，不要求像素级 DOM 相等。
- [交互基线如何定义](issues/01-interaction-baseline.md) — 以十类场景族和纯模块、组件、浏览器三层验证构成交互基线；每个切换阶段运行受影响子集与完整 smoke 流程。
- [过渡 Adapter 的 seam 如何划分](issues/02-transition-adapter-seam.md) — 长期 seam 是内部 Designer Session；旧 Engine 先作为临时 Adapter 实现它，UI 逐簇迁移后再接入新 Authoring Engine，避免模拟旧 Engine 或双写。
- [会话状态如何保持连续](issues/03-session-state-continuity.md) — 区分必须保留的会话核心事实、可重算的会话投影和宿主状态，并以 Cutover Fence 禁止 active drag 中切换后端。
- [Renderer 如何按切片替换](issues/04-slice-cutover-order.md) — 先切只读投影与写入，再依次替换节点交互、Container Region、Root Surface、Frame/几何耦合簇；每个切片单一 active implementation，并只允许 seam 级回退。
- [何时允许删除旧 Renderer](issues/05-renderer-deletion-gate.md) — 六组证据全部满足后才删除旧 Renderer/Adapter/协议，并以独立无行为变更的清理提交完成最终切换。

## Not yet specified

无；交互保真重构的目的地、状态连续性、切片顺序和删除闸门均已明确。

## Out of scope

- 直接重做现有 Designer 视觉和交互设计。
- v1 Schema 迁移、公共兼容 alias、双读、双写。
- 递归容器及其设计态交互。
- 本轮交付非 Vue/浏览器宿主的 Presentation 实现。
