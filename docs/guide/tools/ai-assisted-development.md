---
description: "使用 DragCraft skill 按宿主项目的公开接口、精确指南和范例建立可复核的集成证据链。"
---

# AI 辅助开发

DragCraft 提供显式调用的 `dragcraft` skill。它先检查宿主项目实际安装的公开接口，再按任务选择精确指南、公开类型和参考实现。

使用统一的 skills CLI 安装：

```bash
npx skills@latest add hackycy/dragcraft
```

```text
$dragcraft 为活动页增加一个带两个 region 的容器，并验证变体迁移
```

维护说明见仓库中的 [skill 目录](https://github.com/hackycy/dragcraft/tree/main/skills)。skill 会按接入、命令、物料、表单、布局、容器、Shell 和生命周期八个工作流读取当前文档。

skill 不替代服务端权限、发布审核或生产运行时设计。它会把这些责任明确保留给宿主应用。取证过程用于避免猜测 API，不会在每次交付中生成固定证据报告。

**完成检查**：skill 能为当前任务读取对应的新指南、`guide-project` 源码和公开 package 入口，并在结论中说明宿主边界。
