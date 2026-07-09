# widgets 与 fields

这两个入口分别解决“如何整理物料”和“如何接入字段组件”。

先看一个最小示例：

```ts
import { buildComponentMap, getWidgetMetas } from '@dragcraft/widgets'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designerOptions = {
  widgetMetas: getWidgetMetas(myWidgetDefinitions),
  componentMap: buildComponentMap(myWidgetDefinitions),
  fieldComponentMap: createAntDesignVueFields(),
}
```

上面的三行刚好对应标准接入时最常见的三份输入。`@dragcraft/widgets` 更偏协议和整理工具，用来整理左侧物料和画布组件映射；`@dragcraft/fields-ant-design-vue` 则直接提供一份可用的 Ant Design Vue 字段映射，给右侧表单使用。

如果你要继续整理物料或替换字段 adapter，指南页里有更完整的上下文。关于这两个入口，目前知道这些就够了。准备好之后，继续阅读 [物料与字段](/guide/materials-and-fields)。
