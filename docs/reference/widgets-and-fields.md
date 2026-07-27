---
description: "@dragcraft/widgets 与 @dragcraft/fields-ant-design-vue 的物料整理和字段 adapter 公开 API。"
---

# widgets 与 fields

这两个包解决标准接入的三份输入：物料 metadata、页面组件映射和字段组件映射。

```ts
import { buildComponentMap, getWidgetMetas } from '@dragcraft/widgets'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const widgetMetas = getWidgetMetas(definitions)
const componentMap = buildComponentMap(definitions)
const fieldComponentMap = createAntDesignVueFields()
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `WidgetDefinition` | 将 metadata 与 Vue 组件放在同一份定义中。 |
| `getWidgetMetas()` | 提取注册到 Engine 的 metadata。 |
| `buildComponentMap()` | 构建 `node.type` 到 Vue 组件的映射。 |
| `defineContainerWidget()` | 保留容器 metadata 的类型推断。 |
| `createAntDesignVueFields()` | 创建 Ant Design Vue 字段 adapter map。 |

这些帮助函数不替你定义业务组件的 props、资源协议或容器几何。容器需要通过 `ContainerDefinition` 和 `ContainerRegionOutlet` 接入。

继续阅读 [业务物料](/guide/customization/materials) 或 [表单与字段](/guide/customization/forms-and-fields)。
