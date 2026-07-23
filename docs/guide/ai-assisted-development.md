---
description: "安装并使用 DragCraft 的显式 AI 开发 skill，以本地版本优先的证据链完成集成与高级扩展。"
---

# AI 辅助接入

DragCraft 提供一个显式调用的 `dragcraft` skill。它不会复制 API 文档，而是根据任务读取当前项目的实际依赖、精确的指南和 Playground 范例，帮助 coding agent 以可验证的方式完成集成。

skill 覆盖设计器接入、业务物料、外部容器、属性表单和字段、UI Shell、草稿发布与生产运行时。开发者只需要记住一个入口：

```text
$dragcraft <描述当前任务>
```

例如：

```text
$dragcraft 为商品详情页新增一个可切换布局的双列容器，并验证拖放约束
```

## 安装

本仓库的 [`skills/dragcraft`](https://github.com/hackycy/dragcraft/tree/main/skills/dragcraft) 是唯一源。仓库内开发时，按所用 agent 创建链接：

```bash
mkdir -p .agents/skills
ln -s ../../skills/dragcraft .agents/skills/dragcraft
```

```bash
mkdir -p .claude/skills
ln -s ../../skills/dragcraft .claude/skills/dragcraft
```

外部项目可以克隆 DragCraft 仓库，再把其中的 `skills/dragcraft` 复制或链接到相同目录。外部宿主优先读取已安装包的类型和 source map 中的官方 URL；skill 只有确认 DragCraft 源码 checkout 后才读取仓库内路径。该 skill 随框架版本演进；项目升级 DragCraft 时应同步更新 skill。或

```bash
npx skills@latest add hackycy/dragcraft
```

## 证据链

skill 在实现前按以下顺序取证：

1. 当前项目的 `package.json`、锁文件、已安装类型与既有集成。
2. 与工作流精确匹配的本地指南、API 参考和 Playground 范例。
3. [`llms.txt`](../llms.txt) 定位尚未映射的文档。
4. [`llms-full.txt`](../llms-full.txt) 补充索引无法定位的事实。

已安装声明与线上文档不一致时，skill 会以当前项目的包版本为实现契约，并在交付中说明兼容或升级选择。每次交付还会列出证据、使用的扩展边界、改动范围和实际验证命令。

维护者可运行：

```bash
pnpm skills:test
pnpm skills:check
```

测试覆盖缺失评测字段、错误工作流、router/source-map 错配和缺少 agent 结果。检查会确认 skill metadata、source map、评测契约、agent 结果和本地文档入口仍保持一致。
