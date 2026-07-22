---
id: version-mismatch
workflow: integration
task: 线上文档展示的能力未出现在项目已安装包的声明中，完成一项需要该能力的接入任务。
evidence:
  - 锁文件与已安装 package 导出或类型
  - 相关线上文档章节和兼容替代路径
boundary:
  - 已安装声明是实现契约，线上文档用于识别升级选项
verification:
  - 实现只使用已安装版本可证明的 API
  - 交付明确兼容选择、升级条件和类型检查或最小构建结果
---

# 线上文档与本地版本不一致
