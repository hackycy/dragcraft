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
  // 物料面板 / 运行时字形
  'fluent:image-24-regular',
  'fluent:content-view-gallery-24-regular',
  'fluent:apps-list-24-regular',
  'fluent:megaphone-24-regular',
  'fluent:tab-group-24-regular',
  'fluent:text-header-1-24-regular',
  'fluent:line-horizontal-1-24-regular',
  'fluent:spacebar-24-regular',
  'fluent:tap-single-24-regular',
  'fluent:window-24-regular',
  'fluent:speaker-2-24-regular',
  'fluent:chevron-right-24-regular',
  // 检查器字段字形
  'fluent:align-top-24-regular',
  'fluent:align-bottom-24-regular',
  'fluent:align-center-vertical-24-regular',
  'fluent:grid-24-regular',
  'fluent:full-screen-maximize-24-regular',
  'fluent:arrow-bidirectional-up-down-24-regular',
  'fluent:arrow-bidirectional-left-right-24-regular',
  'fluent:arrow-down-right-24-regular',
  'fluent:arrow-down-left-24-regular',
  'fluent:link-24-regular',
  'fluent:link-dismiss-24-regular',
  'fluent:delete-24-regular',
  'fluent:add-24-regular',
  // items 字段字形
  'fluent:dismiss-circle-24-regular',
  'fluent:re-order-dots-vertical-24-regular',
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
    const { app, svg } = mountIcon({ icon: 'fluent:window-24-regular', size: 24 })

    expect(svg!.getAttribute('width')).toBe('24')
    expect(svg!.getAttribute('height')).toBe('24')

    app.unmount()
  })

  it('lets the color prop reach the glyph, since every path is currentColor', () => {
    const { app, svg } = mountIcon({ icon: 'fluent:image-24-regular', color: 'red' })

    expect(svg!.getAttribute('style')).toContain('color')
    expect(svg!.style.color).not.toBe('')
    expect(svg!.querySelector('path')!.getAttribute('fill')).toBe('currentColor')

    app.unmount()
  })

  it('throws instead of silently rendering an empty glyph for an unknown name', () => {
    expect(() => mountIcon({ icon: 'fluent:does-not-exist' }))
      .toThrow(/fluent:does-not-exist/)
  })
})
