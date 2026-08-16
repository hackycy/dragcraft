# 项目总览

DragCraft 是面向垂直业务场景的 Schema 驱动可视化页面编排框架。它提供 Vue 设计工作台，使业务应用通过一个 `@dragcraft/designer` 入口定义物料、编辑 `DocumentSchema`，并在自己的运行时解释同一份纯数据。

框架以业务物料和受约束的页面结构为编排单位，适合列表、详情、营销、配置等业务页面，也可用于小程序装修；它不是自由画布或像素级 H5 编辑器。

## 公开边界

业务应用只直接使用：

- `@dragcraft/designer`：Designer、物料协议、Schema 类型和设计态 Presentation 扩展。
- `@dragcraft/device-frames`：可选的 Device Frame Container Shell。
- `@dragcraft/fields-*`：可选的字段 adapter。

其他 workspace package 是实现细节。业务应用、公开文档、examples 和 playground 不直接依赖它们。

## 运行链路

```text
MaterialDefinition[] + DocumentSchema
              |
       createDesigner()
              |
DesignerInstance
  |       |        |
document selection history
              |
  Designer Presentation
              |
       host production runtime
```

`MaterialDefinition` 是一个 type 的唯一注册面。它把 Schema 声明、authoring 能力、属性面板和设计态 Presentation 放在一起。生产运行时不复用 Designer，而是根据稳定 `type` 解释导出的 `DocumentSchema`。

## 标准接入

```ts
import '@dragcraft/designer/standard.css'
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designer = createDesigner({
  schema,
  materials,
  fieldComponentMap: createAntDesignVueFields(),
})
```

`materials` 必填且可以为空。配置错误会在创建时抛出；Schema 数据错误通过 `designer.document` 和 `importSchema()` 的状态返回，rejected 输入不会覆盖当前文档。

## 约束

- 所有持久化修改都进入 `designer.execute(action)`。
- `designer.document`、`selection` 和 `history` 都是只读状态。
- 一个实例只有一份 DocumentSchema、一个 history 和一个 active backend。
- Designer 拥有设计态 Presentation 与结构 CSS；`standard.css` 是完整默认工作台主题，`structure.css` 只用于完全自定义主题。
- 设备外壳只能包围业务预览。Designer 的工具栏、选中态和拖拽反馈属于工作台 Presentation。
