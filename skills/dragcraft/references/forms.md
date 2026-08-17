# 表单与字段

读取 [forms resources](resources/forms.json)，再检查字段 adapter 类型、现有字段映射、`ifShow` 显示语义和目标 Schema 值格式。

## 实施

1. 用字符串字段键连接 `FormSchema` 与 `fieldComponentMap`；adapter 明确 Vue 组件、model prop、更新事件和必要的值转换。
2. 物料表单的未绑定字段写入当前节点 props，页面业务表单的未绑定字段写入 `globalConfig`；页面 surface、节点样式和容器状态使用显式 `bindTo`（surface 作用域为 `schema`）。
3. 用 `ifShow` 控制字段是否渲染（`visible` 仅作旧别名），用 `show` 控制隐藏而保留 DOM 状态，用 `disabled` 拒绝编辑但保留值。
4. 把联动、依赖和规则保留在 FormSchema，使变化继续经过设计器解析与 AuthoringAction 路径。
5. 业务字段负责异步选项或选择交互，adapter 负责框架值协议。字段 change 会先提交转换值，再运行规则并展示错误；把它作为编辑反馈，保存与发布仍由宿主重新校验。

## 完成标准

字段初值、组件事件、转换结果、错误展示、ifShow 和绑定目标形成闭环；测试应明确验证发生在 change 之后，并覆盖自定义 adapter、显式绑定、隐藏字段保值和宿主最终校验。
