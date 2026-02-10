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
- 配置类型化：全局配置通过 type 区分，引擎不预设任何配置类型，完全由使用者定义。

### 子系统职责
- engine: 组合根，串联子系统并提供统一 API。
- state: 响应式状态仓库，支持快照/替换。
- registry: widget/config/renderer 注册中心。
- schema: widget 与 config 的 schema 定义。
- commands: 原子状态变更的唯一入口。
- history: 撤销/重做快照记录。
- dnd: 拖拽状态存储（类型、悬停索引、数据）。
- event-bus: 发布/订阅 state 与 command 事件。
- plugin: 插件 setup 接口与生命周期管理。
- types: schema 与 definition 的共享类型。

### 状态模型
- GlobalConfigSchema[]: 全局配置集合。
  - 每个配置通过 `type` 字段标识配置类型（如 'page-config'、'theme-config'、'layout-config' 等）。
  - 配置类型完全由使用者通过 registry 定义，引擎不预设任何配置类型。
  - 示例：页面配置 `{ id: 'xxx', type: 'page-config', props: { title: '', backgroundColor: '#fff' } }`
  - 示例：主题配置 `{ id: 'yyy', type: 'theme-config', props: { primaryColor: '#000' } }`
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
	- registerConfig(definition): 注册全局配置定义。
	- registerRenderer(definition): 注册渲染器定义。
- Plugins
	- setup(engine): 注册命令、配置定义或副作用逻辑。
- Event Bus
	- 监听 `state:changed`、`command:before`、`command:executed`、`command:failed` 以及 dnd 事件。
- Engine API
	- engine.addGlobalConfig(type, props): 添加新的全局配置。
	- engine.updateGlobalConfig(id, props): 更新全局配置属性。
	- engine.removeGlobalConfig(id): 删除全局配置。
	- engine.getGlobalConfig(id): 获取指定 ID 的配置。
	- engine.getGlobalConfigsByType(type): 获取指定类型的所有配置。

### 非目标
- 不包含任何 UI 渲染。
- 不支持嵌套 widget 树（只支持扁平列表）。
- 响应式依赖`@vue/reactivity`

### 建议使用流程
1. 使用初始 schema 或默认值创建 `CoreEngine`。
2. 通过 registry 或 plugins 注册 widgets/configs/renderers。
3. UI shell 监听 event bus，并通过 commands 完成所有变更。
4. 表单引擎从 registry 读取表单 schema（widget 或 globalConfig）。
5. renderer 根据 `widgets` 与当前 `globalConfigs` 构建视图。

## 配置系统详解

### 核心理念

所有全局配置（如页面配置、主题配置、布局配置等）均通过 **type** 字段区分。引擎不预设任何配置类型，完全由使用者自由定义。每个配置类型对应一个配置定义（ConfigDefinition），包含该类型的 schema、默认值、标签等元信息。

### 配置类型注册

```typescript
// 注册页面配置类型
engine.registry.registerConfig({
  type: 'page-config',
  label: '页面配置',
  icon: 'page-icon',
  description: '控制页面的基础属性，如标题、背景色等',
  schema: {
    title: { type: 'string', label: '页面标题', default: '' },
    backgroundColor: { type: 'color', label: '背景色', default: '#ffffff' },
    paddingTop: { type: 'number', label: '上边距', default: 0 },
    paddingBottom: { type: 'number', label: '下边距', default: 0 },
  },
})

// 注册主题配置类型
engine.registry.registerConfig({
  type: 'theme-config',
  label: '主题配置',
  icon: 'theme-icon',
  description: '全局主题样式配置',
  schema: {
    primaryColor: { type: 'color', label: '主色', default: '#000000' },
    secondaryColor: { type: 'color', label: '辅助色', default: '#333333' },
    fontFamily: { type: 'string', label: '字体', default: 'Arial' },
  },
})

// 注册布局配置类型
engine.registry.registerConfig({
  type: 'layout-config',
  label: '布局配置',
  icon: 'layout-icon',
  description: '页面布局模式配置',
  schema: {
    mode: { type: 'select', label: '布局模式', options: ['fluid', 'fixed'], default: 'fluid' },
    maxWidth: { type: 'number', label: '最大宽度', default: 1200 },
  },
})
```

### 配置实例管理

```typescript
// 添加配置实例
const pageConfigId = engine.addGlobalConfig('page-config', {
  title: '我的页面',
  backgroundColor: '#f5f5f5',
})

const themeConfigId = engine.addGlobalConfig('theme-config', {
  primaryColor: '#1a1a1a',
})

// 添加多个布局配置实例（同一类型可以有多个实例）
const layout1Id = engine.addGlobalConfig('layout-config', {
  mode: 'fluid',
  maxWidth: 1200,
})

const layout2Id = engine.addGlobalConfig('layout-config', {
  mode: 'fixed',
  maxWidth: 1000,
})

// 获取指定 ID 的配置
const pageConfig = engine.getGlobalConfig(pageConfigId) // { id, type, props }

// 获取指定类型的所有配置实例
const layoutConfigs = engine.getGlobalConfigsByType('layout-config') // [{ id, type, props }, ...]

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
  type: string     // 配置类型，如 'page-config', 'theme-config', 'layout-config'
  props: Record<string, any> // 配置属性值
}

interface ConfigDefinition {
  type: string     // 配置类型标识符（唯一）
  label: string    // 显示名称
  icon?: string    // 图标
  description?: string // 描述
  schema: Record<string, FieldSchema> // 配置字段定义
}
```

