# 下一代布局语义架构

Status: resolved
Type: map

## Destination

形成一份可直接交给后续实施规划的下一代布局架构规格：重新划分可序列化文档事实、Designer 展示策略、设计器交互与外部消费边界，明确页面与一层容器的关系、公共 Schema 契约、扩展机制以及直接替换现有体系的路径。

## Notes

- 领域：Dragcraft Schema、文档结构、Designer 展示策略、容器区域、设计器渲染与外部消费契约。
- 本地图只产出架构决策，不直接实施重构。
- 每张票使用 `grilling` 与 `domain-modeling`；涉及模块接口时使用 `codebase-design` 的 module、interface、seam、adapter、depth、locality 术语。
- 已确认约束：直接重构，不做迁移或兼容层；Schema 必须纯数据；不支持递归容器；结构顺序是默认唯一顺序；文档结构独立于空间展示；Core 结构不变量封闭；Designer 展示通过 Vue Preview 与 PresentationFrame 扩展，外部消费端自主解释 Schema；第一阶段只实现 Vue + 浏览器 Designer 宿主。
- 公共复用边界：`@dragcraft/designer` 只向生产消费端交付纯数据 Schema 的结构与 type/props 语义契约，不交付 `ResolvedDocument`、registry、Presentation Adapter 或 renderer interface。
- 生产消费边界：Dragcraft 不拥有或注册生产 renderer；Flutter、原生、Web 或其他消费端仅按纯数据 Schema 的稳定 type 与 props 自主解释和展示。
- 交互保留边界：现有 toolbar、画布拖放、结构树、选中反馈和撤销重做体验保持不变；本次重构替换其下方的 Authoring Action、Policy、Schema Operation、提交与 history 管线，不重新设计设计器交互。

## Decisions so far

<!-- Closed decision tickets will be appended here. -->

- [规范化 Schema 与布局关系模型](issues/01-canonical-schema-model.md) — 采用节点定义数组与独立文档结构，内部按需派生 ID 索引；page 不是节点，每个节点恰有一个结构 owner，容器只支持 root 下的一层稳定 region 拓扑，布局能力不进入结构模型。
- [布局能力代数与空间关系模型](issues/02-layout-capability-algebra.md) — 空间语义不持久化到 Schema；Designer 根据稳定 type 生成设计态展示，外部平台按同一纯数据 type 自主解释，不共享 renderer 或空间计划。
- [Schema 结构解析器的阶段与输出接口](issues/03-schema-structure-resolver-output.md) — 单一纯函数把未知输入和不可变定义快照解析为四态结果与模块拥有的只读文档查询模型；内部隐藏校验、索引、定义绑定和诊断，缓存由 Engine/Store 管理。
- [一层容器与 Region 约束模型](issues/04-one-level-container-model.md) — 容器 owner 使用稳定语义 regions，不持久化视觉 variant；约束是纯数据，NodeBundle 原子创建 aggregate，region child 可在 root/regions 间移动，删除/复制/unwrap 具有明确事务语义。
- [纯数据可见性与外部状态上下文](issues/05-declarative-state-and-visibility.md) — Core Schema 不提供通用 visible/条件 DSL；业务条件保存在物料 props，Dragcraft 不提供 Designer previewState 或 Runtime 状态 interface，额外模拟与生产展示均由框架使用者自行实现。
- [设计器结构操作与历史模型](issues/07-authoring-operations-model.md) — 现有设计器交互保留，由有状态 Authoring Engine 经 Policy 生成封闭纯数据操作，纯 Schema Editor 原子返回新文档；新增/复制统一插入 NodeBundle，位置使用 owner 锚点，批处理与有界快照 history 均以一次提交为单位。
- [语义标识与消费端展示绑定](issues/10-semantic-render-binding.md) — type 是唯一语义与展示识别键；Designer 通过单一 MaterialDefinition 注册 visual/headless 物料并内部投影，重复配置失败、未知 type 降级保留；生产消费端只接收纯数据 Schema，不共享任何 Dragcraft renderer 或 registry。
- [Vue 与浏览器展示适配器](issues/06-web-geometry-adapter.md) — 内置 ApplicationSurface 以可选 PresentationFrame、Document/Viewport mount planes、Surface Reservation 和唯一 NodeHost 支持任意设计态几何；Interaction Plane、锚点拖放、RegionOutlet、DOM 测量与 stacking 由 Designer 统一拥有，不恢复 Schema 空间分类。
- [@dragcraft/designer 公共 Schema 与展示接口](issues/08-public-designer-contract.md) — `createDesigner({ schema?, materials })` 是唯一公共注册入口；公开 `DocumentSchema`、受控 DesignerInstance、诊断和 Vue Presentation 扩展，内部保留解析器/ResolvedDocument/Engine/几何 registry；不提供 previewState、场景模拟或跨平台 renderer。
- [布局体系的验证与一致性契约](issues/09-validation-and-conformance.md) — 每条不变量绑定唯一执行 owner 与权威测试面；Core 使用表格和有界属性测试，公共入口使用消费者契约测试，跨平台止于 JSON 往返，Web 几何由三个重做的产品化 playground 模板人工验收，最终合并不允许新旧双轨。
- [Schema Resolver 诊断预算契约](issues/11-resolver-diagnostic-budget-contract.md) — Resolver 通过可选 options 拥有默认 200、硬上限 2000 的调用级诊断预算，四态统一返回可准确表达稳定截断的 DiagnosticReport，非法预算静默回退到默认值。

## Not yet specified

无；本地图的架构决策、公共契约、示例要求与直接替换验收矩阵已经明确。

## Out of scope

- v1 Schema 迁移、旧接口兼容、双写或过渡期适配。
- 递归容器及其设计态交互（嵌套选中、拖放、插入和层级导航）。
- 非 Vue/浏览器宿主的实现交付；核心结果保持平台无关，但本地图不设计其他宿主适配器。
- 让业务物料注入任意文档结构解析规则或替换 Core 的结构不变量。
