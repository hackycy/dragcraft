# 业务物料与 Authoring Policy

读取 [widgets resources](resources/widgets.json)，再检查现有 `MaterialDefinition[]` 和稳定 type 命名。

## 实施

1. 在一个 MaterialDefinition 中共置 Schema 声明、authoring 策略、inspector、panel 和 Presentation。
2. 为 visual material 提供 preview；为 headless material 明确声明 kind，并保留可编辑 Schema 配置。
3. 使用 `authoring.policy` 表达 create、duplicate、move、remove、unwrap 与 update 的裁决。
4. 需要 children 时声明 container regions，并让 preview 用 `DesignerRegionOutlet` 呈现。
5. 组件负责业务展示；Designer 负责 action、history、selection 与 drag feedback。

## 完成标准

每个 type 只注册一次；默认 props、表单值和策略一致；headless 物料有面板标识和中性拖入说明；新增策略具备可观察测试。