### 典型使用场景

#### 场景 1：使用者只需要页面配置
```typescript
// 只注册 page-config 类型
engine.registry.registerConfig({
  type: 'page-config',
  label: '页面配置',
  schema: { title: { type: 'string', default: '' } },
})

// 初始化时添加一个页面配置实例
engine.addGlobalConfig('page-config', { title: '首页' })
```

#### 场景 2：使用者需要多种配置类型
```typescript
// 注册多个配置类型
engine.registry.registerConfig({
  type: 'page-config',
  label: '页面配置',
  schema: { title: { type: 'string', default: '' } },
})

engine.registry.registerConfig({
  type: 'theme-dark',
  label: '深色主题',
  schema: { primaryColor: { type: 'color', default: '#000' } },
})

engine.registry.registerConfig({
  type: 'theme-light',
  label: '浅色主题',
  schema: { primaryColor: { type: 'color', default: '#fff' } },
})

// 初始化时添加实例
engine.addGlobalConfig('page-config', { title: '首页' })
engine.addGlobalConfig('theme-dark', { primaryColor: '#1a1a1a' })
```

#### 场景 3：完全自定义配置类型
```typescript
// 使用者可以创建任意的配置类型
engine.registry.registerConfig({
  type: 'seo-config',
  label: 'SEO 配置',
  description: '搜索引擎优化相关设置',
  schema: {
    metaTitle: { type: 'string', label: 'Meta Title', default: '' },
    metaDescription: { type: 'string', label: 'Meta Description', default: '' },
    keywords: { type: 'array', label: 'Keywords', default: [] },
  },
})

engine.addGlobalConfig('seo-config', {
  metaTitle: '我的网站',
  metaDescription: '这是一个很棒的网站',
  keywords: ['lowcode', 'nocode'],
})
```

#### 场景 4：同一类型的多个配置实例
```typescript
// 注册一个可以有多个实例的配置类型
engine.registry.registerConfig({
  type: 'banner-config',
  label: '横幅配置',
  schema: {
    title: { type: 'string', default: '' },
    imageUrl: { type: 'string', default: '' },
  },
})

// 添加多个横幅配置
const banner1 = engine.addGlobalConfig('banner-config', {
  title: '首页横幅',
  imageUrl: '/banner1.jpg',
})

const banner2 = engine.addGlobalConfig('banner-config', {
  title: '活动横幅',
  imageUrl: '/banner2.jpg',
})

// 获取所有横幅配置
const allBanners = engine.getGlobalConfigsByType('banner-config')
```

### 优势

1. **完全解耦**：引擎不预设任何配置类型，使用者完全自由定义。
2. **简洁直观**：每个配置类型就是一个独立的类型定义，无需中间的分类层级。
3. **高度灵活**：可以定义任意数量和种类的配置类型，同一类型可以有多个实例。
4. **统一管理**：所有配置通过相同的 API 进行注册、管理和变更。
5. **类型安全**：每个配置类型都有自己的 schema 定义，保证数据一致性。
6. **易于扩展**：添加新配置类型只需注册一次，无需额外的分类定义。

### 设计优势解析

#### 去除分类层级的好处

**旧设计（Category-based）**：
- 需要先注册 Category（如 'page'、'theme'）
- 再在 Category 下注册具体的 Config Type（如 'basic-page'、'dark-theme'）
- GlobalConfigSchema 包含 `{ category, type, props }`
- 需要维护 `registerConfigCategory` 和 `registerConfig` 两个 API
- 需要实现 `getConfigByCategory` 等分类相关的查询 API

**新设计（Type-based）**：
- 直接注册 Config Type（如 'page-config'、'theme-dark'、'theme-light'）
- GlobalConfigSchema 只包含 `{ type, props }`
- 只需要维护 `registerConfig` 一个注册 API
- 查询通过 `getGlobalConfigsByType(type)` 按类型获取
- 使用者如果需要分组，可以通过命名约定（如 'theme-dark'、'theme-light'）或在 UI 层实现分组逻辑

#### 灵活性提升

使用者可以根据自己的需求来组织配置：

```typescript
// 方式 1: 扁平化，每个配置类型独立
registerConfig({ type: 'page-global-config', ... })
registerConfig({ type: 'theme-dark', ... })
registerConfig({ type: 'theme-light', ... })
registerConfig({ type: 'seo-meta', ... })

// 方式 2: 通过命名约定实现"伪分类"
registerConfig({ type: 'page:global', ... })
registerConfig({ type: 'page:settings', ... })
registerConfig({ type: 'theme:dark', ... })
registerConfig({ type: 'theme:light', ... })

// 方式 3: 完全自由定义
registerConfig({ type: 'my-awesome-config', ... })
```

引擎不关心配置如何命名或分组，这完全由使用者的业务逻辑决定。

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
