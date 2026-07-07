# Form 与配置系统

`@dragcraft/form-generator` 是配置面板表单引擎，基于 schema 渲染属性编辑 UI。它服务于 designer 右栏，也可以被业务方独立使用。

## 设计目标

- 将配置协议抽象为 `FormSchema`，不与具体业务字段耦合。
- 支持全局配置和 widget 配置两类模型。
- 为 `@dragcraft/designer` 提供可替换的右侧面板实现。
- 字段组件通过 adapter 描述值绑定方式，UI 库 props 通过 `componentProps` 原样透传。

## 设计边界

- 不持久化业务状态。
- 不依赖具体 widget。
- 不依赖 `@dragcraft/core`，不调用 `engine.execute()`。
- 值变更通过 `change` 事件向上传递，由 designer 负责 dispatch core command。
- 不内置 CSS 样式，只应用 class。

## 文件结构

```plaintext
src/
├── types.ts
├── context.ts
├── composables/
│   ├── useFieldState.ts
│   └── useFormValidation.ts
├── components/
│   ├── FormGenerator.ts
│   ├── FormSection.ts
│   └── FormField.ts
└── index.ts
```

## FormSchema 协议

```ts
interface FieldSchema {
  key: string
  label: string
  component: string
  bindTo?: string | { scope?: 'node' | 'schema' | 'globalConfig', path: string }
  componentProps?: Record<string, unknown> | ((ctx: FormContext) => Record<string, unknown>)
  defaultValue?: unknown
  visible?: (ctx: FormContext) => boolean
  disabled?: (ctx: FormContext) => boolean
  rules?: ValidationRule[]
  tooltip?: string
}

interface SectionSchema {
  title: string
  collapsed?: boolean
  fields: FieldSchema[]
}

interface FormSchema {
  sections: SectionSchema[]
}
```

字段组件名通过 `fieldComponentMap` 解析，schema 本身只声明使用哪个 adapter 和传给 UI 组件的 `componentProps`。

### 字段绑定到 Schema DSL

`FormGenerator` 本身不理解 `bindTo`，它只维护字段值并 emit `{ key, value }`。`@dragcraft/designer` 在右侧属性面板中解释 `bindTo`，把字段变更翻译成 core command。

默认绑定：

- Widget 表单字段默认写入当前节点 `props.{field.key}`。
- Global 表单字段默认写入 `globalConfig.{field.key}`。

显式绑定：

```ts
const widgetForm: FormSchema = {
  sections: [{
    title: '容器',
    fields: [{
      key: 'marginTop',
      label: '上外边距',
      component: 'Number',
      bindTo: { scope: 'node', path: 'style.container.marginTop' },
    }],
  }],
}

const globalForm: FormSchema = {
  sections: [{
    title: '页面',
    fields: [{
      key: 'pageBg',
      label: '页面背景色',
      component: 'Color',
      bindTo: { scope: 'schema', path: 'root.style.surface.backgroundColor' },
    }],
  }],
}
```

`scope` 说明：

| Scope | Path 基准 | 写入命令 |
| --- | --- | --- |
| `node` | 当前选中节点 | `UPDATE_PROPS` |
| `schema` | 整个 `DesignerSchema` | 根据路径翻译为语义命令，例如 `root.style.*` 进入 `UPDATE_PROPS(root)` |
| `globalConfig` | `schema.globalConfig` | `SET_GLOBAL_CONFIG` |

这使配置面板可以编辑开放 DSL，例如页面 surface 样式或物料容器样式，而不需要把背景、间距等业务场景硬编码成固定全局字段。

带类型提示的业务 schema 可以使用 `TypedFormSchema<PropsMap>`：

```ts
import type { TypedFormSchema } from '@dragcraft/form-generator'
import type { AntDesignVueFieldComponentPropsMap } from '@dragcraft/fields-ant-design-vue'

const schema: TypedFormSchema<AntDesignVueFieldComponentPropsMap> = {
  sections: [{
    title: '基础设置',
    fields: [{
      key: 'title',
      label: '标题',
      component: 'Input',
      componentProps: { allowClear: true },
    }],
  }],
}
```

## 渲染管线

```plaintext
FormGenerator
  -> provide FormGeneratorContext
  -> FormSection[]
      -> FormField[]
          -> resolve field component
          -> render label, control, tooltip and error
```

### FormGenerator

Props：

| Prop | 说明 |
| --- | --- |
| `schema` | 表单结构描述 |
| `values` | 当前字段值 |
| `disabled` | 是否全局禁用 |
| `fieldComponentMap` | 字段组件映射 |

事件：

