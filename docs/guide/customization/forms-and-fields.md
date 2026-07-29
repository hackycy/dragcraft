---
description: "在活动页的属性面板上使用 FormSchema、字段 adapter、绑定范围和验证扩展。"
---

# 表单与字段

当物料已有稳定 props 后，字段 schema 使用稳定字符串键定位 UI adapter。公告示例把资产选择器注册为 `Asset`。

## 注册一个可复用字段

`src/forms/index.ts`：

<<< ../../../examples/guide-project/src/forms/index.ts

一个 adapter 声明真实控件的 model prop 和 update event。这里的 `AssetField` 使用 Vue 默认的 `modelValue` / `onUpdate:modelValue`；如果你接入的控件使用 `value` 或 `checked`，在 adapter 中明确写出它们。

## 先使用默认绑定

物料表单中未声明 `bindTo` 的字段默认更新当前节点的 `props.{key}`。全局表单默认更新 `globalConfig.{key}`；需要编辑页面 surface 或容器变体时，声明明确的 `bindTo`。

| 场景 | 使用方式 |
| --- | --- |
| 可复用字段 | `component: 'Asset'` 加 `fieldComponentMap` |
| 当前表单专用说明或操作区 | `FieldRenderFactory` |
| 修改节点、Schema、全局配置或容器状态 | `bindTo` 指定 `scope` 与 `path` |

活动页的全局设置展示了 `schema` scope：

`src/editor/global-config-schema.ts`：

<<< ../../../examples/guide-project/src/editor/global-config-schema.ts

`backgroundColor` 不写到 `globalConfig`，而是写到 `root.style.surface.backgroundColor`。这能避免把页面视觉 DSL 伪装成业务配置字段。

## 再添加联动和校验

`visible` 和 `disabled` 接收当前 `FormContext`。公告的背景图字段只有 `hasImage` 为真时出现。需要校验时，把规则放在字段 schema；需要远程选项、资产权限或最终安全校验时，把异步逻辑和服务端约束留在宿主。

```ts
{
  key: 'name',
  label: '名称',
  component: 'Input',
  rules: [
    { required: true, message: '名称不能为空' },
    { validator: value => typeof value === 'string' && value.length <= 50 || '最多 50 个字符' },
  ],
}
```

`parseValue` 处理输入值到模型值，`valueFormat` 处理模型值到控件值。不要在组件 render 函数里偷偷转换持久化值，否则同一字段在编辑器、导入和运行时容易产生不同含义。

函数值会被解释为 render factory。要使用 Vue 函数式组件，先把它注册到 `FieldComponentMap`。更多字段类型见 [Designer 表单与字段](/reference/designer-forms)。

**完成检查**：切换“使用背景图”后，`Asset` 字段出现或隐藏；其值只写入公告的 `props.image`。

下一步：[页面布局与容器](/guide/customization/layout-and-containers)。字段绑定和 adapter 的完整约束见 [Architecture Map 的字段绑定](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/04-form-and-configuration.md#字段绑定到-schema-dsl) 与 [字段 Adapter 协议](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/04-form-and-configuration.md#字段-adapter-协议)。
