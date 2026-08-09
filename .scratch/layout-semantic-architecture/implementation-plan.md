# 下一代布局语义架构实施计划

Status: active

本计划是 [下一代布局语义架构](map.md) 的唯一实施入口。它取代此前“先建设全部新模块，再整体切换 Workbench 和 Renderer”的实施方式；实现必须按本文的 gate 顺序推进，任何 gate 未关闭时不得开始后续 gate。

## Outcome

在保持现有 Designer 可观察交互的前提下，把运行链路逐步收敛为：

```text
Designer UI / Presentation
          |
    DesignerSession
          |
    Authoring Engine
          |
      Schema Editor
          |
     DocumentSchema
```

最终结果只保留新 `DocumentSchema`、Schema Structure Resolver、Schema Editor、Authoring Engine、Designer 内部 Presentation 和单一 `MaterialDefinition[]` 注册面；删除旧 Engine、Command、Registry、LayoutPlan、Renderer package 和 Widgets package。

本计划不实现旧 Schema 数据迁移、公共兼容 alias、双读、双写、生产 Runtime renderer 或递归容器。

## Previous Failure

失败分支证明了纯 Core 模块不是主要风险，真正失控的是集成切换：

- Resolver 和 Schema Editor 已分别通过独立红绿测试，说明纯模块方向可行。
- `11d205e` 一次切换 50 个文件，修改约 `+1823/-5068` 行，把 Canvas、Structure、Property、drag/drop、public interface 和 Presentation 混在同一提交。
- `ec09166` 随后一次删除 127 个文件、约 2 万行旧实现，使交互偏差失去 seam 级回退点。
- Phase 0 明确记录 Playground baseline 尚未由人确认，但实现仍推进到 Phase 7。
- 最终偏差集中在 Container Owner selection entry、preview input mask、toolbar action resolution、drop feedback 和 Frame 几何，说明失败发生在交互保真和切换顺序，而不是 Schema 算法。

本轮因此采用相反顺序：先让旧系统完整通过最终 `DesignerSession` interface 运行，再接入新 Core；先切读取和写入，再切 Presentation；先证明新实现通过同一基线，再删除旧实现。

## Non-Negotiable Rules

1. **一个状态源**：任一 Designer 实例只能有一个 Document、一个 history 和一个 active backend。
2. **一个 active implementation**：每个交互切片只能由旧或新实现中的一个处理，禁止双渲染、shadow write、事件复制和结果择优。
3. **backend 生命周期不可变**：backend 在 Designer 实例创建时确定，不支持已挂载实例从 Legacy 热切到 Next。开发期对照使用两个分别创建、分别运行的实例。
4. **不迁移旧 Schema**：Legacy 实例只读取旧 Schema；Next 实例只读取新 `DocumentSchema`。产品模板和示例在代码切换前离线重写，不提供运行时转换器。
5. **seam 级回退**：回退整个调用簇或 Presentation 簇，不在簇内部混搭新旧行为。
6. **闸门先于进度**：directed tests、完整 smoke、人工验收或仓库 gate 任一未通过，都必须停止在当前 gate。
7. **行为替换与删除分离**：实现切换的提交不得删除旧实现；物理删除只发生在最终独立清理提交。
8. **interface 不泄漏旧实现**：`DesignerSession` 不公开旧 Engine、Store、Registry、Command、LayoutPlan、Core operation 或 Renderer context。
9. **公共面最后切换**：内部 session 和 Next backend 通过完整基线前，不修改公开 `createDesigner()` 的输入契约。
10. **不顺手重做 UI**：视觉、交互、文案和键盘行为仅在基线证明现有行为本身有缺陷时才改变，并单独决策。

## Cutover Model

`DesignerSession` 是最终内部 seam，不是兼容 facade：

```text
                       +------------------------------+
                       | Designer UI / old Renderer   |
                       +--------------+---------------+
                                      |
                              DesignerSession
                               /             \
              Legacy Adapter /               \ Next Adapter
                            /                   \
        old Engine / old Schema          Authoring Engine
                                             |
                                         Schema Editor
                                             |
                                        DocumentSchema
```

`DesignerSession` interface 只包含四类知识：

