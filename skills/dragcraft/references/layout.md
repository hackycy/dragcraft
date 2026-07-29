# 布局投影

读取 [layout resources](resources/layout.json)，再确认 Schema 布局意图与宿主运行时的映射边界。

## 实施

1. 未声明布局的节点按 `flow` 处理；分别在 `flow`、各 `chrome` 边和各 `layer` 内保持稳定排序，不跨排序域比较顺序。
2. `chrome` 处理边、固定方式和 inset；`layer` 处理锚点、offset 与 framework/self 定位。`visible: false` 在设计态保留隐藏轮廓供编辑，在生产运行时跳过内容。
3. `container`、`content` 和根 `surface` 样式写入各自所有者；布局对象不承担业务组件 CSS。
4. 生产运行时消费同一 Schema 意图，但由宿主实现平台布局和组件映射，不复用编辑器 Renderer。

## 完成标准

测试覆盖默认 flow、chrome、layer、稳定排序、设计态隐藏反馈、运行时可见性、固定避让和三种样式作用域；运行时投影与设计态消费同一布局意图。
