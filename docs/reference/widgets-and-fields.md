# widgets 与 fields

这两个入口分别解决“如何整理物料”和“如何接入字段组件”。

需要实现容器物料时，先阅读 [外部容器物料](/guide/container-materials)；本页说明相关 package 的公开 API。

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

物料协议、行为约束和展示元数据见 [自定义物料](/guide/materials-and-fields)；字段 adapter 的绑定与联动见 [配置表单与字段](/guide/forms-and-fields)。

## 容器物料 API

`defineContainerWidget()` 保留包含 `ContainerDefinition` 的 meta 推断。外部 meta 注册 variants、regions、constraints、material-owned migration 和 renderer drop adapters；组件和业务 CSS 持有全部 flex、grid、异形 DOM 与插入 geometry，framework themes 只提供 interaction-state 样式。

属性表单使用 `bindTo: { scope: 'container', path: 'variant' }` 编辑当前 variant。当前协议中容器只能存在于 `root.children`，regions 只拥有普通子节点；嵌套容器被拒绝，schema version 保持不变。