- Document 查询：节点、owner、root/Region 顺序、容器事实和 diagnostics。
- Material 查询：设计态 presentation 与 authoring capability。
- Session 状态：selection、hover、drag、history 和 host-owned 状态引用。
- 写入入口：`evaluate(action)` 与 `execute(action)`。

Legacy Adapter 将这些 interface 调用映射到旧 Engine；Next Adapter 将同样的 interface 映射到新 Authoring Engine。UI 和测试只跨这个 seam，不了解 Adapter 的实现。

开发期可以存在两个 Adapter，但同一个实例只能选择一个。对照测试通过两次独立启动执行同一语义场景，不在运行时比较或同步两份状态。最终 public cutover 是实例创建路径的代码切换，不是用户会话中的热切换。

## Evidence Protocol

每个 PR 必须在描述中给出五项证据，不另建路线图或进度文档：

1. **Entry state**：前一 gate 已关闭的链接或测试结果。
2. **Owned slice**：本 PR 唯一替换的调用簇或 Presentation 簇。
3. **Directed verification**：该簇的 module/component/browser 测试。
4. **Full verification**：完整 smoke 和仓库 gate。
5. **Rollback**：可以切回或 revert 的唯一 seam。

仓库 gate 始终按以下顺序运行：

```text
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
```

`pnpm test:browser` 在 Gate 0 添加，只验证稳定行为，不做像素截图相等或浏览器几何 conformance。真实视觉质量、设备裁剪边缘和难以稳定自动化的几何仍由人工验收。

出现以下任一信号时必须重新切片，不得继续扩大 PR：

- 同时修改两个以上交互耦合簇。
- 同时修改读取 seam、写入 seam 和 Presentation。
- 行为替换与旧文件删除出现在同一 PR。
- 生产文件超过约 15 个或 diff 超过约 1000 行，且无法用一个 interface 测试面解释。
- 为了迁移一个调用方，需要把旧 Engine 类型加入 `DesignerSession`。
- 只能用近似 UI 或删掉旧测试才能让新实现通过。

文件数和行数是重新审视切片的警报，不是机械 KPI；真正判断标准是一个 PR 是否只有一个可回退 seam。

## Gate Overview

```text
G0  Baseline is executable
 |
G1  Legacy reads through DesignerSession
 |
G2  Legacy writes through DesignerSession
 |
G3  Pure Next foundation restored and verified
 |
G4  NextDesignerSession passes shared contracts
 |
G5  Next backend passes existing UI in a dev-only harness
 |
G6  Public/backend cutover to Next
 |
G7  Presentation slices 3-6 replaced one by one
 |
G8  Product consumers and public contract finalized
 |
G9  Deletion gate and independent cleanup commit
```

每个 gate 的 Exit 是下一 gate 的唯一解锁条件。

## G0: Executable Baseline

### Purpose

把当前 `main`/`refactor-r1` 上已经工作的 Designer 行为变成每次切换都能重复执行的硬闸门。G0 不改变生产行为。

### Work

1. 先单独提交 map、decision ticket 和本计划的整理结果。
2. 记录当前 `pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test` 结果；任何既有失败必须先解释并修复，不能作为重构噪音带入后续 gate。
3. 为 Playground 增加 Chromium 行为 smoke 和 `pnpm test:browser`：
   - 空画布、默认容器和唯一 application scrollport。
   - Root ordinary selection、纵向 toolbar 和 preview input mask。
   - Container Owner 外部 selection entry。
   - Region child selection、横向 toolbar 和 Region 排序。
   - material 创建、root/Region move、before/after/start/end/forbidden feedback。
   - Structure/Canvas selection 同步和属性更新。
   - 一次交互一次 history commit、undo/redo 和 redo 分支裁剪。
   - pointer/hand、Space hand、pan/reset、Frame 切换和滚动。
4. 使用稳定 `data-dc-*` hook 和可观察 Schema/state 断言；不依赖内部组件名或完整 DOM 快照。
5. 人工跑通三个现有 Playground 模板，确认 toolbar、selection、drag feedback、Frame 裁剪、scroll 和 pan 的视觉质量。

### Exit

- 十类交互场景都有 module、component 或 browser owner；关键路径不存在“只靠以后人工看看”的空白。
- 完整仓库 gate 和 `pnpm test:browser` 通过。
- 人工基线明确记录为 passed；不允许 `awaiting confirmation`。
- 本 gate 的 diff 不包含生产行为改变。

