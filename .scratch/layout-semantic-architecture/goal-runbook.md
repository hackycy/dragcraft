# layout-semantic-architecture Goal Runbook

## Source Baseline

| Path | SHA-256 |
| --- | --- |
| `.scratch/layout-semantic-architecture/implementation-plan.md` | `6eb45022f7443823970fe4876b13cd37b7a5383c361f57741e055bdd1593e6f0` |
| `.scratch/layout-semantic-architecture/issues/01-canonical-schema-model.md` | `53fe4e8cfb0a600ba0082a2350886a645eeef8e4ae0a825c51eea2f8206747a9` |
| `.scratch/layout-semantic-architecture/issues/02-layout-capability-algebra.md` | `00744a6c65d9f4604b2db0a9a0735cf3f33cb5c2d99b6301e9ec145790b1c114` |
| `.scratch/layout-semantic-architecture/issues/03-schema-structure-resolver-output.md` | `8bc9d1c2dc97414f77a127623b92ef6ed515795673b212d0cf010af390230666` |
| `.scratch/layout-semantic-architecture/issues/04-one-level-container-model.md` | `c1c194b8ca4c4fbc4e0574da85ff54eb4b704c989bff54e12eeef6b37db93a81` |
| `.scratch/layout-semantic-architecture/issues/05-declarative-state-and-visibility.md` | `dc6daf423b96b0f96f7173a24108a8d08ebfc061d03f25cf2f6339978230688b` |
| `.scratch/layout-semantic-architecture/issues/06-web-geometry-adapter.md` | `096d8cdcf14945726fd855afb8c4d127b8e6bdd926d172cdc3b3ec4c9f4f91e4` |
| `.scratch/layout-semantic-architecture/issues/07-authoring-operations-model.md` | `a1c1e6b47bf20bd7ffd3b8d055791d5b4c147f2ae5799546f58ae09c742b3a88` |
| `.scratch/layout-semantic-architecture/issues/08-public-designer-contract.md` | `c5c188137c3d5e9fe0a60df9c0b1a282e03bfda7bfa119c01bb2f12859d12333` |
| `.scratch/layout-semantic-architecture/issues/09-validation-and-conformance.md` | `cb41f0e3c7af7928ef0dfda470ae58f2933b5ec3daee6d7d3348e16418d06c4f` |
| `.scratch/layout-semantic-architecture/issues/10-semantic-render-binding.md` | `becc03605c4a9ebde07572d9797aff29d20b5381f5a2644ea81c62a7c24dc6b8` |
| `.scratch/layout-semantic-architecture/issues/11-interaction-baseline.md` | `23f9a1f21c3a843492aee2b703139fa38f37044e99e555aafc32cda08efd96b2` |
| `.scratch/layout-semantic-architecture/issues/12-transition-adapter-seam.md` | `f02a1cd5d893ff2caff9e4dcc3eaba64e9ab74be7208fded33ac0d332b383060` |
| `.scratch/layout-semantic-architecture/issues/13-session-state-continuity.md` | `49714414ddf87d0dd8fedef0708474aa8eb98616e46fa78957b7029fab1f8067` |
| `.scratch/layout-semantic-architecture/issues/14-slice-cutover-order.md` | `13024c97fc7e7cdddda96c6eee3dd7f95ddc29ed3ad70fcea9a8727d9de5d31b` |
| `.scratch/layout-semantic-architecture/issues/15-renderer-deletion-gate.md` | `c9ff29a28f134958139a944441274b02c2c0ad1cf613e3768cbd2610a0a81875` |
| `.scratch/layout-semantic-architecture/map.md` | `b424da0db698c7ad6a3498bf040356dcf01a2d7035df17154a961752fc475800` |
| `CLAUDE.md` | `96b889f5c462f3c0852f1d791871dc23ebe29573c95b7729ddb3a01454b9009e` |
| `CONTEXT.md` | `fe35826f2c23297236c5858abe248e03e2583ef67ce64d36b28f43cd177be0d4` |

## State Rules

- `implementation-plan.md` 是 Gate 合同的唯一来源；本账本只记录状态和证据。
- 一次只执行 Goal Ledger 中唯一 `active` 的 Gate。
- 每轮向对应 Gate 的 Progress Log 追加 slice、修改、验证结果、风险和下一动作。
- `passed` 需要计划中每条 Exit condition 的明确证据；普通实现或验证失败保持 `active`。
- `blocked` 只用于计划声明的 Stop condition，并记录阻塞与恢复条件。
- 当前 Gate 通过后只激活直接后继并结束本次 Goal；直接后继虽为 `active`，但必须由新的 Goal 执行。最后一个 Gate 通过后记录 effort 完成并结束本次 Goal。

