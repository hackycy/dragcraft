---
name: dragcraft
description: DragCraft 集成与高级扩展的手动路由器。
disable-model-invocation: true
---

# DragCraft

用 `$dragcraft <任务>` 为 Vue 项目接入或扩展 DragCraft。把每个新 API、约束和验证结果放进一条可复核的证据链。

## 路由

先阅读 [source map](references/source-map.json)，选择一个主工作流，再只加载对应的 playbook：

| 任务意图 | Playbook |
| --- | --- |
| 安装、创建实例、挂载设计器、接入页面 | [integration](references/integration.md) |
| 新增或改造普通业务组件、物料栏、创建约束 | [widgets](references/widgets.md) |
| 分栏、网格、region、容器变体或拖放几何 | [containers](references/containers.md) |
| 属性面板、字段 adapter、字段联动或 `bindTo` | [forms](references/forms.md) |
| 主题、设备框、侧栏、工具栏、画布或完整 Shell | [shell](references/shell.md) |
| 导入导出、草稿发布、运行时消费 Schema | [lifecycle](references/lifecycle.md) |

跨越多个区域时，先完成主工作流，再加载直接依赖的第二份 playbook；每份都应为当前改动提供独立证据。

## 证据链

1. 阅读 [evidence](references/evidence.md)，确认宿主项目的包管理器、锁文件、已安装版本和现有接入模式。
2. 从 source map 读取当前工作流的资源。只在确认 DragCraft 源码 checkout 后读取 `repositoryPath`；其他宿主使用 `url` 和已安装包的声明。先检查本地声明或源码，再读取精确文档章节。
3. 用 `llms.txt` 定位尚未映射的文档；只有索引不能定位所需事实时才读取 `llms-full.txt`。
4. 为每个新增的框架 API 保留来源、版本、所依赖的契约和验证方式。已安装声明与线上文档不同时，按已安装版本实现，并说明兼容或升级选择。

## 交付

完成前确认：每个改动属于选定扩展边界；所有 Schema 写入通过公开命令或绑定路径；相关验证已经执行或明确说明无法执行的原因。

最终交付包含使用的证据、采用的框架边界、改动范围和实际验证命令。无法取得必需证据时，说明缺口和阻塞，不猜测 API。
