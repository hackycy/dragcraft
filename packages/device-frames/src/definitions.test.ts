import { describe, expect, it } from 'vitest'
import {
  ANDROID_DEVICE_FRAME,
  ANDROID_WATERDROP_DEVICE_FRAME,
  BUILT_IN_DEVICE_FRAMES,
  DESKTOP_DEVICE_FRAME,
  IPHONE_8_DEVICE_FRAME,
  IPHONE_DEVICE_FRAME,
  IPHONE_X_DEVICE_FRAME,
  TABLET_DEVICE_FRAME,
} from './definitions'

const EXPORTED_DEFINITIONS = [
  IPHONE_DEVICE_FRAME,
  IPHONE_X_DEVICE_FRAME,
  IPHONE_8_DEVICE_FRAME,
  ANDROID_DEVICE_FRAME,
  ANDROID_WATERDROP_DEVICE_FRAME,
  TABLET_DEVICE_FRAME,
  DESKTOP_DEVICE_FRAME,
] as const

describe('built-in Device Frame Definitions', () => {
  it('publishes valid definitions in documented display order', () => {
    expect(BUILT_IN_DEVICE_FRAMES.map(definition => [
      definition.id,
      definition.viewport.width,
      definition.viewport.height,
    ])).toEqual([
      ['iphone', 393, 852],
      ['iphone-x', 375, 812],
      ['iphone-8', 375, 667],
      ['android', 360, 720],
      ['android-waterdrop', 360, 720],
      ['tablet', 768, 1024],
      ['desktop', 1280, 800],
    ])

    const ids = BUILT_IN_DEVICE_FRAMES.map(definition => definition.id)
    expect(ids.every(id => id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    expect(BUILT_IN_DEVICE_FRAMES.every(definition =>
      Number.isFinite(definition.viewport.width)
      && definition.viewport.width > 0
      && Number.isFinite(definition.viewport.height)
      && definition.viewport.height > 0
      && definition.containerShell !== undefined,
    )).toBe(true)
  })

  it('keeps definitions, viewport metadata, and collection references stable and readonly', () => {
    expect(BUILT_IN_DEVICE_FRAMES).toEqual(EXPORTED_DEFINITIONS)
    BUILT_IN_DEVICE_FRAMES.forEach((definition, index) => {
      expect(definition).toBe(EXPORTED_DEFINITIONS[index])
      expect(Object.isFrozen(definition)).toBe(true)
      expect(Object.isFrozen(definition.viewport)).toBe(true)
    })
    expect(Object.isFrozen(BUILT_IN_DEVICE_FRAMES)).toBe(true)
  })
})
