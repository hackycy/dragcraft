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
