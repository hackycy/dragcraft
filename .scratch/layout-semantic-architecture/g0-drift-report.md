# G0 Drift Report

## Baseline

- Source commit: `85b4624ce5addfb01b39ec81c9056511601d7e54`
- Inventory command: `pnpm check:obsolete-protocol`
- Inventory artifact: `g0-obsolete-protocol-inventory.txt`
- Inventory SHA-256: `30083270410bbdfc92b8fb4445e2f5338f4db380e46820b9f99bde2749367bf0`
- Scope: Designer/Core source and exports, docs, architecture docs, examples, Playground, manifests, skills, scripts, and contract tests. `.scratch`, `dist`, `node_modules`, and VitePress cache output are excluded.

The artifact names every finding as `path:line [Gate] identifier`. It contains 468 prohibited Dragcraft findings and 101 permitted local external-runtime findings. The latter are restricted to `examples/guide-project/src/runtime/`; they are recorded for G7 boundary review but are not a shared Dragcraft protocol.

## Assignment

| Gate | Inventory surfaces | Decision sources | Assigned work |
| --- | --- | --- | --- |
| G1 | Core and Designer session document/read projection | 01, 03, 08, 13, 14 | Remove legacy session/layout reads while establishing canonical schema and private structural queries. |
| G3 | NodeHost and node interaction geometry | 06, 09, 11, 14 | Replace placement-dependent node interaction behavior. |
| G5 | ApplicationSurface, CanvasSurface, and root presentation context | 06, 09, 11, 14 | Remove root `LayoutPlan`/flow/chrome/layer distribution. |
| G6 | Designer material types, presentation geometry, CSS, Device Frame, and related components | 06, 08, 09, 11, 14 | Remove material placement categories and make Frame/mount-plane geometry private. |
| G7 | Public exports, docs, skills, examples, Playground source, and permitted Guide Project runtime policy | 02, 05, 08, 10, 15 | Publish only schema/type/Frame semantics; keep external presentation local. |
| G8 | Component and browser baseline tests | 09, 11, 15 | Replace old protocol assertions with conformance and behavior evidence after owning cutovers. |

No current finding is assigned to G2, G4, or G9: their future checks will receive findings only when their owning write, region, or cleanup surfaces are introduced. This baseline does not authorize changes in those Gates.

## Strict Policy

`node scripts/check-obsolete-protocol.mjs --strict` must fail whenever any prohibited finding exists. Inventory mode remains non-failing so G0 can record the baseline. Approved names (`PresentationFrame`, `SurfaceReservation`, and `GeometryRegistry`) are not forbidden; explicit local runtime policy is reported as permitted rather than hidden.
