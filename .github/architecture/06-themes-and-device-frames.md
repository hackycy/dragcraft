# 主题与 Device Frame

Designer 拥有工作台的结构 CSS 和默认主题。`@dragcraft/designer/standard.css` 是完整的 Standard 工作台主题；`@dragcraft/designer/structure.css` 只提供结构层，适用于完全自定义视觉。

## 主题契约

- 公共 CSS custom properties 使用 `--dc-<domain>-<name>`。
- 实现内部变量使用 `--dc-internal-<owner>-<name>`，宿主不得依赖。
- 公共 hook 使用稳定 `data-dc-component`、`data-dc-part` 和 `data-dc-state`。
- 主题只影响工作台，不样式化业务物料的生产外观。

Material panel、structure tree、property panel、canvas 与 node interaction 都有自己的结构层；Standard 主题在这些稳定边界上提供统一 recipe。

## Device Frame

Device Frame 是宿主选择的 `ContainerShell`。它只包围业务预览 slot，并可以提供安全区变量。它不读取或写入 DocumentSchema，也不接管 selection、toolbar、drag feedback 或 history。

```text
Designer Presentation
  -> Frame boundary
    -> active Device Frame shell
      -> Canvas Surface (business preview only)
```

Canvas Surface 承担业务预览的滚动和裁剪。全屏 headless 提示属于该表面，因此不能溢出 Device Frame。工作台交互层保持由 Designer 拥有。

切换设备保留 document 与 history，但 Shell 的本地滚动位置和业务 Vue 局部状态不属于保留契约。宿主持有当前 device ID，并将解析出的只读 shell 传入 Designer 扩展。
