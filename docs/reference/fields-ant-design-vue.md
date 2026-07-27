---
description: "@dragcraft/fields-ant-design-vue 的 Ant Design Vue 字段 adapter 接口。"
---

# @dragcraft/fields-ant-design-vue

该包把 Ant Design Vue 控件映射为 Designer 的字段 adapter。物料定义和组件映射仍从 Designer 创建。

```ts
import {
  buildComponentMap,
  getWidgetMetas,
} from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const widgetMetas = getWidgetMetas(definitions)
const componentMap = buildComponentMap(definitions)
const fieldComponentMap = createAntDesignVueFields()
```

| 入口 | 用途 |
| --- | --- |
| `createAntDesignVueFields()` | 创建完整字段 adapter map。 |
| `antDesignVueFieldComponents` | 读取内置 adapter 定义。 |
| `AntDesignVueFieldComponentType` | 获取受支持的稳定字段键。 |
| `AntDesignVueFieldComponentPropsMap` | 为字段 `componentProps` 提供类型提示。 |

业务特化字段仍由宿主注册到同一份 `fieldComponentMap`。
