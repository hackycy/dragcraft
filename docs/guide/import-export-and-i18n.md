# Schema 生命周期

Schema 是设计器和业务服务之间交换的页面快照。使用 `exportSchema()` 导出，使用 `importSchema()` 在打开页面时加载。

```ts
import { useDesigner } from '@dragcraft/designer'

const { exportSchema, importSchema, undo, redo } = useDesigner(designer)

const response = await pageApi.getDraft(pageId)
importSchema(response.schema)

const schema = exportSchema()
await pageApi.saveDraft({ id: pageId, schema })
```

导出的 Schema 是深拷贝，业务可以安全序列化或传给 API。导入会替换当前页面并清空本地历史，因此应在用户确认放弃未保存修改后调用。

## Schema 中保存什么

```ts
const schema = {
  version: '1.0.0',
  globalConfig: { title: '夏日活动' },
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      { id: 'notice-1', type: 'notice', props: { text: '限时优惠' } },
      {
        id: 'layout-1', type: 'column-container', props: {},
        container: {
          variant: 'single',
          regions: {
            content: [{ id: 'text-1', type: 'text', props: { content: '欢迎' } }],
          },
        },
      },
    ],
  },
}
```

`root.children` 保存页面顶层节点；节点的 `type` 必须能被业务的物料注册表解析。外部容器的普通子节点保存在 `container.regions`，导入导出时要把这棵 region 子树视为页面快照的一部分。图片、链接、表单选项等业务数据通常放进 `props`，页面级业务数据放进 `globalConfig`。

容器 region 的约束和变体由当前物料注册表解释。导入含容器的页面前，先注册对应的 `ContainerDefinition`；未解析容器会保留数据但不能继续编辑结构。容器协议见 [外部容器物料](/guide/container-materials)。

> [!WARNING]
> `importSchema()` 只负责最基本的 Schema 入口校验。服务端仍应校验页面归属、允许的物料类型、资源地址和业务字段，不能把客户端 Schema 当成可信输入。

## 区分编辑历史和页面版本

`undo()` 与 `redo()` 只服务于当前浏览器中的编辑会话。草稿版本、发布版本、审核记录和并发冲突应由业务服务管理。

服务端保存草稿、解决版本冲突和发布页面的流程见 [保存草稿与发布](/guide/saving-and-publishing)。
