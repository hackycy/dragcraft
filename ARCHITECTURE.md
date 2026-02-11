# dragcraft

采用`Core Engine + UI Shell`的模式构建一个核心与UI分离的低代码（Low-Code）/ 无代码（No-Code）引擎设计框架

## 架构设计原则

- **框架与实现分离**：框架只提供约束和基础能力，具体 widget 实现由使用者决定。
- **职责分离**：每个包只负责自己的核心职责，避免跨包耦合。
- **依赖倒置**：core 不依赖具体实现，通过接口定义约束。
- **UI 解耦**：core 不包含任何 UI 逻辑，Shell 通过命令与事件交互。
- **使用者主导**：拖拽交互、物料展示完全由使用者控制。

## @dragcraft/core

Core 是纯状态管理引擎，只负责 schema 数据的存储、命令处理、历史记录和事件发布。

### 设计原则
- 极简职责：只管理 schema 数据（widgets, configs），不关心物料定义。
- 不知道业务：core 不知道 widget 有哪些类型，不存储物料元数据。
- 纯数据驱动：所有变更通过命令完成，可撤销/重做。
- 事件通知：状态变化通过事件通知外部，外部自行处理。

### 子系统职责
- engine: 组合根，串联子系统并提供统一 API。
- state: 响应式状态仓库（widgets, configs, activeId），支持快照/替换。
- commands: 原子状态变更的唯一入口（addWidget, updateWidget, removeWidget 等）。
- history: 撤销/重做快照记录。
- event-bus: 发布/订阅 state 与 command 事件。
- plugin: 插件 setup 接口与生命周期管理。
- types: 最小化类型定义（WidgetSchema, GlobalConfigSchema）。

### 状态模型

```typescript
interface WidgetSchema {
  id: string;
  type: string;           // widget 类型标识
  props: Record<string, any>;
}

interface GlobalConfigSchema {
  id: string;
  type: string;           // config 类型标识
  props: Record<string, any>;
}

interface State {
  widgets: WidgetSchema[];
  globalConfigs: GlobalConfigSchema[];
  activeId: string | null;
  activeType: 'widget' | 'config' | null;
}
```

### 核心 API

```typescript
// 添加 widget
engine.addWidget(type: string, props?: Record<string, any>): string;

// 更新 widget
engine.updateWidget(id: string, props: Partial<Record<string, any>>): void;

// 删除 widget
engine.removeWidget(id: string): void;

// 选中对象
engine.setActive(id: string, type: 'widget' | 'config'): void;

// 订阅状态变化
engine.on('state:changed', (state) => { /* ... */ });
```

### 命令生命周期
1. 校验参数（id 存在性、type 有效性等）。
2. 生成快照并写入 history。
3. 执行命令变更 state。
4. 广播 `command:executed` 与 `state:changed` 事件。
5. 若执行失败，回滚状态并广播 `command:failed` 事件。

### 事件约定
- `state:changed`: 状态变化，携带最新 state。
- `command:executed`: 命令执行完成，携带命令信息。
- `command:failed`: 命令执行失败，携带错误信息。

### 非目标
- 不包含任何 UI 渲染。
- 不存储物料定义（widget/config 元数据）。
- 不包含注册中心（registry）。
- 不提供拖拽交互（由使用者实现）。
- 不支持嵌套 widget 树（只支持扁平列表）。
- 响应式依赖 `@vue/reactivity`。

### Widget 定义约束

core 提供 widget 定义的接口约束，使用者需遵循此结构：

```typescript
// core/types.ts
export interface WidgetDefinition {
  type: string;                        // widget 类型唯一标识
  label: string;                       // 显示名称
  [key: string]: any;                  // 使用者自定义的扩展字段
}
```

使用者可自由扩展 `WidgetDefinition`，例如：
```typescript
interface MyWidgetDefinition extends WidgetDefinition {
  icon?: string;
  category?: string;
  defaultProps?: Record<string, any>;
  formSchema?: any[];
  previewImage?: string;
}
```

## @dragcraft/form-generator

属性配置表单引擎，负责定义表单 schema 类型并动态渲染表单面板。

