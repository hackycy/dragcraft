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
    expect(overview).toContain('这一组页面按 package 组织，适合你在知道自己要找哪个入口之后查具体能力。')
    expect(overview).toContain('[快速开始](/guide/getting-started)')
    expect(overview).toContain('`@dragcraft/designer`：标准入口')
    expect(overview).toContain('`@dragcraft/themes` 与 `@dragcraft/utils`：主题和工具函数')
  })

  it('documents the default designer entry points and links back to the integration guide', () => {
    const designer = readWorkspaceFile('docs/reference/designer.md')

    expect(designer).toContain('# @dragcraft/designer')
    expect(designer).toContain('这是默认入口包。')
    expect(designer).toContain('import { createDesigner, DcDesigner, useDesigner } from \'@dragcraft/designer\'')
    expect(designer).toContain('- `createDesigner`')
    expect(designer).toContain('- `DcDesigner`')
    expect(designer).toContain('- `useDesigner`')
    expect(designer).toContain('[集成设计器](/guide/designer-integration)')
  })

  it('keeps the remaining reference pages focused on the real package boundaries', () => {
    const core = readWorkspaceFile('docs/reference/core.md')
    const renderer = readWorkspaceFile('docs/reference/renderer.md')
    const formGenerator = readWorkspaceFile('docs/reference/form-generator.md')
    const deviceFrames = readWorkspaceFile('docs/reference/device-frames.md')
    const widgetsAndFields = readWorkspaceFile('docs/reference/widgets-and-fields.md')
    const themesAndUtils = readWorkspaceFile('docs/reference/themes-and-utils.md')

    expect(core).toContain('这个包负责 schema、命令、历史记录和事件语义。')
    expect(core).toContain('`createEngine()`、`CommandType`')

    expect(renderer).toContain('这个包负责把 schema 节点变成真正的 Vue 节点树。')
    expect(renderer).toContain('node action registry')

    expect(formGenerator).toContain('这个包负责根据 FormSchema 渲染右侧属性面板。')
    expect(formGenerator).toContain('字段值变化会先通过事件抛出，再由 designer 翻译成对应命令。')

    expect(deviceFrames).toContain('这个包提供设备预览外壳和设备切换工具栏。')
    expect(deviceFrames).toContain('`DeviceFrameShell`、`createDeviceFrameContext()` 和 `createDeviceToolbarRenderer()`')

    expect(widgetsAndFields).toContain('这两个入口分别解决“如何整理物料”和“如何接入字段组件”。')
    expect(widgetsAndFields).toContain('`@dragcraft/widgets` 更偏协议和整理工具。')
    expect(widgetsAndFields).toContain('`@dragcraft/fields-ant-design-vue` 则直接提供一份可用的 Ant Design Vue 字段映射。')

    expect(themesAndUtils).toContain('`@dragcraft/themes` 负责默认视觉皮肤，`@dragcraft/utils` 负责跨包复用的纯函数。')
    expect(themesAndUtils).toContain('如果你只是要接入默认样式，看 `@dragcraft/themes`。')
  })
})
