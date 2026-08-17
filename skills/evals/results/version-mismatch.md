---
id: version-mismatch
workflows:
  - integration
status: passed
inputDigest: sha256:7a6f7681ed6ddf7d4191a6deca4677db4913a2c858e151703ad1364bf71dafe5
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - workspace lockfile、package exports 与当前公开声明
  - 官方指南、source map 和 Guide Project 的可用接入路径
verification:
  - Guide Project 只使用当前声明的公开导入
  - 额外能力仍作为明确的升级前置条件，不写入当前集成
---

# 线上指南与本地声明不一致

参考 Agent 选择 integration，并以当前公开声明作为实现契约。线上额外能力只用于识别升级选项；没有用实现内部符号扩大当前支持面，也没有在证据不足时修改宿主代码。
