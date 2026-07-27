---
description: "查看活动页的初始 Schema，并理解属性修改如何经过 Designer、Core 和 Renderer。"
---

# 理解 Schema 与写入链路

在最小编辑器已经能修改文本后，编辑器保存的是页面 Schema，不保存 Vue 组件实例。贯穿示例从一份带公告节点的页面开始：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts#tutorial-initial-schema

`root.children` 保存页面顶层节点，`globalConfig` 保存页面级业务数据，`root.style.surface` 描述页面承载面的开放样式 DSL。业务物料的 `type` 必须能被当前注册表解析。

一次字段修改会经过同一条路径：

```text
字段 change
  -> Designer 解析 bindTo
  -> engine.execute(...)
  -> Core 校验、写入 Schema、记录历史并触发事件
  -> Renderer 根据新快照更新画布
```

这条路径让撤销、约束和事件保持一致。读取使用 `engine.state` 或 `useDesigner()`，写入使用 `engine.execute()`、属性表单绑定或已有节点动作。

如果节点需要进入固定 chrome、浮层或业务定义的区域，再阅读 [页面布局与容器](/guide/customization/layout-and-containers)。页面布局的完整模型见 [Architecture Map 的布局系统](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/08-layout-system.md)。

**完成检查**：你能指出一次属性修改使用的命令入口，以及它在 Schema 中对应的保存位置。

下一步：[添加物料与属性面板](/guide/learn/material-and-property-panel)。
