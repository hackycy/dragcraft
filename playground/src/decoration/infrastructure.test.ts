// @vitest-environment happy-dom

import type { Component } from 'vue'
import { describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'

import {
  createDiyV2BackgroundStyle,
  createTransparentDiyV2BackgroundConfig,
  normalizeDiyV2BackgroundColor,
  normalizeDiyV2BackgroundConfig,
} from './background'
import { createDecorationDesigner } from './designer'
import { createDecorationFieldComponentMap } from './fields'
import { createDecorationGlobalConfigSchema } from './global-config-schema'
import BackgroundColorConfig from './inspector/BackgroundColorConfig.vue'
import BackgroundImageModeField from './inspector/BackgroundImageModeField.vue'
import ColorField from './inspector/ColorField.vue'
import ImageSourceField from './inspector/ImageSourceField.vue'
import { parseDiyV2CssQuad, serializeDiyV2CssQuad } from './inspector/quad'
import QuadNumberInput from './inspector/QuadNumberInput.vue'
import ShadowConfig from './inspector/ShadowConfig.vue'
import SliderNumberInput from './inspector/SliderNumberInput.vue'
import { createPageBackgroundCssVars } from './page-background'
import { getFileAccessHttpUrl } from './shims/file-url'
import { buildUUID } from './shims/uuid'

function mount(component: Component, props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(component, props) })
  app.mount(host)
  return { app, host }
}

describe('decoration field wiring', () => {
  it('resolves every global-config field through the decoration field map', () => {
    const map = createDecorationFieldComponentMap()
    const fields = createDecorationGlobalConfigSchema().sections.flatMap(section => section.fields)

    expect(fields.map(field => field.component)).toEqual([
      'ColorField',
      'ImageSourceField',
      'BackgroundImageModeField',
      'BackgroundColorConfig',
    ])

    for (const field of fields) {
      expect(typeof field.component).toBe('string')
      expect(map[field.component as string]).toBeDefined()
    }
  })

  it('resolves every custom field the common material wrapper injects', () => {
    const map = createDecorationFieldComponentMap()

    for (const name of [
      'SliderNumberInput',
      'QuadNumberInput',
      'ShadowConfig',
      'BackgroundColorConfig',
      'BackgroundImageModeField',
      'ImageSourceField',
    ]) {
      expect(map[name]).toBeDefined()
    }
  })

  it('provides the stock ant-design fields the material inspectors rely on', () => {
    const map = createDecorationFieldComponentMap()

    for (const name of ['Input', 'InputNumber', 'Select', 'Switch', 'RadioGroup', 'CheckboxGroup', 'Textarea']) {
      expect(map[name]).toBeDefined()
    }
  })

  it('creates a designer with an empty registry and the decoration field map', () => {
    const designer = createDecorationDesigner()

    expect(designer.exportSchema()?.nodes).toEqual([])
  })
})

describe('decoration inspector fields mount with realistic values', () => {
  const cases: Array<[string, Component, Record<string, unknown>]> = [
    ['SliderNumberInput', SliderNumberInput, { value: 24, min: 0, max: 100 }],
    ['QuadNumberInput linked', QuadNumberInput, { value: { top: 8, right: 8, bottom: 8, left: 8 } }],
    [
      'QuadNumberInput individual',
      QuadNumberInput,
      { value: { top: 1, right: 2, bottom: 3, left: 4 }, kind: 'radius' },
    ],
    ['ShadowConfig', ShadowConfig, { value: '0px 2px 4px 0px #000000' }],
    ['BackgroundColorConfig', BackgroundColorConfig, { value: normalizeDiyV2BackgroundColor(undefined) }],
    ['BackgroundImageModeField', BackgroundImageModeField, { value: 'cover' }],
    ['ImageSourceField', ImageSourceField, { value: 'https://example.com/a.png' }],
    ['ColorField', ColorField, { value: '#475AF6' }],
  ]

  it.each(cases)('%s renders without throwing', (_name, component, props) => {
    const { app, host } = mount(component, props)

    expect(host.innerHTML.length).toBeGreaterThan(0)

    app.unmount()
  })

  it('renders one radio option per background image mode', () => {
    const { app, host } = mount(BackgroundImageModeField, { value: 'cover' })

    expect(host.querySelectorAll('input[type="radio"]')).toHaveLength(5)

    app.unmount()
  })

  it('renders one colour control per gradient stop', () => {
    const value = normalizeDiyV2BackgroundColor({
      direction: 'horizontal',
      stops: [
        { id: 'a', color: '#FF0000', percent: 0 },
        { id: 'b', color: '#0000FF', percent: 100 },
      ],
    })
    const { app, host } = mount(BackgroundColorConfig, { value })

    expect(host.querySelectorAll('input[type="color"]')).toHaveLength(2)

    app.unmount()
  })
})

