# @dragcraft/widgets

`@dragcraft/widgets` 提供物料协议定义与通用工具函数。

## 目标

- 定义 `WidgetDefinition`、`WidgetGroupConfig` 等物料协议类型。
- 提供通用工具函数（批量注册、构建 ComponentMap、按分组过滤等）。
- 不包含任何具体的物料实现（内置物料已迁移至 `@dragcraft/builtin-widgets`）。

## 设计边界

- 不依赖 `@dragcraft/form-generator`（formSchema 保持松耦合，运行时遵循 FormSchema 结构）。
- 不依赖 `@dragcraft/renderer`（ComponentMap 由消费方桥接）。
- 仅依赖 `@dragcraft/core`（WidgetMeta 类型）和 `vue`（Component 类型）。
- 纯协议包，不包含 Vue 组件实现。

## 快速上手

```ts
import { buildComponentMap, getWidgetMetas, registerWidgets } from '@dragcraft/widgets'
import type { WidgetDefinition } from '@dragcraft/widgets'

// 自定义 widget definitions
const myDefinitions: WidgetDefinition[] = [
  { meta: myWidgetMeta, component: MyWidget },
]

// 批量注册
registerWidgets(engine, myDefinitions)

// 构建组件映射
const componentMap = buildComponentMap(myDefinitions)

// 提取 metas
const metas = getWidgetMetas(myDefinitions)
```

如需使用内置物料，请引入 `@dragcraft/builtin-widgets`：

```ts
import { getAllWidgetMetas, getDefaultComponentMap } from '@dragcraft/builtin-widgets'
```

## 文件结构

```
src/
├── index.ts      # 公共 API barrel export
├── types.ts      # WidgetDefinition、WidgetGroup、WidgetGroupConfig 类型
└── helpers.ts    # 通用工具函数（registerWidgets、buildComponentMap 等）
```

## Widget 协议

每个 widget 由两部分组成：

1. **WidgetMeta** — 注册到 core registry 的元信息
2. **Vue Component** — 画布中渲染的实际组件

```ts
interface WidgetDefinition {
  meta: WidgetMeta
  component: Component
}
```

### WidgetMeta 接口

```ts
interface WidgetMeta {
  type: string
  title: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  defaultStyle?: Record<string, unknown>
  formSchema: Record<string, unknown>
  mask?: boolean  // 默认 true，控制画布中是否覆盖透明遮罩
}
```

## 分组机制

```ts
// WidgetGroup 为 string 类型，支持任意自定义分组
type WidgetGroup = string

interface WidgetGroupConfig {
  name: string
  title: string
}
```

分组字段可由业务方自由定义，designer 左栏根据 group 自动聚合。

## 通用工具函数

| 函数 | 说明 |
|------|------|
| `registerWidgets(engine, definitions)` | 批量注册 widget 元信息到 engine.registry |
| `buildComponentMap(definitions)` | 从 definitions 构建 `Record<string, Component>` 映射 |
| `getWidgetMetas(definitions)` | 从 definitions 提取所有 WidgetMeta 数组 |
| `filterByGroup(definitions, group)` | 按分组过滤 WidgetDefinition |

## 与其他包协作

- `@dragcraft/core`：依赖 WidgetMeta 类型定义。
- `@dragcraft/builtin-widgets`：依赖本包的 WidgetDefinition 和 WidgetGroupConfig 类型，提供 10 个内置物料实现。
- `@dragcraft/designer`：不再依赖本包（designer 由用户传入 widgetMetas 和 componentMap）。

## 约束

- 纯类型 + 工具函数包，不包含 Vue 组件。
- 不引入第三方 UI 库。