### 职责
- 定义 FormFieldSchema 类型系统。
- 提供表单渲染器，根据 schema 动态生成表单控件。
- 处理表单验证、默认值、动态显示等逻辑。
- 暴露表单数据变更事件，供外部（如 designer）处理。

### FormFieldSchema 类型定义

```typescript
interface FormFieldSchema {
  key: string;                    // 属性字段名
  label: string;                  // 表单项标签
  type: 'input' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio' | 'color' | 'slider' | 'switch';
  defaultValue?: any;             // 默认值
  placeholder?: string;           // 占位符
  options?: Array<{               // select/radio 选项
    label: string;
    value: any;
  }>;
  min?: number;                   // number/slider 最小值
  max?: number;                   // number/slider 最大值
  step?: number;                  // number/slider 步长
  required?: boolean;             // 是否必填
  disabled?: boolean;             // 是否禁用
  visible?: boolean | ((props: any) => boolean);  // 动态显示条件
  validator?: (value: any) => boolean | string;   // 自定义校验
}

type FormSchema = FormFieldSchema[];
```

### 使用方式

```typescript
import { FormRenderer } from '@dragcraft/form-generator';

<FormRenderer
  schema={formSchema}
  value={currentProps}
  onChange={(newProps) => {
    // 通过 core 命令更新 widget/config
    engine.updateWidgetProps(activeId, newProps);
  }}
/>
```

### 依赖
- 无依赖于 @dragcraft/core
- 可独立使用或集成到任意项目

## 框架核心包总结

### @dragcraft/core
- 纯状态管理，只处理 schema 数据
- 提供 `WidgetDefinition` 接口约束
- 零依赖，不知道具体 widget 实现

### @dragcraft/form-generator
- 独立表单渲染引擎
- 零依赖，可用于任意项目

### @dragcraft/renderer
- 根据 core.state.widgets 渲染组件
- 依赖 core，但不依赖具体 widget 定义

---

## 示例实现

以下包是参考实现，展示如何使用框架。使用者可根据需求自行实现。

## @dragcraft/widgets（参考实现）

提供基础物料组件库示例，使用者可参考或完全自定义。

### 说明
- 这是一个可选的参考实现，不是框架核心。
- 使用者可以完全自定义自己的 widget 库。
- 框架不持有此包的引用。

### Widget 定义示例

```typescript
import type { FormSchema } from '@dragcraft/form-generator';

export const ButtonDefinition = {
  type: 'button',
  label: '按钮',
  defaultProps: {
    text: '点击',
    type: 'primary',
    disabled: false
  },
  formSchema: [
    { key: 'text', label: '按钮文字', type: 'input' },
    { key: 'type', label: '按钮类型', type: 'select', options: [
      { label: '主要', value: 'primary' },
      { label: '次要', value: 'default' }
    ]},
    { key: 'disabled', label: '禁用', type: 'switch' }
  ] as FormSchema
};

export const ButtonComponent = (props: any) => {
  return <button disabled={props.disabled}>{props.text}</button>;
};
```

### 导出所有 widgets

```typescript
// widgets/index.ts
export * from './button';
export * from './image';
export * from './text';

// 导出 widget 定义集合
export const ALL_WIDGETS = [
  ButtonDefinition,
  ImageDefinition,
  TextDefinition
];
```

### 依赖
- @dragcraft/form-generator（仅类型依赖）
- 无依赖 @dragcraft/core

### 使用者自定义方式

使用者可以完全自定义自己的 widget 库：

```typescript
// my-custom-widgets/button.ts
import type { FormSchema } from '@dragcraft/form-generator';
import type { WidgetDefinition } from '@dragcraft/core';

export const MyButtonDefinition: WidgetDefinition = {
  type: 'my-button',
  label: '自定义按钮',
  icon: 'icon-button',
  category: 'basic',
  defaultProps: { /* ... */ },
  formSchema: [ /* ... */ ]
};

export const MyButtonComponent = (props: any) => {
  // 自定义实现
};
```

## @dragcraft/designer（参考实现）

设计器组装层示例，使用者可参考或完全自定义自己的设计器。

