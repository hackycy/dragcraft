---
id: version-mismatch
workflows:
  - integration
task: 线上指南展示的能力未出现在项目已安装 package 的公开声明中，完成相关接入并处理兼容选择。
evidence:
  - 锁文件、已安装 package exports 与类型
  - 对应线上指南和当前版本可用的替代路径
boundary:
  - 已安装公开声明决定实现契约
  - 源码和线上文档不能扩大当前可调用接口
verification:
  - 实现只使用本地可证明的公开 API
  - 需要升级时先明确条件与影响
  - 类型检查或最小构建通过
---

# 线上指南与本地声明不一致
