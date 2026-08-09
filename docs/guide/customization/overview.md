---
description: "根据要改变的产品行为选择 DragCraft 的公开扩展点，并划清宿主职责。"
---

# 选择扩展点

先描述你要改变的结果，再选择扩展点。一个需求如果同时涉及页面数据和工作台视觉，通常需要两个独立入口；不要为了修改 UI 而绕过 Schema 命令。

| 你要改变的结果 | 使用入口 | 宿主仍需实现 |
| --- | --- | --- |
| 添加可拖入的业务组件 | `MaterialDefinition` | Vue preview、props、资源和内容主题 |
| 固定由模板提供的组件 | `authoring.policy.create: 'denied'` | 初始 Schema、服务端白名单 |
| 增加属性编辑字段 | `FormSchema`、`fieldComponentMap`、`bindTo` | UI 控件、异步数据和业务校验 |
| 让组件承载子节点 | `ContainerDefinition`、`ContainerRegionOutlet` | DOM、CSS、插入几何和迁移策略 |
| 增加确认、权限或审计 | `customActions`、`actionInterceptors`、`eventHooks` | 授权判断、确认 UI、审计服务 |
| 替换工作台部件 | `DesignerExtensions`、`RendererExtensions` | 产品面板、搜索和自定义视觉 |
| 改变品牌、设备或语言 | 公开 token、Device Frame、`messages` | 品牌主题、设备状态和业务文案 |
| 保存、发布和线上渲染 | `exportSchema()`、`importSchema()` | 服务端、发布流程和生产运行时 |

## 五条边界

- Schema 的所有写入都经过 `designer.execute(action)`；`designer.document` 只能读取。
- Designer Presentation 只服务设计态，生产页面使用宿主运行时。
- 主题使用公开 token 与 `data-dc-*` hook，不依赖私有 `.dc-*` class。
- 容器直接位于 root，region 拥有普通子节点；当前协议不支持容器嵌套。
- 公开应用只导入 Designer 聚合入口和支持的字段/设备包。

## 选择顺序

建议先完成一个普通物料，再接入表单和保存；只有在页面真的需要子节点所有权时才实现容器。面板替换、主题和设备属于工作台集成，不应提前混入业务物料定义。

从 [业务物料](/guide/customization/materials) 开始，或按目标进入 [表单与字段](/guide/customization/forms-and-fields)、[容器与 region](/guide/customization/layout-and-containers) 和 [动作与 Authoring Policy](/guide/customization/actions-and-policies)。
