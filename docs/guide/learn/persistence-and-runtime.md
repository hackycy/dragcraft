---
description: "保存和重新加载页面 Schema，并通过独立 Vue 运行时预览发布数据。"
---

# 保存、加载与只读预览

设计器不会自动持久化页面。宿主通过 `exportSchema()` 取得可传输快照，通过 `importSchema()` 在当前物料注册表下迁移并校验草稿。

## 定义仓储边界

贯穿示例使用带乐观锁修订号的仓储接口：

<<< ../../../examples/guide-project/src/host/page-repository.ts

内存实现让示例在浏览器中完成闭环。真实服务必须校验页面归属、修订号、物料白名单、业务 props、资源 URL、容器变体和 region 约束。

保存成功后服务端返回新的 `revision`。旧编辑会话继续携带旧修订号保存时，仓储抛出 `PageRevisionConflictError`，而不是覆盖较新的页面。

## 注册后再导入

完整实例先创建注册表，再注册 Schema migrations，最后导入初始数据：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts

这个顺序确保 migration 产出的每个 `node.type`、容器 variant 和 region 都能由当前注册表校验。`importSchema()` 失败时保留原快照，并返回带稳定 `code` 的 diagnostics。

> [!WARNING]
> 不要把导入失败改成“忽略未知节点后继续”。静默删除内容会让一次加载操作变成不可恢复的数据损失。

## 使用独立运行时

运行时注册表按 `type` 区分普通物料与容器物料：

<<< ../../../examples/guide-project/src/runtime/registry.ts

普通物料接收 `props` 和 `style.content`。容器物料接收自身节点、variant 和已经递归渲染的 regions。未知物料进入可观察 fallback，不会被静默跳过。

`RuntimePage` 还会解释 root surface、`flow/chrome/layer` 和物料默认布局。它不导入 `RootRenderer`、`ContainerRegionOutlet` 或 `useContainerRuntime()`；这些入口属于设计态。

Vue 参考实现适合 Web 预览和同构业务页面。小程序、原生应用或其他运行时应读取同一 Schema，并按目标平台重新实现组件注册、样式 DSL 和布局投影。

## 验证结果

在完整示例中执行以下操作：

1. 修改公告并保存草稿。
2. 再次修改公告，然后加载草稿，确认保存时的内容恢复。
3. 切换到“查看运行时”，确认固定页头、正文、分栏区域和浮动操作处于不同 surface。
4. 返回编辑器，确认运行时切换没有重建 Designer 或清空历史。

生产运行时的布局和降级策略见 [迁移、草稿与生产运行时](/guide/customization/lifecycle-and-runtime)。
