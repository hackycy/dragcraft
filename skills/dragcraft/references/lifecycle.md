# Schema 生命周期与生产运行时

读取 [lifecycle resources](resources/lifecycle.json)，再检查宿主 API、revision、导入状态和 Runtime 边界。

## 实施

1. 创建 Designer 时传入当前 materials；恢复草稿时调用 `importSchema()`，处理 diagnostics，并让 rejected 输入保持当前会话不变。
2. 使用 `exportSchema()` 保存快照；宿主管理防抖、单请求队列、revision 冲突和发布。
3. 服务端校验页面归属、type 白名单、props、资源地址与容器 region；发布生成不可变版本。
4. 生产 Runtime 按 type 解释普通节点、容器 region、样式作用域和自身布局。
5. 未知 type 采用可观察 fallback、阻断或延迟加载，绝不静默删除内容。

## 完成标准

测试覆盖导入 diagnostics、保存失败、revision 冲突、容器所有权、未知 type 和 Runtime 布局；失败不会覆盖有效草稿或当前会话。
