# Schema 生命周期与生产运行时

读取 [lifecycle resources](resources/lifecycle.json)，再检查宿主 API、revision、migration 注册和运行时 registry。

## 实施

1. 在导入前完成物料与 migration 注册；按版本迁移后调用 `importSchema()`，处理 diagnostics，并让失败保持当前编辑会话不变。
2. 使用 `exportSchema()` 保存快照；成功的 `schema:changed` 只负责标记脏状态，宿主管理防抖、单请求队列、revision 冲突和发布。
3. 服务端校验页面归属、物料白名单、props、资源地址、容器 variant/region 与容量；发布生成不可变版本。
4. 生产运行时使用独立 registry，只读解释普通节点、容器递归、`flow/chrome/layer` 与样式作用域。
5. 未知物料产生包含 `type` 和节点 ID 的可观察 fallback；其他平台消费同一 Schema 契约并实现自己的组件与布局映射。

## 完成标准

测试覆盖注册顺序、migration、导入诊断、保存失败、revision 冲突、容器递归、未知物料和运行时布局；失败不会覆盖有效草稿或当前会话。
