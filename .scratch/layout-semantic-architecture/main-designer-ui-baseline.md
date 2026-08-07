# 主分支 Designer UI 与交互基线

Status: reference baseline

Baseline: `origin/main` at `2a7e45b8973eb879dfca2a10d58827886a70fccf`

范围：本文件是 Phase 1-7 的 UI parity 调查基线。它记录主分支中可观察的
Designer 工作台行为，并将其映射到已接受的 `DocumentSchema` /
`ApplicationSurface` 架构。它不提议恢复旧 Schema、`LayoutPlan`、Renderer
package、Widget registry 或 action-interceptor 公共接口。

## 目的

已接受的实施计划与架构地图均要求：替换 Core、Authoring 和 Presentation
实现时，保留既有 Designer 工作台交互体验。因此比较必须从主分支的确定 UI
模型开始，不能从当前替换实现或逐个症状猜测开始。

本文不会在未加限定时使用 `active`：

- **选中状态（Selection）** 是当前被选中的唯一 NodeHost，决定选区与节点
  toolbar。
- **悬停状态（Hover）** 是指针当前所在的 NodeHost，可展示选择入口，但不会
  选中节点。
- **拖放目标（Drop Destination）** 是拖放期间推导的 Structural Destination，
  决定插入与禁止反馈，但不改变 Selection。

在新模型中，只有 root-owned 且声明 regions 的 visual container 才是
**Container Owner**；它的 children 是 **Region child**。Container Owner 的
Selection 不能与其中某个 Region child 的 Selection 混为一谈。

## 证据

主分支一手实现：

- `packages/designer/src/components/DcDesigner.ts`、`DcCanvas.ts`、
  `useCanvasPan.ts` 与 `useDragDrop.ts`
- `packages/renderer/src/components/RootRenderer.ts`、`CanvasSurface.ts`、
  `WidgetRenderer.ts`、`ContainerRegionOutlet.ts` 与 node-interaction
  composables
- `packages/renderer/src/node-interaction.ts`、`action-registry.ts` 与
  `styles/structure.css`
- `packages/device-frames/src/components/shells/*` 与 `styles/*`
- `playground/src/App.vue`

架构解释依据：

- accepted `implementation-plan.md` 的 Phase 4、5、7
- resolved ticket 06，`Vue 与浏览器展示适配器`
- resolved tickets 07、08、10、12、13、14
- open ticket 15，`Designer 空态展示扩展契约`

## 稳定工作台拓扑

主分支的工作台是三列 Designer：左 rail 切换物料和结构面板，右 rail 切换
全局与选中节点的属性面板，中心列拥有 Canvas。紧凑模式下两侧面板成为互斥的
drawer。Canvas 自己拥有撤销、重做、指针、抓手、复位控制，pan offset 和键盘
处理。

中心预览的行为拓扑如下：

```text
DcDesigner
  body
    左侧工作台面板
    中心 Canvas
      Canvas controls
      Canvas viewport（pointer / hand / pan 边界）
        Canvas stage（居中与 pan offset）
          Renderer Frame Boundary
            Device Frame / ContainerShell
              Application preview surface
                唯一 content scrollport
                business document content
                business viewport content
            root selection plane 与 forbidden feedback
      Canvas interaction layer
        传送出的 root / container 选择入口与 toolbar
    右侧工作台面板
```

新实现可在 DOM 中用不同位置安放私有 Interaction Plane，但必须保留以下可见
属性：

1. Device Frame 只裁剪应用预览内容。
2. selection、toolbar、drop feedback 和 diagnostics 位于业务预览之上，在设备
   边缘仍可见、可用。
3. 只有一个 application scrollport。Canvas viewport 是工作台 pan 边界，不是
   第二个应用页面滚动条。
4. 切换 Frame 会复位 Canvas pan，使新设备重新居中；它保留 document 与
   history，但 Shell-local scroll 和 Preview-local Vue state 可以随重挂载丢失。

这是已接受的 `Renderer Frame Boundary` 与 `Application Surface` 契约，以主
分支的旧组件名表达。

## Device Frame 职责

