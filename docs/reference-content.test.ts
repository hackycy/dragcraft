import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workspaceRoot = resolve(import.meta.dirname, '..')

function readWorkspaceFile(relativePath: string) {
  return readFileSync(resolve(workspaceRoot, relativePath), 'utf8')
}

describe('reference docs content', () => {
  it('introduces the package reference overview and points readers back to the onboarding flow', () => {
    const overview = readWorkspaceFile('docs/reference/overview.md')

    expect(overview).toContain('# 参考总览')
    expect(overview).toContain('[快速开始](/guide/getting-started)')
    expect(overview).toContain('`@dragcraft/designer`：标准入口')
    expect(overview).toContain('`@dragcraft/themes` 与 `@dragcraft/utils`：主题和工具函数')
  })

  it('keeps the designer page example-first and points back to the integration guide', () => {
    const designer = readWorkspaceFile('docs/reference/designer.md')

    expect(designer).toContain('# @dragcraft/designer')
    expect(designer).toContain('```ts')
    expect(designer).toContain('import { createDesigner, DcDesigner, useDesigner } from \'@dragcraft/designer\'')
    expect(designer).toContain('[集成设计器](/guide/designer-integration)')
  })

  it('makes the package reference pages example-first and gives each one a next step', () => {
    const core = readWorkspaceFile('docs/reference/core.md')
    const renderer = readWorkspaceFile('docs/reference/renderer.md')
    const formGenerator = readWorkspaceFile('docs/reference/form-generator.md')
    const deviceFrames = readWorkspaceFile('docs/reference/device-frames.md')
    const widgetsAndFields = readWorkspaceFile('docs/reference/widgets-and-fields.md')
    const themesAndUtils = readWorkspaceFile('docs/reference/themes-and-utils.md')

    expect(core).toContain('```ts')
    expect(core).toContain('import { createEngine, CommandType } from \'@dragcraft/core\'')
    expect(core).toContain('engine.execute(CommandType.SetGlobalConfig')
    expect(core).toContain('[Schema 与布局](/guide/schema-and-layout)')

    expect(renderer).toContain('```ts')
    expect(renderer).toContain('import { RootRenderer, createNodeActionRegistry } from \'@dragcraft/renderer\'')
    expect(renderer).toContain('createNodeActionRegistry()')
    expect(renderer).toContain('[集成设计器](/guide/designer-integration)')

    expect(formGenerator).toContain('```vue')
    expect(formGenerator).toContain('import { FormGenerator } from \'@dragcraft/form-generator\'')
    expect(formGenerator).toContain('@change="handleFieldChange"')
    expect(formGenerator).toContain('[物料与字段](/guide/materials-and-fields)')

    expect(deviceFrames).toContain('```ts')
    expect(deviceFrames).toContain('import {')
    expect(deviceFrames).toContain('createDeviceFrameContext')
    expect(deviceFrames).toContain('createDeviceToolbarRenderer(deviceCtx)')
    expect(deviceFrames).toContain('[主题与设备框架](/guide/themes-and-device-frames)')

    expect(widgetsAndFields).toContain('```ts')
    expect(widgetsAndFields).toContain('import { buildComponentMap, getWidgetMetas } from \'@dragcraft/widgets\'')
    expect(widgetsAndFields).toContain('import { createAntDesignVueFields } from \'@dragcraft/fields-ant-design-vue\'')
    expect(widgetsAndFields).toContain('fieldComponentMap: createAntDesignVueFields(),')
    expect(widgetsAndFields).toContain('[物料与字段](/guide/materials-and-fields)')

    expect(themesAndUtils).toContain('```ts')
    expect(themesAndUtils).toContain('import \'@dragcraft/themes/antd\'')
    expect(themesAndUtils).toContain('import { createI18n, EventEmitter, generateShortId } from \'@dragcraft/utils\'')
    expect(themesAndUtils).toContain('[导入导出与国际化](/guide/import-export-and-i18n)')
  })
})
