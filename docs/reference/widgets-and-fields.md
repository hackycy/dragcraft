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

如果你要继续整理物料，指南页里有完整的物料协议和行为约束；字段 adapter 的用法单独在表单指南中展开。关于这两个入口，目前知道这些就够了。准备好之后，继续阅读 [自定义物料](/guide/materials-and-fields) 和 [配置表单与字段](/guide/forms-and-fields)。