### Stop

任何关键场景无法稳定复现时停在 G0，先改进 test hook 或场景隔离；不得进入 `DesignerSession` 实现。

## G1: Legacy Read Cutover

### Purpose

建立最终 `DesignerSession` seam，让所有 UI 和旧 Renderer 的读取逐簇离开旧 Engine，但仍由 Legacy Adapter 提供同一旧状态源。DOM、CSS、geometry 和写入行为保持不变。

### PR Sequence

1. **G1.1 Interface and Legacy Adapter**
   - 新增内部 `DesignerSession` interface、`LegacyDesignerSessionAdapter` 和 shared contract harness。
   - Adapter 是唯一允许读取旧 Store、State、Registry、LayoutPlan 和 ContainerPlan 的新 module。
   - 此 PR 不迁移生产调用方，不改变公开 `DesignerInstance`。
2. **G1.2 History tracer**
   - 只迁移 Canvas undo/redo 的 `canUndo/canRedo` 响应式读取；按钮和键盘写入仍走旧路径，留给 G2。
   - 这是第一个最小 tracer：证明 UI 可以跨 session seam 订阅状态，而不改变任何 mutation path。
3. **G1.3 Selection and hover reads**
   - 迁移 Canvas clear selection、Structure selected state、Property selection watch 和 Renderer node state。
   - selection hook 的 before/after 语义不变。
4. **G1.4 Document and material reads**
   - 迁移 Structure tree、Property binding、Material panel 的 node/owner/order/container/material/capability 查询。
   - UI 不再自行调用 `createLayoutPlan()`、`createContainerPlan()`、`resolveNodeLayout()` 或 registry。
5. **G1.5 Drag session reads**
   - 迁移 drag target、active destination、forbidden reason 和 drop feedback 的只读状态。
6. **G1.6 Renderer read projection**
   - `RootRenderer`、`WidgetRenderer`、`ContainerRegionOutlet` 和 renderer composables 只读取 `DesignerSession` projection。
   - 保持旧 Renderer DOM、CSS、事件和几何实现。

### Exit

- Designer components、composables 和 Renderer 不直接读取旧 Engine/Store/Registry/LayoutPlan；所有例外只存在于 Legacy Adapter 内。
- 空画布、Root ordinary、Container Owner、Region child 的 DOM 和可观察行为通过完整基线。
- Legacy Adapter contract tests 覆盖 Document、Material、Session state 和 history projection。
- 旧 Engine 仍是唯一运行状态源，未引入新 Schema 或新 Authoring Engine。

### Rollback

每个 PR 只回退该调用簇到旧读取路径；不得保留两条同时执行的读取路径。

## G2: Legacy Write Cutover

### Purpose

让现有 UI 的所有写入都使用最终 `evaluate(action)` / `execute(action)` interface，由 Legacy Adapter 翻译为旧 Command。Renderer DOM 与几何仍保持旧实现。

### PR Sequence

1. 定义封闭的 `AuthoringAction`、decision 和 execution result；UI 不构造旧 Command 或 Core operation。
2. 迁移 undo/redo 按钮与键盘快捷键，再迁移 selection/hover/clear 等 session action。
3. 迁移 node/page/global property update。
4. 迁移 toolbar 和 Structure tree 的 move、duplicate、delete、variant 与 custom action projection。
5. 迁移 material create 和 root/Region drag/drop。
6. 迁移 import/export、template switch 和 host confirmation coordination。

### Exit

- UI 只通过 `DesignerSession` 查询和写入；`DesignerContext` 不再暴露 `engine`。
- 一次交互最多一次 history commit；rejected/unchanged 不进 history；undo 后提交裁剪 redo 分支。
- action visible/disabled、confirmation、event hook 和错误反馈与基线一致。
- 静态检查禁止 Designer/Renderer 调用旧 Engine、CommandBus、Registry 或 Store；Legacy Adapter 是唯一 allowlist。
- 完整 smoke 和仓库 gate 通过。

### Stop

如果 Legacy Adapter 必须模拟完整旧 Engine interface，说明 `DesignerSession` 太浅或调用簇没有收拢；停止并缩小 interface，不得把旧 Engine 类型泄漏给 UI。

## G3: Pure Next Foundation

### Purpose

