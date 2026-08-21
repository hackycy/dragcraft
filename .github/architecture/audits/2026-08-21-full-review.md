# 架构文档与实现全量审查报告

- 审查日期：2026-08-21
- 基线 commit：`0a579f6`（chore: release v0.0.9）
- 范围：`.github/architecture/` 全部 9 篇文档 vs 11 个真实 workspace 包的实现
- 方法：按区域并行深读（core / designer 状态逻辑 / designer UI 呈现 / form-generator 与 fields / 物料协议与 utils / 外围包 / 包边界与工程规范），逐条对照文档承诺，全部结论带 file:line 证据

## 总体评价

架构文档的"所有权语言"质量高（Designer 拥有 X / 业务拥有 Y 表述清晰），公开边界执行超出预期——`scripts/check-public-boundary.mjs` 挂在 lint 中自动强制，playground/docs/examples 零违规；主题层有机器可校验的 `theme-contract.json`。

但核心域代码存在多个正确性缺陷，且两个最核心的承诺各有一处被实际打破：

1. "导出纯数据 Schema"——日期字段将 Dayjs 对象写入 DocumentSchema（见 一.5）
2. "受影响结构不能写入"——实际是任一 definition error 锁死全文档（见 一.4）

---

## 一、高危问题（正确性 / 核心承诺被破坏）

### 1. duplicate-node 静默丢失嵌套子树

`packages/designer/src/.../create-authoring-engine.ts:55-89` 的 `duplicateNodeBundle` 只收集 `[nodeId, ...直接 region children]`，containers 映射也只写一层。复制含嵌套容器的物料时，二层以下节点既不入 nodes 也无 containers 条目，内容无声丢失。core 的 insert-bundle 校验对此完全放行（每个节点都有 owner）。
修复方向：递归展开 `structure.containers` 子树。

### 2. remove 级联非递归

`packages/core/src/operations/remove.ts:16-19` 仅收集被删容器的直接 region 子节点；子树内还有下级容器时其 `structure.containers[child]` 条目残留成孤儿 → `CONTAINER_OWNER_MISSING` → 整个操作被拒。测试只覆盖单层嵌套（apply-schema-operation.test.ts:767）。
与问题 1 同源：单层容器约束没有沉淀成共享的树遍历工具。

### 3. 几何注册表内存泄漏

`packages/designer/src/presentation/node-host.ts:457-461, 483` 的两条卸载清理路径全部失效：

- 483 行的 `onBeforeUnmount(...)` 位于 setup `return` 渲染函数之后，永不可达，且 `register(...)(...)` 对 void 返回值二次调用的语义也是错的
- 457-461 行 ref 回调调用 `geometryRegistry.register(node.id, host)` 但未返回其 cleanup 函数

已卸载节点的 HTMLElement 引用滞留 Map（内存泄漏 + 陈旧测量）。

### 4. 一个坏节点锁死全文档

任一 definition error 使全文档进入 `conflicted`（`resolve-schema.ts:315-328`），而 `commitCandidate` 拒绝对 conflicted 文档的一切写入（`operations/shared.ts:17`）。与文档 02 "保留数据，但受影响结构不能写入"矛盾，也不符合降级可用性意图。需要决策：conflicted 应只冻结受影响结构，其余可写。

### 5. Dayjs 泄入"纯数据"Schema

`packages/fields/ant-design-vue/src/index.ts:108,114,120` DatePicker/RangePicker/TimePicker 均为裸 `valueField`，无 normalizeValue；antdv4 三者的 model 值是 Dayjs 对象，经 FormField 直写表单模型并进入 DocumentSchema。导出 Schema 含非 JSON 序列化实例，宿主运行时无法按文档承诺解释。
修复方向：adapter 默认序列化为字符串并提供 formatValue 反解。

### 6. 公开 API useDesigner().schema 永久过期

`packages/designer/src/composables/useDesigner.ts:15` computed 内调用 `exportSchema()`（纯闭包读取非响应式 currentDocument），无任何响应式依赖——首次访问后永不重算。该函数从包入口导出，属对外承诺失效。

