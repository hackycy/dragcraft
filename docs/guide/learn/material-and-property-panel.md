---
description: "接入公告物料、自定义字段 adapter、字段联动和页面级配置。"
---

# 接入业务物料与属性配置

完整活动页在文本物料之外增加公告、资源选择器和页面设置。选中公告后，右栏可以修改文案、色调和精选状态；打开“使用背景图”后才显示资源字段。

## 定义带表单的业务物料

公告的 Vue 组件和编辑协议位于同一个模块：

<<< ../../../examples/guide-project/src/domain/widgets/notice.ts

这个定义展示了四条常用规则：

- `material` 只影响物料栏的标题、描述、标签和搜索，不进入页面 Schema。
- `defaultProps` 决定新节点的初始数据，不会覆盖导入 Schema 中已有的 props。
- `visible` 根据当前表单值显示背景图字段。
- `rules` 在字段变化时验证输入；服务端仍必须重新验证保存和发布数据。

字段未声明 `bindTo` 时，Designer 默认把值写到 `props.{key}`。因此 `text`、`tone` 和 `image` 不需要重复声明路径。

## 注册业务字段

`Asset` 不是内置字段键。示例将业务按钮包装为字段 adapter，再与 Ant Design Vue 字段合并：

<<< ../../../examples/guide-project/src/forms/index.ts

adapter 明确组件从哪个 prop 读取值，以及通过哪个事件提交新值。资源权限、上传、远程搜索和错误提示仍由字段组件与宿主服务负责。

## 收集物料定义

贯穿项目从同一组 definitions 生成 metadata 和组件映射：

<<< ../../../examples/guide-project/src/domain/widgets/index.ts

这种组织避免 `widgetMetas` 与 `componentMap` 分别维护后发生 `type` 漂移。Schema 托管页头也在注册表中，但不会出现在标准物料面板；它由初始 Schema、导入或 migration 提供。

## 绑定页面级配置

全局配置表单默认写入 `globalConfig`。页面背景属于页面 surface，因此使用显式 Schema 绑定：

<<< ../../../examples/guide-project/src/editor/global-config.ts

`title` 写入 `globalConfig.title`，`backgroundColor` 写入 `root.style.surface.backgroundColor`。不要为了从全局页签编辑背景色，就把页面视觉数据改存到 `globalConfig`。

字段提交后的路径是：

```text
字段组件发出 adapter update event
  -> FormGenerator 更新和验证字段值
  -> Designer 解析默认绑定或 bindTo
  -> engine.execute(UPDATE_PROPS | SET_GLOBAL_CONFIG)
  -> Core 提交 Schema、历史和事件
  -> 画布读取新快照
```

## 验证结果

打开完整示例并执行以下操作：

1. 拖入公告并修改文案。
2. 打开“使用背景图”，确认资源字段出现。
3. 选择示例背景图，再关闭开关；字段隐藏但原值仍保存在 Schema 中。
4. 在全局配置中修改页面标题和背景色。
5. 撤销背景色修改，确认页面 surface 恢复。

字段绑定、转换和验证的完整选择标准见 [表单与字段](/guide/customization/forms-and-fields)。
