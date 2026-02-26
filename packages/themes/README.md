# @dragcraft/themes

Headless 皮肤包 —— 为 dragcraft 无头组件库提供开箱即用的视觉样式。

## 设计理念

dragcraft 的所有 UI 包（designer, renderer, form-generator, widgets）采用 **无头组件（Headless Component）** 模式：组件仅输出语义化 BEM CSS 类名，不捆绑任何样式。

`@dragcraft/themes` 作为独立皮肤包，提供完整的 CSS 实现，与组件逻辑完全解耦。

## 内置皮肤

| 皮肤 | 导入路径 | 风格描述 |
|------|----------|----------|
| Ant Design | `@dragcraft/themes/antd` | 蓝色主调（#1890ff），4px 圆角，轻柔阴影，系统字体 |
| Material Design | `@dragcraft/themes/material` | 蓝色主调（#1976D2），8px 圆角，Material 分层阴影，Roboto 字体 |

## 使用方式

### 开箱即用

```typescript
// 选择一套皮肤导入即可
import '@dragcraft/themes/antd'
// 或
import '@dragcraft/themes/material'

import { createDesigner, DcDesigner } from '@dragcraft/designer'
```

### 无头模式

不导入任何皮肤，自行编写全部 CSS。组件输出的 BEM 类名可作为样式选择器。

```typescript
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import './my-custom-styles.css' // 自定义样式
```

### 覆盖 CSS 变量

导入皮肤后，通过覆盖 CSS 变量快速定制：

```css
:root {
  --dc-primary: #722ED1;      /* 换成紫色主调 */
  --dc-radius: 12px;          /* 更大的圆角 */
}
```

## CSS 变量（Design Tokens）

### 主色

| 变量 | Antd 值 | Material 值 | 说明 |
|------|---------|-------------|------|
| `--dc-primary` | `#1890ff` | `#1976D2` | 主色 |
| `--dc-primary-light` | `#e6f7ff` | `#E3F2FD` | 主色浅色 |
| `--dc-primary-dark` | `#096dd9` | `#1565C0` | 主色深色 |
| `--dc-primary-bg-hover` | `rgba(24,144,255,0.06)` | `rgba(25,118,210,0.08)` | 主色 hover 背景 |
| `--dc-primary-shadow` | `rgba(24,144,255,0.15)` | `rgba(25,118,210,0.2)` | 主色阴影 |
| `--dc-on-primary` | `#ffffff` | `#ffffff` | 主色上的文字 |

### 语义色

| 变量 | Antd 值 | Material 值 | 说明 |
|------|---------|-------------|------|
| `--dc-success` | `#52c41a` | `#2E7D32` | 成功 |
| `--dc-warning` | `#faad14` | `#F9A825` | 警告 |
| `--dc-danger` | `#ff4d4f` | `#D32F2F` | 危险 |
| `--dc-danger-bg-hover` | `rgba(255,77,79,0.06)` | `rgba(211,47,47,0.08)` | 危险 hover 背景 |

### 文字

| 变量 | Antd 值 | Material 值 |
|------|---------|-------------|
| `--dc-text` | `#333333` | `#212121` |
| `--dc-text-secondary` | `#666666` | `#757575` |
| `--dc-text-placeholder` | `#bfbfbf` | `#BDBDBD` |

### 边框 & 背景

| 变量 | Antd 值 | Material 值 |
|------|---------|-------------|
| `--dc-border` | `#d9d9d9` | `#E0E0E0` |
| `--dc-border-light` | `#e8e8e8` | `#EEEEEE` |
| `--dc-bg` | `#ffffff` | `#FFFFFF` |
| `--dc-bg-light` | `#fafafa` | `#FAFAFA` |
| `--dc-bg-dark` | `#f0f0f0` | `#F5F5F5` |
| `--dc-canvas-bg` | `#e8e8e8` | `#ECEFF1` |

### 效果 & 形状

