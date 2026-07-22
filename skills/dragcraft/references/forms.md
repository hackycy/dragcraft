# 表单与字段

## 证据链

读取 Form Generator 与 Designer 的类型、字段指南和现有字段 adapter。先确认字段组件的 model prop、更新事件以及 Schema 值格式。

## 实施

1. 用字符串字段键连接 `FormSchema` 与 `fieldComponentMap`；复用字段以 adapter 定义 Vue 组件、model prop、更新事件和需要时的值转换。
2. 让物料表单未绑定字段写入当前节点 props，让页面表单未绑定字段写入 `globalConfig`；对样式、容器 variant 等非默认位置使用明确的 `bindTo`。
3. 将表单专用的说明、分隔线和轻量交互写成 render factory；需要复用或序列化的控件保持字符串键和 adapter 注册。
4. 把显示条件、依赖与规则保留在 FormSchema，使字段变更继续走设计器的解析与命令路径。

## 完成

确认字段初值、组件事件、规范化值和绑定目标形成闭环。为自定义 adapter 或绑定路径补充至少一个值变化测试。
