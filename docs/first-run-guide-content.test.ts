import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workspaceRoot = resolve(import.meta.dirname, '..')

function readWorkspaceFile(relativePath: string) {
  return readFileSync(resolve(workspaceRoot, relativePath), 'utf8')
}

describe('first-run docs content', () => {
  it('documents the homepage entry points for standard consumers', () => {
    const homepage = readWorkspaceFile('docs/index.md')

    expect(homepage).toContain('# dragcraft')
    expect(homepage).toContain('dragcraft 是一套面向小程序装修场景的可视化页面搭建引擎。')
    expect(homepage).toContain('[快速开始](/guide/getting-started)')
    expect(homepage).toContain('[核心心智模型](/guide/mental-model)')
  })

  it('teaches the shortest path to rendering DcDesigner', () => {
    const gettingStarted = readWorkspaceFile('docs/guide/getting-started.md')

    expect(gettingStarted).toContain('# 快速开始')
    expect(gettingStarted).toContain('你会在这一页完成一件事：把 `@dragcraft/designer` 渲染出来。')
    expect(gettingStarted).toContain('import \'@dragcraft/themes/antd\'')
    expect(gettingStarted).toContain('import { createDesigner, DcDesigner } from \'@dragcraft/designer\'')
    expect(gettingStarted).toContain('import { createAntDesignVueFields } from \'@dragcraft/fields-ant-design-vue\'')
    expect(gettingStarted).toContain('fieldComponentMap: createAntDesignVueFields(),')
    expect(gettingStarted).toContain('globalConfigSchema: myGlobalConfigSchema,')
    expect(gettingStarted).toContain('pnpm add @dragcraft/designer @dragcraft/themes @dragcraft/fields-ant-design-vue vue')
    expect(gettingStarted).toContain('<DcDesigner :instance="designer" />')
    expect(gettingStarted).toContain('[核心心智模型](/guide/mental-model)')
  })

  it('explains the package boundaries with the standard mental model', () => {
    const mentalModel = readWorkspaceFile('docs/guide/mental-model.md')

    expect(mentalModel).toContain('# 核心心智模型')
    expect(mentalModel).toContain('你先不用理解所有内部实现，但要先知道 dragcraft 由哪几层组成。')
    expect(mentalModel).toContain('dragcraft 可以先看成三层：`core` 管状态和命令，`designer` 负责三栏 UI，`themes` 决定默认视觉。')
    expect(mentalModel).toContain('dragcraft 把 schema 写操作集中到 `engine.execute()`。')
    expect(mentalModel).toContain('默认入口是 `@dragcraft/designer`。')
    expect(mentalModel).toContain('[Schema 与布局](/guide/schema-and-layout)')
  })

  it('explains schema shape and layout projection for the next concepts guide', () => {
    const schemaAndLayout = readWorkspaceFile('docs/guide/schema-and-layout.md')

    expect(schemaAndLayout).toContain('# Schema 与布局')
    expect(schemaAndLayout).toContain('这一页会解释两个问题：schema 长什么样，以及节点为什么会进入内容流、chrome 或浮层。')
    expect(schemaAndLayout).toContain('dragcraft 目前采用扁平模型，真正参与页面编排的是 `root.children`。')
    expect(schemaAndLayout).toContain('节点通过 `layout.placement` 表达布局意图。')
    expect(schemaAndLayout).toContain('`@dragcraft/core` 先把 `root.children` 投影成 `LayoutPlan`。')
    expect(schemaAndLayout).toContain('[集成设计器](/guide/designer-integration)')
  })

  it('breaks down the standard createDesigner integration inputs', () => {
    const designerIntegration = readWorkspaceFile('docs/guide/designer-integration.md')

    expect(designerIntegration).toContain('# 集成设计器')
    expect(designerIntegration).toContain('这一页会把 `createDesigner()` 的输入项拆开讲清楚。')
    expect(designerIntegration).toContain('widgetMetas: playgroundWidgetMetas,')
    expect(designerIntegration).toContain('fieldComponentMap: buildPlaygroundFieldComponentMap(),')
    expect(designerIntegration).toContain('读取 schema 和交互状态时，优先通过 `engine.state`。')
    expect(designerIntegration).toContain('如果你要提交 schema 变更，统一通过 `engine.execute()`。')
    expect(designerIntegration).toContain('[物料与字段](/guide/materials-and-fields)')
  })

  it('covers schema import export and message merging for i18n', () => {
    const importExportAndI18n = readWorkspaceFile('docs/guide/import-export-and-i18n.md')

    expect(importExportAndI18n).toContain('# 导入导出与国际化')
    expect(importExportAndI18n).toContain('这一页会解释 schema 的进出路径，以及语言包是怎么合并进去的。')
    expect(importExportAndI18n).toContain('const { exportSchema, importSchema, undo, redo } = useDesigner(designer)')
    expect(importExportAndI18n).toContain('如果 schema 缺少 `root` 或 `version`，core 会直接拒绝导入。')
    expect(importExportAndI18n).toContain('`createDesigner()` 会先加载 designer 和 renderer 的默认文案，再把你传入的 `messages` 合并进去。')
    expect(importExportAndI18n).toContain('[参考总览](/reference/overview)')
  })

  it('points the root README docs section at the consumer site and maintainer architecture docs', () => {
    const readme = readWorkspaceFile('README.md')

    expect(readme).toContain('## 文档')
    expect(readme).toContain('- `docs/`: 面向使用者的 VitePress 文档站点')
    expect(readme).toContain('- `.github/architecture/`: 面向维护者的架构文档')
  })
})
