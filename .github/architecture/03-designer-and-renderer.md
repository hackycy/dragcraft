# Designer 与 Presentation

Designer 是设计态 Presentation 的唯一 owner。它将 `DocumentSchema`、`MaterialDefinition[]` 和工作台状态组合为物料栏、结构树、画布、属性面板、选中态、工具栏与拖拽反馈。

## 创建与挂载

```ts
const designer = createDesigner({
  schema,
  materials,
  fieldComponentMap,
  extensions,
})
```

`DcDesigner` 接收 `DesignerInstance`，而不是内部 engine 或物料映射。宿主通过 `designer.document`、`designer.selection`、`designer.history` 和 `designer.execute(action)` 协调外部 UI。

## Material Presentation

每个物料显式声明一种设计态展示：

| kind | 要求 | 画布行为 |
| --- | --- | --- |
| `visual` | 提供 `preview` | 渲染业务预览，可选 `frame` 包装完整 NodeHost。 |
| `headless` | 不提供 preview | 保留物料栏、Schema、选择、工具栏和 inspector；画布不显示摆放位置。 |

Headless 物料在物料栏标注“无画布预览”。拖入画布时，Designer 在业务预览区显示中性全屏说明；松开后只创建配置节点，不显示位置反馈，也不在属性面板重复提示。

未知 type 与 headless 不同：未知 type 没有定义，画布以只读 fallback 和诊断保留它。

## 画布与 Device Frame

Canvas Surface 是业务预览的滚动与裁剪边界。Device Frame 只裁剪它的业务内容；拖拽、toolbar 和选择交互由 Designer 的工作台层拥有。

全屏 headless 提示是 Canvas Surface 的子层，因此会随 Device Frame 正确裁剪，不能越过 Frame 四角。root 的 selection plane 与 feedback 仍保留在各自的 Presentation 边界中，以避免影响业务预览的几何。

## Container 与扩展

业务容器通过 `ContainerRegionOutlet` 在自己的 DOM 中渲染 region。容器定义 Schema 所有权和约束，业务组件负责 flex、grid 或其他插入几何；Designer 负责 action、selection、drop decision 和 history。

`DesignerExtensions` 可替换面板、物料项和 Presentation 局部。`ContainerShell` 只能恰好渲染一次 slot；它不能读取或写入 Schema，不能复刻 Canvas Surface，也不能创建第二个滚动边界。

## 生产运行时

Designer Presentation 不是生产 Runtime。宿主独立读取导出的 DocumentSchema，并按 type 管理平台组件、未知 type 策略、布局和业务状态。
