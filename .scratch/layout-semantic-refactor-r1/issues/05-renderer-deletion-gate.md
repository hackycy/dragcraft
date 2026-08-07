Status: resolved
Type: grilling
Blocked by: 04

## Question

在什么依赖、测试、产品模板和交互基线全部满足后，才允许删除旧 Renderer 与过渡 Adapter，并确认最终架构没有新旧双轨？

## Answer

旧 Renderer、旧 Engine Adapter 与旧 Core 协议只能在六组证据同时满足后删除；删除闸门是不可逆清理的前置条件，不是删除后的补测清单。

### 1. 调用方闸门

- Designer、Playground、Guide Project、docs 和 skills 不再 import 或描述旧 Renderer 接口。
- UI 只依赖 `DesignerSession`，不依赖旧 Engine、Store、Registry、Command 或 LayoutPlan。
- `ContainerRegionOutlet`、Material Preview Context 等最终接口已由 Designer 拥有。
- 临时旧 Engine Adapter 没有运行时调用方。
- 旧实现选择开关已固定为新实现，并由静态检查证明没有旧分支调用。

### 2. 交互基线闸门

前面确定的十类场景族全部通过纯模块、组件和真实浏览器三层验证。仓库当前没有浏览器自动化时，删除前至少补齐关键 smoke：打开 Playground、选择节点、root/Region 拖放、属性编辑、undo/redo、Device Frame 切换、滚动与 toolbar；稳定状态转换自动化，视觉质量人工确认。

### 3. 产品场景闸门

三个 Playground 模板全部通过：电商首页的 navbar/bottom bar/FAB/长滚动/reservation；内容详情的普通与异形多 Region 容器、root/Region 移动和排序；商品详情的固定购买栏、overlay 和 Device Frame 切换。Guide Project 同时通过最小/完整 Designer、Schema round-trip 和自主生产 Runtime 不依赖 Designer Presentation。

### 4. 恢复与状态闸门

unknown、headless、失配容器和空 Region 不丢节点；rejected/no-op 不进入 history；Selection 在节点仍存在时连续；active drag 遵守 Cutover Fence；import/export 不改变结构；不存在双 Schema、双 history 或双渲染。

### 5. CSS 与发布闸门

Renderer 必需结构 CSS 已由 Designer 拥有；`standard.css`、`structure.css`、theme contract、CSS custom data、package exports 和消费者 fixture 通过；不再引用 `@dragcraft/renderer/structure.css`；Core 不依赖 Vue；workspace、lockfile 和构建图中没有 Renderer。

### 6. 清理提交闸门

物理删除必须是独立的清理提交，只包含删除旧 Renderer、旧 Adapter、旧协议、已被替代的旧测试，以及依赖、exports、workspace、lockfile、文档和 denylist 清理；不得在该提交中新增交互行为或修复可见偏差。该提交必须能单独审查、回退和定位。

删除前按仓库要求通过：`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`。
