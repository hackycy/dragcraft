# @dragcraft/designer 公共 Schema 与展示接口

Status: resolved
Type: grilling
Blocked by: 03, 05, 06, 10

## Question

定义 `@dragcraft/designer` 对外公开的 Schema 结构解析与 Designer Presentation Adapter interface：导出的纯数据类型、解析入口、诊断/错误契约和预览渲染集成方式；同时确认如何遵守当前公共包边界，只把纯数据 Schema 契约交付给 Flutter、原生、Web 等消费端，不让其依赖内部 `@dragcraft/core`、`ResolvedDocument` 或设计器空间策略。

## Answer

`@dragcraft/designer` 的公共 seam 以一个 `createDesigner({ schema?, materials, ... })` 为中心。使用者只维护一个 `MaterialDefinition[]`，不再分别管理 Schema definition、Designer binding、ComponentMap 或其他 registry；`defineMaterial()` 只是无副作用的类型推断辅助函数，真正的注册只发生在 `createDesigner()`。

```ts
const designer = createDesigner({
  schema,
  materials: [textMaterial, navbarMaterial, analyticsMaterial],
})
```

`MaterialDefinition` 是扁平的单物料聚合 interface：

```ts
interface MaterialDefinition<Props extends JsonObject = JsonObject> {
  type: NodeType
  schema?: MaterialSchemaDeclaration<Props>
  authoring?: MaterialAuthoringDefinition<Props>
  presentation: DesignerPresentation<Props>
  panel?: MaterialPanelDefinition
  inspector?: InspectorDefinition<Props>
}
```

`presentation` 必须显式声明 `visual` 或 `headless`。Visual Material 提供一个 Vue preview，并可选提供只包装完整 NodeHost 的 PresentationFrame；Headless Material 不提供自身业务 UI，由 Designer 使用框架代理呈现。重复 type、缺失 presentation、visual 缺少 preview、非法 container/region 声明等是 `DesignerConfigurationError`，初始化直接失败；不采用注册顺序覆盖或隐式 override。

Schema 公共类型统一命名为 `DocumentSchema`，不保留 `DesignerSchema` 兼容别名：

```ts
interface DocumentSchema {
  version: string
  globalConfig: JsonObject
  page: PageDefinition
  nodes: NodeDefinition[]
  structure: DocumentStructure
}
```

`PageDefinition`、`NodeDefinition`、`DocumentStructure`、`ContainerStructure`、`NodeId`、`NodeType`、`RegionId` 和 JSON 值类型均保持普通 JSON 形态。`schema` 省略时，Designer 创建版本为 `'1'` 的标准空文档；显式传入的 `null` 或其他未知值仍按外部输入解析。`materials` 是必填数组但可以为空。

底层 `resolveSchema(input, definitions, options?)` 仍是 Core 内部的深 module interface。`@dragcraft/designer` 不导出 `resolveSchema()`、`SchemaDefinitionSnapshot`、`ResolvedDocument`、Map 索引、registry 或任何布局/几何计划。Designer 内部通过同一解析管线处理初始 Schema 和 `importSchema(input)`；公共宿主只看到状态、诊断、导入、导出和设计态操作。

宿主控制 interface 为：

```ts
interface DesignerInstance {
  readonly document: ShallowRef<DesignerDocumentState>
  readonly selection: Readonly<DesignerSelection>
  readonly history: Readonly<DesignerHistory>
  execute(action: AuthoringAction): AuthoringResult
  importSchema(input: unknown): SchemaLoadResult
  exportSchema(): DocumentSchema | null
  dispose(): void
}
```

配置错误与 Schema 数据错误分离：配置错误抛出；Schema 解析返回 `ready`、`degraded`、`conflicted` 或 `rejected`。成功状态安装当前文档；`rejected` 不覆盖已有文档，初始 rejected 只显示框架恢复态且允许重新导入。未知 type 进入 degraded 并以只读 fallback 保留；与定义或 region 约束冲突进入 conflicted 并限制受影响结构写入。

诊断是有界纯数据：

```ts
interface DiagnosticReport {
  readonly items: readonly SchemaDiagnostic[]
  readonly truncated: boolean
}
```

每条诊断含稳定 `code`、`phase`、`severity`、JSON Pointer `path` 和可选节点/容器/region 标识与 JSON `details`；按 phase、path、code 稳定排序。Designer 将 `limits.maxDiagnostics` 投影为内部 Resolver options：默认最多保留 200 条，可调为包括 0 在内的非负整数，超过 2000 时按硬上限执行，非法运行时值静默回退到默认值。Core 不生成文案，Designer 自己本地化 code；不保存被截断的原始输入或额外诊断。

Preview 通过显式只读 `context` prop 接收当前节点、page、globalConfig、owner 和 selected/hovered/dragging 状态：

```ts
interface MaterialPreviewContext<Props extends JsonObject>
  extends MaterialPresentationContext<Props> {
  updateSelf(patch: MaterialSelfPatch<Props>): AuthoringResult
  invokeAction(action: string, payload?: JsonValue): AuthoringResult
}
```

`updateSelf()` 与 `invokeAction()` 是唯一受控写入口，仍经过 Authoring Policy、Schema Editor、提交和 history。Preview 不接触 Engine、Store、history、registry 或完整文档遍历。Dragcraft 不定义 `previewState`、场景切换或第二套 Runtime context；需要会员/游客、路由、权限、设备等额外模拟时，由框架使用者在自己的 Vue Preview 和宿主状态体系中自行实现。

PresentationFrame 通过 Vue 默认 slot 恰好渲染一次完整 NodeHost，可使用公开 `DesignerViewportPortal`、`DesignerRegionOutlet` 和 `useSurfaceReservation()`；NodeHost、ApplicationSurface、plane、Geometry Registry、Surface Reservation Registry 和所有空间枚举仍是 Designer implementation。Frame 不写 Schema，也不拥有结构顺序。Frame 配置错误产生 presentation diagnostic 并回退到 Document Plane，不能静默丢失节点。

根入口公开 `createDesigner`、`defineMaterial`、`DcDesigner`、`useDesigner`、Presentation 扩展值、`DOCUMENT_SCHEMA_VERSION` 及上述纯数据/宿主/物料类型。字段 schema 类型由 Designer 聚合导出，具体字段实现来自 `@dragcraft/fields-*`。不再导出 Core Engine、Command、ResolvedDocument、SchemaOperation、ComponentMap、Widget registry、RootRenderer、NodeHost 或几何内部类型，也不保留旧名称别名。`@dragcraft/designer/standard.css` 和 `structure.css` 继续是公开 CSS 入口。
