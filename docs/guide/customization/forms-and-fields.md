---
description: "使用 FormSchema、字段 adapter、绑定范围和 render factory 定制属性面板。"
---

# 表单与字段

当物料已有稳定 props 后，字段 schema 使用稳定字符串键定位 UI adapter。公告示例把资产选择器注册为 `Asset`：

<<< ../../../examples/guide-project/src/forms/index.ts#tutorial-field-adapter

物料表单中未声明 `bindTo` 的字段默认更新当前节点的 `props.{key}`。全局表单默认更新 `globalConfig.{key}`；需要编辑页面 surface 或容器变体时，声明明确的 `bindTo`。

| 场景 | 使用方式 |
| --- | --- |
| 可复用字段 | `component: 'Asset'` 加 `fieldComponentMap` |
| 当前表单专用说明或操作区 | `FieldRenderFactory` |
| 修改节点、Schema、全局配置或容器状态 | `bindTo` 指定 `scope` 与 `path` |

| 框架负责 | 宿主负责 |
| --- | --- |
| 字段可见性、禁用状态、值转换和校验触发 | 远程选项、资产权限、异步校验和最终服务端校验 |

函数值会被解释为 render factory。要使用 Vue 函数式组件，先把它注册到 `fieldComponentMap`。更多字段类型见 [Designer 表单与字段](/reference/designer-forms)。

**完成检查**：切换“使用背景图”后，`Asset` 字段出现或隐藏；其值只写入公告的 `props.image`。

下一步：[页面布局与容器](/guide/customization/layout-and-containers)。
