---
name: dragcraft
description: DragCraft 集成与高级扩展的显式开发路由器。
disable-model-invocation: true
---

# DragCraft

用 `$dragcraft <任务>` 在 Vue 项目中接入或扩展 DragCraft。按“路由、取证、开发、验证”推进；证据链约束实现过程，不是固定的交付模板。

## 1. 路由

根据需求与验收条件选择一个主工作流。只有验收条件确实跨越边界时，才加载对应的直接依赖：

| 任务意图 | Playbook |
| --- | --- |
| 安装、quickstart、创建实例、注册顺序、Vue 挂载或释放 | [integration](references/integration.md) |
| Schema action、节点 action、结果、history、事件或撤销 | [commands](references/commands.md) |
| 普通物料、Schema 托管物料、动作、Presentation 或 Authoring Policy | [widgets](references/widgets.md) |
| 字段 adapter、绑定、ifShow、联动、转换、验证或全局配置 | [forms](references/forms.md) |
| 页面 frame、viewport portal、reservation、容器展示或生产运行时边界 | [layout](references/layout.md) |
| region、放置约束、插入几何或容器变体 | [containers](references/containers.md) |
| 主题、设备、面板、画布扩展、消息或 Container Shell | [shell](references/shell.md) |
| 导入诊断、草稿、发布或生产运行时 | [lifecycle](references/lifecycle.md) |

路由完成标准：每项验收行为都归入一个已选择的工作流，没有为无关能力加载 playbook。

## 2. 取证

阅读 [证据规则](references/evidence.md) 和 [source map](references/source-map.json)，再读取每个已选择工作流的 playbook 与 `resources` 文件。先检查宿主的锁文件、已安装公开声明和现有接入方式，再使用映射中的精确指南与示例。

取证完成标准：每个准备调用的 DragCraft 导入和关键契约都有当前宿主可复核的公开来源；无法证明存在的 API 不进入实现。

## 3. 开发

按 playbook 的扩展边界实施。复用宿主既有模式，让 Schema 写入继续经过公开 `AuthoringAction` 或绑定路径；源码只能解释行为，不能把内部模块变成宿主可调用接口。

开发完成标准：每项验收行为都有可观察结果，所有 DragCraft 导入都来自当前安装版本支持的公开 package。

## 4. 验证

先运行覆盖新增行为的最窄测试，再运行宿主已有的类型检查、构建或相关质量门禁。失败时继续修复；缺少必要证据或环境时明确阻塞条件。

验证完成标准：验收行为与相关失败路径已验证，检查均通过或已准确说明无法运行的原因。最终回复按正常开发任务报告改动、关键取舍和实际测试结果；只在版本冲突、API 选择、阻塞或用户询问时说明证据来源。
