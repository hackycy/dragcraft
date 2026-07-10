// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { centerCanvasTarget } from './DcCanvas'

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }
}

describe('centerCanvasTarget', () => {
  it('centers an oversized frame on both axes', () => {
    const viewport = document.createElement('div')
    const target = document.createElement('div')
    viewport.scrollLeft = 0
    viewport.scrollTop = 24
    viewport.getBoundingClientRect = vi.fn(() => rect(100, 50, 600, 500))
    target.getBoundingClientRect = vi.fn(() => rect(50, 74, 1280, 842))

    centerCanvasTarget(viewport, target)

    expect(viewport.scrollLeft).toBe(290)
    expect(viewport.scrollTop).toBe(219)
  })

  it('centers a smaller frame on both axes', () => {
    const viewport = document.createElement('div')
    const target = document.createElement('div')
    viewport.scrollLeft = 200
    viewport.scrollTop = 200
    viewport.getBoundingClientRect = vi.fn(() => rect(0, 0, 800, 700))
    target.getBoundingClientRect = vi.fn(() => rect(100, 80, 400, 300))

    centerCanvasTarget(viewport, target)

    expect(viewport.scrollLeft).toBe(100)
    expect(viewport.scrollTop).toBe(80)
  })
})
