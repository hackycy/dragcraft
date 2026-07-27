---
description: "将 Schema 保存到宿主仓储，重新加载草稿，并用只读运行时解释业务节点。"
---

# 保存草稿并预览运行时

在业务物料和页面配置可编辑后，草稿服务属于宿主应用。贯穿示例先定义一个可替换的仓储接口和内存实现：

<<< ../../../examples/guide-project/src/host/page-repository.ts#tutorial-page-repository

`revision` 是乐观锁版本。真实服务应在保存时验证页面归属、物料白名单、资源 URL 和业务字段；内存实现只用于让教程在浏览器中完成闭环。

生产运行时需要自己解释 Schema，尤其是容器的 `regions`：

<<< ../../../examples/guide-project/src/runtime/RuntimePage.ts#tutorial-runtime-renderer

普通节点使用 `componentMap` 渲染。容器节点把递归渲染后的 region VNode 交给业务容器组件，因此业务应用仍拥有 flex、grid 和分栏的实际 DOM 与 CSS。

运行时容器只接收 `variant` 和 `regions`，不使用 `ContainerRegionOutlet` 或 `useContainerRuntime()`：

<<< ../../../examples/guide-project/src/runtime/RuntimeColumnContainer.ts#tutorial-runtime-container

| 框架负责 | 宿主负责 |
| --- | --- |
| 导出快照、导入校验、历史与 Schema 事件 | 保存接口、版本冲突、发布流程、生产渲染与服务端安全校验 |

不要在生产页面复用编辑态 `RootRenderer` 或 `ContainerRegionOutlet`。它们包含选中、拖拽和编辑交互。

**完成检查**：保存后重新加载草稿，Schema 与公告状态恢复；切换预览时，运行时容器只使用 `variant` 和 `regions`。

下一步：[完成检查](/guide/learn/completion)。
