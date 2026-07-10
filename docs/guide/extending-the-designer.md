# 扩展设计器交互

设计器把外观和业务交互留在显式扩展点中。先从画布工具栏开始：

```ts
import { h } from 'vue'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  extensions: {
    toolbarRenderer: ({ undo, redo, canUndo, canRedo }) => [
      h('button', { disabled: !canUndo(), onClick: undo }, '撤销'),
      h('button', { disabled: !canRedo(), onClick: redo }, '重做'),
    ],
  },
})
```

工具栏拿到的是稳定的操作 API。保存草稿这类业务动作可以在同一个宿主组件中调用 `exportSchema()`，而不需要修改 core 或画布组件。

## 选择合适的扩展点

| 目标 | 扩展点 |
| --- | --- |
| 完整替换左侧物料区或右侧属性区 | `materialPanelRenderer` / `propertyPanelRenderer` |
| 只定制一张物料卡片 | `materialItemRenderer` |
| 更换设备外壳、节点工具栏、空状态或节点包裹层 | `rendererExtensions` |
| 在画布顶部增加历史、预览等 UI | `toolbarRenderer` |

`materialPanelRenderer` 和 `propertyPanelRenderer` 会替换整个区域，适合业务已有成熟面板时使用。只改一个物料项时，优先使用 `materialItemRenderer`，这样可以保留 designer 的搜索、尺寸和拖拽约束。

## 拦截节点动作

删除、移动和自定义动作都会经过 Action Runtime。确认、权限和审计应写成 interceptor：

```ts
const designer = createDesigner({
  widgetMetas,
  componentMap,
  actionInterceptors: [{
    beforeAction: async ({ key }) => {
      if (key !== 'delete')
        return true
      return await confirmDeleteInYourApp()
    },
    afterAction: ({ key, ctx }) => analytics.track('designer_action', {
      key,
      nodeType: ctx.node.type,
    }),
  }],
})
```

会改 Schema 的自定义动作应返回 core command，例如 `ADD_NODE` 或 `UPDATE_PROPS`。只产生副作用的动作使用 `handler`。这样创建约束、历史记录和事件通知仍由 core 统一处理。

## 观察画布交互

`eventHooks` 适合在选择或拖动前后接入业务行为：

```ts
const designer = createDesigner({
  widgetMetas,
  componentMap,
  eventHooks: {
    onBeforeSelect: ({ nodeId }) => canEditNode(nodeId),
    onAfterDrag: ({ nodeId }) => analytics.track('node_moved', { nodeId }),
  },
})
```

`onBeforeDrag` 必须同步返回，因为浏览器拖拽不能等待异步结果。节点操作的确认和异步权限判断则放在 `actionInterceptors`。

关于设计器扩展，目前知道这些就够了。接下来阅读 [主题与设备框架](/guide/themes-and-device-frames)。
