# @dragcraft/form-generator

`@dragcraft/form-generator` 是配置面板表单引擎，基于 schema 渲染属性编辑 UI（Vue3）。

## 目标

- 将配置协议抽象为 schema，不与具体业务字段耦合。
- 支持全局配置与 widget 配置双模型。
- 为 `@dragcraft/designer` 提供可替换的右侧面板实现。

## 设计边界

- 不持久化业务状态，仅渲染与收集值变更。
- 不依赖具体 widget，只依赖 widget 提供的 schema。
- 不依赖 `@dragcraft/core`，不调用 `engine.execute()`。
- 值变更通过 `change` 事件向上传递，由 designer 负责 dispatch core 命令。
- 不内置 CSS 样式，仅应用 CSS class 名。

## 快速上手

```ts
import { FormGenerator } from '@dragcraft/form-generator'
import type { FormSchema } from '@dragcraft/form-generator'

// 定义表单 schema
const schema: FormSchema = {
  sections: [
    {
      title: '基础属性',
      fields: [
        { key: 'text', label: '文本', component: 'input' },
        { key: 'fontSize', label: '字号', component: 'number', props: { min: 12, max: 72 } },
        { key: 'color', label: '颜色', component: 'color' },
        {
          key: 'linkUrl',
          label: '链接地址',
          component: 'input',
          visible: ctx => ctx.values.hasLink === true,
        },
      ],
    },
  ],
}

// 在 Vue 模板中使用
// <FormGenerator :schema="schema" :values="currentValues" @change="handleChange" />
```

## 文件结构

```
src/
├── types.ts                          # 所有类型定义 + InjectionKey
├── context.ts                        # useFormGeneratorContext 注入助手
├── composables/
│   ├── useFieldState.ts             # 字段 visible/disabled 计算
│   ├── useFormValidation.ts         # 表单级验证引擎
│   └── index.ts
├── components/
│   ├── FormGenerator.ts             # 根入口，provide context，渲染 sections
│   ├── FormSection.ts               # 可折叠 section（标题 + 字段列表）
│   ├── FormField.ts                 # 字段包装器（解析组件、visible/disabled/验证）
│   ├── fields/
│   │   ├── InputField.ts            # <input type="text">
│   │   ├── NumberField.ts           # <input type="number">
│   │   ├── TextareaField.ts         # <textarea>
│   │   ├── SelectField.ts           # <select>
│   │   ├── SwitchField.ts           # <input type="checkbox">
│   │   ├── ColorField.ts            # <input type="color">
│   │   ├── SliderField.ts          # <input type="range">
│   │   └── index.ts                 # barrel + buildDefaultFieldComponentMap()
│   └── index.ts
└── index.ts                          # 公共 API barrel export
```

## 核心概念

### FormSchema（表单协议）

```ts
interface FieldSchema {
  key: string                                    // 值对象中的属性键
  label: string                                  // 可读标签
  component: string                              // 字段组件名（如 'input', 'select'）
  props?: Record<string, unknown>                // 透传给字段组件的额外 props
  defaultValue?: unknown                         // 实际值为 undefined 时的默认值
  visible?: (ctx: FormContext) => boolean        // 动态可见性
  disabled?: (ctx: FormContext) => boolean       // 动态禁用
  rules?: ValidationRule[]                       // 验证规则
  tooltip?: string                               // 提示文本
}

interface SectionSchema {
  title: string
  collapsed?: boolean                            // 默认折叠状态
  fields: FieldSchema[]
}

interface FormSchema {
  sections: SectionSchema[]
}
```

### 渲染管线

```
FormGenerator              → 根组件，provide context，渲染 sections
  └─ FormSection           → 每个 section，可折叠标题 + 字段列表
       └─ FormField        → 每个字段，解析组件、处理 visible/disabled/验证
            └─ [InputField] → 实际字段组件（通过组件名解析）
```

## 组件详解

### FormGenerator（根入口）

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `schema` | `FormSchema` | 是 | 表单结构描述 |
| `values` | `Record<string, unknown>` | 是 | 当前字段值 |
| `disabled` | `boolean` | 否 | 全局禁用所有字段 |
| `fieldComponentMap` | `FieldComponentMap` | 否 | 自定义字段组件（覆盖内置默认） |

| 事件 | Payload | 说明 |
|------|---------|------|
| `change` | `{ key: string, value: unknown }` | 任何字段值变化时触发 |

`expose` 方法：
- `validate()` — 验证所有字段，返回 `ValidationError[]`
- `clearErrors()` — 清除所有验证错误

