# 物料与字段

这一页会回答两个问题：左侧能拖的物料从哪里来，右侧字段组件又是怎么接进来的。

先看两个入口：

```ts
import { registerWidgets, buildComponentMap } from '@dragcraft/widgets'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
```

`@dragcraft/widgets` 负责帮你整理 widget meta 和组件映射。`@dragcraft/fields-ant-design-vue` 提供的是右侧表单字段的 adapter map。

## 物料最少需要什么

至少要有一组 `widgetMetas`，再配上一份 `componentMap`。

设计器左侧显示哪些卡片，取决于 `DesignerWidgetMeta.material`。画布里真正渲染什么，则取决于 `componentMap`。

## 字段组件最少需要什么

如果你直接使用 Ant Design Vue，可以先用：

```ts
const fieldComponentMap = createAntDesignVueFields()
```

这个 map 会把 `Input`、`Select`、`Switch` 这类字段类型绑定到真实组件，同时声明每个字段的 `modelPropName` 和更新事件。

关于第一批自定义点，目前知道这些就够了。准备好之后，继续阅读 [主题与设备框架](/guide/themes-and-device-frames)。
