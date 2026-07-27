---
description: "把公告物料、组件映射、字段 adapter 和页面级配置接入活动页编辑器。"
---

# 添加物料与属性面板

在文本物料已可编辑后，公告物料把编辑协议和 Vue 组件放在同一份定义里：

<<< ../../../examples/guide-project/src/domain/widgets/notice.ts#tutorial-notice-widget

`type` 是持久化 Schema 标识，不能随意改名。`defaultProps` 在拖入时复制给新节点，`formSchema` 决定选中节点后右侧显示哪些字段。

将所有定义收集为设计器输入：

<<< ../../../examples/guide-project/src/domain/widgets/index.ts#tutorial-widget-registry

公告中的 `Asset` 不是内置字段。示例把它注册到字段 adapter map：

<<< ../../../examples/guide-project/src/forms/index.ts#tutorial-field-adapter

拖入公告后，右侧可以编辑文案、色调和精选状态；打开“使用背景图”后才显示资产字段。页面级配置则通过 `globalConfigSchema` 放在右侧的全局页签。

| 框架负责 | 宿主负责 |
| --- | --- |
| 物料创建、行为约束、字段绑定和 change 管线 | 物料 props、资源选择器、异步选项和业务校验 |

可复用字段使用字符串键和 `fieldComponentMap`。当前表单专用的说明、分割线或轻量操作区才使用 render factory；函数式 Vue 组件也必须先注册为字段 adapter。

**完成检查**：拖入公告后能编辑文案、色调和背景图，且页面标题与背景色可以从全局页签修改。

下一步：[保存草稿并预览运行时](/guide/learn/persistence-and-runtime)。
