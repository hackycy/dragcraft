---
description: "准备 Vue 3 与 TypeScript 项目，并运行 DragCraft 的贯穿式参考实现。"
---

# 准备开发

这套指南面向已经会 Vue 3 和 TypeScript 的开发者。完成后，你会得到一个能编辑、保存并以只读方式预览活动页的应用。

先运行仓库中的参考实现：

```bash
pnpm install
pnpm --filter guide-project dev
```

浏览器会打开活动页编辑器。左侧是物料，中央是画布，右侧会在选中节点后显示属性。顶部的“保存草稿”“加载草稿”和“查看运行时”对应本指南最后要完成的宿主能力。

**完成检查**：浏览器能打开示例，选中节点后右侧出现属性面板。

## 准备你的项目

你的项目需要 Vue 3、TypeScript 和 pnpm。首次接入会安装内含 Standard 主题的 `@dragcraft/designer`、字段 adapter 与实际字段 UI 库；[挂载最小编辑器](/guide/learn/first-editor) 给出完整命令。

| 由框架提供 | 由你的应用提供 |
| --- | --- |
| Schema、命令、历史、编辑器交互和属性表单渲染 | 业务物料、字段组件、草稿服务、权限和生产运行时 |

编辑器不会替你保存页面，也不会把 Schema 直接变成线上页面。把这两个边界放在宿主应用，才能按你的产品模型处理版本、审核和资源权限。

完整的包分层与设计约束保留在 [Architecture Map](https://github.com/hackycy/dragcraft/tree/main/.github/architecture)。本指南只在需要时链接到对应的架构章节。

下一步：[挂载最小编辑器](/guide/learn/first-editor)。
