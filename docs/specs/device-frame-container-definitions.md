# Device Frame 容器定义与宿主切换规范

## Problem Statement

业务应用需要改变 Designer 画布的设备外形，并由宿主决定当前使用哪一个设备容器。设备外形包括尺寸、边框、圆角、状态栏、刘海、系统导航和桌面浏览器标题栏，但不应负责解释页面 Schema、划分业务布局或渲染业务节点。

当前实现把设备目录、当前设备状态和切换行为集中在 device-frames package 内，通过 Device Frame Context、Vue provide/inject 和一个负责二次分发的 Device Frame Shell 完成切换。同时，Renderer 的 container shell interface 向设备外壳暴露 LayoutPlan、region VNode、chrome VNode、layer VNode、选择平面和禁止层等内部职责。结果是设备外壳不再是单纯的视觉容器，宿主也无法直接持有和切换稳定的设备容器定义。

需要重新明确以下领域术语：

- **设备容器定义**：device-frames package 稳定导出的只读目录项，包含设备 ID、展示元数据、viewport 尺寸和容器外壳。
- **容器外壳**：无状态 Vue adapter，只负责设备外形并渲染一次 default slot。
- **画布 Surface**：Renderer 拥有的内部深模块，负责 flow、region、chrome、layer、滚动、inset、空态和选择平面。
- **宿主**：集成 Designer 的业务应用，拥有当前设备选择状态和切换策略。

## Solution

device-frames package 只稳定导出每个内置设备容器定义以及一个有序只读集合。它不拥有当前设备状态，不提供设备切换 controller，也不要求 Vue provide/inject。

宿主持有当前设备容器定义或当前容器外壳的响应式引用。Renderer 的 container shell extension seam 同时接受静态容器外壳和只读响应式容器外壳。宿主更新该引用后，现有 Designer 实例响应式切换外形，不需要重新创建 Designer、Engine 或 Schema。

Renderer 在容器外壳的 default slot 中提供已经完成布局分区的完整画布 Surface。容器外壳只决定 slot 位于外形中的位置，不接收或解释 LayoutPlan、region、chrome、layer、selection presentation、registry、surface style 或 forbidden overlay。

Renderer 继续拥有容器外壳之外的稳定交互结构，包括根级选择呈现、禁止层和画布工具栏定位语义。设备切换可以重新挂载容器外壳及其 slot 子树；保留 shell 内部滚动位置和 widget 本地 Vue 状态不属于本规范的保证。

Device Picker 保持为公开的可选视图，但改为完全受控。它接收设备容器定义集合和当前设备 ID，并只发出选择事件。宿主决定是否更新当前设备，以及如何持久化、授权或同步该状态。

## User Stories

1. As a Designer integrator, I want to import an individual iPhone device container definition, so that I can use it without creating package-owned state.
2. As a Designer integrator, I want to import an individual Android device container definition, so that I can choose only the device appearances my product supports.
3. As a Designer integrator, I want an ordered readonly collection of built-in device container definitions, so that I can build a selector without reconstructing the catalog.
4. As a Designer integrator, I want each definition to expose stable identity and display metadata, so that my controls can render labels and icons consistently.
5. As a Designer integrator, I want each definition to expose its usable viewport width and height, so that I can inspect and present device dimensions without mounting the container.
6. As a host application developer, I want to own the active device definition in my own reactive state, so that switching follows my product state model.
7. As a host application developer, I want to switch the active container without recreating the Designer instance, so that Engine state, Schema and history remain intact.
8. As a host application developer, I want to switch containers from any product control, so that I am not coupled to the built-in Device Picker.
9. As a host application developer, I want different Designer instances to use independent active-container refs, so that multiple editors on one page do not share device state.
10. As a host application developer, I want to initialize the Designer with a static container when switching is unnecessary, so that the simplest integration remains concise.
11. As a host application developer, I want to use a readonly reactive container source when switching is required, so that consumers cannot mutate Renderer-owned configuration accidentally.
12. As a custom device author, I want to implement a container that only renders a default slot, so that I do not need to understand the Renderer layout system.
13. As a custom device author, I want to place visual chrome before, after or around the default slot, so that I can represent phones, tablets, browsers and product-specific preview frames.
14. As a custom device author, I want to control border, radius, shadow and system chrome with package-owned DOM and CSS, so that the device appearance remains self-contained.
15. As a custom device author, I want to declare an open string ID, so that custom devices are not restricted by a closed built-in union.
16. As a custom device author, I want my definition to participate in host selectors alongside built-in definitions, so that custom and built-in appearances use the same interface.
17. As a Renderer maintainer, I want flow and region rendering to remain inside the canvas Surface, so that every container receives the same resolved business content.
18. As a Renderer maintainer, I want fixed, sticky and flow chrome rendering to remain inside the canvas Surface, so that an outer appearance cannot reinterpret business placement.
19. As a Renderer maintainer, I want layer positioning and inset measurement to remain inside the canvas Surface, so that switching appearance does not duplicate layout algorithms.
20. As a Renderer maintainer, I want content and viewport selection planes to remain Renderer-owned, so that custom containers cannot accidentally break selection projection.
21. As a Renderer maintainer, I want the root selection presentation to remain outside the custom container interface, so that root highlighting does not require private marker properties.
22. As a Renderer maintainer, I want the forbidden overlay to remain Renderer-owned, so that custom containers cannot render it twice or omit it.
23. As a Renderer maintainer, I want empty-state rendering to remain part of the complete canvas Surface, so that a container only needs to render its slot once.
24. As a Renderer maintainer, I want surface styles to be applied before the canvas Surface reaches the container slot, so that custom containers never need to interpret the style DSL.
25. As a Designer user, I want the selected device appearance to update immediately after a host switch, so that the preview reflects my selection without a page reload.
26. As a Designer user, I want the same Schema content to appear after switching devices, so that changing preview appearance does not modify my page.
27. As a Designer user, I want a newly selected container to be centered according to existing canvas behavior, so that a differently sized device remains discoverable.
28. As a Designer user, I want device-specific system chrome to remain outside business layout semantics, so that a device status bar is not confused with a Schema chrome node.
29. As a Device Picker user, I want the picker to reflect the host-provided current ID, so that it remains synchronized with switches made elsewhere.
30. As a Device Picker user, I want the picker to emit a requested device ID without mutating hidden state, so that the host can accept, reject or transform the request.
31. As a Device Picker user, I want custom definitions to appear from provided metadata rather than hard-coded ID groups, so that the picker remains open to extension.
32. As a package consumer, I want device definitions to remain readonly and reference-stable, so that equality checks and memoized derived state are reliable.
33. As a package consumer, I want invalid built-in dimensions and duplicate built-in IDs to fail package tests, so that the exported catalog is trustworthy.
34. As a package maintainer, I want public documentation to show host-owned switching, so that consumers do not recreate the removed context/router architecture.
35. As a package maintainer, I want public examples and the playground to use only public entry packages, so that the documented integration respects the repository package boundary.
36. As a test author, I want to verify switching through RootRenderer's public extension behavior, so that tests survive internal canvas Surface refactors.

