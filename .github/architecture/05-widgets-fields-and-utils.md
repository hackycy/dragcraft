# 物料、字段与工具

业务物料由应用维护，并通过 `MaterialDefinition[]` 传入 `createDesigner()`。Designer 不提供默认业务物料包，也不要求维护平行的 Schema、组件和面板注册表。

## MaterialDefinition

```ts
const noticeMaterial = defineMaterial({
  type: 'notice',
  panel: { title: '公告', group: 'marketing', groupTitle: '营销' },
  schema: { defaultProps: { text: '新公告' } },
  authoring: { policy: { create: 'allowed' } },
  inspector: { formSchema: noticeFormSchema },
  presentation: { kind: 'visual', preview: NoticePreview },
})
```

| 部分 | 职责 |
| --- | --- |
| `type` | Schema 和生产运行时共享的稳定语义键。 |
| `schema` | 默认 props、样式和容器声明。 |
| `authoring` | 创建 bundle 与 create/move/remove/update 等策略。 |
| `inspector` | 设计器属性面板的 FormSchema。 |
| `panel` | 物料栏的标题、分组、搜索和辅助展示。 |
| `presentation` | visual preview 或显式 headless 行为。 |

同一 type 只能出现一次。visual 物料必须提供 preview；headless 物料不得伪造空 preview。重复或不完整声明在 Designer 初始化时失败。

## 容器物料

容器物料在 `schema.container` 中声明 region 与容量约束。Designer 根据 `schema.structure.containers` 保持 children 的 owner 和顺序；业务 preview 通过 `DesignerRegionOutlet` 呈现它们。

业务组件拥有 DOM、CSS 与插入几何，Designer 拥有 selection、drop decision、action 和 history。当前结构只允许一层容器，容器不应嵌套。

## 字段 Adapter

字段 adapter 来自公开的 `@dragcraft/fields-*` 包，或由宿主合并进 `fieldComponentMap`。它们对齐 `componentProps` 与真实 UI 库的 props，并把值变化交给 Designer。

`@dragcraft/fields-ant-design-vue` 提供 Ant Design Vue 的常用输入控件。业务特化控件如资源选择器仍由业务应用实现。

## 工具与国际化

物料可以使用 Designer 导出的字段类型、JSON 类型和 `defineMaterial()` 获得类型推断。消息、资源、权限和业务文案由宿主维护；Designer 只消费传入的 locale 与 messages。
