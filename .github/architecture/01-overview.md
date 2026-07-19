# 项目总览

dragcraft 是面向小程序装修场景的可视化页面搭建引擎。它采用 `Core Engine + Themeable UI Shell + Workbench Themes` 的分层架构，用拖拽式物料编排和 Schema 驱动渲染帮助业务方快速搭建页面。

## 产品目标

- 开箱即用：业务方引入 `@dragcraft/designer`、`@dragcraft/themes` 和内置字段包，并显式传入自己的物料与配置 schema，即可完成设计器接入。
- 完全可定制：业务方可以自行实现物料、字段 adapter、内容主题和工作台主题差异。
- 可主题化 UI Shell：组件包拥有 DOM、结构行为与必要结构 CSS，工作台主题只通过稳定 token 与精选 component/part/state 钩子定制视觉。
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
│   ├── fields           # UI 库字段 adapter 包
│   ├── widgets          # 物料协议与工具函数
│   ├── themes           # 工作台主题聚合、令牌与视觉配方
│   ├── device-frames    # 设备容器框架
│   ├── icons            # SVG 图标组件库
│   ├── i18n             # Vue 国际化上下文
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
`engine.state` 是对外读取 schema 与运行时状态的安全入口，返回当前已提交的深冻结快照；快照引用在下一条有效变更命令前保持稳定。`engine.store` 只公开只读 refs 与 selection/hover/drag 交互方法。Core 内部只允许命令拥有可写 draft，业务侧无法绕过命令系统写 schema。

### UI Shell

`@dragcraft/designer` 组合设计器三栏布局：

- 左栏：物料面板，支持分组、搜索、拖拽和自定义物料项渲染。
- 中栏：画布区域，集成 renderer，支持拖入高亮、DropIndicator、mask、选中态与节点浮动工具栏。
- 右栏：配置面板，集成 form-generator，固定提供 Global 与 Widget 两个配置 Tab。

### Renderer

`@dragcraft/renderer` 负责把 core schema 渲染为 Vue 组件树。它消费 engine、componentMap、renderer extensions 与 event hooks，但不承担业务状态管理，也不直接修改 schema。

### Form Generator

`@dragcraft/form-generator` 根据 FormSchema 渲染配置表单。它不依赖 core，不执行命令，只通过 `change` 事件向 designer 报告字段变更，由 designer 转发为 core 命令。

### Workbench Themes

`@dragcraft/themes` 提供与组件结构行为分层的工作台主题：

- designer、renderer 与 form-generator 分别发布自身必要的结构 CSS。
- Standard 提供完整默认 token 与共享基线视觉配方，Material 只维护差异。
- 外部主题通过公开 token 和精选 hook 增量覆盖；内部 BEM 不属于公共契约。
- 工作台主题不样式化画布内业务物料，内容主题由宿主独立拥有。

## 标准接入模式

```ts
import '@dragcraft/themes'
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designer = createDesigner({
  widgetMetas: myWidgetMetas,
  componentMap: myComponentMap,
  fieldComponentMap: createAntDesignVueFields(),
})
```

标准流程：

1. 导入 `@dragcraft/designer` 和一套主题样式。
2. 显式传入 `widgetMetas` 与 `componentMap`。
3. 传入字段 adapter map，可直接使用内置字段包，也可合并业务自定义字段。
4. 在 Vue3 中挂载 `<DcDesigner />`。
5. 通过 `useDesigner()` 调用导入导出、历史、事件订阅和命令执行能力。

## 跨包设计约束

- Runtime 一致性：schema 写操作必须通过 core command；无效或被拒绝的命令不写入 history，也不触发 `schema:changed`。
- 主题一致性：UI 包拥有结构样式，Themes 拥有视觉配方；公共主题契约不暴露内部 BEM。
- 可扩展性：左栏物料、画布容器、节点渲染、节点工具栏、空状态、右栏表单都通过显式扩展点替换。
- 可测试性：core 可独立单元测试，UI 层通过集成测试覆盖交互。
- Schema 版本化：schema 必须携带版本号，后续结构演进应显式识别语义。
- Workspace 依赖：包之间通过 pnpm workspace 依赖引用。