## Implementation Decisions

- The primary and only external seam affected by this design is Renderer extensions' container shell field. No device-specific switching seam will be added to Designer or Renderer.
- The container shell field will accept either a static Vue component or a readonly Vue ref whose current value is a Vue component. Renderer will resolve refs explicitly so functional Vue components are not mistaken for getters.
- A static container remains the default integration. Reactive switching is opt-in by passing a readonly ref.
- Renderer will own a stable outer frame boundary around the selected container. This boundary will own root selection presentation, forbidden-overlay placement, toolbar-boundary semantics and any Renderer-required fallback behavior.
- Renderer will introduce or consolidate an internal canvas Surface module. It will consume the resolved LayoutPlan and all Renderer-created VNodes, then render flow regions, fixed/sticky/flow chrome, layers, scroll behavior, inset variables, empty state, surface style and content/viewport selection planes.
- The selected container shell will receive the complete canvas Surface only through its default slot. It must render that slot exactly once.
- The public container shell interface will no longer include LayoutPlan, region VNodes, chrome VNodes, layer VNodes, registry, selection presentation, surface style, empty state or forbidden overlay.
- The hidden component capability marker used to report forbidden-overlay handling will be removed. Renderer will no longer infer behavioral capabilities from properties attached to Vue component objects.
- DefaultContainerShell will become a normal adapter at the same slot-only seam used by device containers. It will not retain a privileged layout protocol.
- Each built-in device will be represented by a readonly Device Frame Definition with an open string ID, label, optional translation key, optional icon, positive finite viewport width and height, optional selector grouping metadata, and a container shell component.
- Individual built-in Device Frame Definition constants will be public exports. An ordered readonly collection containing the same object references will also be exported for selectors and iteration.
- Calling a factory will not be required to obtain built-in definitions. Repeated imports and collection access will observe the same definition and component references.
- Built-in container shell components will be stateless. Their dimensions and appearance will be fixed by their corresponding definition and implementation; they will not read a shared current-device context.
- Container shell implementations may set inherited CSS variables needed by the Renderer-owned canvas Surface, including safe-area variables. Setting those variables does not grant the container ownership of layout partitioning.
- Device system chrome and Schema chrome remain distinct concepts. Device status bars, cutouts, home indicators, Android navigation and browser title bars belong to the container appearance. Schema chrome remains inside the canvas Surface and follows LayoutPlan placement.
- The closed DeviceType union will be removed from the extensibility interface. Built-in IDs may still be exported as literal constants, but custom IDs are arbitrary non-empty strings.
- Package-owned current-device state, the Device Frame Context, its injection key, its consuming composable and the routing Device Frame Shell will be removed from the canonical architecture.
- This specification defines a breaking cleanup rather than a compatibility adapter. The existing state/router exports will be removed without a compatibility shim.
- Device Picker will remain public as a controlled view. It will receive definitions and a model value, emit the requested ID, and never create or mutate selection state internally.
- Picker grouping and ordering will derive from definition metadata or input order. It will not branch on a closed list of built-in device IDs.
- The host is responsible for resolving a selected ID to a definition or container component and updating its reactive ref. Invalid IDs do not cause Renderer fallback behavior because Renderer receives only an already resolved component.
- Switching the reactive container source will replace the rendered container without recreating Designer, Engine, history or Schema.
- Switching may remount the selected container and its slot subtree. Shell-local scroll state, measured DOM state and widget-local Vue state are not preserved by contract. Schema-backed state remains authoritative.
- Existing canvas centering behavior will continue to observe replacement of the rendered container and may reset pan position when the frame boundary changes.
- Device definition dimensions describe the usable business viewport. External status bars, navigation bars and browser title bars are excluded unless a definition explicitly models them as overlapping appearance.
- Device frame CSS remains self-contained and independent from the Designer workbench theme. Public customization continues through documented device tokens and semantic hooks rather than private DOM classes.
- Public architecture documentation, reference documentation, examples and playground integration will be updated when implementation lands. They will describe the implemented architecture, not retain the removed context/router data flow.

