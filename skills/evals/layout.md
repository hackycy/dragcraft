---
id: layout
workflows:
  - layout
task: 为页面加入固定页头、正文和浮层操作，并让独立 Vue 运行时正确解释排序、可见性与样式作用域。
evidence:
  - LayoutPlacement 和 Schema 样式类型
  - layout resources、布局指南和运行时布局实现
boundary:
  - flow、各 chrome 边与各 layer 分别排序
  - 生产运行时只读消费布局意图，不复用编辑器 Renderer
verification:
  - 测试覆盖默认 flow、chrome、layer 和 visible false
  - 固定 inset 与 container/content/surface 样式作用域正确
  - 相同 order 不破坏原始稳定顺序
---

# 布局投影与参考运行时
