# dragcraft Architecture Map

本目录记录 DragCraft 作为面向垂直业务场景的 Schema 驱动可视化页面编排框架所实施的稳定架构边界。业务接入只使用 `@dragcraft/designer`、`@dragcraft/device-frames` 和 `@dragcraft/fields-*`。

## 阅读路径

1. [项目总览](./01-overview.md)：公开入口、运行链路和工作台边界。
2. [Schema 与 Authoring Engine](./02-schema-and-core.md)：DocumentSchema、解析状态、action 与 history。
3. [Designer 与 Presentation](./03-designer-and-renderer.md)：物料展示、画布、Device Frame 与扩展。
4. [表单与配置](./04-form-and-configuration.md)：FormSchema、字段 adapter 和写入路径。
5. [物料、字段与工具](./05-widgets-fields-and-utils.md)：MaterialDefinition、容器与字段注册。
6. [主题与设备容器](./06-themes-and-device-frames.md)：工作台 CSS 与设备外壳。
7. [包职责索引](./07-package-reference.md)：公开 package 支持面。
8. [布局系统](./08-layout-system.md)：页面结构与宿主展示策略的边界。

## 维护规则

- 修改公开 `DesignerInstance`、Schema、action 或 MaterialDefinition 时，同步更新对应章节。
- 修改设计态结构、Device Frame 或主题契约时，同步更新 Presentation 与主题章节。
- 不将内部模块、过渡实现或历史兼容协议写入公开架构说明。
