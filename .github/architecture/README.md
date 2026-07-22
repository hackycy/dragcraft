# dragcraft Architecture Map

本目录统一管理 dragcraft 的架构、包职责和设计约束文档。包目录下不再维护独立 README，新增架构说明请按主题写入本目录。

## 阅读路径

1. [项目总览](./01-overview.md)
   - 产品目标
   - Monorepo 结构
   - 分层架构
   - 对外使用模式

2. [Schema 与 Core Engine](./02-schema-and-core.md)
   - 扁平 Schema 模型
   - LayoutPlan 投影
   - 命令系统、历史、事件与注册中心
   - Widget 行为控制与位置锁定

3. [Designer 与 Renderer](./03-designer-and-renderer.md)
   - 三栏设计工作台
   - 画布拖拽、选中、mask 与 toolbar
   - Renderer 渲染管线
   - 扩展点、event hooks 与 node action 系统

4. [Form 与配置系统](./04-form-and-configuration.md)
   - FormSchema 协议
   - 表单渲染管线
   - 字段联动、验证和值变更数据流

5. [物料、字段与工具包](./05-widgets-fields-and-utils.md)
   - 物料协议与工具函数
   - 字段 adapter 与内置字段包
   - icons 与 utils 包职责

6. [主题与设备容器](./06-themes-and-device-frames.md)
   - 可主题化设计工作台与公共主题契约
   - Design Tokens
   - 设备容器与 toolbar 集成

7. [包职责索引](./07-package-reference.md)
   - 每个 package 的定位
   - 主要导出
   - 依赖方向和集成方式

8. [布局系统](./08-layout-system.md)
   - Flow、Chrome 与 Layer placement
   - LayoutPlan 生成与消费
   - 设备框架 inset 与浮层渲染
   - 排序与可见性控制

## 文档维护规则

- 新增或修改包职责时，优先更新 [包职责索引](./07-package-reference.md)。
- 修改 Schema、命令、行为约束时，同步更新 [Schema 与 Core Engine](./02-schema-and-core.md)。
- 修改 `engine.state` / `engine.store` 边界、command 语义或对外入口分级时，同步更新 [项目总览](./01-overview.md)、[Schema 与 Core Engine](./02-schema-and-core.md) 与 [Designer 与 Renderer](./03-designer-and-renderer.md)。
- 修改 designer、renderer、form-generator、themes、device-frames 的扩展点时，同步更新对应章节。
- 重构完成后把最终架构合并进对应主题章节，不保留已实施方案索引或重构过程文档。
- 包目录下不再新增 README 或架构 Markdown，避免文档入口分散。
