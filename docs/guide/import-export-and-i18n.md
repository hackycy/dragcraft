# 导入导出与国际化

这一页会解释 schema 的进出路径，以及语言包是怎么合并进去的。

先看 playground 里真实存在的几项能力：

```ts
const { exportSchema, importSchema, undo, redo } = useDesigner(designer)
```

`exportSchema()` 会拿到当前 schema 快照。`importSchema()` 会在导入时先校验基本结构，再经过已注册的 migration。

## 导入时会发生什么

如果 schema 缺少 `root` 或 `version`，core 会直接拒绝导入。

如果你注册过 migration，`importSchema()` 会按版本顺序依次迁移，最后再写回 store，并清空历史记录。

## 语言包怎么合并

`createDesigner()` 会先加载 designer 和 renderer 的默认文案，再把你传入的 `messages` 合并进去。

这意味着你可以只覆盖业务需要改写的文案，不必从零写完整语言包。

关于导入导出和国际化，目前知道这些就够了。准备好之后，继续阅读 [参考总览](/reference/overview)。
