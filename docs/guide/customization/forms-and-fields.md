---
description: "使用 FormSchema、字段 adapter、绑定范围、联动、转换和验证定制属性面板。"
---

# 表单与字段

FormSchema 描述字段，Field adapter 描述真实 UI 控件如何接收和提交值，Designer 再把 change 转为 `AuthoringAction`。三层各自有边界，业务字段不需要依赖内部实现。

## 先声明字段

公告中的 `Asset` 字段由宿主注册，其他字段来自 Ant Design Vue adapter：

<<< ../../../examples/guide-project/src/forms/index.ts

字段 adapter 至少需要说明 `component`、model prop 和 update event。`componentProps` 会透传给实际 UI 组件；异步资源列表、权限和上传行为属于字段组件。

## 选择绑定范围

| 目标 | 默认或显式绑定 | 写入 action |
| --- | --- | --- |
| 当前节点 props | widget 字段默认值 | `UPDATE_PROPS` |
| 当前节点 style | `{ scope: 'node', path: 'style.container.*' }` | `UPDATE_PROPS` |
| 页面 surface | `{ scope: 'page', path: 'style.surface.*' }` | 语义化页面 action |
| 页面业务配置 | 全局字段默认值 | `SET_GLOBAL_CONFIG` |
| 容器 variant | `{ scope: 'container', path: 'variant' }` | `CHANGE_CONTAINER_VARIANT` |

默认绑定适合物料自身 props。页面视觉、容器状态和跨节点数据应显式写出 `bindTo`，让保存位置一眼可见。

## 控制字段显示和禁用

`visible` 会移除字段，`show` 只隐藏 CSS 并保留 DOM 状态，`disabled` 保留当前值但拒绝编辑。字段联动读取 `FormContext.values`：

```ts
{
  key: 'image',
  label: '背景图',
  component: 'Asset',
  visible: ctx => ctx.values.hasImage === true,
  disabled: ctx => ctx.values.locked === true,
}
```

Authoring policy 对物料能力的拒绝优先于 dependency handler。即使联动函数返回 `disabled: false`，Designer 仍会拒绝未授权的写入。

## 转换和验证

输入值和 Schema 值不一致时，使用 `parseValue` 和 `valueFormat`；不要把转换逻辑散落在多个组件事件里。字段规则按 required 到自定义 validator 顺序执行，首个错误短路：

```ts
{
  key: 'title',
  label: '标题',
  component: 'Input',
  rules: [
    { required: true, message: '标题不能为空' },
    {
      validator: (value) => typeof value === 'string' && value.length <= 50
        ? true
        : '标题不能超过 50 个字符',
    },
  ],
}
```

表单验证改善编辑体验，不能代替保存接口和发布服务的最终校验。

## 选择字段组件还是 render factory

可复用 Vue 控件先注册为 `fieldComponentMap` 中的字符串键。函数形式的 `FieldSchema.component` 总是当前表单专用的 render factory，适合说明、分割线和轻量操作区；不要用它替代可复用字段 adapter。

完整字段协议见 [Designer 表单与字段参考](/reference/designer-forms)。