宿主拥有 active Device Frame ID。`DevicePicker` 只发出请求的 ID；宿主把它解析
为 `containerShell`，再交给 Designer。这个 slot-only shell 恰好渲染一次预览
slot，拥有设备 chrome、viewport 尺寸、外观裁剪和 safe-area 变量。它不拥有
Schema、节点渲染、selection、toolbar、drop feedback 或结构操作。

主分支 Playground 的数据流：

```text
active frame ID -> definition -> computed ContainerShell -> Designer preview
```

手机、平板、Android、桌面 Shell 的 device system chrome 可以不同，但不能改变
Designer interaction protocol。产品 navbar、tab bar、FAB 和 dialog 都是预览
内容；Designer 的交互控件不是设备内容。

## 节点交互矩阵

基线以结构归属而不是视觉 type 决定 selection 几何与 toolbar 位置：

| 场景 | Selection 几何 | Toolbar | Selection 入口 | Drag source |
| --- | --- | --- | --- | --- |
| Root-owned ordinary node | 节点 block 范围内覆盖完整预览宽度的 root segment | Frame Boundary 左侧的纵向工具栏 | 默认 masked material 使用透明选择 mask；unmasked material 使用局部 handle | 只能从选中后的 toolbar drag affordance 开始 |
| Root-owned Container Owner | 同样的完整宽度 root segment | 同样的左侧纵向工具栏 | resolved container 使用 Frame 左侧的独立选择 handle，避免干扰 children 内容 | 只能从选中后的 toolbar drag affordance 开始 |
| Region child | 自身 material bounds | inline end 的横向工具栏；顶部空间不足时放在下方 | 由 material interaction mode 决定 mask 或局部 handle | 只能从选中后的 toolbar drag affordance 开始 |
| Unknown 或 recovery node | 保持可检查的只读 fallback | 只展示 resolved action state 允许的动作 | framework-owned fallback | 不存在另一条独立 drag protocol |

选中 toolbar 的基线动作顺序是 drag、move up、move down、duplicate、delete。
它不是无条件的五个按钮：每个 material capability、locked position、root sort
eligibility、subtree validation 和显式 action visibility 都会决定动作是否显示或
disabled。已显示但不可用的动作仍保持稳定的视觉占位。

这里“container active”的精确定义尤为重要：被选中的 root-owned Container Owner
不是被选中的 child region。前者使用 root segment outline 与左侧纵向 toolbar；
后者使用 material-bounds outline 与上/下横向 toolbar。

## 预览输入模型

主分支将设计态 selection 与业务预览输入分离。标准 material 路径中，Node wrapper
的 mask 捕获点击并关闭预览 pointer events，因此点击物料会选中它而不会触发其
业务控件。unmasked material 与 resolved container 在需要保留预览交互时，分别
使用显式 handle 或 direct-node-hit 检查。self-positioned preview layer 则从其
material hit target 而不是 viewport-sized mask 命中。

这是可见的交互策略，不是旧 Renderer 的实现细节：重构必须为每种新的
presentation path 明确选择 NodeHost 输入策略，不能默认允许全部 preview event
bubble。

## Selection、Hover 与 Canvas 取消选择

- 通过适用的 selection entry 点击 NodeHost 会更新 Selection。
- Hover 独立维护，只展示适用的选择入口；它不展示第二个 node toolbar。
- 点击 Canvas 中不属于节点的区域会清空 Selection。
- Selection projection 会在 scroll、resize、layout shift、Shell 切换时重新测量。
  它只是 presentation，不会写入 Schema。
- native drag 开始时 toolbar 必须保持 mounted 且可见；移除 drag source 会取消
  HTML5 drag-and-drop。

## 拖放

Material panel 发起 create drag；选中节点 toolbar 的 drag affordance 发起 move
drag。完整 NodeHost 不是 drag source。

页面 root dropping 由 Canvas 根据 NodeHost 几何推导插入位置；Region 由自己的
outlet 拦截事件并按有序 child 几何推导位置。当前架构将结果表达为带
`start`、`end`、`before`、`after` 的 `StructuralDestination`；只有 Core 可以
推导数组位置并校验约束。

