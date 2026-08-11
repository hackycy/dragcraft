---
id: commands
workflows:
  - commands
task: 为一个业务动作接入公开 AuthoringAction，并证明 committed、unchanged 和 rejected 不会混淆 history 与 schema:changed 事件。
evidence:
  - 当前安装版本的 AuthoringAction 与结果类型
  - commands playbook、动作指南和现有 action 测试
boundary:
  - Schema 写入只经过公开 execute() 或绑定路径
  - 失败与 no-op 不产生历史或 schema:changed
verification:
  - 测试覆盖成功、no-op、拒绝与 undo/redo
  - 一项用户意图只形成一个历史事务
---

# AuthoringAction 结果与历史原子性
