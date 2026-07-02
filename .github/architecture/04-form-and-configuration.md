# Form 与配置系统

`@dragcraft/form-generator` 是配置面板表单引擎，基于 schema 渲染属性编辑 UI。它服务于 designer 右栏，也可以被业务方独立使用。

## 设计目标

- 将配置协议抽象为 `FormSchema`，不与具体业务字段耦合。
- 支持全局配置和 widget 配置两类模型。
- 为 `@dragcraft/designer` 提供可替换的右侧面板实现。
- 字段组件由消费方通过 `fieldComponentMap` 显式提供。

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
  props?: Record<string, unknown>
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

字段组件名通过 `fieldComponentMap` 解析，schema 本身不绑定具体实现。

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

## 字段组件协议

自定义字段组件需要接收标准 props，并通过 `update:modelValue` 通知变化：

```ts
interface FieldComponentProps {
  modelValue: unknown
  disabled: boolean
  field: FieldSchema
}
```

示例：

```ts
h(FormGenerator, {
  fieldComponentMap: {
    input: MyCustomInput,
    'icon-picker': MyIconPicker,
  },
})
```

## 字段联动

`visible` 与 `disabled` 谓词函数用于声明字段间依赖：

```ts
{
  key: 'linkUrl',
  label: '链接地址',
  component: 'input',
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
  component: 'input',
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
字段组件 emit update:modelValue
  -> FormField 调用 ctx.onFieldChange(key, value)
  -> FormGenerator 更新本地 values 并触发验证
  -> FormGenerator emit change
  -> designer 接收 change
  -> designer dispatch UPDATE_PROPS 或 SET_GLOBAL_CONFIG
```

## 内置字段包关系

`@dragcraft/form-generator` 不再内置字段组件。内置字段组件由 `@dragcraft/builtin-fields` 提供：

```ts
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'

h(FormGenerator, {
  fieldComponentMap: buildDefaultFieldComponentMap(),
})
```

业务也可以完全不使用内置字段，直接传入自己的字段组件映射。

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
