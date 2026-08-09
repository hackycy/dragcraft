# 表单与配置

属性面板用 `FormSchema` 描述字段，并用 `fieldComponentMap` 将稳定字段键映射为实际 Vue 控件。字段 adapter 只负责值协议和控件交互；Designer 负责将变更转换成 `AuthoringAction`。

## 配置位置

| 目标 | 默认写入位置 | 显式绑定 |
| --- | --- | --- |
| 物料属性 | `node.props.{key}` | `bindTo` 可覆盖。 |
| 页面业务配置 | `globalConfig.{key}` | `bindTo` 可覆盖。 |
| 节点样式 | 无 | 使用节点样式 binding。 |
| 页面样式 | 无 | 使用页面 binding。 |
| 容器状态 | 无 | 使用容器 binding。 |

字段未指定 `bindTo` 时，节点 inspector 写入当前节点 props，Global 面板写入 globalConfig。跨节点数据不应被伪装为局部 props。

## Field Adapter

```ts
const fieldComponentMap = {
  ...createAntDesignVueFields(),
  Asset: {
    component: AssetField,
    modelPropName: 'modelValue',
    updateEventName: 'onUpdate:modelValue',
  },
}
```

可复用控件用字符串键从 `fieldComponentMap` 解析。函数形式的 `FieldSchema.component` 是当前表单专用 render factory，适合说明、分隔和轻量操作区。

`visible`、`show`、`disabled`、`dependencies`、`parseValue`、`valueFormat` 和 `rules` 都属于编辑体验。字段验证不能代替保存或发布服务的业务校验。

## 写入保证

表单不会直接修改 DocumentSchema。字段 change 经 Designer 生成 action，受到 material authoring policy、解析约束和 history 规则约束。拒绝和 unchanged 结果不产生 history；一次用户意图可通过 batch 保持为一次撤销。
