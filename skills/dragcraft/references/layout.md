# 页面布局

读取 [layout resources](resources/layout.json)，再确认 Designer Presentation 与宿主 Runtime 的布局边界。

## 实施

1. 为 visual material 在 `presentation.layout` 中选择 flow、chrome 或 layer。
2. 让 flow 按 `schema.structure.root` 排序；chrome 和 layer 使用自己的业务 preview 平面。
3. 将节点、页面和容器样式写入各自的 owner，不让布局对象承担业务组件 CSS。
4. 生产 Runtime 按 type 实现自己的平台布局，不复用 Designer Presentation。

## 完成标准

测试覆盖 flow、chrome、layer、root 顺序、容器 region 和 Device Frame 裁剪边界；Runtime 不导入设计态组件。
