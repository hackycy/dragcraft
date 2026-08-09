// @vitest-environment happy-dom
import type { Component } from 'vue'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { BUILT_IN_DEVICE_FRAMES } from '../../definitions'

interface ShellExpectation {
  id: string
  modifier: string
  radius: string
  statusIcons: string[]
  cutout?: string
  navigation?: string[]
}

const EXPECTATIONS: ShellExpectation[] = [
  { id: 'iphone', modifier: 'dc-device-frame--iphone', radius: '48px', statusIcons: ['cellular', 'wifi', 'battery'], cutout: 'dynamic-island', navigation: ['home-indicator'] },
  { id: 'iphone-x', modifier: 'dc-device-frame--iphone-x', radius: '40px', statusIcons: ['cellular', 'wifi', 'battery'], cutout: 'notch', navigation: ['home-indicator'] },
  { id: 'iphone-8', modifier: 'dc-device-frame--iphone-8', radius: '8px', statusIcons: ['cellular', 'wifi', 'battery'] },
  { id: 'android', modifier: 'dc-device-frame--android', radius: '20px', statusIcons: ['wifi', 'cellular', 'battery'], navigation: ['back', 'home', 'recent'] },
  { id: 'android-waterdrop', modifier: 'dc-device-frame--android-waterdrop', radius: '24px', statusIcons: ['wifi', 'cellular', 'battery'], cutout: 'waterdrop', navigation: ['back', 'home', 'recent'] },
  { id: 'tablet', modifier: 'dc-device-frame--tablet', radius: '24px', statusIcons: ['wifi', 'battery'] },
  { id: 'desktop', modifier: 'dc-device-frame--desktop', radius: '8px', statusIcons: [] },
]

describe('built-in Container Shells', () => {
  it.each(EXPECTATIONS)('renders $id appearance and the default slot exactly once', ({ id, modifier, statusIcons, cutout, navigation }) => {
    const definition = BUILT_IN_DEVICE_FRAMES.find(candidate => candidate.id === id)!
    let slotCalls = 0
    const wrapper = mount(definition.containerShell as Component, {
      slots: {
        default: () => {
          slotCalls += 1
          return h('main', { 'data-test-canvas-surface': '' }, 'Canvas Surface')
        },
      },
    })

    expect(wrapper.classes()).toContain(modifier)
    expect(wrapper.findAll('[data-test-canvas-surface]')).toHaveLength(1)
    expect(wrapper.find('.dc-device-frame__viewport .dc-device-frame__canvas [data-test-canvas-surface]').exists()).toBe(true)
    expect(slotCalls).toBe(1)
    expect(wrapper.findAll('[data-dc-status-icon]').map(icon => icon.attributes('data-dc-status-icon'))).toEqual(statusIcons)
    expect(wrapper.findAll('[data-dc-system-navigation]').map(icon => icon.attributes('data-dc-system-navigation'))).toEqual(navigation ?? [])

    if (cutout)
      expect(wrapper.get('[data-dc-phone-cutout]').attributes('data-dc-phone-cutout')).toBe(cutout)
    else
      expect(wrapper.find('[data-dc-phone-cutout]').exists()).toBe(false)
  })

  it('keeps usable viewport dimensions in appearance CSS', () => {
    const cssFiles = ['iphone.css', 'android.css', 'tablet.css', 'desktop.css']
      .map(file => readFileSync(path.resolve(process.cwd(), 'src/styles', file), 'utf8'))
      .join('\n')

    for (const definition of BUILT_IN_DEVICE_FRAMES) {
      const modifier = EXPECTATIONS.find(item => item.id === definition.id)!.modifier
      const escaped = modifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rootRule = cssFiles.match(new RegExp(`\\.${escaped}\\s*\\{[^}]*\\}`))?.[0]
      const viewportRule = cssFiles.match(new RegExp(`\\.${escaped} \\.dc-device-frame__viewport\\s*\\{[^}]*\\}`))?.[0]
      expect(rootRule).toContain(`width: ${definition.viewport.width}px`)
      expect(viewportRule).toContain(`height: ${definition.viewport.height}px`)
    }
  })

  it('provides each built-in frame radius to the stable Renderer boundary', () => {
    const cssFiles = ['iphone.css', 'android.css', 'tablet.css', 'desktop.css']
      .map(file => readFileSync(path.resolve(process.cwd(), 'src/styles', file), 'utf8'))
      .join('\n')

    for (const { modifier, radius } of EXPECTATIONS) {
      const escaped = modifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const boundaryRadiusRule = cssFiles.match(new RegExp(
        `\\.${escaped}\\s*,\\s*\\[data-dc-component="renderer-frame-boundary"\\]:has\\(> \\.${escaped}\\)\\s*\\{[^}]*\\}`,
      ))?.[0]
      expect(boundaryRadiusRule).toContain(`--dc-device-frame-radius: ${radius}`)
    }
  })

  it('does not contain Renderer layout or selection implementation selectors', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'src/styles/device-frame.css'), 'utf8')
    const boundaryRule = css.match(/\[data-dc-component="renderer-frame-boundary"\]:has\(> \.dc-device-frame\)\s*\{[^}]*\}/)?.[0]
    expect(boundaryRule).toContain('--dc-internal-designer-root-selection-plane-outset: var(--dc-device-frame-border-width)')
    expect(boundaryRule).toContain('--dc-internal-designer-root-selection-plane-radius: var(--dc-device-frame-radius)')
    expect(boundaryRule).toContain('--dc-node-selection-root-block-overlap: var(--dc-device-frame-border-width)')
    expect(boundaryRule).toContain('--dc-node-selection-root-inline-overlap: var(--dc-device-frame-border-width)')
    expect(css).not.toContain('dc-device-frame__content-layout')
    expect(css).not.toContain('dc-device-frame__chrome')
    expect(css).not.toContain('dc-device-frame__layer')
    expect(css).not.toContain('dc-device-frame__selection-plane')
    expect(css).not.toContain('[data-dc-selection-plane')
    expect(css).not.toContain('forbidden-overlay')
  })

  it('lets a narrow device define the Renderer Frame Boundary width', () => {
    const css = readFileSync(path.resolve(process.cwd(), '../renderer/styles/structure.css'), 'utf8')
    const boundaryRule = css.match(/\.dc-renderer-frame-boundary\s*\{[^}]*\}/)?.[0]
    const defaultShellRule = css.match(/\.dc-container-shell\s*\{[^}]*\}/)?.[0]

    expect(boundaryRule).toContain('width: max-content')
    expect(boundaryRule).not.toContain('min-width')
    expect(defaultShellRule).toContain('min-width: 375px')
  })
})
