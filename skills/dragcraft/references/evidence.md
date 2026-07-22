# 证据链

## 建立版本事实

1. 读取宿主的 `package.json`、锁文件和现有 DragCraft 初始化文件，确定包管理器、版本范围和项目约定。
2. 查找已安装包的 `package.json`、导出声明、`.d.ts` 与源码；这些文件决定当前可调用的 API。
3. 从 skill 目录向上查找 Git checkout，并用 source map 的 `sourceCheckoutMarker` 确认它是 DragCraft 源码仓库。确认后才读取资源的 `repositoryPath`；否则读取资源的 `url`，并把宿主项目中的已安装类型作为本地事实。范例用于确认组合方式，公开类型用于确认调用形状。
4. 本地信息不足时，读取 `https://hackycy.github.io/dragcraft/llms.txt` 定位章节，再加载该章节。`https://hackycy.github.io/dragcraft/llms-full.txt` 用于无法由索引定位的事实。

## 解决版本差异

将已安装包的导出和类型作为实现契约。线上文档出现更高版本能力时，选择当前版本支持的路径，或说明升级所需的包版本与影响；不要把未安装 API 写入代码。

## 记录与验证

为本次任务记录以下事实：

- 使用的 DragCraft 版本和本地或线上证据位置。
- 新增或修改的公开 API、其输入输出或行为约束。
- 选择的扩展边界及其未承担的职责。
- 已运行的类型检查、单元测试、构建或交互验证。

优先复用宿主已有的测试与构建命令；新增行为时，为可观察的业务契约补充最窄的测试。
