# dragcraft

采用 `Core Engine + UI Shell` 架构，构建核心与 UI 分离的低代码 / 无代码设计引擎。

## 一、产品目标

- 开箱即用：业务方只需要引入 `@dragcraft/designer` 即可完成设计器接入。
- 单一出口：所有可用能力都由 `@dragcraft/designer` 统一导出（含类型、插件、默认实现）。
- 高可定制：支持左侧物料区、中心画布容器、画布内物料渲染、右侧配置区按需替换。
- 强内核：`@dragcraft/core` 不依赖 Vue，不包含 UI，负责状态、命令、历史、注册和事件语义。

## 二、Monorepo 目录结构

```plaintext
root
├── package.json
├── pnpm-workspace.yaml
├── packages
│   ├── core             # 核心引擎（纯逻辑）
│   ├── designer         # 对外唯一入口（Vue3 UI Shell）
│   ├── renderer         # Schema -> Vue 组件渲染层
│   ├── form-generator   # Schema 表单引擎（配置面板）
│   ├── widgets          # 物料协议与默认物料实现
│   └── utils            # 通用工具函数
├── playground           # 本地演示与联调
└── docs                 # 详细设计文档
```

## 三、分层架构

### 3.1 Core Engine（无 UI）

负责：

- Schema 状态树管理（页面、容器、组件节点）。
- 命令系统（新增、移动、删除、更新）。
- 历史记录（undo/redo，批处理事务）。
- 注册中心（widget、容器、表单 schema）。
- 事件总线（拖拽生命周期、选中变化、变更通知）。

### 3.2 UI Shell（Vue3）

由 `@dragcraft/designer` 组合以下模块：

- 左栏：物料面板（支持分组、搜索、拖拽、用户自定义渲染）。
- 中栏：画布区域（支持容器壳自定义渲染，仅容器可替换；拖入高亮态）。
- 右栏：配置面板（Tab：全局配置 / 当前选中 Widget 配置）。

## 四、对外使用模式（唯一入口）

业务方标准接入流程：

1. 安装并引入 `@dragcraft/designer`。
2. 传入 `DesignerOptions`（物料、容器、表单 schema、初始 schema）。
3. 在 Vue3 中挂载 `<DcDesigner />`。
4. 通过 `designerApi` 调用所有操作（增删改查、历史、导入导出、事件订阅）。

## 五、关键交互约束

### 5.1 左侧物料区

- 支持物料分组：基础组件 / 表单组件 / 业务组件等。
- 每个 widget 都定义自己的表单 schema（属性配置协议）。
- 支持 `renderWidgetItem` 扩展点，用于自定义左栏物料卡片 UI。

### 5.2 中间画布区

- 仅容器支持自定义渲染（如手机壳、平板壳、PC 画板壳）。
- 组件落点仍由 core 的 schema 驱动，避免 UI 自定义破坏数据一致性。
- 拖拽悬停时支持 DropZone 高亮（边框、背景、占位提示态）。
- 支持 `renderWidgetNode` 扩展点：画布内 widget 的展示可由用户重写。

### 5.3 右侧配置区

- 采用 schema 表单驱动。
- 固定包含两个 Tab：`Global`（全局配置）与 `Widget`（当前选中组件配置）。
- 全局配置始终可见；Widget 配置随选中态变化。

## 六、非功能性设计要求

- 运行时一致性：所有写操作必须通过命令系统进入 core。
- 可扩展性：所有可替换能力通过显式扩展点，不破坏默认行为。
- 可测试性：core 可独立单元测试；UI 层以集成测试验证交互。
- 向后兼容：schema 需包含版本号并提供迁移钩子。

## 七、包职责总览

- `@dragcraft/core`：领域模型、状态机、命令、历史、事件、注册协议。
- `@dragcraft/designer`：对外 API、Vue3 设计器布局与交互编排。
- `@dragcraft/renderer`：将 schema 节点映射为组件树。
- `@dragcraft/form-generator`：渲染属性面板 schema 表单。
- `@dragcraft/widgets`：默认物料与物料协议实现。
- `@dragcraft/utils`：跨包复用的纯函数工具。
