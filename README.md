# dragcraft

面向小程序装修场景的可视化页面搭建引擎。采用拖拽式物料编排，通过 Schema 驱动渲染，帮助业务方快速搭建小程序页面。

## 设计原则

- **无头组件库**：所有 UI 包仅输出语义化 BEM 类名，不捆绑 CSS —— 实现逻辑与样式完全解耦。
- 核心与 UI 解耦：`@dragcraft/core` 专注状态、命令与安全读取 facade；UI 侧读取优先走 `engine.state`，写入统一走 `engine.execute()`。
- 单一对外入口：业务方仅需使用 `@dragcraft/designer`。
- 开箱即用：`@dragcraft/themes` 提供内置皮肤，一行 import 获得完整视觉效果。
- 可扩展：左栏物料、中间画布容器、画布节点、右栏表单均支持扩展。

## 快速开始

```typescript
// 1. 导入皮肤（二选一）
import '@dragcraft/themes/shadcn'       // 默认：紧凑、企业蓝调的产品工作台
// import '@dragcraft/themes/material'  // Google Material 3

// 2. 导入设计器
import { createDesigner, DcDesigner } from '@dragcraft/designer'
```

## 快速理解

- 外部接入：引入 `@dragcraft/designer` + `@dragcraft/themes`。
- 读写边界：读取 schema 与交互状态优先使用 `engine.state`，schema 写入必须执行 core command。
- 左栏：物料分组 + 可自定义物料项渲染。
- 中栏：支持容器壳自定义（仅容器）+ 拖拽高亮态。
- 右栏：Schema 表单，Tab 分为全局配置与 widget 配置。
- 无头模式：不导入 `@dragcraft/themes`，自行编写全部 CSS。

## 文档

- [`docs/`](./docs/): 面向接入者的文档站点
- [`.github/architecture/`](./.github/architecture/): 面向维护者的架构文档

## Packages

| Package | Architecture |
| ------- | ------------ |
| `@dragcraft/core` | [Schema 与 Core Engine](./.github/architecture/02-schema-and-core.md) |
| `@dragcraft/designer` | [Designer 与 Renderer](./.github/architecture/03-designer-and-renderer.md) |
| `@dragcraft/renderer` | [Designer 与 Renderer](./.github/architecture/03-designer-and-renderer.md) |
| `@dragcraft/form-generator` | [Form 与配置系统](./.github/architecture/04-form-and-configuration.md) |
| `@dragcraft/fields-ant-design-vue` | [物料、字段与工具包](./.github/architecture/05-widgets-fields-and-utils.md) |
| `@dragcraft/widgets` | [物料、字段与工具包](./.github/architecture/05-widgets-fields-and-utils.md) |
| `@dragcraft/themes` | [主题与设备容器](./.github/architecture/06-themes-and-device-frames.md) |
| `@dragcraft/device-frames` | [主题与设备容器](./.github/architecture/06-themes-and-device-frames.md) |
| `@dragcraft/icons` | [包职责索引](./.github/architecture/07-package-reference.md) |
| `@dragcraft/utils` | [包职责索引](./.github/architecture/07-package-reference.md) |

## License

[MIT](./LICENSE) License © [hackycy](https://github.com/hackycy)
