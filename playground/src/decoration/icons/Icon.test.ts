// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'

import { ICON_GLYPH_NAMES, ICON_GLYPHS } from './glyphs'
import { Icon } from './Icon'

/**
 * 注册表是显式清单而不是"随便多少都行"：多出来的通常意味着抄错了范围外的物料图标，
 * 少一个则意味着某个物料或检查器字段会渲染失败。新增字形时在这里追加并说明用途。
 */
const EXPECTED_GLYPH_NAMES: readonly string[] = [
  // 物料面板 / 运行时字形（见 research/iconify-glyphs.md；那份文档的 14 个物料里有 3 个后来被移出，
  // 对应字形已删，所以这里比文档少 3 项）
  'ant-design:picture-outlined',
  'material-symbols:view-carousel-outline',
  'material-symbols:signpost-outline',
  'material-symbols:campaign-outline',
  'material-symbols:bottom-navigation',
  'ant-design:font-size-outlined',
  'ant-design:border-horizontal-outlined',
  'ant-design:column-height-outlined',
  'material-symbols:touch-app-outline',
  'bx:bxs-volume-full',
  'ant-design:right-outlined',
  'material-symbols:page-header',
  // 11 个检查器字段字形（prod 里来自 @ant-design/icons-vue）
  'ant-design:appstore-outlined',
  'ant-design:fullscreen-outlined',
  'ant-design:vertical-align-top-outlined',
  'ant-design:vertical-align-bottom-outlined',
  'ant-design:vertical-align-middle-outlined',
  'ant-design:link-outlined',
  'ant-design:disconnect-outlined',
  'ant-design:arrow-down-outlined',
  'ant-design:column-width-outlined',
  'ant-design:delete-outlined',
  'ant-design:plus-outlined',
  // 2 个物料 items 字段字形（prod 里来自 @ant-design/icons-vue）
  'ant-design:close-circle-filled',
  'ant-design:drag-outlined',
]

interface IconTestProps {
  icon: string
  size?: number | string
  color?: string
}

function mountIcon(props: IconTestProps) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(Icon, props as unknown as Record<string, unknown>)
  app.mount(host)
  return { app, svg: host.querySelector('svg') }
}

describe('decoration Icon', () => {
  it('registers exactly the glyphs the port needs, and nothing else', () => {
    expect([...ICON_GLYPH_NAMES].sort()).toEqual([...EXPECTED_GLYPH_NAMES].sort())
  })

  it.each(ICON_GLYPH_NAMES)('renders %s with its own viewBox and child nodes', (name) => {
    const { app, svg } = mountIcon({ icon: name })

    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe(ICON_GLYPHS[name].viewBox)
    expect(svg!.children.length).toBeGreaterThan(0)

    app.unmount()
  })

  it('sizes the glyph through width/height rather than assuming a coordinate system', () => {
    const { app, svg } = mountIcon({ icon: 'material-symbols:page-header', size: 24 })

    expect(svg!.getAttribute('width')).toBe('24')
    expect(svg!.getAttribute('height')).toBe('24')

    app.unmount()
  })

  it('lets the color prop reach the glyph, since every path is currentColor', () => {
    const { app, svg } = mountIcon({ icon: 'ant-design:picture-outlined', color: 'red' })

    expect(svg!.getAttribute('style')).toContain('color')
    expect(svg!.style.color).not.toBe('')
    expect(svg!.querySelector('path')!.getAttribute('fill')).toBe('currentColor')

    app.unmount()
  })

  it('throws instead of silently rendering an empty glyph for an unknown name', () => {
    expect(() => mountIcon({ icon: 'material-symbols:does-not-exist' }))
      .toThrow(/material-symbols:does-not-exist/)
  })
})
