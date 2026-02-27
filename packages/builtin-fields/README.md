# @dragcraft/builtin-fields

`@dragcraft/builtin-fields` 提供 7 个内置表单字段组件，用于 `@dragcraft/form-generator` 的属性配置面板。

## 目标

- 提供开箱即用的基础字段组件。
- 用户可按需引入，也可完全不使用本包，自行实现字段组件。

## 安装

```bash
pnpm add @dragcraft/builtin-fields
```

## 快速上手

```ts
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'
import { createDesigner } from '@dragcraft/designer'

const designer = createDesigner({
  fieldComponentMap: buildDefaultFieldComponentMap(),
  // ...
})
```

也可以混合使用内置字段与自定义字段：

```ts
import { buildDefaultFieldComponentMap } from '@dragcraft/builtin-fields'

const fieldComponentMap = {
  ...buildDefaultFieldComponentMap(),
  'icon-picker': MyIconPickerField,  // 自定义字段
  'input': MyCustomInput,            // 覆盖内置 input
}
```

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

## 文件结构

```
src/
├── index.ts           # 公共 API barrel export
└── fields/
    ├── index.ts       # barrel + buildDefaultFieldComponentMap()
    ├── InputField.ts
    ├── NumberField.ts
    ├── TextareaField.ts
    ├── SelectField.ts
    ├── SwitchField.ts
    ├── ColorField.ts
    └── SliderField.ts
```

## 导出

| 导出 | 类型 | 说明 |
|------|------|------|
| `buildDefaultFieldComponentMap()` | `() => FieldComponentMap` | 返回所有内置字段的组件映射 |
| `InputField` | Component | 文本输入字段 |
| `NumberField` | Component | 数字输入字段 |
| `TextareaField` | Component | 多行文本字段 |
| `SelectField` | Component | 下拉选择字段 |
| `SwitchField` | Component | 开关字段 |
| `ColorField` | Component | 颜色选择字段 |
| `SliderField` | Component | 滑块字段 |

## 与其他包协作

- `@dragcraft/form-generator`：依赖其 `FieldComponentMap` 和 `FieldSchema` 类型。
- `@dragcraft/designer`：通过 `fieldComponentMap` 选项传入。

## 无头设计（Headless Design）

本包采用无头组件模式：所有组件仅输出语义化 BEM CSS 类名（`dc-*`），不捆绑任何 CSS 样式文件。

视觉样式由独立的 `@dragcraft/themes` 包提供。