### 说明
- 这是一个可选的参考实现，展示如何组装框架。
- 使用者可以完全自定义拖拽交互、物料展示、布局等。
- 框架不强制要求使用此设计器。

### 内部 Widget Registry

designer 自己维护一个 widget 定义的映射表：

```typescript
import { ALL_WIDGETS } from '@dragcraft/widgets';

class Designer {
  private widgetRegistry = new Map<string, WidgetDefinition>();

  constructor(engine: CoreEngine) {
    // 注册所有 widgets
    ALL_WIDGETS.forEach(def => {
      this.widgetRegistry.set(def.type, def);
    });
  }

  // 获取 widget 定义
  getWidgetDefinition(type: string) {
    return this.widgetRegistry.get(type);
  }

  // 动态注册额外的 widget
  registerWidget(definition: WidgetDefinition) {
    this.widgetRegistry.set(definition.type, definition);
  }
}
```

### 工作流程示例

#### 1. 物料面板（使用者自定义）

使用者完全控制物料如何展示和拖拽：

```typescript
// 使用者可以自定义物料面板样式和交互
import { myWidgets } from './my-widgets';

// 示例：卡片式物料面板
myWidgets.map(def => (
  <MaterialCard
    key={def.type}
    icon={def.icon}
    label={def.label}
    preview={def.previewImage}
    onDragEnd={() => {
      engine.addWidget(def.type, def.defaultProps);
    }}
  />
))

// 或者：列表式物料面板
myWidgets.map(def => (
  <MaterialListItem
    key={def.type}
    onClick={() => {
      engine.addWidget(def.type, def.defaultProps);
    }}
  />
))
```

#### 2. 属性面板
```typescript
// 监听选中状态
engine.on('state:changed', (state) => {
  if (state.activeId && state.activeType === 'widget') {
    const widget = state.widgets.find(w => w.id === state.activeId);
    const definition = designer.getWidgetDefinition(widget.type);

    // 渲染表单
    return (
      <FormRenderer
        schema={definition.formSchema}
        value={widget.props}
        onChange={(newProps) => {
          engine.updateWidget(widget.id, newProps);
        }}
      />
    );
  }
});
```

#### 3. 画布渲染
```typescript
// 使用 renderer 渲染 widgets
<Renderer
  widgets={engine.state.widgets}
  widgetComponents={widgetComponentsMap}
  onSelect={(id) => engine.setActive(id, 'widget')}
/>
```

### 依赖关系（示例）

```
my-designer-app (使用者自定义)
  ├── @dragcraft/core (状态管理、命令、事件)
  ├── @dragcraft/form-generator (属性表单渲染，可选)
  ├── @dragcraft/renderer (画布渲染)
  ├── my-custom-widgets (使用者自己的 widget 库)
  └── my-dnd-library (使用者选择的拖拽库，如 dnd-kit)
```

### 核心特点
- 使用者完全掌控 widget 定义和物料展示。
- 使用者自由选择拖拽交互方式（原生 DnD、dnd-kit、react-dnd 等）。
- core 只负责状态管理，不干涉 UI 实现。
- form-generator 可选，使用者可以用其他表单方案。

## 包依赖关系

### 框架核心

```
┌──────────────────────────────────────────┐
│           使用者的应用                    │
│  - 自定义 widget 库                       │
│  - 自定义拖拽交互                         │
│  - 自定义物料面板                         │
│  - 自定义设计器布局                       │
└──────────────────────────────────────────┘
     ↓           ↓            ↓
┌────────┐ ┌──────────┐ ┌─────────┐
│  core  │ │form-gen  │ │renderer │
│        │ │  (可选)  │ │         │
│ 零依赖 │ │  零依赖  │ │依赖core │
└────────┘ └──────────┘ └─────────┘

框架核心: core, form-generator, renderer
参考实现: widgets, designer (使用者可选)
```

