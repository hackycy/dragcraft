# 业务物料与 Authoring Policy

读取 [widgets resources](resources/widgets.json)，再检查现有 `MaterialDefinition[]`、稳定 type 命名和当前 Presentation 入口。

物料任务涉及 `style.content.margin`、NodeHost 几何、命中、mask、selection 或 `presentation.frame` 时，读取 [layout](layout.md) 作为直接依赖。它们不是普通 preview 样式：layout 负责 NodeHost footprint、viewport mount 与 selection 的边界。

## 实施

1. 在一个 MaterialDefinition 中共置 Schema 声明、authoring 策略、inspector、panel 和 Presentation；`type` 是跨端稳定键。
2. 为 visual material 提供 preview；为 headless material 明确声明 kind，并保留可编辑 Schema 配置。
3. 只有页面级 root material 才考虑 `presentation.frame`；Frame 只包装一个完整 NodeHost，不改变 Schema 顺序。Frame 和 Preview 根元素负责 viewport 定位，物料 CSS 不依赖内部 NodeHost，也不把它扩张成全屏透明层。
4. 使用 `authoring.policy` 表达 create、duplicate、move、remove、unwrap 与 update 的裁决；确认 action 用 `confirmed` 完成已获宿主确认的设计态操作。
5. 需要 children 时声明 container regions，并让 preview 用 `DesignerRegionOutlet` 呈现；组件负责业务展示，Designer 负责 action、history、selection 与 drag feedback。

## 完成标准

每个 type 只注册一次；默认 props、表单值、Presentation 和策略一致；headless 物料有面板标识和中性拖入说明；新增策略具备可观察测试，拒绝和确认不会产生部分 Schema 写入。涉及上述几何边界时，验证实际 NodeHost/Preview 命中范围，而不是只检查 selection 的视觉外观。
