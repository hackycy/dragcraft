# 语义标识与消费端展示绑定

Status: resolved
Type: grilling
Blocked by: 03

## Question

确定稳定的节点 `type` 如何绑定 Designer Presentation Adapter：是否确实需要额外的实例 role、完整 Material Definition 如何声明与校验、visual/headless 和未知或重复 type 如何处理，以及 Dragcraft 向 Flutter、原生、Web 等外部消费端交付哪些纯数据契约而不定义生产 renderer。

## Answer

`NodeDefinition.type` 是节点所属物料及其数据契约的唯一稳定语义标识，也是 Designer 选择设计态展示、外部消费端解释节点的唯一公共键。下一代 Schema 删除 `role`：navbar、bottom-bar、floating-action 和 dialog 等不同业务语义使用不同 type；同 type 的实例差异使用普通业务 props。禁止用节点 ID、可编辑 name、几何字段或额外 renderer key 选择展示。

框架使用者不维护 Schema definition、Designer binding 和 ComponentMap 三份平行 registry。`MaterialDefinition` 是向 Designer 注册一个 type 的唯一聚合 interface，type 只声明一次；内部 module 再把 `MaterialDefinition[]` 投影为纯数据 `SchemaDefinitionSnapshot`、Authoring 配置与 Designer Presentation Registry。这些内部投影不是公共注册负担。

```ts
interface MaterialDefinition {
  type: NodeType
  schema: MaterialSchemaDeclaration
  authoring: MaterialAuthoringDefinition
  designer: {
    presentation: DesignerPresentation
    material?: MaterialPanelPresentation
    inspector?: InspectorDefinition
  }
}

type DesignerPresentation =
  | { kind: 'visual', preview: VueComponent, frame?: VueComponent }
  | { kind: 'headless' }
```

`schema` 段只含 container capability、regions 和 constraints 等纯数据结构声明，可安全投影到 `SchemaDefinitionSnapshot`；`authoring` 段拥有 NodeBundle factory 与 Designer policy；`designer` 段拥有物料栏、属性面板和设计态展示。具体字段命名与公开导出位置由 [@dragcraft/designer 公共 Schema 与展示接口](08-public-designer-contract.md) 最终固定，本票确定职责与注册心智模型。

Visual Material 必须提供一个 Designer preview，并可选提供只包装完整 NodeHost 的 PresentationFrame；同 type 的 props 差异由这个 adapter 自己解释，不允许 Schema 实例选择另一 renderer。Headless Material 明确没有自己的业务可视输出，因此不提供 preview，由 Designer 使用框架拥有的标准代理表示，以保留选中、配置、toolbar、拖放、复制、删除、owner 顺序与诊断。Headless container 的代理仍须呈现其 region children，具体 Web 几何由 [Vue 与浏览器展示适配器](06-web-geometry-adapter.md) 决定。

`headless` 必须显式声明，不能用缺失 preview 猜测。未声明 presentation kind、visual 缺少 preview 或同一批 materials 中 type 重复均属于宿主配置错误，Designer 初始化直接失败；不采用警告后覆盖、注册顺序优先或隐式 override。

Schema 中可能出现当前 Designer 未注册的 type。此时 `resolveSchema()` 返回 degraded 并完整保留节点、props、owner、regions 和 children；Designer 使用 Unknown Material fallback 显示 type、id 与诊断，允许选中查看但保持节点只读。Unknown Material 与 Headless Material 是不同状态：前者缺少定义，后者具有完整显式定义。

Dragcraft 不拥有生产 Runtime。`MaterialDefinition` 不包含 `runtime`、production renderer 或跨平台组件；`SchemaDefinitionSnapshot`、`ResolvedDocument` 与 Designer Presentation Registry 也不交付给 Flutter、原生、Web 或其他生产消费端。跨平台契约只有序列化纯数据 Schema、稳定 type、物料 props 业务含义、文档结构和 region 语义。

外部消费端按 type 自主执行渲染、行为初始化或数据提取，也自主决定未知 type 是报错、跳过、fallback 还是延迟加载。所谓 Consumer Presentation Policy 只是对这种外部行为的架构描述，不是 Dragcraft module interface。Dragcraft 的终点是可靠地产出 Schema，而不是成为跨平台 Runtime 框架。
