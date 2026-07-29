---
description: "使用 DragCraft skill 按宿主项目的公开接口、精确指南和范例建立可复核的集成证据链。"
---

# AI 辅助开发

DragCraft 提供显式调用的 `dragcraft` skill。它先检查宿主项目实际安装的公开接口，再按任务选择精确指南、公开类型和参考实现。

```text
$dragcraft 为活动页增加一个带两个 region 的容器，并验证变体迁移
```

安装方式和完整证据链见仓库中的 [skill 说明](https://github.com/hackycy/dragcraft/tree/main/skills/dragcraft)。skill 会按接入、物料、容器、表单、Shell 和生命周期六个工作流读取当前文档。

skill 不替代服务端权限、发布审核或生产运行时设计。它会把这些责任明确保留给宿主应用。

**完成检查**：skill 能为当前任务读取对应的新指南、`guide-project` 源码和公开 package 入口，并在结论中说明宿主边界。
