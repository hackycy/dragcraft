---
description: "按 package 查阅 dragcraft 的设计器、内核、渲染、表单、主题、设备框架和工具 API。"
---

# 参考总览

这一组页面按 package 组织，适合在你已经知道要查哪个入口时定位具体能力。

如果你还没有完成第一次接入，先回到 [快速开始](/guide/getting-started)。如果你已经知道自己要扩展哪一层，再从下面的 package 页面进入。

如果你的物料需要承载其他物料，先阅读 [外部容器物料](/guide/container-materials)。这条路径会同时用到 core 的容器协议、renderer 的 region outlet 和 designer 的变体字段绑定。

| Package | 查找内容 |
| --- | --- |
| [@dragcraft/designer](/reference/designer) | 标准入口、工作台和容器设计器 API |
| [@dragcraft/core](/reference/core) | Schema、命令、历史、事件和容器协议 |
| [@dragcraft/renderer](/reference/renderer) | 画布节点渲染、交互扩展和容器 region |
| [@dragcraft/form-generator](/reference/form-generator) | 右侧表单字段和 render factory |
| [@dragcraft/device-frames](/reference/device-frames) | 设备预览外壳和设备选择器 |
| [widgets 与 fields](/reference/widgets-and-fields) | 物料定义整理和 Ant Design Vue 字段 adapter |
| [themes、i18n 与 utils](/reference/themes-and-utils) | 主题入口、国际化上下文和纯函数工具 |
