<div align="center">
  <h1 align="center">dragcraft</h1>
  <p align="center">面向小程序装修场景的可视化页面搭建引擎</p>
  <p align="center">
    用可视化设计器、结构化 Schema 和可扩展的 Vue 可视化搭建工作台，构建可维护的页面装修后台。
  </p>
  <p align="center">
    <a href="https://hackycy.github.io/dragcraft/"><strong>阅读文档</strong></a>
    &nbsp;|&nbsp;
    <a href="https://hackycy.github.io/dragcraft/playground"><strong>在线体验</strong></a>
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/@dragcraft/designer"><img src="https://img.shields.io/npm/v/%40dragcraft%2Fdesigner?logo=npm&label=npm" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@dragcraft/designer"><img src="https://img.shields.io/npm/dm/%40dragcraft%2Fdesigner?logo=npm&label=downloads" alt="npm monthly downloads"></a>
    <a href="https://github.com/hackycy/dragcraft/blob/main/LICENSE"><img src="https://img.shields.io/github/license/hackycy/dragcraft?label=license" alt="MIT License"></a>
  </p>
</div>

## 从这里开始

| 我想要 | 前往 |
| --- | --- |
| 先看看设计器实际效果 | [打开 Playground](https://hackycy.github.io/dragcraft/playground) |
| 从新的 Vue 项目搭建可保存、可预览的编辑器 | [准备项目](https://hackycy.github.io/dragcraft/guide/learn/prerequisites) |
| 理解宿主、Designer、Core、Schema 和运行时边界 | [理解 Dragcraft 的边界](https://hackycy.github.io/dragcraft/guide/learn/mental-model) |
| 接入业务物料、属性表单、页面布局或容器组件 | [按需扩展](https://hackycy.github.io/dragcraft/guide/customization/overview) |
| 查阅包的公开 API | [API 参考](https://hackycy.github.io/dragcraft/reference/overview) |

## 为什么选择 dragcraft

- **为页面装修而设计**：围绕物料拖拽、属性配置、设备预览和页面结构编排构建，而不只是一个通用拖拽容器。
- **Schema 驱动**：页面结构与属性保存为稳定、可导入导出的 Schema；业务运行时负责解释并渲染页面。
- **写入可控**：新增、移动、删除和属性更新统一经由命令系统，天然接入历史记录、事件通知和行为约束。
- **开箱即用，也能深度扩展**：标准设计器组合了画布与配置表单；物料、字段、容器、设备框架和主题都可按业务替换。

## 快速开始

安装设计器和默认字段 adapter：

```bash
pnpm add @dragcraft/designer@^0.0.4 @dragcraft/fields-ant-design-vue@^0.0.4 ant-design-vue vue
```

在 Vue 应用入口加载 Ant Design Vue 基础样式与 Designer Standard 主题：

```ts
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/designer/styles'
```

随后创建设计器实例并渲染 `DcDesigner`。从创建 Vite 项目开始的完整最小物料、组件映射和字段 adapter 示例见[快速开始：挂载编辑器](https://hackycy.github.io/dragcraft/guide/learn/first-editor)。

## Packages

| Packages | Version | Downloads |
| --- | --- | --- |
| [`@dragcraft/designer`](https://www.npmjs.com/package/@dragcraft/designer) | [![npm version](https://img.shields.io/npm/v/%40dragcraft%2Fdesigner)](https://www.npmjs.com/package/@dragcraft/designer) | [![npm downloads](https://img.shields.io/npm/dm/%40dragcraft%2Fdesigner)](https://www.npmjs.com/package/@dragcraft/designer) |
| [`@dragcraft/fields-ant-design-vue`](https://www.npmjs.com/package/@dragcraft/fields-ant-design-vue) | [![npm version](https://img.shields.io/npm/v/%40dragcraft%2Ffields-ant-design-vue)](https://www.npmjs.com/package/@dragcraft/fields-ant-design-vue) | [![npm downloads](https://img.shields.io/npm/dm/%40dragcraft%2Ffields-ant-design-vue)](https://www.npmjs.com/package/@dragcraft/fields-ant-design-vue) |
| [`@dragcraft/device-frames`](https://www.npmjs.com/package/@dragcraft/device-frames) | [![npm version](https://img.shields.io/npm/v/%40dragcraft%2Fdevice-frames)](https://www.npmjs.com/package/@dragcraft/device-frames) | [![npm downloads](https://img.shields.io/npm/dm/%40dragcraft%2Fdevice-frames)](https://www.npmjs.com/package/@dragcraft/device-frames) |

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 可视化设计器 | 三栏工作台，支持物料面板、画布编辑、节点选择和属性配置。 |
| 页面结构编排 | 使用 Schema 和布局计划表达内容区、固定区域、浮层与外部容器子区域。 |
| 业务物料扩展 | 通过物料元数据和组件映射，将业务组件接入画布与配置面板。 |
| 表单与字段扩展 | 通过 Form Schema 配置属性面板，可使用 Ant Design Vue adapter 或自定义字段组件。 |
| 主题与设备预览 | 提供 Standard 工作台主题和可替换的设备外壳，也支持完整自定义工作台视觉。 |
| 页面生命周期 | 提供导入、导出与编辑事件；草稿、发布、权限和生产运行时由业务应用掌控。 |

## 文档导航

- [文档首页](https://hackycy.github.io/dragcraft/)
- [准备项目](https://hackycy.github.io/dragcraft/guide/learn/prerequisites)
- [快速开始：挂载编辑器](https://hackycy.github.io/dragcraft/guide/learn/first-editor)
- [理解 Dragcraft 的边界](https://hackycy.github.io/dragcraft/guide/learn/mental-model)
- [保存 Schema，并通过命令写入](https://hackycy.github.io/dragcraft/guide/learn/schema-and-write-path)
- [安排内容、Chrome 和浮层](https://hackycy.github.io/dragcraft/guide/learn/page-layout)
- [让业务容器承载子节点](https://hackycy.github.io/dragcraft/guide/learn/containers)
- [业务物料](https://hackycy.github.io/dragcraft/guide/customization/materials)
- [主题、设备与国际化](https://hackycy.github.io/dragcraft/guide/customization/theme-device-and-i18n)
- [生命周期与运行时](https://hackycy.github.io/dragcraft/guide/customization/lifecycle-and-runtime)
- [API 参考](https://hackycy.github.io/dragcraft/reference/overview)
- [架构设计](https://github.com/hackycy/dragcraft/tree/main/.github/architecture)

## 本地开发

```bash
pnpm install
pnpm dev
```

## 参与贡献

欢迎通过 [Issue](https://github.com/hackycy/dragcraft/issues) 提交问题或建议。在提交变更前，请依次运行：

```bash
pnpm build
pnpm lint
pnpm typecheck
```

## License

[MIT](./LICENSE) License Copyright (c) [hackycy](https://github.com/hackycy)
