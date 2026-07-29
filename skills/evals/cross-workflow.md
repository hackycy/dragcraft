---
id: cross-workflow
workflows:
  - widgets
  - forms
  - commands
task: 新增单例优惠券物料、可验证的优惠码字段和带确认的重置动作，并保持失败操作不写入历史。
evidence:
  - 物料、表单、命令和 interceptor 的公开类型
  - widgets、forms 与 commands 三个资源分支
boundary:
  - widgets 是主工作流，forms 和 commands 只承担直接依赖行为
  - 字段与动作写入共享公开命令路径
  - 字段规则提供提交后反馈，业务保存与发布负责阻断无效优惠码
verification:
  - 单例约束覆盖所有创建入口
  - 无效优惠码提交转换值并显示错误；单例拒绝与取消确认保持 Schema 和历史不变
  - 成功重置形成单个可撤销事务
---

# 跨工作流优惠券物料
