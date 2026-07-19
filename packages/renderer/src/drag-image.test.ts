// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hideNativeDragImage } from './drag-image'

describe('hideNativeDragImage', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('uses a mounted transparent element for the native drag image', () => {
    const dataTransfer = { setDragImage: vi.fn() } as unknown as DataTransfer

    hideNativeDragImage(dataTransfer)

    const element = document.querySelector('[data-dc-transparent-drag-image]')
    expect(element).toBeInstanceOf(HTMLElement)
    expect(dataTransfer.setDragImage).toHaveBeenCalledWith(element, 0, 0)
  })
})