在 UI 已与旧 Engine 解耦后恢复新 Core，避免再次出现“新模块长期旁置、最终整体接线”的局面。G3 只增加纯模块，不切换 runtime。

### Reuse Policy

失败分支只作为实现参考，不直接 cherry-pick 大提交：

- 可审计恢复 `d7e3dff` 的 Document/Resolver module 和测试。
- 可审计恢复 `7b5df1e` 的 Schema Editor module 和测试。
- `51db444` 只复用 Material Catalog、Authoring Engine 和 history 的领域逻辑；其 session/public 接线按当前 `DesignerSession` 重写。
- `3ef3ac1`、`56e7ff3`、`11d205e`、`ec09166` 的 Presentation、整体 cutover 和删除策略只作反例或行为参考，不直接移植。

### PR Sequence

1. `DocumentSchema`、JSON inspection、definition snapshot、Resolver 和 `ResolvedDocument`。
2. Schema Operation、NodeBundle、Structural Destination 和 Schema Editor。
3. Material Catalog 的纯投影与配置校验。
4. Authoring Engine、Policy 和 bounded history，不连接生产 UI。

### Exit

- Resolver 四态、diagnostic budget/order、input isolation 和一层容器约束通过 table/property tests。
- Editor 的 committed/unchanged/rejected、原子 batch、anchor resolution 和引用不变量通过测试。
- Core source 与 manifest 不依赖 Vue，且不使用 `structuredClone`。
- 新模块只通过最终 interface 测试；生产实例仍只创建 Legacy Adapter。
- 完整仓库 gate 通过。

## G4: NextDesignerSession Contract

### Purpose

实现 `NextDesignerSessionAdapter`，先在无 UI 环境下证明新 backend 满足与 Legacy 相同的语义 interface。

### Work

1. 将 Material Catalog、Resolver、Authoring Engine 和 host-owned state 组合成 Next Adapter。
2. 复用 G1 的 shared contract harness；测试场景相同，但 Legacy 和 Next 使用各自原生 Schema fixture。
3. Contract 比较语义观察值，不比较两种 Schema 的对象形状：
   - node identity、owner 和 owner order。
   - selection/hover repair。
   - action decision 与结果状态。
   - history commit count、undo/redo 和 branch truncation。
   - unknown、conflicted、headless 和 container recovery。
4. 证明 export 是与内部快照隔离、可 JSON round-trip 的纯数据。

### Exit

- Legacy 和 Next 分别通过同一套 `DesignerSession` contract scenarios。
- 测试中可以分别创建两个 Adapter，但不存在同步器、转换器、双写或 runtime shadow comparison。
- Next Adapter 不依赖旧 Engine、Registry、Command 或 LayoutPlan。
- 生产 `createDesigner()` 仍默认创建 Legacy Adapter。

## G5: Next UI Harness

### Purpose

在改变公共 interface 前，让 Next backend 驱动现有 Workbench 和旧 Renderer，并跑通 G0 的完整交互基线。

### Work

1. 增加仅存在于重构分支和开发环境的 backend selector；每次页面加载只创建 Legacy 或 Next 一个实例。
2. 为三个 Playground 场景准备最终 `MaterialDefinition[]` 和 `DocumentSchema` fixture；可暂时与旧 fixture 同文件存在，但不能同时注册或运行。
3. 让旧 Renderer 通过 G1 的 session projection 解释 Next document/material facts；不创建新 Presentation。
4. 分别以 Legacy 和 Next 启动完整 browser smoke，比较同一用户操作后的语义结果和可观察交互。
5. 人工分别验收三个模板；Next 的任何近似交互都视为失败。

### Exit

- Next backend 使用现有 DOM、CSS 和 geometry 通过十类场景、完整 smoke 和人工验收。
- toolbar action、mask/direct-hit、Container Owner handle、Region drop 和 Frame 行为没有偏差。
- dev selector 不进入 public interface，不允许 mounted instance 热切换。
- 所有 workspace consumer 都已有新 material/schema fixture，public cutover 不再需要临时设计这些数据。

### Stop

如果旧 Renderer 无法仅通过 session projection 表达某个 Next 语义，先判断缺的是最终 `DesignerSession` interface 还是 Presentation 职责。不得恢复旧 Schema 字段或把 LayoutPlan 塞进新 Schema。

