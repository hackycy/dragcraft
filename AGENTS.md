# dragcraft

采用 `Core Engine + UI Shell` 架构，构建核心与 UI 分离的低代码 / 无代码设计引擎。

## 一、产品目标

- 开箱即用：业务方只需要引入 `@dragcraft/designer` 即可完成设计器接入。
- 单一出口：所有可用能力都由 `@dragcraft/designer` 统一导出（含类型、插件、默认实现）。
- 高可定制：支持左侧物料区、中心画布、右侧配置区按需替换。
- 强内核：`@dragcraft/core`不包含 UI，负责状态、命令、历史、注册和事件语义。

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

- Schema 状态管理（根节点 + 扁平 widget 列表）。
- 命令系统（新增、移动、删除、更新）。
- 历史记录（undo/redo，批处理事务）。
- 注册中心（widget、表单 schema）。
- 事件总线（拖拽生命周期、选中变化、变更通知）。

### 3.2 UI Shell（Vue3）

由 `@dragcraft/designer` 组合以下模块：

- 左栏：物料面板（支持分组、搜索、拖拽、用户自定义渲染）。
- 中栏：画布区域（扁平 widget 列表渲染；拖入高亮态；mask 覆盖层控制交互；选中浮动工具栏）。
- 右栏：配置面板（Tab：全局配置 / 当前选中 Widget 配置）。

## 四、数据模型

### 4.1 扁平架构

Schema 采用扁平 widget 列表模型，无树结构、无容器嵌套：

```ts
interface SchemaNode {
  id: string
  type: string
  props: Record<string, unknown>
  style?: Record<string, unknown>
  children?: SchemaNode[] // 仅 root 节点使用
}
```

- `root.children` 是扁平的 widget 数组。
- 不存在 `nodeType`、不区分容器和 widget。
- 不支持嵌套子节点（`children` 仅 root 保留）。

### 4.2 Mask 概念

每个 widget 可通过 `WidgetMeta.mask` 字段控制画布中的交互行为：

- `mask: true`（默认）：widget 上方覆盖透明遮罩层，阻止直接交互，点击遮罩选中 widget。
- `mask: false`：widget 可直接交互，hover 时右上角显示选中 handle。

### 4.3 选中态与工具栏

- 选中的 widget 显示明显的蓝色实线边框 + 阴影（`dc-node--selected`）。
- 选中时在 widget 右侧浮动显示工具栏（拖拽排序 / 上移 / 下移 / 删除）。
- 拖拽排序按钮支持 HTML5 原生拖拽，拖住该按钮可将 widget 拖拽到画布中的目标位置进行排序，通过 `MOVE_NODE` 命令完成重排。
- hover 状态显示蓝色虚线边框（`dc-node--hovered`）。

## 五、对外使用模式（唯一入口）

业务方标准接入流程：

1. 安装并引入 `@dragcraft/designer`。
2. 传入 `DesignerOptions`（物料、表单 schema、初始 schema）。
3. 在 Vue3 中挂载 `<DcDesigner />`。
4. 通过 `designerApi` 调用所有操作（增删改查、历史、导入导出、事件订阅）。

## 六、关键交互约束

### 6.1 左侧物料区

- 支持物料分组：基础组件 / 表单组件。
- 每个 widget 都定义自己的表单 schema（属性配置协议）。
- 支持 `renderWidgetItem` 扩展点，用于自定义左栏物料卡片 UI。

### 6.2 中间画布区

- 画布为 root 节点，所有 widget 平铺在 root.children 中。
- 拖拽 widget 支持任意位置插入，通过鼠标 Y 坐标与各 widget 垂直中点比较实时计算插入索引。
- 支持 mask 覆盖层（默认开启）控制 widget 在画布中的可交互性。
- 选中 widget 后右侧浮动工具栏提供拖拽排序、上移、下移、删除操作。
- 拖拽悬停时 DropIndicator 在精确插入位置渲染（由 `dragOverIndex` 驱动）。
- 空画布显示"拖拽组件到这里"占位提示。
- 点击画布空白处取消选中。

### 6.3 右侧配置区

- 采用 schema 表单驱动。
- 固定包含两个 Tab：`Global`（全局配置）与 `Widget`（当前选中组件配置）。
- 全局配置始终可见；Widget 配置随选中态变化。
- 修改配置后画布实时预览效果。

## 七、非功能性设计要求

- 运行时一致性：所有写操作必须通过命令系统进入 core。
- 可扩展性：所有可替换能力通过显式扩展点，不破坏默认行为。
- 可测试性：core 可独立单元测试；UI 层以集成测试验证交互。
- 向后兼容：schema 需包含版本号并提供迁移钩子。

## 八、包职责总览

- `@dragcraft/core`：领域模型、状态机、命令、历史、事件、注册协议。
- `@dragcraft/designer`：对外 API、Vue3 设计器布局与交互编排。
- `@dragcraft/renderer`：将 schema 节点映射为组件树。
- `@dragcraft/form-generator`：渲染属性面板 schema 表单。
- `@dragcraft/widgets`：默认物料与物料协议实现。
- `@dragcraft/utils`：跨包复用的纯函数工具。
