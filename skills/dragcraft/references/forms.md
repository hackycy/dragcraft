# 表单与字段

读取 [forms resources](resources/forms.json)，再检查字段 adapter 类型、现有字段映射、`ifShow` 显示语义和目标 Schema 值格式。

## 实施

1. 用字符串字段键连接 `FormSchema` 与 `fieldComponentMap`；adapter 明确 Vue 组件、model prop、更新事件和必要的值转换。函数形式的 `component` 仅提供当前表单专用的 control 内容，字段外框始终由 FormGenerator 按 `label -> control -> help-message -> error` 生成。
2. `label` 可省略、使用字符串，或使用接收只读 `FieldPresentationContext` 的 renderer；空字符串或空 renderer 结果不生成标签节点。`labelKey` 只翻译静态标签，自定义标签通过 `ctx.t()` 翻译。
3. `helpMessage` 使用字符串或返回字符串的 `FieldPresentationContext` 回调，作为 control 后持续可见的纯文本说明；空结果不生成节点，并与校验错误同时保留。`tooltip` 已移除，Schema 使用者迁移到 `helpMessage`。
4. 物料表单的未绑定字段写入当前节点 props，页面业务表单的未绑定字段写入 `globalConfig`；页面 surface、节点样式和容器状态使用显式 `bindTo`（surface 作用域为 `schema`）。
5. 用 `ifShow` 控制字段是否渲染（`visible` 仅作旧别名），用 `show` 控制隐藏而保留 DOM 状态，用 `disabled` 拒绝编辑但保留值。
6. 把联动、依赖和规则保留在 FormSchema，使变化继续经过设计器解析与 AuthoringAction 路径。
7. 业务字段负责异步选项或选择交互，adapter 负责框架值协议。字段 change 会先提交转换值，再运行规则并展示错误；把它作为编辑反馈，保存与发布仍由宿主重新校验。

## 完成标准

字段初值、组件事件、转换结果、字段展示、错误展示、ifShow 和绑定目标形成闭环；测试应明确验证发生在 change 之后，并覆盖自定义 adapter、显式绑定、隐藏字段保值、factory 的统一 field chrome、空标签、动态辅助说明与校验错误共存，以及宿主最终校验。
