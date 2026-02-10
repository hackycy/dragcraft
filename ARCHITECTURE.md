# dragcraft

采用`Core Engine + UI Shell`的模式构建一个核心与UI分离的低代码（Low-Code）/ 无代码（No-Code）引擎设计框架

## @dragcraft/core

Core 是引擎核心，负责状态容器、命令管线、注册中心、历史记录、拖拽状态和插件生命周期。所有状态变更必须通过命令完成。

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
- types: schema 与 definition 的共享类型。

### 状态模型
- GlobalConfigSchema[]: 全局配置集合，支持分类管理。
  - 每个配置包含 `category` 字段标识配置类别（如 'page'、'theme'、'layout' 等）。
  - 配置分类完全由使用者通过 registry 定义，引擎不预设固定分类。
  - 示例：页面配置 `{ category: 'page', type: 'basic-page', props: { title: '', backgroundColor: '#fff' } }`
  - 示例：主题配置 `{ category: 'theme', type: 'dark-theme', props: { primaryColor: '#000' } }`
- WidgetSchema[]: 扁平化 widget 列表（不支持嵌套）。
- activeId: 当前选中对象 ID（widget/globalConfig/null）。
- activeType: 当前选中对象类型（'widget' | 'globalConfig'）。

### 命令生命周期
1. 校验参数与前置条件。
2. 若命令可撤销，生成快照并写入 history。
3. 执行命令变更 state（widget 或 globalConfig）。
4. 广播 `command:before` 事件（可被插件拦截或修改）。
5. 应用状态变更到 state。
6. 广播 `command:executed` 与 `state:changed` 事件。
7. 若执行失败，回滚状态并广播 `command:failed` 事件，保持状态不变且不写入历史。

### 事件约定
- `command:executed`: 命令执行完成，可用于审计或联动。
- `state:changed`: 状态发生变化，UI 订阅此事件更新视图。
- dnd 事件：拖拽状态变化，由 dnd 子系统发出。

### 扩展点
- Registries
	- registerWidget(definition): 注册 widget 物料定义。
	- registerConfig(category, definition): 注册全局配置定义，需指定配置分类。
	- registerRenderer(definition): 注册渲染器定义。
	- registerConfigCategory(category, options): 注册配置分类及其元信息（如显示名称、图标、描述）。
- Plugins
	- setup(engine): 注册命令、配置分类、配置定义或副作用逻辑。
- Event Bus
	- 监听 `state:changed`、`command:before`、`command:executed`、`command:failed` 以及 dnd 事件。
- Engine API
	- engine.getConfigByCategory(category): 获取指定分类的所有配置。
	- engine.updateGlobalConfig(id, props): 更新全局配置属性。
	- engine.addGlobalConfig(category, type, props): 添加新的全局配置。
	- engine.removeGlobalConfig(id): 删除全局配置。
	- engine.listConfigCategories(): 列出所有已注册的配置分类。

### 非目标
- 不包含任何 UI 渲染。
- 不支持嵌套 widget 树（只支持扁平列表）。
- 响应式依赖`@vue/reactivity`

### 建议使用流程
1. 使用初始 schema 或默认值创建 `CoreEngine`。
2. 通过 registry 注册配置分类（如 'page'、'theme'、'layout'）。
3. 通过 registry 或 plugins 注册 widgets/configs/renderers。
4. UI shell 监听 event bus，并通过 commands 完成所有变更。
5. 表单引擎从 registry 读取表单 schema（widget 或 globalConfig）。
6. renderer 根据 `widgets` 与当前 `globalConfigs` 构建视图。

## 配置分类系统详解

### 核心理念

页面配置、主题配置等均属于全局配置（GlobalConfig）的不同 **分类（Category）**。引擎不预设任何固定分类，完全由使用者通过 API 定义。

### 配置分类注册