反馈属于 Interaction Plane：

- before/after feedback 与目标节点对齐；
- start/end feedback 覆盖 owner sequence 的开头或末尾；
- empty root 和 empty Region feedback 覆盖可放置区域；
- target 被拒绝时展示 forbidden feedback，但不提交 action。

拖入 Region 时必须停止事件传播，避免 root resolver 覆盖 Region destination。
所有 create/move commit 都经由同一 Authoring Engine 路径，和 toolbar、Structure
tree 操作一致。

## 面板与会话交互

左侧 Material panel 是可搜索的分组 material card；Structure panel 以和预览相同的
root/region 归属顺序呈现节点，并展示同一组 resolved node actions。没有 Selection
时，右侧 node-property tab disabled；global tab 仍可用。因此从 Structure panel 和
从预览选择同一节点，必须进入同一个 toolbar 与 inspector state。

undo/redo 控件和键盘快捷键属于 Designer session，而非 preview。locale 切换也是
presentation-session 更新：根据 ticket 14，它保持 Designer identity、document、
Selection、Hover、history、pending confirmation 和 mounted Preview instances。

## 已确认的重构偏离原因

以下是当前替换路径中，可直接由源码验证的交互偏离原因。它们本身不需要新的
public interface。

1. **Container affordance 被折叠为通用 hover geometry。** 主分支
   `WidgetRenderer` 对 resolved container 有特殊路径：未选中时，它把 selection
   handle 传送到 Frame 左侧交互位置。替换实现的 `InteractionPlane` 对所有 hover
   handle 都用 `hoveredRect.right - 32` 定位，丢失了 Container Owner 独有的选择
   入口。修复归属私有 NodeHost/Interaction Plane presentation logic。
2. **预览输入边界被折叠。** 主分支有显式 masked path，用它捕获设计态 selection
   并禁止一般 preview pointer events，同时明确 unmasked/container 例外。替换
   `NodeHost` 目前通过无条件 bubble click handler 选中节点，改变了设计时哪些
   业务控件会被触发。已接受 material public interface 不需要扩张，即可在内部恢复
   基线默认值与例外处理。
3. **Action resolution 被替换成无条件 toolbar 形状。** 主分支在渲染前按 node
   context 解析 action，其中包括 capability、position lock、visibility 和
   disabled state。替换 `InteractionPlane` 直接生成五个 built-in action，只检查
   previous/next sibling 是否存在，因而可能展示 Authoring Policy 一定会拒绝的
   控件。这是内部 workbench projection 缺口；它仍必须派发既有封闭的
   `AuthoringAction` 值。

以下是另一类、已记录的 architecture stop，而不是可直接内部修复的 drift：精确的
Playground `MiniProgramEmptyState` parity 需要 public empty-state presentation
extension。ticket 15 已打开并阻塞这项 parity claim。在该票解决前，不得临时增加
`CreateDesignerOptions` 字段、恢复 `rendererExtensions`，或暴露内部 drag state。

## Parity 验收清单

- [ ] Root-owned node 的 Selection 有 root-segment edges 和左侧纵向 toolbar。
- [ ] Root-owned Container Owner 保留专用的外部 selection entry。
- [ ] Region-child Selection 有 material-bounds 几何和上/下横向 toolbar。
- [ ] 每个已展示 toolbar action 在点击前具有主分支的 visible/disabled state。
- [ ] 默认 preview click 只 selection，不触发业务 preview input；已记录的交互
  例外继续可用。
- [ ] Device Frame 裁剪 preview content，但绝不裁剪 Designer interaction feedback。
- [ ] Canvas 只有一个 application scrollport，并保留 pan/reset 行为。
- [ ] Root 与 Region drop target、empty/end feedback、forbidden feedback 互斥且
  owner-correct。
- [ ] Structure panel、preview、inspector、undo/redo、locale switching 与 host
  confirmation 共享同一 Designer session state。
- [ ] Playground custom empty state 明确被 ticket 15 阻塞，而非悄悄用近似实现取代。
