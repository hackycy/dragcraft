# DragCraft Skills

`dragcraft` 是面向 Vue 3 集成项目的显式调用 skill。它按任务加载物料、容器、表单、UI Shell 或 Schema 生命周期的专项流程，并以本地版本优先的证据链降低 API 幻觉。

## 安装

使用统一的 skills CLI 安装仓库中的 `dragcraft` skill：

```bash
npx skills@latest add hackycy/dragcraft
```

CLI 会发现仓库中的唯一 skill，并让你选择安装范围与目标 agent。更新已安装内容时运行 `npx skills@latest update dragcraft`。

skill 在宿主中优先读取已安装 package 的公开声明和 source map 的官方 URL；只有检测到 DragCraft 源码 checkout 时才读取仓库路径。

## 使用

在支持 user-invoked skills 的 coding agent 中输入：

```text
$dragcraft 为当前 Vue 页面新增一个带属性面板的优惠券物料
```

skill 会按需求选择接入、命令、物料、表单、布局、容器、Shell 或生命周期工作流，只读取对应的本地类型、框架指南和业务示例，再实施并验证。证据链用于约束开发过程，最终回复保持正常的工程交付形式。

运行 `pnpm skills:test` 验证维护检查的反例覆盖，运行 `pnpm skills:check` 确认 skill、资源映射、评测结果和文档入口保持同步。
