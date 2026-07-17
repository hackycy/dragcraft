# 核心心智模型

dragcraft 把可视化搭建拆成“页面数据、编辑器 UI、业务扩展”三件事。先看一次属性修改会经过什么路径：

```text
右侧字段 change
  -> designer 解析 bindTo
  -> engine.execute(UPDATE_PROPS / SET_GLOBAL_CONFIG)
  -> core 写入 Schema、记录历史、触发 schema:changed
  -> renderer 根据新 Schema 更新画布
```

这条路径是设计器可维护的核心。表单、物料栏和自定义动作都不直接修改 Schema，它们都通过命令系统汇合。

## 业务应用需要提供什么

```ts
const designer = createDesigner({
  widgetMetas,
  componentMap,
  fieldComponentMap,
  globalConfigSchema,
})
```

这四份输入各自有清晰的边界：

| 输入 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| `widgetMetas` | 物料行为、默认属性、配置 schema、布局意图 | Vue 组件实现 |
| `componentMap` | `node.type` 到 Vue 组件的映射 | 物料栏展示和表单定义 |
| `fieldComponentMap` | 表单字段到 UI 库控件的值绑定 | Schema 持久化 |
| `globalConfigSchema` | 页面级配置的属性面板 | 服务端业务校验 |

## 每个包在什么时候出现

`@dragcraft/designer` 是通常的唯一入口，它组合 core、renderer 和 form-generator。只有在需要替换某一层时，才直接使用下层包。

- `@dragcraft/core`：定义 Schema、命令、历史、行为约束和事件。
- `@dragcraft/renderer`：把 Schema 节点变成设计态 Vue 组件，并提供画布扩展点。
- `@dragcraft/form-generator`：根据 FormSchema 渲染字段，不持久化页面数据。
- `@dragcraft/themes`：聚合 UI 包的必要结构 CSS，并提供默认工作台 token 与视觉配方；不改变编辑器逻辑，也不负责业务物料内容主题。

## 读取与写入规则

```ts
const snapshot = designer.engine.state.getSchema()

designer.engine.execute({
  type: CommandType.SET_GLOBAL_CONFIG,
  payload: { config: { title: '夏日活动' } },
})
```

读取使用 `engine.state` 或 `useDesigner()`，写入使用 `engine.execute()`。`engine.store` 是 core 内部状态；业务代码直接修改它会跳过历史记录、事件和约束检查。

关于整体分层，目前知道这些就够了。准备好之后，继续阅读 [Schema 与布局](/guide/schema-and-layout)。
