# dragcraft

低代码（Low-Code）/ 无代码（No-Code）引擎

## 设计原则

- 核心与 UI 解耦：`@dragcraft/core` 专注状态与命令。
- 单一对外入口：业务方仅需使用 `@dragcraft/designer`。
- 可扩展：左栏物料、中间画布容器、画布节点、右栏表单均支持扩展。

## 快速理解

- 外部接入：仅引入 `@dragcraft/designer`。
- 左栏：物料分组 + 可自定义物料项渲染。
- 中栏：支持容器壳自定义（仅容器）+ 拖拽高亮态。
- 右栏：Schema 表单，Tab 分为全局配置与 widget 配置。

## Packages

| Package | Version |
| ------- | ------- |
| [@dragcraft/core](./packages/core) | 🚧 |
| [@dragcraft/designer](./packages/designer) | 🚧 |
| [@dragcraft/form-generator](./packages/form-generator) | 🚧 |
| [@dragcraft/renderer](./packages/renderer) | 🚧 |
| [@dragcraft/utils](./packages/utils) | 🚧 |
| [@dragcraft/widgets](./packages/widgets) | 🚧 |

## License

[MIT](./LICENSE) License © [hackycy](https://github.com/hackycy)
