---
id: version-mismatch
workflow: integration
status: passed
evidence:
  - dragcraft integration playbook 和 source map
  - 本地 Playground、Designer 和文档 package 声明
  - 线上 llms.txt 与 npm 的 Designer 类型声明
verification:
  - pnpm build:packages && pnpm --dir playground build
---

# 版本差异结果

agent 对比了已安装 `@dragcraft/designer@0.0.1` 声明与线上文档，未发现当前文档入口需要而本地没有的导出。它保留现有标准外部链接，未添加文档站点依赖或猜测 API。单独构建 Playground 前先生成 workspace 包后，构建通过。