### 7. 潜伏的 bundle id 冲突

`next-designer-session-adapter.ts:118` 用常量 `() => entry.id` 作 createNodeId 调 `catalog.createBundle`：一旦物料使用自定义多节点 createBundle 工厂，所有节点同 id，将被 core 以 `BUNDLE_INVALID: duplicate-bundle-node-id` 拒绝。当前仓库无此用法，属埋雷。

---

## 二、系统性性能隐患

每次提交的全量重解析是最大扩展性风险，三路独立审查命中同一问题：

| 层 | 问题 | 位置 |
| --- | --- | --- |
| core | 单次属性编辑约 5 次全文档遍历（描述符级 JSON 合法性收集 + 逐键 defineProperty 深拷贝 + 两阶段诊断 + ResolvedDocument 重建） | json.ts:45-130、operations/shared.ts:12-25 |
| core | batch 内每个 op 再各跑一遍完整管线 | apply-schema-operation.ts:43-48 |
| designer | 双重解析：applySchemaOperation 已返回 resolved 文档，installSchema 再整体 resolveSchema 一遍 | create-authoring-engine.ts:224-236 |
| designer | session 适配器每 action 双份编译与策略评估 | next-designer-session-adapter.ts:453-484 |

几百节点的大文档下拖拽/连续输入会明显卡顿。
优化方向：内部构造的候选跳过 JSON 合法性遍历；消除双重解析；诊断做增量校验。

---

## 三、约束时机错位（体验与文档落差）

1. **accepts/cardinality 未进拖拽决策层**：区域约束仅流向初始化校验（create-material-catalog.ts:169-183）和展示 hint（material-presentation.ts:23-26）。useDragDrop.ts 与 session 适配器中无任何 accepts/canDrop 判断——用户可拖着不允许的类型得到正常放置反馈，直到 execute 才以 `REGION_TYPE_NOT_ACCEPTED` 拒绝（resolve-schema.ts:263-280）。文档宣称"声明 region 与容量约束"，实际语义是事后校验。
2. **领域泄漏**：`useDragDrop.ts:131-139, 358` 在通用拖拽逻辑里硬编码 `'navbar'` 单例约束和英文文案 `'Navbar already exists...'`（绕过 i18n）。应由物料 policy（root accepts/singleton 规则）表达。

---

## 四、隐式跨包契约未入文档

