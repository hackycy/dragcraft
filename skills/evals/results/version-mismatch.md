---
id: version-mismatch
workflows:
  - integration
status: passed
inputDigest: sha256:b67bd09aee2a4f51de569054461d06cea76260682c733e2336044c32417f4b27
executedAt: "2026-07-29T10:57:11Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - 宿主锁文件、package exports 与已安装声明
  - 线上指南、source map 和当前示例的替代接入路径
verification:
  - 方案未导入本地声明中不存在的符号
  - 需要升级的能力被保留为显式前置条件而未写入实现
---

# 线上指南与本地声明不一致

参考 Agent 选择 integration，并以已安装公开声明作为实现契约。线上额外能力只用于识别升级选项；没有用源码内部符号扩大当前支持面，也没有在证据不足时修改宿主代码。
