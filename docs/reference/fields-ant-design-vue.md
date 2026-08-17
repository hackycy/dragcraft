---
description: "@dragcraft/fields-ant-design-vue 的 Ant Design Vue 字段 adapter 接口。"
---

# @dragcraft/fields-ant-design-vue

该包把 Ant Design Vue 控件映射为 Designer 的字段 adapter。物料定义统一通过 `materials` 提供。

```ts
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const fieldComponentMap = createAntDesignVueFields()
```

| 入口 | 用途 |
| --- | --- |
| `createAntDesignVueFields()` | 创建完整字段 adapter map。 |
| `antDesignVueFieldComponents` | 读取内置 adapter 定义。 |
| `AntDesignVueFieldComponentType` | 获取受支持的稳定字段键。 |
| `AntDesignVueFieldComponentPropsMap` | 为字段 `componentProps` 提供类型提示。 |

## 支持的字段键

`createAntDesignVueFields()` 返回以下稳定键，字段 Schema 通过 `component` 引用：

`AutoComplete`、`Cascader`、`Checkbox`、`CheckboxGroup`、`DatePicker`、`Input`、`InputNumber`、`Mentions`、`Radio`、`RadioGroup`、`RangePicker`、`Rate`、`Select`、`Slider`、`Switch`、`Textarea`、`TimePicker`、`TreeSelect`。

文本值控件使用 `value` / `onUpdate:value`，复选类控件使用 `checked` / `onUpdate:checked`。应用仍需导入 `ant-design-vue/dist/reset.css` 或自己的 UI 基础样式。

业务特化字段仍由宿主合并到同一份 `fieldComponentMap`。