### FormSection（内部组件）

- 接收 `section: SectionSchema`
- 管理本地折叠状态
- 渲染标题栏（可点击切换折叠）+ 字段列表

### FormField（内部组件）

- 接收 `field: FieldSchema`
- 注入 `FormGeneratorContext`
- 使用 `useFieldState` 计算 visible/disabled
- 从 `fieldComponentMap` 解析组件
- 渲染：label → 字段组件 → tooltip → error message

## 内置字段组件

| 组件 | type 字符串 | HTML 元素 | field.props 支持 |
|------|------------|-----------|-----------------|
| InputField | `'input'` | `<input type="text">` | `placeholder` |
| NumberField | `'number'` | `<input type="number">` | `min`, `max`, `step`, `placeholder` |
| TextareaField | `'textarea'` | `<textarea>` | `placeholder`, `rows` |
| SelectField | `'select'` | `<select>` | `options: Array<{label,value}>`, `placeholder` |
| SwitchField | `'switch'` | `<input type="checkbox">` | 无 |
| ColorField | `'color'` | `<input type="color">` | 无 |
| SliderField | `'slider'` | `<input type="range">` | `min`, `max`, `step` |

全部使用原生 HTML 元素，无第三方 UI 库依赖。

### 自定义字段组件

通过 `fieldComponentMap` prop 注册自定义字段组件：

```ts
h(FormGenerator, {
  fieldComponentMap: {
    'icon-picker': MyIconPicker,  // 自定义组件
    'input': MyCustomInput,       // 覆盖内置 input
  },
})
```

自定义组件需实现标准 Props 协议：

```ts
interface FieldComponentProps {
  modelValue: unknown
  disabled: boolean
  field: FieldSchema
}
// 并通过 emit('update:modelValue', newValue) 响应值变更
```

## 字段联动

通过 `visible` / `disabled` 函数式谓词实现字段间依赖：

```ts
{
  key: 'linkUrl',
  label: '链接地址',
  component: 'input',
  visible: (ctx) => ctx.values.hasLink === true,
  disabled: (ctx) => ctx.values.isLocked === true,
}
```

`FormContext.values` 包含当前表单所有字段的最新值，由响应式系统自动触发重新计算。

## 验证

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

- 字段值变化时自动触发验证（即时反馈）
- 可通过 `formRef.validate()` 手动触发全局验证
- 验证顺序：`required` → 自定义 `validator` → 首个错误短路返回

## 值变更数据流

```
字段组件 emit update:modelValue
  → FormField 调用 ctx.onFieldChange(key, value)
    → FormGenerator 更新本地 values + 触发验证 + emit change
      → designer 接收 change 事件，dispatch core 命令
```

## Composables

### useFormGeneratorContext()

注入 `FormGeneratorContext`，必须在 `FormGenerator` 子树内使用。

### useFieldState(field, ctx)

为单个字段计算响应式交互状态：

```ts
interface FieldState {
  isVisible: ComputedRef<boolean>
  isDisabled: ComputedRef<boolean>
}
```

### useFormValidation(schema, getValues)

表单级验证引擎：

```ts
interface FormValidation {
  fieldErrors: Ref<Record<string, string | undefined>>
  validateField: (key: string) => string | undefined
  validateAll: () => ValidationError[]
  clearErrors: () => void
}
```

## CSS Class 层级

```
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
      .dc-field-input / .dc-field-number / .dc-field-textarea / ...
      .dc-field-unknown
```

form-generator 不内置样式，仅应用 class 名，由使用方或 designer 提供样式。

## 与其他包协作

- `@dragcraft/designer`：传入 schema + values + fieldComponentMap，接收 change 事件，dispatch core 命令。
- `@dragcraft/widgets`：widget 的 `formSchema` 字段应遵循 `FormSchema` 结构。
- `@dragcraft/core`：form-generator 不直接依赖 core。designer 负责桥接 form-generator 的值变更与 core 命令。

## 约束

- 不调用 `engine.execute()`，所有写操作由 designer 转发。
- 不持久化业务状态。
- 不依赖具体 widget，只依赖 widget 提供的 schema。
- 渲染幂等，无副作用。

## 里程碑

1. ~~完成类型定义与上下文系统。~~ ✅
2. ~~完成 composables（useFieldState、useFormValidation）。~~ ✅
3. ~~完成内置字段组件（7 个）。~~ ✅
4. ~~完成核心渲染组件（FormGenerator/FormSection/FormField）。~~ ✅
5. 补齐单元测试。