1. **device-frames 反向写 designer 内部变量**：`packages/device-frames/src/styles/device-frame.css:18-24` 用 `:has(> .dc-device-frame)` 探测 designer 的 `data-dc-component="presentation-frame-boundary"` DOM 结构，并写入 `--dc-internal-designer-root-selection-plane-outset/radius` 和 `--dc-node-selection-root-block/inline-overlap`。违反项目自定契约（`--dc-internal-*` 为 owner 私有），且 frame 实际参与了它声明不管的选中面计算。修复方向：designer 侧读取 frame 已暴露的公共 token（`--dc-device-frame-border-width/radius` 已存在）。
2. **shell→designer 隐式握手协议**：shell 根元素声明 `data-dc-canvas-fit="contain"`（shells/device-container-shell.ts:13），被 designer `DcCanvas.ts:57` querySelector 消费；缩放由 designer 的 `--dc-internal-canvas-view-scale`（DcCanvas.ts:142）完成。改名会静默破坏，应写入架构文档 06。
3. **session 层整层缺席于文档**：presentation 组件全部经由 session seam（session/ 目录 + next-designer-session-adapter，489 行）读写而非文档所述直连 engine；且存在两套 action 词汇（engine 的 SchemaAuthoringAction 与 session 的 AuthoringAction）。文档 02 示例 `move-node` + `to:{kind:'root',index}` 与 core 实际 `move` + `StructuralDestination{owner,position}` 不符、`confirmation-required` 在 core 层不存在，均源于层级标注缺失。
4. **结构 CSS 所有权表述偏差**：文档称 Designer 拥有结构 CSS，实体在 @dragcraft/ui 导出的 structure.css/recipe.css（designer/theme/*.css 仅 @import），文档未提 ui 层。

---

## 五、协议能力缺口

1. **无版本化/迁移机制**：DocumentSchema.version 是自由字符串；MaterialDefinition 无 version 或 props 迁移钩子；schemaDefinitions.revision 硬编码 1（create-material-catalog.ts:273）。对"垂直业务持续演进"定位，存量 Schema 演进无官方路径。
2. **缺全局 inspector 扩展机制**：playground 只能给每个 visual 物料猴子补丁追加样式 section（next-fixtures.ts:91-150），接入方都会复制此 hack。框架缺"跨物料共享字段贡献"入口。
3. **ID 生成弱**：generateShortId（utils/src/uuid.ts:1-5）用 `Date.now().toString(36).slice(-6)` + `Math.random()`，同毫秒批量创建有碰撞概率；碰撞后果是插入被 BUNDLE_INVALID 拒绝。应换 `crypto.randomUUID()`。
4. **Presentation frame 样板重复**：playground（next-fixtures.ts:45-89）与 guide-project（materials.ts:10-31）手写几乎相同的 DesignerViewportPortal 包装组件，可由 designer 提供工厂。
5. **defineMaterial() 卖点未被自家示例采用**：playground 与 guide 的物料全是裸字面量数组。

---

## 六、公开边界瑕疵（其余全部合规）

1. `fields-ant-design-vue/package.json:39-41` 把内部包 `@dragcraft/form-generator` 列为运行时 dependencies，源码仅 type-only import（src/index.ts:1）——公开消费者被迫安装内部包及其传递依赖。需把协议类型内联/独立或由 tsdown 打包 dts 后降为 devDep。
2. ui 包的 `DcScrollArea` 经 designer index re-export（index.ts:132）成为事实公开 API，却按内部组件标准维护。

合规确认：playground/examples/docs 全部源码只 import 公开三件套（59/5/5 处）；依赖图为干净 DAG 无环；无幽灵依赖；依赖统一走 catalog。

---

## 七、工程质量

1. **测试厚薄倒挂**：designer 19 个测试文件 vs core（3211 行领域逻辑）仅 2 个、form-generator（3198 行）4 个——恰是本次发现最多 bug 的两个包。
2. **可访问性**：
   - 物料栏对键盘用户完全不可达：DcMaterialItem.ts:96-110 是 div[draggable]，无 tabindex/role，HTML5 DnD 无法键盘触发，也没有点击/Enter 替代添加路径
   - 结构树缺 tree 语义与方向键导航：DcStructurePanel.ts:150-186 无 role=tree/treeitem/group
3. **dispose() 是空操作**（factory.ts:93）：WeakMap 形态的 runtime configuration 与 session 无任何清理路径。
4. **macOS 重做失效**：DcDesigner.ts:154 只认 Ctrl+Y，Cmd+Y 不触发（Cmd+Shift+Z 正常）。
5. **常驻 subtree MutationObserver**：DcCanvas.ts:81-84 观察整个画布内容区，可收窄为 childList 或精确 watch。
6. **node-host 其他**：unwrap 只提升已声明 region 子节点，未知 region 子节点使操作被整体拒绝；update-node 未在运行时剥离 operation.node.id（update.ts:23-24）；markViewportRootNodeHost 以 props 启发式递归识别 NodeHost，对 slot 包装方式脆弱。
7. **fields 细节**：visible/ifShow 双轨 API 无 deprecated 标记（types.ts:152-154）；dependencies handler 在渲染路径与校验路径取值上下文不一致（useFieldDependencies.ts:16-25 vs FormGenerator.ts:73-76）；min/max 仅对 number 生效，数字字符串静默跳过；index.ts:104-121 全部 as unknown as Component 双重断言，key 拼错仅运行时报错。
8. **工程链路**：turbo 只缓存 build/dev，test/typecheck 走 pnpm -r 无缓存；根 typecheck 每次强制全量构建；exports 缺显式 types 条件；发布元数据（description/keywords）为占位符。
9. **仓库卫生**：packages/renderer|themes|widgets|builtin-fields|builtin-widgets 为已删包（commit 1aec197）的磁盘残留 dist，建议删除或 gitignore。
10. **utils 包不成立**：122 行中 EventEmitter 全仓零消费、clone.ts 是一行 lodash-es 转出口；建议并入消费方（designer/core）。
11. **i18n 边角**：designer 默认文案硬编码 zh-CN（messages.ts:6-24）；device-frames 有英文兜底与装饰性硬编码（'9:41'/'Carrier' 等，phone-container-shell.ts:38,54,81）；labelKey 无共享 key 常量。

---

## 八、文档本身的问题

1. `08-layout-system.md` 第 10 行是一条 300+ 字的单条规则（NodeHost footprint、root-segment 选中态、viewport anchor 语义堆叠）——补丁式累积，应拆分重构。
2. 文档 02 示例失真（move-node/to vs move/{owner,position}）、confirmation-required 层级未标注（见 四.3）。
3. 文档 04 遗漏已实现契约：defaultProps/formatValue/normalizeValue（types.ts:242-247）、defaultValue 兜底（utils.ts:14-17）、span/columns 栅格、'schema' binding scope（types.ts:116）、i18n key 机制。
4. visible/ifShow 双轨 API 文档只提 visible。
5. 总览未明示"框架不提供生产 Runtime，宿主自行解释 Schema"这一重大范围选择。
6. 跨包 DOM 握手协议（data-dc-canvas-fit）与 device-frame CSS 依赖关系未入文档 06。

---

## 九、验证相符的承诺（做得好的部分）

- importSchema rejected 不覆盖当前文档；resolveSchema 为纯函数
- diagnostics 有界（默认 200、硬顶 2000）且按 phase/path/code 稳定排序
- history 默认 50 条上限；unchanged 判定避免 history 污染；undo/redo 重解析防脏快照
- core 无 structuredClone；selection/history 只读暴露成立
- type 去重、visual 必须有 preview、headless 禁止 preview 均在初始化抛错；catalog 深冻结快照防篡改
- 单层容器禁止嵌套由 REGION_CHILD_CONTAINER_FORBIDDEN 强制
- panel.visible 布尔/函数仅影响物料栏
- CSS 命名规范零违规：全包无 --_dc-* 遗留，16 个内部变量全部带 --dc-internal- 前缀；structure 层无硬编码色值
- theme-contract.json（tokens 61 + integrationProperties 18 + components 33）+ check:theme 机器校验
- standard.css = structure + tokens + recipes 三行 @import，与 structure.css 无重复规则
- ContainerShell 只包 CanvasSurface 业务预览；root selection plane 在 frame boundary 内；headless 提示为 CanvasSurface 子层且带 role=status
- designer 组件 i18n 无裸文案；51 处 aria/tabindex；compact drawer 有焦点管理
- 无 >500 行组件；选中态用 Teleport 投影层不污染业务 DOM
- icons 包 tree-shaking 友好（sideEffects:false + 每图标独立模块）
- DcScrollArea 实现质量好（rAF 节流、pointer capture、ResizeObserver、卸载清理完整）
- fields 写入路径与文档一致（usePropertyBinding → createBindingAction → session.execute）；隐藏字段自动清错；pattern.lastIndex 复位防全局正则串状态
- viewport projection / reservation / NodeHost 对齐实现与文档 08 描述一致

---

## 十、建议优先级

| 级别 | 内容 |
| --- | --- |
| P0 | 一.1 #2 #3 #6 #7 正确性 bug；一.5 Dayjs 序列化；一.4 conflicted 锁死策略决策 |
| P1 | 消除双重解析（二）；accepts 进入拖拽层（三.1）；fields 包依赖修复（六.1）；文档补 session 层与握手协议（四.2/四.3） |
| P2 | core/form-generator 补测试（用本次发现的 bug 做回归用例）；物料栏键盘可达性；版本化迁移设计（五.1）；navbar 约束下沉到 policy（三.2） |
| P3 | 删残留目录；dispose 实现；utils 并入；exports types 条件；结构树 a11y；macOS 快捷键；发布元数据 |
