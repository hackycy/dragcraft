---
description: "@dragcraft/designer 的实例创建、工作台控制、动作和界面扩展公开 API。"
---

# @dragcraft/designer

这是业务应用的标准入口。它组合 Core、Renderer 和 Form Generator，并要求宿主显式提供业务物料和字段 adapter。

```ts
import { createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  fieldComponentMap,
})
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `createDesigner(options)` | 创建编辑器实例。 |
| `DcDesigner` | 挂载标准三栏工作台。 |
| `useDesigner(instance)` | 读取 Schema、执行命令、导入导出和订阅事件。 |
| `DesignerWorkspaceController` | 打开、关闭或切换左右面板。 |
| `customActions`、`actionInterceptors` | 扩展节点动作与业务流程。 |
| `DesignerExtensions` | 替换面板、物料项或追加 rail 内容。 |

`DesignerOptions` 中的 `widgetMetas`、`componentMap` 和 `fieldComponentMap` 是三份不同的输入：物料协议、页面组件和字段 UI 不应相互替代。

扩展对象在 Renderer 挂载时读取。要在运行中切换一组 Renderer 扩展，应重新挂载承载 `DcDesigner` 的组件。

继续阅读 [动作与业务策略](/guide/customization/actions-and-policies) 或 [面板与画布](/guide/customization/panels-and-canvas)。
