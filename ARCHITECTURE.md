# dragcraft

采用`Core Engine + UI Shell`的模式构建一个核心与UI分离的低代码（Low-Code）/ 无代码（No-Code）引擎设计框架

## Monorepo 目录结构

``` plaintext
root
├── package.json
├── pnpm-workspace.yaml
├── packages
│   ├── core             # 【核心】状态管理、事件总线、注册中心、历史记录（不含任何 UI）
│   ├── designer         # 【组装】设计器骨架（左中右布局）、拖拽交互逻辑
│   ├── renderer         # 【渲染】负责将 Schema 渲染为真实组件（含样式容器处理）
│   ├── form-generator   # 【配置】属性设置器（高度抽象的表单引擎）
│   ├── widgets          # 【物料】提供的基础组件库（Button, Image等）
│   └── utils            # 【工具】工具函数库
├── playground           # 【演示】用于开发调试和展示
├── docs                 # 【文档】开发文档
```

## [@dragcraft/core](./packages/core)

`core`是引擎核心，负责状态容器、命令管线、注册中心、历史记录、拖拽状态和插件生命周期。所有状态变更必须通过命令完成。

### 设计原则

- UI 解耦：核心不依赖 UI 框架，Shell 只通过命令与事件交互。
- 单一事实来源：物料列表、全局配置与选中态全部归一管理。
- 可回溯性：任何变更都可回放、撤销/重做。
- 注册中心优先：widgets/configs/renderers 通过 registry 统一注册与检索。
- 扩展友好：副作用集中在插件与事件监听中，核心保持可预测。
- 配置抽象化：页面配置、主题配置等全局配置均通过统一的 Config Schema 管理，由使用者决定配置分类。

### 子系统职责
- engine: 组合根，串联子系统并提供统一 API，暴露配置分类管理接口。
- state: 响应式状态仓库，支持快照/替换。
- registry: widget/config/renderer 注册中心，支持配置分类注册。
- schema: widget 与 config 的 schema 定义。
- commands: 原子状态变更的唯一入口。
- history: 撤销/重做快照记录。
- dnd: 拖拽状态存储（类型、悬停索引、数据）。
- event-bus: 发布/订阅 state 与 command 事件。
- plugin: 插件 setup 接口与生命周期管理。