```typescript
// 1. 注册配置分类
engine.registry.registerConfigCategory('page', {
  label: '页面配置',
  icon: 'page-icon',
  description: '控制页面的基础属性，如标题、背景色等',
  allowMultiple: false, // 此分类是否允许多个实例
})

engine.registry.registerConfigCategory('theme', {
  label: '主题配置',
  icon: 'theme-icon',
  description: '全局主题样式配置',
  allowMultiple: false,
})

engine.registry.registerConfigCategory('layout', {
  label: '布局配置',
  icon: 'layout-icon',
  description: '页面布局模式配置',
  allowMultiple: true, // 允许多个布局配置
})

// 2. 注册该分类下的配置定义
engine.registry.registerConfig('page', {
  type: 'basic-page',
  label: '基础页面',
  schema: {
    title: { type: 'string', label: '页面标题', default: '' },
    backgroundColor: { type: 'color', label: '背景色', default: '#ffffff' },
    paddingTop: { type: 'number', label: '上边距', default: 0 },
    paddingBottom: { type: 'number', label: '下边距', default: 0 },
  },
})

engine.registry.registerConfig('theme', {
  type: 'dark-theme',
  label: '深色主题',
  schema: {
    primaryColor: { type: 'color', label: '主色', default: '#000000' },
    secondaryColor: { type: 'color', label: '辅助色', default: '#333333' },
    fontFamily: { type: 'string', label: '字体', default: 'Arial' },
  },
})
```

### 配置实例管理

```typescript
// 添加配置实例
const pageConfigId = engine.addGlobalConfig('page', 'basic-page', {
  title: '我的页面',
  backgroundColor: '#f5f5f5',
})

const themeConfigId = engine.addGlobalConfig('theme', 'dark-theme', {
  primaryColor: '#1a1a1a',
})

// 获取某个分类的所有配置实例
const pageConfigs = engine.getConfigByCategory('page') // [{ id, category, type, props }]
const themeConfigs = engine.getConfigByCategory('theme')

// 更新配置
engine.updateGlobalConfig(pageConfigId, {
  backgroundColor: '#ffffff',
})

// 删除配置
engine.removeGlobalConfig(themeConfigId)
```

### 状态存储结构

```typescript
interface EngineState {
  globalConfigs: GlobalConfigSchema[] // 所有全局配置实例
  widgets: WidgetSchema[]
  activeId: string | null
  activeType: 'widget' | 'globalConfig'
}

interface GlobalConfigSchema {
  id: string
  category: string // 配置分类，如 'page', 'theme', 'layout'
  type: string     // 配置类型，如 'basic-page', 'dark-theme'
  props: Record<string, any> // 配置属性值
}
```

### 典型使用场景

#### 场景 1：使用者只需要页面配置
```typescript
// 只注册 page 分类
engine.registry.registerConfigCategory('page', { ... })
engine.registry.registerConfig('page', { type: 'basic-page', ... })

// 初始化时添加一个页面配置实例
engine.addGlobalConfig('page', 'basic-page', { title: '首页' })
```

#### 场景 2：使用者需要页面 + 主题配置
```typescript
// 注册两个分类
engine.registry.registerConfigCategory('page', { ... })
engine.registry.registerConfigCategory('theme', { ... })

// 注册各自的配置定义
engine.registry.registerConfig('page', { type: 'basic-page', ... })
engine.registry.registerConfig('theme', { type: 'dark-theme', ... })
engine.registry.registerConfig('theme', { type: 'light-theme', ... })

// 初始化时添加实例
engine.addGlobalConfig('page', 'basic-page', { ... })
engine.addGlobalConfig('theme', 'dark-theme', { ... })
```

#### 场景 3：完全自定义配置分类
```typescript
// 使用者可以创建任意的配置分类
engine.registry.registerConfigCategory('seo', {
  label: 'SEO 配置',
  description: '搜索引擎优化相关设置',
})

engine.registry.registerConfig('seo', {
  type: 'basic-seo',
  schema: {
    metaTitle: { type: 'string', label: 'Meta Title', default: '' },
    metaDescription: { type: 'string', label: 'Meta Description', default: '' },
    keywords: { type: 'array', label: 'Keywords', default: [] },
  },
})
```

### 优势

1. **完全解耦**：引擎不预设任何配置分类，使用者完全自由定义。
2. **高度灵活**：页面配置只是众多全局配置分类之一，没有特殊地位。
3. **可扩展性强**：使用者可以根据业务需求添加任意数量的配置分类。
4. **统一管理**：所有配置通过相同的 API 进行注册、管理和变更。
5. **类型安全**：每个配置分类都有自己的 schema 定义，保证数据一致性。

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
│   └── utils            # 【工具】UUID, DeepClone等工具函数
├── playground           # 【演示】用于开发调试和展示
├── docs                 # 【文档】开发文档
```