| 事件 | Payload | 说明 |
| --- | --- | --- |
| `change` | `{ key: string, value: unknown }` | 任意字段值变化 |

Expose：

- `validate()`：验证全部字段，返回 `ValidationError[]`。
- `clearErrors()`：清除验证错误。

### FormSection

Section 是可折叠字段分组，负责渲染标题栏和字段列表，并管理本地折叠状态。

### FormField

Field 负责：

- 注入 `FormGeneratorContext`。
- 使用 `useFieldState` 计算 visible 与 disabled。
- 从 `fieldComponentMap` 解析组件。
- 渲染 label、字段组件、tooltip 与 error message。
- 触发字段级验证和值变更。

## 字段 Adapter 协议

字段组件不再要求实现固定的 `modelValue + field` 协议。`FieldComponentMap` 注册的是 adapter definition：

```ts
interface FieldComponentDefinition {
  component: Component
  modelPropName?: string
  updateEventName?: string
  defaultProps?: Record<string, unknown>
  formatValue?: (value: unknown, ctx: FieldComponentTransformContext) => unknown
  normalizeValue?: (value: unknown, ctx: FieldComponentTransformContext) => unknown
}
```

示例：

```ts
h(FormGenerator, {
  fieldComponentMap: {
    Input: {
      component: AInput,
      modelPropName: 'value',
      updateEventName: 'onUpdate:value',
    },
    Switch: {
      component: ASwitch,
      modelPropName: 'checked',
      updateEventName: 'onUpdate:checked',
    },
  },
})
```

`@dragcraft/form-generator` 负责把 `defaultProps`、`componentProps`、禁用态和 model 绑定合并后传给真实 UI 组件。禁用态由表单层最终写入 `disabled`，覆盖 `componentProps.disabled`。

## 字段联动

`visible` 与 `disabled` 谓词函数用于声明字段间依赖：

```ts
{
  key: 'linkUrl',
  label: '链接地址',
  component: 'Input',
  visible: (ctx) => ctx.values.hasLink === true,
  disabled: (ctx) => ctx.values.isLocked === true,
}
```

`FormContext.values` 包含当前表单所有字段的最新值，响应式系统会自动触发重新计算。

## 表单验证

验证规则通过 `FieldSchema.rules` 定义：

```ts
{
  key: 'name',
  label: '名称',
  component: 'Input',
  rules: [
    { required: true, message: '名称不能为空' },
    {
      validator: (value) => {
        if (typeof value === 'string' && value.length > 50) return '最多 50 个字符'
        return true
      },
    },
  ],
}
```

验证策略：

- 字段值变化时自动触发即时验证。
- 可通过 `formRef.validate()` 手动触发全局验证。
- 顺序为 required 到自定义 validator。
- 首个错误短路返回。

`useFormValidation(schema, getValues)` 提供：

- `fieldErrors`。
- `validateField(key)`。
- `validateAll()`。
- `clearErrors()`。

## 值变更数据流

```plaintext
字段组件 emit adapter.updateEventName
  -> FormField 调用 ctx.onFieldChange(key, value)
  -> FormGenerator 更新本地 values 并触发验证
  -> FormGenerator emit change
  -> designer 接收 change
  -> designer 根据 bindTo/default binding dispatch UPDATE_PROPS 或 SET_GLOBAL_CONFIG
```

## 字段包关系

`@dragcraft/form-generator` 只提供 adapter 协议和表单运行时，不直接依赖具体 UI 库。UI 库字段由独立字段包提供，例如 `@dragcraft/fields-ant-design-vue`：

```ts
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

h(FormGenerator, {
  fieldComponentMap: {
    ...createAntDesignVueFields(),
    Color: { component: ColorField },
  },
})
```

业务特化字段仍由业务侧注册到同一个 `fieldComponentMap`。如果业务希望获得 schema 侧的 `componentProps` 类型提示，应为字段包导出 `ComponentPropsMap`，并配合 `TypedFormSchema<PropsMap>` 使用。

## CSS Class 层级

```plaintext
.dc-form-generator
  .dc-form-section
    .dc-form-section__header
      .dc-form-section__title
      .dc-form-section__toggle
    .dc-form-section__body
      .dc-form-field
        .dc-form-field__label
        .dc-form-field__control
        .dc-form-field__tooltip
        .dc-form-field__error
        .dc-form-field--disabled
        .dc-form-field--error
      .dc-field-input
      .dc-field-number
      .dc-field-textarea
      .dc-field-unknown
```

form-generator 不内置样式，class 由 `@dragcraft/themes` 或业务 CSS 实现视觉效果。
