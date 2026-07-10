# 扩展设计器交互

设计器把撤销和重做固定在画布左上角。`toolbarRenderer` 用来增加宿主选择提供的预览或设备控制：

```ts
import { h } from 'vue'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  extensions: {
    toolbarRenderer: ({ t }) => h('button', {
      class: 'dc-canvas-toolbar__btn',
      title: t('preview.open', '预览'),
      onClick: openPreview,
    }, t('preview.open', '预览')),
  },
})
```

这个扩展区仍能拿到 `undo`、`redo`、`execute`、`workspace` 和 `t`。左右栏通过各自 rail 上的折叠控制开关；保存、发布和模板切换通常放在 designer 外部的应用顶栏。

## 选择合适的扩展点

| 目标 | 扩展点 |
| --- | --- |
| 完整替换左侧物料区或右侧属性区 | `materialPanelRenderer` / `propertyPanelRenderer` |
| 只定制一张物料卡片 | `materialItemRenderer` |
| 更换设备外壳、节点工具栏、空状态或节点包裹层 | `rendererExtensions` |
| 在画布悬浮区增加预览或设备控制 | `toolbarRenderer` |
| 向左右 Sidebar rail 增加事件、设置等工具 | `leftRailRenderer` / `rightRailRenderer` |

`materialPanelRenderer` 和 `propertyPanelRenderer` 会替换整个区域，适合业务已有成熟面板时使用。只改一个物料项时，优先使用 `materialItemRenderer`，这样可以保留 designer 的搜索、尺寸和拖拽约束。

Rail 扩展不会替换内置 tab。下面的设置入口会追加到右 rail 的独立分区：

```ts
extensions: {
  rightRailRenderer: ({ t }) => h('button', {
    class: 'my-rail-action',
    title: t('settings.open', '打开设置'),
    onClick: openSettings,
  }, h(SettingsIcon)),
}
```

`leftRailRenderer` 和 `rightRailRenderer` 都能读取 `engine`、`workspace` 与 `t`，宿主负责扩展按钮的业务状态和样式。

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
