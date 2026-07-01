import { describe, expect, it } from 'vitest'
import { IconPhone } from './index'

describe('icons exports', () => {
  it('exports icon render functions with svg vnode output', () => {
    const vnode = IconPhone({ size: 24, color: '#111111', class: 'phone-icon' })

    expect(vnode.type).toBe('svg')
    expect(vnode.props).toMatchObject({
      width: 24,
      height: 24,
      stroke: '#111111',
      class: 'phone-icon',
    })
  })
})
