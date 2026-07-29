# 表单与字段

读取 [forms resources](resources/forms.json)，再检查字段 adapter 类型、现有字段映射和目标 Schema 值格式。

## 实施

1. 用字符串字段键连接 `FormSchema` 与 `fieldComponentMap`；adapter 明确 Vue 组件、model prop、更新事件和必要的值转换。
2. 物料表单的未绑定字段写入当前节点 props，页面表单的未绑定字段写入 `globalConfig`；样式、容器状态和其他位置使用显式 `bindTo`。
3. 把联动、显示条件、依赖和规则保留在 FormSchema，使变化继续经过设计器解析与命令路径。
4. 业务字段负责异步选项或选择交互，adapter 负责框架值协议。字段 change 会先提交转换值，再运行规则并展示错误；把它作为编辑反馈，保存与发布仍由宿主重新校验。

## 完成标准

字段初值、组件事件、转换结果、错误展示和绑定目标形成闭环；测试应明确验证发生在 change 之后，并覆盖自定义 adapter、显式绑定和宿主最终校验。