## Testing Decisions

- Tests will assert observable behavior across module interfaces. They will not assert private helper calls, private class nesting, internal computed values or the implementation shape of the canvas Surface.
- The highest test seam is RootRenderer with a container shell extension. RootRenderer tests will cover both a static component and a readonly reactive component ref.
- A switching test will render through one fake slot-only container, update the host-owned ref to a second fake container, and verify that the second appearance is visible without recreating the Engine or changing Schema.
- RootRenderer tests will verify that the complete canvas Surface is rendered exactly once inside the selected container's default slot.
- RootRenderer tests will verify that flow regions, additional regions, fixed/sticky/flow chrome and layers remain observable after switching containers.
- RootRenderer tests will verify that selection presentation, forbidden overlay and empty state remain functional with a custom slot-only container.
- RootRenderer tests will verify that a custom container does not need private capability markers or Renderer-specific props.
- Designer integration tests will verify that changing the host-owned container ref updates the mounted canvas and retains Engine schema/history state.
- Designer integration tests will verify the existing centering or pan-reset behavior when the rendered container boundary changes.
- Device frame package tests will verify that every built-in definition has a unique non-empty ID, positive finite viewport dimensions and a defined container component.
- Device frame package tests will verify that the ordered built-in collection contains the exact exported definition references in documented display order.
- Each built-in container will be mounted through the slot-only interface and tested for rendering the supplied slot exactly once together with its expected external appearance markers.
- Device container tests will not pass LayoutPlan, region, chrome, layer, selection or registry props. Requiring any of those inputs will be treated as a regression in interface depth.
- Controlled Device Picker tests will verify model-value rendering, emitted selection IDs, custom definition support and absence of package-owned selection mutation.
- Existing RootRenderer custom-shell tests, Device Frame Shell rendering tests, Device Picker tests and Designer canvas-boundary tests provide prior art. They should be replaced or rewritten at the new public seam rather than layered on top of the obsolete context/router behavior.
- Verification for the completed implementation will run package-focused tests first, followed by repository build, lint and typecheck in the required order.

## Out of Scope

- Persisting the selected device in browser storage, Schema, global configuration or backend data.
- Adding device controls to Designer's built-in canvas toolbar or sidebars.
- Defining host authorization, analytics, telemetry or product-specific switching policies.
- Preserving shell scroll position, DOM measurements or widget-local Vue state across a container component replacement.
- Changing Schema or LayoutPlan based on the selected device.
- Responsive breakpoints, device orientation switching or separate portrait/landscape definitions.
- Multi-viewport, foldable, split-screen or nested device previews.
- Production runtime rendering outside the design workbench.
- Allowing an outer device container to reinterpret flow, region, chrome or layer placement.
- Adding a second public extension seam for full canvas Surface replacement.
- Maintaining the existing provide/inject context architecture as an alternative canonical integration.

## Further Notes

- The architecture documentation now describes the implemented host-owned selection model, stable Renderer Frame Boundary, slot-only Container Shell seam and Renderer-owned Canvas Surface. The removed Device Frame Context/router model remains documented only as rejected historical context in ADR-0001 and this specification.
- The distinction between device system chrome and Schema chrome is load-bearing. Both may be visually positioned near viewport edges, but only Schema chrome participates in LayoutPlan and business content inset measurement.
- The slot-only container seam deliberately trades unrestricted layout replacement for a smaller interface. A future requirement for a fundamentally different canvas layout should be evaluated as a separate Surface extension rather than expanding device container props.
- The selected testing seam reflects the design agreed in this discussion: device-frames supplies adapters, the host supplies state, and RootRenderer is the first module that observes both the current adapter and the complete rendered canvas.
