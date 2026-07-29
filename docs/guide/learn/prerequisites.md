---
description: "从新的 Vite Vue 3 TypeScript 项目安装 Dragcraft，并了解课程要完成的结果。"
---

# 准备项目

## 预期结果

你会从一个空的 Vue 3 项目开始，完成一个能编辑、保存并以只读方式预览活动页的应用。

## 前置状态

教程假设你已经会使用 TypeScript、Vue 单文件组件和 pnpm，且本机可以运行 Vue 3 的默认 Vite 模板。

## 完整文件

### 命令和文件状态

运行下面的命令：

```bash
pnpm create vite dragcraft-starter --template vue-ts
cd dragcraft-starter
pnpm install
pnpm add @dragcraft/designer@^0.0.4 @dragcraft/fields-ant-design-vue@^0.0.4 ant-design-vue
```

`@dragcraft/designer` 是业务接入的统一入口。`@dragcraft/fields-ant-design-vue` 把 Designer 的字段协议连接到 Ant Design Vue；下一页会加载对应样式。

这一页不替换 Vite 生成的 `src` 文件。先保留默认模板，下一页会给出第一组完整的业务源码文件。

## 立即可观察行为

运行下面的命令，确认 Vite 项目本身可以启动：

```bash
pnpm dev
```

浏览器应显示默认 Vue 页面。此时还没有编辑器，这是后续代码要填入的能力。

## 设计原因

课程中的代码会逐步形成下面的目录。每页给出需要新增或替换的完整文件，最终结果可以与仓库中的 [`examples/guide-project`](https://github.com/hackycy/dragcraft/tree/main/examples/guide-project) 对照。

```text
src/
  domain/widgets/     # 业务物料与 Vue 组件
  editor/             # Schema 和 Designer 装配
  forms/              # 字段 adapter
  host/               # 草稿、设备选择和宿主服务
  runtime/            # 生产只读运行时
```

你会先得到一个能拖入和编辑文本的工作台。随后会添加公告、属性字段、页面设置、草稿保存和只读预览。最后再处理布局、容器和模板节点这些需要理解 Schema 所有权的能力。

| 由框架提供 | 由你的应用提供 |
| --- | --- |
| Schema、命令、历史、编辑器交互和属性表单渲染 | 业务物料、字段组件、草稿服务、权限和生产运行时 |

编辑器不会替你保存页面，也不会把 Schema 直接变成线上页面。把这两个边界留在宿主应用，才能按产品模型处理版本、审核、资源权限和跨端运行时。

## 限制与下一步

> [!TIP]
> 本地想先看看最终效果时，可以在仓库根目录运行 `pnpm install` 和 `pnpm --filter guide-project dev`。它用于核对完成态，不是本教程的前置条件。

## 完成检查

新项目已经安装依赖，并能通过 `pnpm dev` 启动默认 Vite 页面。

下一步：[快速开始：挂载编辑器](/guide/learn/first-editor)。
