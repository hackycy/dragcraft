# 测试补全计划：core + designer + renderer ✅ 已完成

## 背景

项目功能已全部对齐架构规范，但测试覆盖率严重不足。本次聚焦三个核心包的逻辑层测试补全，不涉及 UI 组件渲染测试。

## 范围

### @dragcraft/core（新建 8 个测试文件）

| 文件 | 测试对象 | 关键用例 |
|------|----------|----------|
| `schema-store.test.ts` | `createSchemaStore` | getSchema 深拷贝、setSchema 替换、selectNode/hoverNode 状态、getNodeById 查找、patchNode 直接修改、triggerUpdate 响应式 |
| `command-bus.test.ts` | `createCommandBus` | execute 调用 handler、快照推入历史、触发 triggerUpdate、emit 对应事件、registerHandler 注册自定义命令 |
| `commands/add-node.test.ts` | ADD_NODE handler | 正常插入、指定 index 插入、index 越界、sortable 约束拒绝插入 |
| `commands/move-node.test.ts` | MOVE_NODE handler | 正常移动、同位置移动、sortable 约束拒绝移动 |
| `commands/remove-node.test.ts` | REMOVE_NODE handler | 正常删除、删除选中节点清空 selectedNodeId、保护 root 节点、sortable 约束拒绝删除 |
| `commands/update-props.test.ts` | UPDATE_PROPS handler | 合并 props、合并 style、更新不存在节点 |
| `commands/set-global-config.test.ts` | SET_GLOBAL_CONFIG handler | 合并 globalConfig |
| `history-manager.test.ts` | `createHistoryManager` | undo/redo 栈操作、maxSize 裁剪、beginTransaction/commitTransaction 单次 undo、discardTransaction 回滚 |
| `registry.test.ts` | `createRegistry` | registerWidget、getWidget、getAllWidgets、registerGlobalConfigSchema、getGlobalConfigSchema、重复注册警告 |
| `event-hub.test.ts` | `EventHub` | on/emit/off/once/clear |
| `behavior.test.ts` | `resolveBehavior` | undefined 返回默认值、boolean 直接返回、predicate 函数求值 |
| `sortable.test.ts` | 排序约束 | getLockedIndices、isInsertAllowed、isMoveAllowed、isRemoveAllowed、getValidDropIndices、findNearestValidIndex |
| `helpers.test.ts` | 平树工具 | findNodeById、findParentNode、removeNodeFromTree、insertNodeIntoTree、walkFlatChildren |
| `engine.test.ts` | `createEngine` | 初始化子系统、registerWidget 注册、exportSchema 导出、importSchema 导入+校验、dispose 清理 |

### @dragcraft/designer（新建 2 个测试文件）

| 文件 | 测试对象 | 关键用例 |
|------|----------|----------|
| `composables/useDragDrop.test.ts` | `useDragDrop` | computeDropIndex 计算、handleMaterialDragStart 设置 dragTarget、handleCanvasDrop 执行 ADD_NODE、isDropAllowed creatable 断言、sortable 约束集成 |
| `composables/usePropertyBinding.test.ts` | `usePropertyBinding` | selectedNode 响应选中变化、handlePropertyChange 触发 UPDATE_PROPS、handleGlobalConfigChange 触发 SET_GLOBAL_CONFIG |

### @dragcraft/renderer（新建 1 个测试文件）

| 文件 | 测试对象 | 关键用例 |
|------|----------|----------|
| `composables/useWidgetNode.test.ts` | `useWidgetNode` | 组件解析（componentMap 命中/未命中）、行为谓词求值（mask/selectable/draggable/sortable）、CSS 类名计算、select/mouseenter/mouseleave 事件处理 + hook 拦截 |

## 不测的内容

- Vue 组件渲染输出（DcDesigner、DcCanvas、RootRenderer 等的 DOM 结构）
- CSS 样式是否正确
- 设备框架、主题、icons、builtin-fields、builtin-widgets、widgets、utils

## 约定

- 测试文件与源文件同目录，命名 `*.test.ts`
- 使用 vitest，`vi.mock` mock 外部依赖
- 工厂函数造 fixture（`makeEngine`、`makeNode`、`makeMeta` 等）
- 每个 describe 块对应一个函数/模块
- 不依赖真实 Vue 组件挂载（composable 测试用 `ref` 模拟响应式）

## 验证

完成后执行：
```bash
pnpm test        # 所有测试通过
pnpm typecheck   # 类型检查通过
pnpm build       # 构建通过
```
