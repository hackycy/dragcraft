# dragcraft

低代码（Low-Code）/ 无代码（No-Code）引擎

## 设计原则

- **无头组件库**：所有 UI 包仅输出语义化 BEM 类名，不捆绑 CSS —— 实现逻辑与样式完全解耦。
- 核心与 UI 解耦：`@dragcraft/core` 专注状态与命令。
- 单一对外入口：业务方仅需使用 `@dragcraft/designer`。
- 开箱即用：`@dragcraft/themes` 提供内置皮肤，一行 import 获得完整视觉效果。
- 可扩展：左栏物料、中间画布容器、画布节点、右栏表单均支持扩展。

## 快速开始

```typescript
// 1. 导入皮肤（二选一）
import '@dragcraft/themes/antd'       // Ant Design 风格
// import '@dragcraft/themes/material' // Material Design 风格

// 2. 导入设计器
import { createDesigner, DcDesigner } from '@dragcraft/designer'
```

## 快速理解

- 外部接入：引入 `@dragcraft/designer` + `@dragcraft/themes`。
- 左栏：物料分组 + 可自定义物料项渲染。
- 中栏：支持容器壳自定义（仅容器）+ 拖拽高亮态。
- 右栏：Schema 表单，Tab 分为全局配置与 widget 配置。
- 无头模式：不导入 `@dragcraft/themes`，自行编写全部 CSS。

## Packages

| Package | Version |
| ------- | ------- |
| [@dragcraft/core](./packages/core) | 🚧 |
| [@dragcraft/designer](./packages/designer) | 🚧 |
| [@dragcraft/form-generator](./packages/form-generator) | 🚧 |
| [@dragcraft/renderer](./packages/renderer) | 🚧 |
| [@dragcraft/themes](./packages/themes) | 🚧 |
| [@dragcraft/utils](./packages/utils) | 🚧 |
| [@dragcraft/widgets](./packages/widgets) | 🚧 |

## License

[MIT](./LICENSE) License © [hackycy](https://github.com/hackycy)
