/**
 * 物料在面板里的分组。单独成文件（与 prod 的 `materials/groups.ts` 一致）是因为物料的
 * `index.ts` 要在模块求值期读取分组名，如果把它放在 `registry.ts` 里，物料的
 * `index.ts` 与 `registry.ts` 会互相导入，形成循环并让分组常量在求值时还是 undefined。
 */
export const DECORATION_MATERIAL_GROUPS = {
  basic: {
    name: 'basic',
    title: '基础组件',
  },
  tools: {
    name: 'tools',
    title: '工具组件',
  },
} as const
