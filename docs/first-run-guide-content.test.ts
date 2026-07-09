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

  it('points the root README docs section at the consumer site and maintainer architecture docs', () => {
    const readme = readWorkspaceFile('README.md')

    expect(readme).toContain('## 文档')
    expect(readme).toContain('- `docs/`: 面向使用者的 VitePress 文档站点')
    expect(readme).toContain('- `.github/architecture/`: 面向维护者的架构文档')
  })
})
