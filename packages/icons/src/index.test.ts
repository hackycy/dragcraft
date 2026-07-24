import { describe, expect, it } from 'vitest'
import { IconCenter, IconChevronDown, IconClose, IconComponent, IconFit, IconGlobalConfig, IconHand, IconMinus, IconPanelLeft, IconPanelRight, IconPhone, IconPointer, IconProperties, IconSearch, IconSettings } from './index'

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

  it('exports workbench control icons', () => {
    const icons = [IconPanelLeft, IconPanelRight, IconChevronDown, IconSearch, IconClose, IconSettings, IconComponent, IconGlobalConfig, IconProperties, IconPointer, IconHand, IconCenter, IconMinus, IconFit]

    for (const icon of icons)
      expect(icon().type).toBe('svg')
  })
})