## Goal Ledger

| Gate | Status | Depends on | Plan contract | Unlock evidence |
| --- | --- | --- | --- | --- |
| G0: Convergence Guard and Drift Inventory | passed | none | `implementation-plan.md` -> `G0: Convergence Guard and Drift Inventory` | no predecessor |
| G1: Canonical Schema and Session | passed | G0 | `implementation-plan.md` -> `G1: Canonical Schema and Session` | G0 passed |
| G2: Authoring and Structural Operations | active | G1 | `implementation-plan.md` -> `G2: Authoring and Structural Operations` | G1 passed |
| G3: Node Interaction and Geometry | planned | G2 | `implementation-plan.md` -> `G3: Node Interaction and Geometry` | G2 pending |
| G4: Container Region Cutover | planned | G3 | `implementation-plan.md` -> `G4: Container Region Cutover` | G3 pending |
| G5: Root Surface Cutover | planned | G4 | `implementation-plan.md` -> `G5: Root Surface Cutover` | G4 pending |
| G6: PresentationFrame and Surface Geometry | planned | G5 | `implementation-plan.md` -> `G6: PresentationFrame and Surface Geometry` | G5 pending |
| G7: Public and External Consumer Boundary | planned | G6 | `implementation-plan.md` -> `G7: Public and External Consumer Boundary` | G6 pending |
| G8: Conformance and Product Evidence | planned | G7 | `implementation-plan.md` -> `G8: Conformance and Product Evidence` | G7 pending |
| G9: Legacy Deletion and Closeout | planned | G8 | `implementation-plan.md` -> `G9: Legacy Deletion and Closeout` | G8 pending |

## Progress Log

### G0: Convergence Guard and Drift Inventory

- 2026-08-16: initialized as `active`; the new plan explicitly treats current placement/layout implementation as drift inventory, not as the target behavior. Implementation has not started.
- 2026-08-16: Slice `scan coverage` completed. Modified `scripts/check-obsolete-protocol.mjs`, `scripts/check-obsolete-protocol-fixtures.test.mjs`, and `scripts/fixtures/public-contract-valid.md`. Directed verification: `pnpm exec vitest run scripts/check-obsolete-protocol-fixtures.test.mjs` passed (3 tests); strict invalid fixture emitted stable `path:line identifier` findings; valid fixture permits `PresentationFrame`, `SurfaceReservation`, and `GeometryRegistry`; `examples/guide-project/src/runtime/layout.ts` is recorded as permitted local external-runtime policy. Risk: the baseline still contains prohibited contracts by design, and the remaining inventory must be assigned before later gates begin. Next: capture the deterministic baseline inventory and decision-to-Gate drift assignment.
- 2026-08-16: Slice `fixture and baseline` completed. Added `g0-obsolete-protocol-inventory.txt` and `g0-drift-report.md`; modified the scanner to annotate every finding with its later owner Gate. Directed verification: scanner fixture suite passed (3 tests); two inventory runs produced the identical SHA-256 `30083270410bbdfc92b8fb4445e2f5338f4db380e46820b9f99bde2749367bf0`; full `node scripts/check-obsolete-protocol.mjs --strict` failed closed with the recorded 468 prohibited findings, while the 101 Guide Project runtime findings remain explicitly permitted and visible. Risk: repository baseline may expose pre-existing failures; preserve their diagnostics without broadening G0. Next: run the declared repository verification order and record the exact outcome.
- 2026-08-16: Repository verification reached the declared stop point. `pnpm check:obsolete-protocol` passed in inventory mode; `pnpm check:public-boundary`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` passed. `pnpm test:browser` started both Vite servers but all 32 browser tests failed before launch because Chromium is absent at `C:\Users\Administrator\AppData\Local\ms-playwright\chromium_headless_shell-1234\chrome-headless-shell.exe`. Stop condition: baseline verification failed for an unisolated environment prerequisite. Completed evidence is the command output above and the unchanged source inventory; recovery requires installing the pinned Playwright browser (`pnpm exec playwright install`) or providing an equivalent executable, then rerunning the full ordered verification. G0 remains `active`; no Exit condition is marked passed.
- 2026-08-16: Browser prerequisite recovery completed with `pnpm exec playwright install chromium`. Final repository verification then passed in the required order: `pnpm check:obsolete-protocol` (inventory mode), `pnpm check:public-boundary`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` (32 passed). Exit evidence: (1) deterministic coverage is proven by the 3-test scanner fixture suite and identical two-run inventory SHA-256 `30083270410bbdfc92b8fb4445e2f5338f4db380e46820b9f99bde2749367bf0`; (2) every recorded finding has `path:line [Gate] identifier` in `g0-obsolete-protocol-inventory.txt`, with assignments documented in `g0-drift-report.md`; (3) full strict mode fails closed on the 468 prohibited findings while 101 local external-runtime findings remain visible and permitted; (4) the baseline source SHA `85b4624ce5addfb01b39ec81c9056511601d7e54`, inventory artifact, and ordered verification are recorded here and in the drift report. No runtime behavior, public export, Schema, or interaction was changed. G0 is `passed`.

