# 配置表单与字段

右侧属性面板由 `FormSchema` 描述。可复用字段由 adapter map 提供，一次性内容则可以直接写成 render factory。

先看一个同时编辑物料属性和页面 surface 的表单：

```ts
import type { FormSchema } from '@dragcraft/designer'

const globalConfigSchema: FormSchema = {
  sections: [{
    title: '页面外观',
    fields: [{
      key: 'backgroundColor',
      label: '背景颜色',
      component: 'Color',
      bindTo: { scope: 'schema', path: 'root.style.surface.backgroundColor' },
    }],
  }],
}

const noticeForm: FormSchema = {
  sections: [{
    title: '内容',
    fields: [{ key: 'text', label: '公告文字', component: 'Input' }],
  }],
}
```

物料表单中未声明 `bindTo` 的字段默认写入当前节点的 `props.{key}`。全局表单中的未绑定字段默认写入 `globalConfig.{key}`；上面的显式绑定则写入根节点的页面样式 DSL。

## 接入字段 adapter

使用 adapter 时，字段 schema 中的 `component` 是字符串键，不是 Vue 组件本身。adapter 里的 `component` 才是真实的 Vue `Component`，因此可以注册 `defineComponent()` 创建的组件，也可以注册函数式组件。

Ant Design Vue 已经提供一份可直接使用的映射：

```ts
import { createDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  fieldComponentMap: createAntDesignVueFields(),
  globalConfigSchema,
})
```

这份 map 已定义 `Input` 使用 `value` / `onUpdate:value`，`Switch` 使用 `checked` / `onUpdate:checked` 等绑定差异。业务字段可以与它合并：

```ts
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const fieldComponentMap = {
  ...createAntDesignVueFields(),
  Color: {
    component: ColorPicker,
    modelPropName: 'modelValue',
    updateEventName: 'onUpdate:modelValue',
    normalizeValue: value => String(value).toUpperCase(),
  },
}
```

`normalizeValue` 把 UI 组件输出转成 Schema 值。需要把旧值展示成另一种输入格式时，再使用 `formatValue`。

## 复用 Vue 函数式组件

函数式组件与普通 Vue 组件的注册方式相同。关键是让 adapter 的 prop 名和事件名与组件契约一致：

```ts
import type { FunctionalComponent } from 'vue'
import { h } from 'vue'

const AssetField: FunctionalComponent<{ modelValue?: string }> = (props, { emit }) =>
  h('button', {
    type: 'button',
    onClick: () => emit('update:modelValue', 'asset://banner-1'),
  }, props.modelValue ? '更换图片' : '选择图片')

const fieldComponentMap = {
  Asset: {
    component: AssetField,
    modelPropName: 'modelValue',
    updateEventName: 'onUpdate:modelValue',
  },
}

const imageForm: FormSchema = {
  sections: [{
    title: '图片',
    fields: [{ key: 'src', label: '图片', component: 'Asset' }],
  }],
}
```

这里 `Asset` 是稳定的 Schema 标识，`AssetField` 是 Vue 函数式组件。要复用这类组件，仍然把组件引用放进 `fieldComponentMap`，再由字符串键连接 Schema 和 adapter。

## 直接渲染一次性字段内容

标题、分割线和只读说明不需要先注册字段。把 `component` 写成 factory，就能直接返回这块字段的完整内容：

```ts
import type { FormSchema } from '@dragcraft/designer'
import { h } from 'vue'

const articleForm: FormSchema = {
  sections: [{
    title: '文章',
    fields: [{
      key: '__basic-divider',
      label: '',
      component: ({ t }) => () =>
        h('div', { class: 'article-form__divider' }, t('form.basic', '基础设置')),
      span: 2,
    }],
  }],
}
```

factory 在字段 `setup()` 时执行一次，返回的 render 函数会在响应式状态变化时重新调用。它的内容不会套上默认 label 和 control，但字段 wrapper 仍会处理 `visible`、`ifShow`、`show`、`disabled` 和 `span`。

临时交互也可以使用同一条路径。`value` 和 `disabled` 是计算引用，`setValue()` 会沿用字段的解析、change 事件和校验流程：

```ts
import AssetPicker from './AssetPicker.vue'

{
  key: 'cover',
  label: '封面图',
  component: ({ value, disabled, setValue }) => () =>
    h(AssetPicker, {
      modelValue: value.value,
      disabled: disabled.value,
      'onUpdate:modelValue': setValue,
    }),
}
```

## 字符串还是 factory？

两种方式都能生成字段内容，选择取决于这段内容是否需要复用和持久化。

- Input、Select、资产选择器等复用字段使用字符串键和 `fieldComponentMap`。
- 当前表单专用的标题、分割线、说明或轻量操作区使用 factory。
- 需要保存为 JSON 或跨进程传输的 FormSchema 使用字符串键，因为函数不能序列化。

::: warning 函数始终按 factory 解释
Vue 函数式组件和 render factory 在运行时都是函数，无法可靠区分。`component: SomeFunction` 始终表示 `FieldRenderFactory`；要使用可复用的 Vue 函数式组件，请先把它注册到 `fieldComponentMap`，再在 Schema 中填写字符串键。
:::

完整的 factory 上下文定义见 [`FieldRenderContext` API](/reference/form-generator#fieldrendercontext)。

## 让字段联动和校验

表单字段能根据当前值决定是否显示、禁用和校验。

```ts
{
  key: 'linkUrl',
  label: '链接地址',
  component: 'Input',
  visible: ctx => ctx.values.hasLink === true,
  rules: [{
    required: ctx => ctx.values.hasLink === true,
    message: '请输入链接地址',
  }],
}
```

`visible` 不满足时字段不渲染；`show` 只隐藏 DOM，适合需要保留控件状态的场景。需要按照其他字段动态改写 placeholder、选项或规则时使用 `dependencies`，但不能借此改变字段的 `key` 或 `component`。

需要定制节点动作、确认流程或属性栏本身时，继续阅读 [动作与视图扩展](/guide/extending-the-designer)。
