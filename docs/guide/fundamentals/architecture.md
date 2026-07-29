---
description: "建立 Designer、Core、Renderer、表单和宿主应用之间的协作模型。"
---

# 框架如何协作

DragCraft 的公开入口是一个可视化工作台，但页面数据始终由无 UI 的命令内核管理。理解这条边界后，你可以判断一个需求应该放进物料、字段、Designer 扩展还是宿主服务。

## 从一次属性修改开始

在右栏修改公告文案时，实际经过以下路径：

```text
业务字段组件
  -> Field adapter 归一化值
  -> FormGenerator 发出 change
  -> Designer 将 bindTo 翻译为命令
  -> Core 校验并原子提交 Schema
  -> History 保存旧快照，EventHub 发出事件
  -> Renderer 读取新快照并更新画布
```

表单引擎不直接依赖 Core，Renderer 也不能直接修改 Schema。Designer 负责把 UI 意图翻译为命令，因此字段绑定、节点动作和拖放最终共享相同的历史与校验语义。

## 区分五类职责

| 模块 | 持有什么 | 不负责什么 |
| --- | --- | --- |
| Core Engine | Schema、命令、历史、注册表、事件 | Vue 组件和 DOM |
| Designer | 三栏工作台、字段绑定、扩展点组装 | 草稿服务和生产发布 |
| Renderer | 设计态组件树、选择、拖拽、工具栏 | 业务状态和生产页面 |
| Form Generator | 字段状态、联动、验证、adapter 调用 | Schema 持久化和命令执行 |
| 宿主应用 | 物料、权限、仓储、发布、生产运行时 | 绕过命令修改编辑状态 |

公开应用只从 `@dragcraft/designer` 使用前四类能力的聚合接口。`@dragcraft/device-frames` 和 `@dragcraft/fields-*` 是另外两类公开 adapter；其余 workspace package 属于实现模块。

## 创建实例时发生什么

完整活动页的组装代码如下：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts

实例创建遵循固定顺序：

1. 创建 Designer 和空 Engine。
2. 注册物料 metadata、组件、字段和工作台扩展。
3. 注册 Schema migrations。
4. 导入初始 Schema，并由当前注册表校验。
5. 将实例传给 `DcDesigner`。

如果直接把未注册的初始 Schema 交给 Engine，容器定义、物料类型和迁移结果无法按当前业务协议验证。

## 选择扩展位置

| 需求 | 放置位置 |
| --- | --- |
| 改变页面业务内容 | 物料 Vue 组件和 props |
| 改变可编辑字段 | `FormSchema` 与字段 adapter |
| 改变页面结构所有权 | Layout 或 `ContainerDefinition` |
| 写入页面 Schema | 字段绑定、内置 command 或节点 action |
| 增加确认、权限和审计 | `actionInterceptors` 与宿主服务 |
| 改变工作台视觉 | 主题 token、公开 data hook 或扩展 renderer |
| 保存和发布页面 | 宿主仓储、校验与发布流程 |

组件内部需要修改自身节点时，可以使用 `useWidgetRuntime()`。它仍会执行 Core command，不应以本地 DOM 状态模拟应该持久化的页面状态。

## 不受支持的路径

- 直接修改 `engine.store.schema.value` 或冻结快照。
- 从公开应用导入内部 package，绕过 Designer 聚合入口。
- 把设计态 `RootRenderer` 当成生产页面运行时。
- 依赖私有 `.dc-*` class 修改交互结构。
- 用自定义 command 替代已经存在的内置命令和字段绑定。

需要继续理解数据时，阅读 [Schema 与样式作用域](/guide/fundamentals/schema)；需要理解写入保证时，阅读 [状态、命令、历史与事件](/guide/fundamentals/state-commands-and-history)。
