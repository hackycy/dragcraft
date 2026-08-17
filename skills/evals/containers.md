---
id: containers
workflows:
  - containers
task: 实现单 Region 与多 Region 外部容器，限制 region 容量和 accepted types，并保证非法 resolver、重复 outlet 或拒绝放置不会部分修改 Schema。
evidence:
  - MaterialDefinition、DesignerRegionOutlet、useContainerRuntime 和 drop diagnostic 类型
  - containers resources 与现有容器测试
boundary:
  - 子节点只由 structure.containers 的 Region 序列持久化，当前协议不支持嵌套容器
  - 容器组件负责 DOM、CSS 和插入几何
verification:
  - resolver 返回有效插入边界或 null，非法返回值与异常有诊断
  - 测试覆盖容量拒绝、accepted type 拒绝、跨 region 移动和 missing/duplicate outlet recovery
  - 拒绝或抛错保持 Schema 与历史不变
---

# Region 容器与失败原子性
