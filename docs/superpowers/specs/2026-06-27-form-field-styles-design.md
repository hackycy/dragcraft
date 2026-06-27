# 表单字段样式设计

**日期**: 2026-06-27
**状态**: 已批准

## 1. 背景与目标

### 1.1 问题描述

新创建的 ArrayField 和 NavbarTitleField 组件没有对应的 CSS 样式，渲染出来是原生 HTML 元素，视觉效果很差，与现有的 form-generator 样式不一致。

### 1.2 设计目标

为 ArrayField 和 NavbarTitleField 添加 Ant Design 风格的 CSS 样式，使其与项目整体风格保持一致。

## 2. 设计方案

### 2.1 ArrayField 样式

在 `packages/themes/src/components/form-generator.css` 中添加以下样式：

- 容器：圆角边框，白色背景
- 列表区域：最大高度 300px，可滚动
- 每个项目：底部边框分隔，hover 时背景变化
- 头部：flex 布局，包含展开/折叠按钮、标题、操作按钮
- 操作按钮：透明背景，hover 时显示，删除按钮 hover 变红
- 内容区域：左侧缩进，浅灰色背景
- 添加按钮：虚线边框，hover 时高亮

### 2.2 NavbarTitleField 样式

- 容器：圆角边框，overflow hidden
- 预览区域：渐变背景，居中显示
- 表单区域：flex 布局，垂直排列
- 输入框、滑块、下拉框：统一的 Ant Design 风格

### 2.3 设计规范

- 使用项目的 design tokens（--dc-primary, --dc-border, --dc-text 等）
- 遵循 Ant Design 的视觉风格
- 保持与现有 form-generator 样式的一致性
- 支持 hover、focus 交互状态
- 使用平滑的过渡动画

## 3. 实现细节

### 3.1 文件位置

- 修改：`packages/themes/src/components/form-generator.css`

### 3.2 样式类名

- ArrayField: `dc-field-array__*`
- NavbarTitleField: `dc-field-navbar-title__*`

### 3.3 测试

- 在 playground 中验证样式效果
- 确保在不同主题下正常显示

## 4. 验收标准

- [ ] ArrayField 有完整的样式，包括容器、列表项、操作按钮
- [ ] NavbarTitleField 有完整的样式，包括预览区域和表单控件
- [ ] 样式与现有的 form-generator 风格一致
- [ ] 支持 hover、focus 交互状态
- [ ] 在 Ant Design 主题下视觉效果良好