### 依赖说明
- **@dragcraft/core**: 框架核心，纯状态管理引擎，零依赖。
- **@dragcraft/form-generator**: 框架核心，独立表单引擎，零依赖，可选。
- **@dragcraft/renderer**: 框架核心，渲染引擎，依赖 core。
- **@dragcraft/widgets**: 参考实现，使用者可选，可完全自定义。
- **@dragcraft/designer**: 参考实现，使用者可选，可完全自定义。
- **使用者应用**: 自由组合框架核心包，实现自己的设计器。

### 数据流

```
用户操作 → 使用者的 UI → core.command → core.state 更新 → 触发事件
              ↓                                              ↓
      查询自定义 widget 定义                          使用者监听事件
              ↓                                              ↓
      渲染自定义 UI (表单/面板等)                     更新 UI 视图
```

## 总结

### 关键设计点

1. **core 极简化**
   - 只管理 schema 数据（widgets, configs）。
   - 提供 `WidgetDefinition` 接口约束。
   - 不存储物料定义，不提供 UI 组件。

2. **form-generator 独立可选**
   - 独立的表单渲染引擎。
   - 使用者可选择使用或自己实现表单方案。

3. **renderer 专注渲染**
   - 根据 core.state 渲染组件。
   - 不关心 widget 定义来源。

4. **widgets 与 designer 是参考实现**
   - 仅作为示例，展示如何使用框架。
   - 使用者完全可以自定义实现。
   - 框架不持有这些包的引用。

5. **使用者完全主导**
   - 自定义 widget 库（扩展 `WidgetDefinition`）。
   - 自定义物料面板展示和交互。
   - 自定义拖拽方式（原生 DnD、第三方库等）。
   - 自定义设计器布局和功能。

### 优势

- **高度灵活**: 使用者完全掌控 widget 定义和 UI 实现。
- **低耦合**: 框架核心包相互独立，职责单一。
- **易扩展**: 通过接口约束，支持任意自定义扩展。
- **可复用**: 框架核心包可用于各种场景。
- **无强制**: 不强制使用参考实现，使用者自由选择。

## Monorepo 目录结构

``` plaintext
root
├── package.json
├── pnpm-workspace.yaml
├── packages
│   ├── core             # 【框架核心】纯状态管理引擎，零依赖
│   ├── form-generator   # 【框架核心】独立表单引擎，零依赖（可选）
│   ├── renderer         # 【框架核心】渲染引擎，依赖 core
│   ├── utils            # 【框架核心】工具函数（UUID, DeepClone 等）
│   ├── widgets          # 【参考实现】示例 widget 库，使用者可选
│   └── designer         # 【参考实现】示例设计器，使用者可选
├── playground           # 【演示】用于开发调试和展示
└── docs                 # 【文档】开发文档
```

### 说明
- **框架核心包**: core, form-generator, renderer, utils
  - 这些是框架必需的基础能力。
  - 使用者通过这些包构建自己的设计器。

- **参考实现包**: widgets, designer
  - 仅作为示例，展示如何使用框架。
  - 使用者可以完全不使用，自己实现。
  - 框架核心包不依赖这些参考实现。

## 使用者集成示例

```typescript
// my-app/index.ts
import { CoreEngine } from '@dragcraft/core';
import { Renderer } from '@dragcraft/renderer';
import { FormRenderer } from '@dragcraft/form-generator'; // 可选

// 使用者自定义的 widgets
import { myWidgets, MyWidgetRegistry } from './my-widgets';

// 创建引擎
const engine = new CoreEngine(/* 初始 state */);

// 创建 widget registry (使用者自己管理)
const widgetRegistry = new MyWidgetRegistry(myWidgets);

// 构建自定义设计器 UI
function MyDesigner() {
  return (
    <div>
      {/* 自定义物料面板 */}
      <MaterialPanel
        widgets={myWidgets}
        onAdd={(type, props) => engine.addWidget(type, props)}
      />

      {/* 画布 */}
      <Renderer
        widgets={engine.state.widgets}
        components={widgetRegistry.getComponents()}
      />

      {/* 自定义属性面板 */}
      <PropertiesPanel
        widget={engine.state.activeWidget}
        formSchema={widgetRegistry.getFormSchema(widget.type)}
        onChange={(props) => engine.updateWidget(widget.id, props)}
      />
    </div>
  );
}
```