## G6: Backend And Public Cutover

### Purpose

把唯一生产实例创建路径从 Legacy 切到 Next；由于 G5 已完成 fixture 和 UI 验证，本 gate 只改变 wiring 和公共契约，不重写 Presentation。

### PR Sequence

1. 切换内部 factory 默认创建 Next Adapter，删除 dev backend selector 的生产入口。
2. 将公开 `createDesigner()` 固定为 `{ schema?, materials, ... }`，更新 public allowlist 和 consumer fixture。
3. 切换 Playground 与 Guide Project 到已准备的新 Schema/material fixture。
4. 保留 Legacy Adapter 和旧 packages 作为 seam 级代码回退，但确保没有默认运行时调用方。

### Exit

- 所有生产和 workspace consumer 只创建 Next Adapter。
- UI 仍使用旧 Renderer DOM/CSS/geometry，但 document、history 和 writes 全部来自 Next backend。
- Public consumer 只能导入允许的 Designer、Device Frames 和 field adapter interface。
- 导入导出、template switch、locale、host confirmation 和自主生产 Runtime 示例通过。
- 完整 smoke、人工验收和仓库 gate 通过。

### Rollback

只在 factory seam 将实例创建路径回退到 Legacy，并同时回退对应 consumer wiring；不转换正在运行的实例或其 history。

## G7: Presentation Replacement

### Purpose

在 Next backend 已稳定后，按交互耦合簇逐步把旧 Renderer implementation 移入 Designer 内部 Presentation。每个 PR 只替换一个簇，旧实现文件保留到 G9。

### G7.1 Node Interaction Cluster

一起替换 NodeHost、mask/direct-hit policy、hover entry、selection projection、toolbar、node geometry 和 root-owned/Region-child 策略。

Exit：root-segment 与 material-bounds、Container Owner 外部 selection entry、toolbar orientation、masked/unmasked/self-positioned/container input、action visible/disabled 全部通过。

### G7.2 Container Region Cluster

一起替换 Region Outlet、child order、empty Region、drop geometry、forbidden、unresolved/recovery container 和 material runtime context。

Exit：empty/active/forbidden/recovery 互斥；Region drop 不冒泡成 root drop；root/Region move 和排序正确；失配容器不吞 children。

### G7.3 Root Surface Cluster

一起替换 root document plane、root destination、start/end/before/after feedback、empty canvas、唯一 application scrollport 和 selection plane mount。

Exit：root/Region target 互斥；scroll 后重测；无重复渲染、节点丢失或第二滚动条。

### G7.4 Frame And Geometry Cluster

最后替换 Application Surface、Presentation Frame、Device Frame clip、Surface Reservation、Geometry Registry、pan/reset 和 viewport plane。

Exit：Frame 只裁剪 business preview；Designer feedback 不被裁剪；Frame 切换、safe area、reservation 和 Cutover Fence 符合基线。

### Gate Exit

- G7.1 到 G7.4 每簇分别通过 directed tests、完整 smoke、人工模板验收和仓库 gate。
- Designer 是 Presentation 的唯一 owner；没有生产调用方 import Renderer interface 或 stylesheet。
- 旧 Renderer 文件仍存在但没有 active runtime caller。

## G8: Product And Public Finalization

### Purpose

在删除旧实现前证明最终产品、文档和发布面只描述并使用新体系。

### Work

1. 完成三个 Playground 模板：电商首页、内容详情、商品详情，以及一个真实 Headless material。
2. 完成 Guide Project 的最小/完整 Designer、Schema round-trip 和自主生产 Runtime 示例。
3. 合并 Renderer 必需结构 CSS 到 Designer，验证 `standard.css`、`structure.css`、theme contract 和 CSS custom data。
4. 更新 `.github/architecture`、公开 docs、README、examples 和 skills，只描述新 Schema、Material、Session 和 Presentation。
5. 增加 obsolete protocol denylist，但此 gate 不物理删除旧文件。

### Exit

- 产品模板、恢复状态、CSS、package exports、public consumer fixture 和 docs 全部通过。
- source/docs 搜索除 `.scratch` 历史外不再出现旧公共协议。
- Legacy Adapter、Renderer 和 Widgets 没有运行时调用方。
- G9 的六组删除证据全部可提供。

