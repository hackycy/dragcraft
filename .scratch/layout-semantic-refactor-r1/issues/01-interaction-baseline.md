Status: resolved
Type: grilling

## Question

如何把当前 `main` 的 Designer 交互契约定义成可重复执行的最小基线，使每次底层切换都能判断行为和状态转移是否保持等价，而不是等到 Phase 7 通过一次性人工体验来猜测偏差？

## Answer

交互基线采用“场景族 + 三层验证”的最小矩阵。它验证可观察行为和状态转移，不要求 DOM 结构或截图像素级相等。

场景族固定为：

- 空画布与默认容器：空态、默认容器挂载、唯一 application scrollport、首次拖入反馈。
- Root 普通节点：hover 入口、root-segment selection、纵向 toolbar、mask 对业务点击的拦截。
- Root Container Owner：外部 selection handle、容器 toolbar、空 Region 与默认容器 UI。
- Region child：material-bounds selection、横向 toolbar、Region 内排序。
- 创建拖放：material 到 root/Region、空目标、start/end/before/after、forbidden。
- 移动拖放：root 与 Region 之间移动、同 owner 重排、反馈与最终 Schema 一致。
- 结构树与属性：Tree/Canvas 选中一致、属性写入后预览更新、容器变体约束。
- History：一次交互一次提交、undo/redo、redo 分支截断、no-op/rejected 不进 history。
- Canvas 会话：pointer/hand、Space 临时 hand、pan/reset、Frame 切换、scroll 与 reservation。
- 辅助会话状态：selection/hover/drop 清理、模板切换、locale、host confirmation。

验证分三层，并由不同 owner 负责：

1. 纯模块测试验证 Schema/Authoring 操作结果与 history 语义。
2. 组件测试验证 NodeHost、Renderer、Canvas 的 DOM 状态、事件传播和恢复状态。
3. 浏览器验收验证真实 pointer、HTML5 drag、滚动、Frame 裁剪、pan 和几何位置；人工只负责视觉质量与无法稳定自动化的设备体验。

每个底层切换阶段必须运行受影响场景子集和完整 smoke 流程；只有三层验证都通过，才允许进入下一切换阶段。