### G1: Canonical Schema and Session

- 2026-08-16: initialized as `planned`; G0 pending and no implementation evidence.
- 2026-08-16: activated after G0 passed; not started in this Goal.
- 2026-08-16: Slice `canonical session read projection` completed. Modified the internal Designer Session contract and Next adapter, added the private `presentation/material-presentation.ts` resolver, and rewired direct Presentation/Structure/drag consumers to use it without changing DOM or authoring behavior. Session now exposes canonical Schema, root/region owner sequences, and resolver read-only state only; it no longer exposes layout resolution, container tree projections, scoped structural positions, or destination projections. Directed verification: `pnpm exec vitest run packages/core/src/resolver/resolve-schema.test.ts packages/designer/src/session/next-designer-session-adapter.test.ts packages/designer/src/components/DcStructurePanel.test.ts packages/designer/src/composables/useDragDrop.test.ts` passed (43 tests). Risk: legacy presentation layout still intentionally exists outside the Session and continues to inform existing write paths; G2 and G6 own its later removal. Next: verify canonical import/export rejection stability and then run the declared ordered repository verification.
- 2026-08-16: Slice `import/export stability` completed. Added a direct Authoring Engine test for rejected import state stability; no production import/export behavior changed. Directed verification: `pnpm exec vitest run packages/designer/src/authoring/create-authoring-engine.test.ts packages/designer/src/factory.test.ts packages/designer/src/session/next-designer-session-adapter.test.ts` passed (38 tests), proving JSON-safe exports and a rejected import leaves the current canonical snapshot and history intact. Risk: none beyond the preserved later-Gate presentation/write dependencies noted above. Next: run focused Core/Designer session verification, then the full repository sequence in its declared order.
- 2026-08-16: G1 final evidence. Focused Core/Designer verification passed: `pnpm exec vitest run packages/core/src/resolver/resolve-schema.test.ts packages/designer/src/authoring/create-authoring-engine.test.ts packages/designer/src/session/next-designer-session-adapter.test.ts packages/designer/src/components/DcStructurePanel.test.ts packages/designer/src/composables/useDragDrop.test.ts packages/designer/src/factory.test.ts` (67 tests). Final ordered repository verification passed on the completed worktree: `pnpm build`; `pnpm lint` (including public-boundary and inventory checks); `pnpm typecheck`; `pnpm test`; `pnpm test:browser` (32/32; Playwright `.last-run.json` status `passed`). `git diff --check` passed. Exit 1: Session schema reads are canonical `DocumentSchema` snapshots or rejected state, with rejected import snapshot/history stability covered directly. Exit 2: Session contract tests prove no `resolvePresentation`, `resolveContainer`, or `resolveDestination` projection; Session owner/index reads are canonical resolver sequences. Exit 3: focused, repository, and browser verification pass while the Authoring Engine remains the single document/history source. Manual acceptance: none. G1 is `passed`; G2 is activated, not started in this Goal.

### G2: Authoring and Structural Operations

- 2026-08-16: initialized as `planned`; G1 pending and no implementation evidence.
- 2026-08-16: activated after G1 passed; not started in this Goal.

### G3: Node Interaction and Geometry

- 2026-08-16: initialized as `planned`; G2 pending and no implementation evidence.

### G4: Container Region Cutover

- 2026-08-16: initialized as `planned`; G3 pending and no implementation evidence.

### G5: Root Surface Cutover

- 2026-08-16: initialized as `planned`; G4 pending and no implementation evidence.

### G6: PresentationFrame and Surface Geometry

- 2026-08-16: initialized as `planned`; G5 pending and no implementation evidence.

### G7: Public and External Consumer Boundary

- 2026-08-16: initialized as `planned`; G6 pending and no implementation evidence.

### G8: Conformance and Product Evidence

- 2026-08-16: initialized as `planned`; G7 pending and no implementation evidence.

### G9: Legacy Deletion and Closeout

- 2026-08-16: initialized as `planned`; G8 pending and no implementation evidence.
