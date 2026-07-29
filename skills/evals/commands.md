---
id: commands
workflows:
  - commands
task: 为一个业务动作接入公开命令，并证明成功、no-op 和拒绝不会混淆历史与 schema:changed 事件。
evidence:
  - 当前安装版本的命令与结果类型
  - commands playbook、命令指南和现有命令测试
boundary:
  - Schema 写入只经过公开 execute() 或绑定路径
  - 失败与 no-op 不产生历史或 schema:changed
verification:
  - 测试覆盖成功、no-op、拒绝与 undo/redo
  - 一项用户意图只形成一个历史事务
---

# 命令结果与历史原子性
