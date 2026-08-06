import { readFileSync } from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

function declarations(css: string, selector: string): Record<string, string> {
  const result: Record<string, string> = {}
  postcss.parse(css).walkRules((rule) => {
    if (rule.selector !== selector)
      return
    rule.walkDecls((declaration) => {
      result[declaration.prop] = declaration.value
    })
  })
  return result
}

describe('applicationSurface structural CSS', () => {
  it('owns the scrollport, safe-area reservations, and isolated plane order', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const surface = declarations(css, '[data-dc-component="application-surface"]')
    const documentPlane = declarations(
      css,
      '[data-dc-component="application-surface"] > [data-dc-plane="document"]',
    )
    const viewportPlane = declarations(
      css,
      '[data-dc-component="application-surface"] > [data-dc-plane="viewport"]',
    )
    const interactionPlane = declarations(
      css,
      '[data-dc-component="application-surface"] > [data-dc-plane="interaction"]',
    )

    expect(surface).toMatchObject({
      position: 'relative',
      isolation: 'isolate',
      contain: 'layout paint',
      overflow: 'hidden',
    })
    expect(documentPlane).toMatchObject({ 'overflow': 'auto', 'z-index': '1' })
    expect(documentPlane['padding-block-start']).toContain('--dc-safe-area-block-start')
    expect(documentPlane['padding-block-start'])
      .toContain('--dc-internal-application-surface-reservation-block-start')
    expect(viewportPlane).toMatchObject({ 'z-index': '2', 'pointer-events': 'none' })
    expect(interactionPlane).toMatchObject({ 'z-index': '3', 'pointer-events': 'none' })
  })
})
