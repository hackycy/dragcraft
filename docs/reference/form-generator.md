# @dragcraft/form-generator

这个包负责根据 FormSchema 渲染右侧属性面板。

它不直接依赖 core，也不提交命令。字段值变化会先通过事件抛出，再由 designer 翻译成对应命令。
