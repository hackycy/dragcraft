# 项目总览

dragcraft 是面向小程序装修场景的可视化页面搭建引擎。它采用 `Core Engine + UI Shell + Headless Themes` 的分层架构，用拖拽式物料编排和 Schema 驱动渲染帮助业务方快速搭建页面。

## 产品目标

- 开箱即用：业务方引入 `@dragcraft/designer`、`@dragcraft/themes`，并按需传入 `@dragcraft/builtin-widgets` 与 `@dragcraft/builtin-fields`，即可完成设计器接入。
- 完全可定制：业务方也可以不使用内置物料、内置字段和内置皮肤，完全自行实现物料、字段组件和 CSS。
- 无头组件：UI 包只输出语义化 BEM 类名，不捆绑业务样式。视觉样式由 `@dragcraft/themes` 或业务自定义 CSS 提供。
- 单一入口：标准业务接入以 `@dragcraft/designer` 为统一入口，designer 负责组合 core、renderer 与 form-generator。
- 强内核：`@dragcraft/core` 不包含 UI，负责状态、命令、历史、注册和事件语义。

## Monorepo 结构

```plaintext
root
├── package.json
├── pnpm-workspace.yaml
├── packages
│   ├── core             # 核心引擎，纯逻辑
│   ├── designer         # 对外入口，Vue3 UI Shell
│   ├── renderer         # Schema 到 Vue 组件的渲染层
│   ├── form-generator   # Schema 表单引擎
│   ├── widgets          # 物料协议与工具函数
│   ├── builtin-fields   # 内置表单字段组件
│   ├── builtin-widgets  # 内置物料实现
│   ├── themes           # Headless 皮肤包
│   ├── device-frames    # 设备容器框架
│   ├── icons            # SVG 图标组件库
│   └── utils            # 通用纯函数工具
├── playground           # 本地演示与联调
└── .github/architecture # 架构文档统一入口
```

## 分层架构

### Core Engine

`@dragcraft/core` 是无 UI 的领域内核，负责：

- Schema 状态管理。
- 命令系统：新增、移动、删除、更新、全局配置更新。
- 历史记录：undo、redo 与批处理事务。
- 注册中心：widget meta 与全局配置 schema。
- 事件总线：拖拽生命周期、选中变化、schema 变更通知。

所有 schema 写操作必须通过 core 的命令系统进入，UI 层不能直接修改 schema。

### UI Shell

`@dragcraft/designer` 组合设计器三栏布局：

- 左栏：物料面板，支持分组、搜索、拖拽和自定义物料项渲染。
- 中栏：画布区域，集成 renderer，支持拖入高亮、DropIndicator、mask、选中态与节点浮动工具栏。
- 右栏：配置面板，集成 form-generator，固定提供 Global 与 Widget 两个配置 Tab。

### Renderer

`@dragcraft/renderer` 负责把 core schema 渲染为 Vue 组件树。它消费 engine、componentMap、renderer extensions 与 event hooks，但不承担业务状态管理，也不直接修改 schema。

### Form Generator

`@dragcraft/form-generator` 根据 FormSchema 渲染配置表单。它不依赖 core，不执行命令，只通过 `change` 事件向 designer 报告字段变更，由 designer 转发为 core 命令。

### Headless Themes

`@dragcraft/themes` 提供与组件逻辑解耦的 CSS 皮肤：

- 所有 UI 包输出 `dc-*` BEM 类名。
- 皮肤包基于 CSS 变量和共享组件样式实现视觉表现。
- 内置 `antd` 与 `material` 两套 light 皮肤。
- 业务可不导入皮肤进入无头模式，也可覆盖 CSS 变量快速换肤。

## 标准接入模式

```ts
import '@dragcraft/themes/antd'
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'
import { getAllWidgetMetas, getDefaultComponentMap } from '@dragcraft/builtin-widgets'

const designer = createDesigner({
  widgetMetas: getAllWidgetMetas(),
  componentMap: getDefaultComponentMap(),
  fieldComponentMap: buildDefaultFieldComponentMap(),
})
```

标准流程：

1. 导入 `@dragcraft/designer` 和一套主题样式。
2. 显式传入 `widgetMetas` 与 `componentMap`。
3. 按需传入 `fieldComponentMap` 与全局配置 schema。
4. 在 Vue3 中挂载 `<DcDesigner />`。
5. 通过 `useDesigner()` 调用导入导出、历史、事件订阅和命令执行能力。

## 跨包设计约束

- Runtime 一致性：所有 schema 写操作必须通过 core command。
- Headless 一致性：UI 逻辑包不内置主题样式，只输出稳定 class。
- 可扩展性：左栏物料、画布容器、节点渲染、节点工具栏、空状态、右栏表单都通过显式扩展点替换。
- 可测试性：core 可独立单元测试，UI 层通过集成测试覆盖交互。
- Schema 版本化：schema 必须携带版本号，后续结构演进应显式识别语义。
- Workspace 依赖：包之间通过 pnpm workspace 依赖引用。
