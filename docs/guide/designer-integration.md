# 集成设计器

`createDesigner()` 把 core、renderer 和 form-generator 组装为一个设计器实例。业务应用只需要提供物料、渲染组件和字段 adapter。

先看一个带初始页面和全局配置的实例：

```ts
const designer = createDesigner({
  engineOptions: {
    initialSchema: {
      version: '1.0.0',
      globalConfig: { title: '活动页' },
      root: { id: 'root', type: 'root', props: {}, children: [] },
    },
    maxHistorySize: 50,
  },
  widgetMetas,
  componentMap,
  fieldComponentMap,
  globalConfigSchema: {
    sections: [{
      title: '页面',
      fields: [{ key: 'title', label: '页面标题', component: 'Input' }],
    }],
  },
})
```

`engineOptions.initialSchema` 决定首次打开时编辑哪份页面。`globalConfigSchema` 显示在右侧的“全局配置”页签；没有选中物料时，它仍然可编辑。

## 读取与写入的边界

业务代码读取页面快照时使用 `designer.engine.state.getSchema()`，或在组件内使用 `useDesigner(designer)`。所有 schema 写入都通过 `execute()` 进入命令系统。

```ts
import { CommandType, useDesigner } from '@dragcraft/designer'

const { execute, exportSchema } = useDesigner(designer)

execute({
  type: CommandType.UPDATE_PROPS,
  payload: { nodeId: 'text-1', props: { content: '新品上线' } },
})

const snapshot = exportSchema()
```

`execute()` 会统一接入约束、历史记录和 `schema:changed` 事件。不要直接改 `engine.store`；那会绕过这条链路。

## 该准备哪些输入

| 输入 | 解决的问题 | 下一步 |
| --- | --- | --- |
| `widgetMetas` + `componentMap` | 能创建什么，以及节点怎么渲染 | [自定义物料](/guide/materials-and-fields) |
| `fieldComponentMap` + `FormSchema` | 右侧如何编辑页面和物料属性 | [配置表单与字段](/guide/forms-and-fields) |
| `extensions`、hooks、actions | 替换面板、画布外壳与操作行为 | [扩展设计器交互](/guide/extending-the-designer) |

关于标准集成，目前知道这些就够了。准备好之后，继续阅读 [自定义物料](/guide/materials-and-fields)。
