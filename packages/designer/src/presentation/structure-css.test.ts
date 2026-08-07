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
      '[data-dc-component="application-surface"] [data-dc-plane="document"]',
    )
    const viewportPlane = declarations(
      css,
      '[data-dc-component="application-surface"] [data-dc-plane="viewport"]',
    )
    const interactionPlane = declarations(
      css,
      '[data-dc-component="application-surface"] > [data-dc-plane="interaction"]',
    )

    expect(surface).toMatchObject({
      position: 'relative',
      isolation: 'isolate',
      contain: 'layout',
      overflow: 'visible',
    })
    expect(documentPlane).toMatchObject({ 'overflow': 'auto', 'z-index': '1' })
    expect(documentPlane['padding-block-start']).toContain('--dc-safe-area-block-start')
    expect(documentPlane['padding-block-start'])
      .toContain('--dc-internal-application-surface-reservation-block-start')
    expect(viewportPlane).toMatchObject({ 'z-index': '2', 'pointer-events': 'none' })
    expect(interactionPlane).toMatchObject({ 'z-index': '3', 'pointer-events': 'none' })
  })

  it('keeps toolbar orientation, anchoring, and action dimensions stable', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const toolbar = declarations(css, '[data-dc-component="node-toolbar"]')
    const vertical = declarations(css, '[data-dc-component="node-toolbar"][data-orientation="vertical"]')
    const horizontal = declarations(css, '[data-dc-component="node-toolbar"][data-orientation="horizontal"]')
    const action = declarations(css, '[data-dc-component="node-toolbar"] > [data-dc-part="action"]')
    const drag = declarations(css, '[data-dc-component="node-toolbar"] > [data-dc-action="drag"]')

    expect(toolbar).toMatchObject({ display: 'flex', gap: '3px', padding: '4px' })
    expect(vertical).toMatchObject({ 'flex-direction': 'column' })
    expect(horizontal).toMatchObject({ 'flex-flow': 'row nowrap' })
    expect(horizontal.right).toContain('--dc-internal-node-toolbar-anchor-inline-end')
    expect(action).toMatchObject({ display: 'flex', width: '26px', height: '26px' })
    expect(drag).toMatchObject({ cursor: 'grab' })
  })

  it('provides usable structure and theme recipes for forbidden feedback', () => {
    const structure = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const recipes = readFileSync(path.resolve(process.cwd(), 'theme/baseline/recipes.css'), 'utf8')
    const overlayLayout = declarations(structure, '[data-dc-component="forbidden-overlay"]')
    const overlayTheme = declarations(recipes, '[data-dc-component="forbidden-overlay"]')
    const textTheme = declarations(
      recipes,
      '[data-dc-component="forbidden-overlay"] > [data-dc-part="text"]',
    )

    expect(overlayLayout).toMatchObject({
      'position': 'absolute',
      'inset': '0',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'pointer-events': 'none',
    })
    expect(overlayTheme).toMatchObject({
      color: 'var(--dc-color-danger)',
      background: 'var(--dc-color-danger-subtle)',
      border: '2px dashed var(--dc-color-danger)',
      animation: 'dc-theme-forbidden-pulse 1.5s ease-in-out infinite',
    })
    expect(textTheme).toMatchObject({
      background: 'var(--dc-color-surface)',
      border: '1px solid color-mix(in srgb, var(--dc-color-danger), transparent 70%)',
    })
  })

  it('centers and themes the default empty state', () => {
    const structure = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const recipes = readFileSync(path.resolve(process.cwd(), 'theme/baseline/recipes.css'), 'utf8')
    const emptyLayout = declarations(structure, '[data-dc-component="empty-state"]')
    const emptyTheme = declarations(recipes, '[data-dc-component="empty-state"]')
    const iconTheme = declarations(
      recipes,
      '[data-dc-component="empty-state"] > [data-dc-part="icon"]',
    )

    expect(emptyLayout).toMatchObject({
      'display': 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'center',
      'min-height': '160px',
    })
    expect(emptyTheme).toMatchObject({
      'color': 'var(--dc-color-text-subtle)',
      'font-size': 'var(--dc-font-size-sm)',
    })
    expect(iconTheme).toMatchObject({ opacity: 'var(--dc-empty-state-icon-opacity)' })
  })

  it('draws root selection with four edge strips', () => {
    const structure = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const recipes = readFileSync(path.resolve(process.cwd(), 'theme/baseline/recipes.css'), 'utf8')
    const rootSelection = declarations(
      structure,
      '[data-dc-component="node-selection"][data-dc-state~="root-segment"]',
    )
    const edge = declarations(
      structure,
      '[data-dc-component="node-selection"][data-dc-state~="root-segment"] > [data-dc-part]',
    )
    const blockEdges = declarations(
      structure,
      '[data-dc-component="node-selection"] > [data-dc-part="block-start-edge"],\n[data-dc-component="node-selection"] > [data-dc-part="block-end-edge"]',
    )
    const blockStart = declarations(
      structure,
      '[data-dc-component="node-selection"] > [data-dc-part="block-start-edge"]',
    )
    const edgeTheme = declarations(
      recipes,
      '[data-dc-component="node-selection"][data-dc-state~="root-segment"] > [data-dc-part]',
    )

    expect(rootSelection).toMatchObject({ border: '0' })
    expect(edge).toMatchObject({ position: 'absolute', display: 'block' })
    expect(blockEdges).toMatchObject({ right: '0', left: '0' })
    expect(blockStart).toMatchObject({ bottom: '100%' })
    expect(edgeTheme).toMatchObject({ background: 'var(--dc-color-accent)' })
  })

  it('sizes and themes the hover selection handle', () => {
    const structure = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
    const recipes = readFileSync(path.resolve(process.cwd(), 'theme/baseline/recipes.css'), 'utf8')
    const handleLayout = declarations(structure, '[data-dc-component="node-handle"]')
    const surfaceLayout = declarations(
      structure,
      '[data-dc-component="node-handle"] > [data-dc-part="surface"]',
    )
    const handleTheme = declarations(recipes, '[data-dc-component="node-handle"]')
    const surfaceTheme = declarations(
      recipes,
      '[data-dc-component="node-handle"] > [data-dc-part="surface"]',
    )

    expect(handleLayout).toMatchObject({ width: '32px', height: '32px', padding: '0', border: '0' })
    expect(surfaceLayout).toMatchObject({
      'position': 'absolute',
      'inset': '4px',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
    })
    expect(handleTheme).toMatchObject({ color: 'var(--dc-color-accent)', background: 'transparent' })
    expect(surfaceTheme).toMatchObject({
      color: 'var(--dc-color-on-accent)',
      background: 'var(--dc-color-accent)',
    })
  })
})
