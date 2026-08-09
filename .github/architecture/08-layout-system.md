# 页面 Presentation 布局

页面级 Presentation 将 `schema.structure.root` 的节点投影为 flow、chrome 与 layer 三类业务预览位置。每个节点只从自己的 owner 路径展示一次。

## 规则

- `flow` 进入业务内容流，并按 root 顺序处理。
- `chrome` 位于业务页面边缘，可由 material 的 layout 声明表达固定、sticky 或 flow 行为。
- `layer` 位于业务预览的浮层坐标系。
- 容器 region children 由容器组件展示，不再次参加页面级投影。
- Device Frame 的系统外观和 Designer 的选中、工具栏、禁止反馈不属于页面布局。

布局意图来自 `MaterialDefinition.presentation.layout`。它仅描述设计态；生产 Runtime 按稳定 type 独立决定其平台布局与 fallback 策略。

## 容器

容器的 region 和容量由 material schema 声明，children 顺序由 `schema.structure.containers` 保存。业务组件通过 `ContainerRegionOutlet` 将 region 放入自己的 DOM，因此框架不会定义 flex、grid、插入方向或轨道。

## 几何边界

Canvas Surface 是业务 preview 的唯一滚动和裁剪边界。Container Shell 只能渲染一次默认 slot，不能创建第二个业务 scrollport，也不能重建页面 node tree。Device Frame 只包围该 preview，Designer Presentation 在其外部维持工作台交互。
