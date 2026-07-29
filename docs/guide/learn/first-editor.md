---
description: "在 Vue 应用中定义文本物料、创建设计器实例并挂载完整工作台。"
---

# 创建可运行编辑器

最小编辑器由一个物料定义、一个字段 adapter map 和一个 `DcDesigner` 组成。完成后，你可以拖入文本、修改属性并撤销修改。

安装设计器、默认字段 adapter 和对应 UI 库：

```bash
pnpm add @dragcraft/designer @dragcraft/fields-ant-design-vue ant-design-vue vue
```

## 定义第一个物料

物料定义把持久化协议和 Vue 组件放在一起。示例中的完整文本物料如下：

<<< ../../../examples/guide-project/src/domain/widgets/text.ts

`meta.type` 是 Schema 中保存的稳定标识。`component` 是设计态和当前 Vue 运行时使用的组件；组件名可以重构，`type` 改名则需要 Schema migration。

`defaultProps` 在拖入物料时复制到新节点。`formSchema` 中没有显式 `bindTo` 的 `content` 字段默认写入当前节点的 `props.content`。

## 创建设计器实例

完整的最小实例工厂只有三类输入：

<<< ../../../examples/guide-project/src/editor/minimal-designer.ts

| 输入 | 回答的问题 |
| --- | --- |
| `widgetMetas` | 设计器允许创建和编辑哪些 `type` |
| `componentMap` | 画布如何把 `type` 渲染为 Vue 组件 |
| `fieldComponentMap` | 属性表单如何把字段键渲染为真实控件 |

这三份注册表不能互相替代。只注册 metadata 会让物料出现在左栏，但画布找不到组件；只注册组件则不会产生物料卡片和属性协议。

## 挂载并释放实例

最小页面完整地创建、挂载并释放 Designer：

<<< ../../../examples/guide-project/src/MinimalApp.vue

`designer.dispose()` 会清理事件监听、历史和交互状态。实例由组件创建时，应在组件卸载时释放；如果实例由应用级容器持有，则由该容器管理生命周期。

应用入口加载字段 UI 的基础样式和 Standard 工作台主题：

<<< ../../../examples/guide-project/src/minimal.ts

`@dragcraft/designer/standard.css` 包含完整工作台主题。只有准备实现整套工作台视觉时，才改用 `@dragcraft/designer/structure.css`。

## 验证结果

```bash
pnpm --filter guide-project dev
```

打开 `http://localhost:9982/minimal.html`，验证以下行为：

- 左栏显示“文本”。
- 拖入后画布显示“新文本”。
- 选中节点后右栏显示“文本内容”。
- 修改内容后可以撤销和重做。

如果左栏存在物料但画布显示 fallback，检查 `componentMap` 是否使用了相同的 `type`。如果右栏显示未知字段，检查 `fieldComponentMap` 是否注册了 `formSchema` 中的组件键。

接下来可以 [接入业务物料与属性配置](/guide/learn/material-and-property-panel)，或先建立 [Schema 与样式作用域](/guide/fundamentals/schema) 的数据模型。
