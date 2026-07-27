---
description: "使用节点动作、拦截器和事件 hooks 接入权限、确认、审计和业务副作用。"
---

# 动作与业务策略

当操作需要业务规则时，节点动作应返回命令，让 Core 继续负责校验、历史和 Schema 事件。贯穿示例为公告增加“设为精选”，并在删除前走确认拦截器：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts#tutorial-actions

`command` 适合写 Schema，`handler` 适合跳转、打开宿主弹窗或埋点。`actionInterceptors` 包裹内置和自定义动作，适合确认、权限和错误上报。`eventHooks` 则用于选择、拖拽和 hover 的交互通知。

| 需求 | 入口 |
| --- | --- |
| 新增、覆盖或限制工具栏操作 | `customActions` 与 `meta.actions` |
| 确认、鉴权和审计 | `actionInterceptors` |
| 监听选择、拖拽和 hover | `eventHooks` |

| 框架负责 | 宿主负责 |
| --- | --- |
| 动作管线、内置 command、历史和交互事件 | 权限、确认 UI、审计、错误提示和服务端授权 |

框架不会替宿主显示拦截器返回的业务原因，也不会替你实现权限策略。不要把任意自定义 command 当作标准 Designer 扩展；优先使用内置 command 或字段绑定。

**完成检查**：公告动作只能在允许的节点出现；删除时会先经过宿主确认，并且取消不会写入 Schema。

下一步：[面板与画布](/guide/customization/panels-and-canvas)；精确字段见 [@dragcraft/renderer](/reference/renderer)。
