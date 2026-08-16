<div align="center">
  <h1 align="center">dragcraft</h1>
  <p align="center">面向垂直业务场景的 Schema 驱动可视化页面编排框架</p>
  <p align="center">
    用可扩展业务物料、结构化 DocumentSchema 和 Vue 设计工作台，搭建可维护的列表、详情、营销与配置等业务页面。
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
| 从零搭建可保存、可预览的页面编辑器 | [准备开发](https://hackycy.github.io/dragcraft/guide/learn/prerequisites) |
| 理解 DocumentSchema、AuthoringAction 与公开包的边界 | [Schema 与写入链路](https://hackycy.github.io/dragcraft/guide/learn/schema-and-write-path) |
| 接入业务物料、属性表单或容器组件 | [高级自定义](https://hackycy.github.io/dragcraft/guide/customization/materials) |
| 查阅包的公开 API | [API 参考](https://hackycy.github.io/dragcraft/reference/overview) |

## 为什么选择 dragcraft

- **为业务页面编排而设计**：围绕业务物料、属性配置、设备预览和受约束的页面结构编排构建，适用于小程序装修等垂直业务场景，而不只是一个通用拖拽容器。
- **DocumentSchema 驱动**：页面结构与属性保存为稳定、可导入导出的 `DocumentSchema`；业务运行时负责解释并渲染页面。
- **AuthoringAction 写入**：新增、移动、删除和属性更新统一经过 `AuthoringAction`，并共享 history、事件通知和 authoring policy。
- **开箱即用，也能深度扩展**：标准设计器组合了画布与配置表单；`MaterialDefinition`、字段、容器、Device Frame 和主题都可按业务替换。

## 快速开始

安装设计器和默认字段 adapter：

```bash
pnpm add @dragcraft/designer @dragcraft/fields-ant-design-vue ant-design-vue vue
```

在 Vue 应用入口加载 Ant Design Vue 基础样式与 Designer Standard 主题：

```ts
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/designer/standard.css'
```

随后创建设计器实例并渲染 `DcDesigner`。完整的最小 `MaterialDefinition`、Designer Presentation 和字段 adapter 示例见[挂载最小编辑器](https://hackycy.github.io/dragcraft/guide/learn/first-editor)。

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
| 页面结构编排 | 使用 DocumentSchema 与布局投影表达内容区、固定区域、浮层与外部容器子区域。 |
| 业务物料扩展 | 通过 MaterialDefinition 和 Designer Presentation，将业务组件接入画布与配置面板。 |
| 表单与字段扩展 | 通过 Form Schema 配置属性面板，可使用 Ant Design Vue adapter 或自定义字段组件。 |
| 主题与设备预览 | 提供 Standard 工作台主题和可替换的设备外壳，也支持完整自定义工作台视觉。 |
| 页面生命周期 | 提供导入、导出与编辑事件；草稿、发布、权限和生产运行时由业务应用掌控。 |

## 文档导航

- [文档首页](https://hackycy.github.io/dragcraft/)
- [准备开发](https://hackycy.github.io/dragcraft/guide/learn/prerequisites)
- [挂载最小编辑器](https://hackycy.github.io/dragcraft/guide/learn/first-editor)
- [理解 Schema 与写入链路](https://hackycy.github.io/dragcraft/guide/learn/schema-and-write-path)
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
pnpm test
pnpm test:browser
pnpm skills:check
pnpm skills:test
```

## License

[MIT](./LICENSE) License Copyright (c) [hackycy](https://github.com/hackycy)
