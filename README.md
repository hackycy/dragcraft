<div align="center">
  <h1 align="center">dragcraft</h1>
  <p align="center">面向小程序装修场景的可视化页面搭建引擎</p>
  <p align="center">
    用可视化设计器、结构化 Schema 和可扩展的 Vue UI Shell，构建可维护的页面装修后台。
  </p>
  <p align="center">
    <a href="https://hackycy.github.io/dragcraft/"><strong>阅读文档</strong></a>
    &nbsp;|&nbsp;
    <a href="https://hackycy.github.io/dragcraft/playground"><strong>在线体验</strong></a>
    &nbsp;|&nbsp;
    <a href="https://github.com/hackycy/dragcraft">GitHub</a>
  </p>
  <p align="center">
    <a href="https://github.com/hackycy/dragcraft/blob/main/LICENSE">MIT License</a>
    &nbsp;|&nbsp;
    Vue 3
    &nbsp;|&nbsp;
    TypeScript
  </p>
</div>

## 从这里开始

| 我想要 | 前往 |
| --- | --- |
| 先看看设计器实际效果 | [打开 Playground](https://hackycy.github.io/dragcraft/playground) |
| 把设计器集成到 Vue 应用 | [快速开始](https://hackycy.github.io/dragcraft/guide/getting-started) |
| 理解 Schema、命令和包的边界 | [核心心智模型](https://hackycy.github.io/dragcraft/guide/mental-model) |
| 接入业务物料、属性表单或容器组件 | [扩展设计器](https://hackycy.github.io/dragcraft/guide/materials-and-fields) |
| 查阅包的公开 API | [API 参考](https://hackycy.github.io/dragcraft/reference/overview) |

## 为什么选择 dragcraft

- **为页面装修而设计**：围绕物料拖拽、属性配置、设备预览和页面结构编排构建，而不只是一个通用拖拽容器。
- **Schema 驱动**：页面结构与属性保存为稳定、可导入导出的 Schema；业务运行时负责解释并渲染页面。
- **写入可控**：新增、移动、删除和属性更新统一经由命令系统，天然接入历史记录、事件通知和行为约束。
- **开箱即用，也能深度扩展**：标准设计器组合了画布与配置表单；物料、字段、容器、设备框架和主题都可按业务替换。

## 快速开始

安装设计器和默认主题：

```bash
pnpm add @dragcraft/designer @dragcraft/themes @dragcraft/fields-ant-design-vue ant-design-vue vue
```

在 Vue 应用入口加载字段样式与 dragcraft 主题：

```ts
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/themes'
```

随后创建设计器实例并渲染 `DcDesigner`。完整的最小物料、组件映射和字段 adapter 示例见[快速开始](https://hackycy.github.io/dragcraft/guide/getting-started)。

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 可视化设计器 | 三栏工作台，支持物料面板、画布编辑、节点选择和属性配置。 |
| 页面结构编排 | 使用 Schema 和布局计划表达内容区、固定区域、浮层与外部容器子区域。 |
| 业务物料扩展 | 通过物料元数据和组件映射，将业务组件接入画布与配置面板。 |
| 表单与字段扩展 | 通过 Form Schema 配置属性面板，可使用 Ant Design Vue adapter 或自定义字段组件。 |
| 主题与设备预览 | 提供 Standard、Material 主题和可替换的设备外壳，也支持完整自定义工作台视觉。 |
| 页面生命周期 | 提供导入、导出与编辑事件；草稿、发布、权限和生产运行时由业务应用掌控。 |

## 文档导航

- [文档首页](https://hackycy.github.io/dragcraft/)
- [快速开始](https://hackycy.github.io/dragcraft/guide/getting-started)
- [接入设计器](https://hackycy.github.io/dragcraft/guide/designer-integration)
- [自定义物料与字段](https://hackycy.github.io/dragcraft/guide/materials-and-fields)
- [主题与设备框架](https://hackycy.github.io/dragcraft/guide/themes-and-device-frames)
- [保存草稿与发布](https://hackycy.github.io/dragcraft/guide/saving-and-publishing)
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