| 变量 | Antd 值 | Material 值 |
|------|---------|-------------|
| `--dc-shadow` | `0 2px 8px rgba(0,0,0,0.1)` | `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)` |
| `--dc-shadow-sm` | `0 1px 4px rgba(0,0,0,0.08)` | `0 1px 1px rgba(0,0,0,0.1)` |
| `--dc-radius` | `4px` | `8px` |
| `--dc-radius-lg` | `8px` | `12px` |

### 排版

| 变量 | Antd 值 | Material 值 |
|------|---------|-------------|
| `--dc-font-size` | `13px` | `14px` |
| `--dc-font-size-sm` | `12px` | `12px` |
| `--dc-font-family` | `-apple-system, BlinkMacSystemFont, ...` | `'Roboto', 'Noto Sans SC', ...` |

### 布局

| 变量 | Antd 值 | Material 值 |
|------|---------|-------------|
| `--dc-panel-header-height` | `40px` | `48px` |
| `--dc-toolbar-height` | `40px` | `48px` |

## 目录结构

```
src/
├── components/           # 共享组件 CSS（使用 CSS 变量，两套皮肤复用）
│   ├── reset.css
│   ├── designer.css
│   ├── canvas.css
│   ├── material-panel.css
│   ├── property-panel.css
│   ├── form-generator.css
│   └── widgets.css
├── antd/
│   ├── tokens.css        # Ant Design CSS 变量
│   └── index.css         # 入口
└── material/
    ├── tokens.css        # Material Design CSS 变量
    ├── overrides.css     # Material 特有样式覆盖
    └── index.css         # 入口
```

## 自定义皮肤

创建自定义皮肤有两种方式：

### 方式一：覆盖 CSS 变量（推荐）

```css
/* 导入基础皮肤 */
@import '@dragcraft/themes/antd';

/* 覆盖变量 */
:root {
  --dc-primary: #722ED1;
  --dc-primary-light: #f9f0ff;
  --dc-primary-dark: #531dab;
  --dc-radius: 8px;
}
```

### 方式二：完全自定义（无头模式）

不导入任何皮肤，参照 `src/components/` 目录下的 CSS 文件，为所有 `dc-*` BEM 类名编写样式。

## 画布相关 CSS 类

以下 CSS 类在 `canvas.css` 中定义，用于画布区域的节点渲染：

### 空状态

| 类名 | 说明 |
|------|------|
| `.dc-empty-state` | 空画布占位组件容器 |
| `.dc-empty-state__icon` | 空状态图标 |
| `.dc-empty-state__text` | 空状态文字 |
| `.dc-canvas-empty` | 空画布 legacy 回退样式 |

### 节点交互

| 类名 | 说明 |
|------|------|
| `.dc-node` | 节点基础容器 |
| `.dc-node--widget` | widget 类型节点 |
| `.dc-node--masked` | mask=true 的节点 |
| `.dc-node--unmasked` | mask=false 的节点 |
| `.dc-node--selected` | 选中状态 |
| `.dc-node--hovered` | 悬停状态 |
| `.dc-node--drag-over` | 拖拽悬停状态 |
| `.dc-node__mask` | 透明遮罩覆盖层 |
| `.dc-node__handle` | 选中 handle 角标（mask=false 时） |

### 工具栏

| 类名 | 说明 |
|------|------|
| `.dc-node__toolbar` | 浮动工具栏容器 |
| `.dc-node__toolbar-btn` | 工具栏按钮 |
| `.dc-node__toolbar-btn--drag` | 拖拽 handle 按钮 |
| `.dc-node__toolbar-btn--delete` | 删除按钮（hover 时红色） |

### 拖拽指示器

| 类名 | 说明 |
|------|------|
| `.dc-drop-indicator` | 拖拽指示器容器 |
| `.dc-drop-indicator__line` | 指示线 |

### Fallback

| 类名 | 说明 |
|------|------|
| `.dc-widget-fallback` | 未知 widget 类型 fallback |