describe('decoration quad conversion', () => {
  it('round-trips a css shorthand through the quad object', () => {
    expect(parseDiyV2CssQuad('0px')).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(serializeDiyV2CssQuad(parseDiyV2CssQuad('12px'))).toBe('12px')
    expect(serializeDiyV2CssQuad({ top: 1, right: 2, bottom: 3, left: 2 })).toBe('1px 2px 3px')
    expect(serializeDiyV2CssQuad({ top: 1, right: 2, bottom: 3, left: 4 })).toBe('1px 2px 3px 4px')
  })

  it('clamps out-of-range edges rather than trusting the schema', () => {
    expect(parseDiyV2CssQuad('999px')).toEqual({ top: 100, right: 100, bottom: 100, left: 100 })
  })
})

describe('decoration background model', () => {
  it('keeps a structured background object intact through normalization', () => {
    const normalized = normalizeDiyV2BackgroundConfig({
      image: ' https://example.com/bg.png ',
      imageMode: 'top',
      color: { direction: 'horizontal', stops: [{ id: 's', color: '#123456', percent: 40 }] },
    })

    expect(normalized).toEqual({
      image: 'https://example.com/bg.png',
      imageMode: 'top',
      color: { direction: 'horizontal', stops: [{ id: 's', color: '#123456', percent: 40 }] },
    })
  })

  it('falls back to the default mode and a transparent config for garbage input', () => {
    expect(normalizeDiyV2BackgroundConfig(undefined).imageMode).toBe('cover')
    expect(normalizeDiyV2BackgroundConfig({ imageMode: 'nope' }).imageMode).toBe('cover')
    expect(createTransparentDiyV2BackgroundConfig().color.stops[0].color).toBe('transparent')
  })

  it('translates the structured config into real css, since node-host passes it through raw', () => {
    const style = createDiyV2BackgroundStyle(
      normalizeDiyV2BackgroundConfig({
        image: 'https://example.com/bg.png',
        imageMode: 'cover',
        color: {
          direction: 'vertical',
          stops: [
            { id: 'a', color: '#FF0000', percent: 0 },
            { id: 'b', color: '#0000FF', percent: 100 },
          ],
        },
      }),
    )

    expect(style.backgroundColor).toBe('#FF0000')
    expect(style.backgroundImage).toContain('url("https://example.com/bg.png")')
    expect(style.backgroundImage).toContain('linear-gradient(to bottom, #FF0000 0%, #0000FF 100%)')
    expect(style.backgroundSize).toContain('cover')
  })
})

describe('decoration shims', () => {
  it('produces distinct uuids', () => {
    expect(buildUUID()).not.toBe(buildUUID())
  })

  it('passes an already-usable image url through unchanged', () => {
    expect(getFileAccessHttpUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(getFileAccessHttpUrl(undefined)).toBe('')
  })
})

describe('page background css variables', () => {
  it('translates the global background value into canvas css variables', () => {
    const vars = createPageBackgroundCssVars({
      image: 'https://example.com/bg.png',
      imageMode: 'top',
      color: { direction: 'horizontal', stops: [{ id: 's', color: '#123456', percent: 40 }] },
    })

    expect(vars['--dc-internal-page-background-color']).toBe('#123456')
    expect(vars['--dc-internal-page-background-image']).toContain('url("https://example.com/bg.png")')
    expect(vars['--dc-internal-page-background-position']).toContain('center top')
    expect(vars['--dc-internal-page-background-size']).toContain('contain')
  })

  it('turns a multi stop colour into a gradient layer', () => {
    const vars = createPageBackgroundCssVars({
      image: '',
      imageMode: 'cover',
      color: {
        direction: 'vertical',
        stops: [
          { id: 'a', color: '#FF0000', percent: 0 },
          { id: 'b', color: '#0000FF', percent: 100 },
        ],
      },
    })

    expect(vars['--dc-internal-page-background-color']).toBe('#FF0000')
    expect(vars['--dc-internal-page-background-image']).toBe(
      'linear-gradient(to bottom, #FF0000 0%, #0000FF 100%)',
    )
  })

  // 空画布用的是 createEmptyDocumentSchema 的默认背景；缺值/垃圾值也必须落到同一个默认
  it('falls back to the default white page background for missing or garbage input', () => {
    for (const input of [undefined, null, {}, 'nope', 42]) {
      const vars = createPageBackgroundCssVars(input)
      expect(vars['--dc-internal-page-background-color']).toBe('#FFFFFF')
      expect(vars['--dc-internal-page-background-image']).toBe('none')
    }
  })
})
