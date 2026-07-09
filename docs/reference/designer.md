# @dragcraft/designer

这是默认入口包。

先看最常用的导出：

```ts
import { createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
```

大多数业务接入只需要先理解这三个入口。它们分别负责“创建实例”“渲染设计器”“在业务层读取和调用能力”。

## 你通常会从这里取什么

- `createDesigner`
- `DcDesigner`
- `useDesigner`
- 常用的 core、renderer、form-generator 类型重导出

准备好之后，继续阅读 [集成设计器](/guide/designer-integration)。
