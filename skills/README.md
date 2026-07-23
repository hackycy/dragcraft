# DragCraft Skills

`dragcraft` 是面向 Vue 3 集成项目的显式调用 skill。它按任务加载物料、容器、表单、UI Shell 或 Schema 生命周期的专项流程，并以本地版本优先的证据链降低 API 幻觉。

## 安装

将本仓库的 `skills/dragcraft` 保留为唯一源。仓库内开发时，为使用的 agent 创建链接：

```bash
npx skills@latest add hackycy/dragcraft
```

外部项目可先克隆本仓库，再把该项目中的 `skills/dragcraft` 复制或链接到相同的目标目录。skill 在外部宿主中优先读取已安装包的类型和 source map 的官方 URL；只有检测到 DragCraft 源码 checkout 时才读取仓库路径。更新 DragCraft 时同步更新该目录。

## 使用

在支持 user-invoked skills 的 coding agent 中输入：

```text
$dragcraft 为当前 Vue 页面新增一个带属性面板的优惠券物料
```

skill 会选择一个工作流，读取与当前任务相关的本地类型、框架指南与 Playground 范例，再实施和验证。运行 `pnpm skills:test` 验证维护检查的反例覆盖，运行 `pnpm skills:check` 确认 skill、source map、评测、agent 结果和文档入口保持同步。