## G9: Deletion Gate

### Purpose

只在 [何时允许删除旧 Renderer](issues/15-renderer-deletion-gate.md) 的六组证据同时满足后，进行一次独立、无行为变化的物理清理。

### Work

1. 删除 Legacy Adapter、旧 Engine/Command/Registry/LayoutPlan 和实现耦合测试。
2. 删除 Renderer 和 Widgets packages、workspace 入口、dependencies、exports 和 lockfile 条目。
3. 删除旧 CSS、旧 public types、临时 fixture、dev selector 和 allowlist 例外。
4. 保留已经迁移到新 interface 测试面的行为覆盖。

### Exit

- 清理提交不包含新交互行为或偏差修复，可以独立审查和 revert。
- Core 无 Vue dependency；Designer 不依赖 Renderer 或 Widgets。
- 完整仓库 gate、browser smoke、三个模板人工验收全部通过。
- source、docs、examples、playground、workspace 和 lockfile 中不存在 active 旧协议。

## Current Execution State

| Gate | Status | Unlock evidence |
| --- | --- | --- |
| G0 Executable Baseline | passed | `pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:browser` 通过；Chromium 基线 14/14；三个 Playground 模板人工验收通过 |
| G1 Legacy Read Cutover | passed | Renderer session projection、DesignerSession 读取迁移完成；Legacy Adapter 是生产旧读取唯一 allowlist；directed tests Designer 113/113、Renderer 187/187；完整仓库 gate 和 Chromium 14/14 通过 |
| G2 Legacy Write Cutover | passed | 所有 Designer/Renderer 写入经 `DesignerSession.execute(action)`；Legacy Adapter 是旧运行时调用唯一 allowlist；directed tests 5/5；`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`（Core 346、Renderer 187、Designer 115）和 Chromium 14/14 通过 |
| G3 Pure Next Foundation | passed | Resolver 27/27、Schema Editor 38/38、Material Catalog 12/12、Authoring Engine 20/20；Core 不依赖 Vue/`structuredClone`；生产 factory 仍只创建 Legacy Adapter；`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:browser`（Chromium 14/14）通过 |
| G4 NextDesignerSession Contract | passed | Legacy/Next shared DesignerSession contract；Next action translation、recovery、export isolation；Designer directed 155/155；`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:browser`（Chromium 14/14）通过 |
| G5 Next UI Harness | passed | dev-only Next selector 与三个最终 Playground fixture；Next/Legacy 分别通过 14 个交互基线、Next harness 3/3（Chromium 31/31）；`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test` 通过；三个模板人工验收通过 |
| G6 Backend/Public Cutover | passed | Next backend 已作为唯一生产实例；容器完整 NodeBundle 创建与非 flow Region 拒绝回归已关闭；`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:browser`（Chromium 25/25）通过；Playground 与 Guide Project 人工验收通过 |
| G7 Presentation Replacement | passed | Node Interaction、Container Region、Root Surface 与 Frame/Geometry clusters 已完成；Device Frame root selection plane 外扩及四边等宽（3px）浏览器回归已覆盖；Designer 无生产 Renderer interface 或 stylesheet import，旧 Renderer 无 active runtime caller；`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:browser`（Chromium 26/26）通过；三个 Playground 模板人工验收通过 |
| G8 Product/Public Finalization | pending | G7 Exit 已满足 |
| G9 Deletion Gate | blocked | G8 Exit and six deletion evidence groups |

状态只能按 `blocked -> pending -> in progress -> passed` 前进。若已通过 gate 的基线因后续改动回归，当前 gate 立即重新变为 blocked，直到回归关闭。

## Definition Of Done

重构只有在以下条件同时满足时完成：

- Designer UI 和 Presentation 只依赖 `DesignerSession`。
- 唯一 active backend 是新 Authoring Engine + Schema Editor + `DocumentSchema`。
- 十类交互场景在 module、component、browser 和人工验收层面通过。
- 三个产品模板、Guide Project、公共消费者和自主 Runtime 示例通过。
- 旧 Engine、Renderer、Widgets、LayoutPlan、Command、Registry、旧 Schema 和所有临时 Adapter 已删除。
- `pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:browser` 全部通过。
- 最终依赖图与 map 决策一致，不存在兼容层、双读、双写或第二套 active implementation。
