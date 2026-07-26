// @vitest-environment happy-dom
import type { Component } from 'vue'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AndroidFrame from './AndroidFrame'
import AndroidWaterdropFrame from './AndroidWaterdropFrame'
import IPhone8Frame from './IPhone8Frame'
import IPhoneFrame from './IPhoneFrame'
import IPhoneXFrame from './IPhoneXFrame'
import TabletFrame from './TabletFrame'

interface FrameExpectation {
  component: Component
  modifier: string
  statusStyle: string
  cutout?: string
  navigation?: string[]
}

const frames: FrameExpectation[] = [
  {
    component: IPhoneFrame,
    modifier: 'dc-device-frame--iphone',
    statusStyle: 'ios-modern',
    cutout: 'dynamic-island',
    navigation: ['home-indicator'],
  },
  {
    component: IPhoneXFrame,
    modifier: 'dc-device-frame--iphone-x',
    statusStyle: 'ios-modern',
    cutout: 'notch',
    navigation: ['home-indicator'],
  },
  {
    component: IPhone8Frame,
    modifier: 'dc-device-frame--iphone-8',
    statusStyle: 'ios-classic',
  },
  {
    component: AndroidFrame,
    modifier: 'dc-device-frame--android',
    statusStyle: 'android',
    navigation: ['back', 'home', 'recent'],
  },
  {
    component: AndroidWaterdropFrame,
    modifier: 'dc-device-frame--android-waterdrop',
    statusStyle: 'android',
    cutout: 'waterdrop',
    navigation: ['back', 'home', 'recent'],
  },
]

describe('phone frames', () => {
  it.each(frames)('renders $modifier system chrome', ({ component, modifier, statusStyle, cutout, navigation }) => {
    const wrapper = mount(component)

    expect(wrapper.classes()).toContain(modifier)
    expect(wrapper.find('.dc-device-frame__status-bar').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__viewport').exists()).toBe(true)
    const statusIcons = wrapper.findAll('[data-dc-status-icon]')
    expect(statusIcons.map(icon => icon.attributes('data-dc-status-icon'))).toEqual([
      modifier === 'dc-device-frame--iphone-8' ? 'cellular' : modifier.includes('android') ? 'wifi' : 'cellular',
      modifier === 'dc-device-frame--iphone-8' ? 'wifi' : modifier.includes('android') ? 'cellular' : 'wifi',
      'battery',
    ])
    expect(statusIcons.every(icon => icon.element.tagName.toLowerCase() === 'svg')).toBe(true)
    expect(statusIcons.every(icon => icon.attributes('data-dc-status-style') === statusStyle)).toBe(true)

    if (cutout)
      expect(wrapper.get('[data-dc-phone-cutout]').attributes('data-dc-phone-cutout')).toBe(cutout)
    else
      expect(wrapper.find('[data-dc-phone-cutout]').exists()).toBe(false)

    const navigationIcons = wrapper.findAll('[data-dc-system-navigation]')
    const renderedNavigation = navigationIcons.map(item =>
      item.attributes('data-dc-system-navigation'),
    )
    expect(renderedNavigation).toEqual(navigation ?? [])
    expect(navigationIcons.every(icon => icon.element.tagName.toLowerCase() === 'svg')).toBe(true)

    for (const icon of navigationIcons.filter(icon => icon.classes().includes('dc-device-frame__nav-icon'))) {
      expect(icon.attributes('viewBox')).toBe('0 0 20 20')
      expect(icon.attributes('stroke-width')).toBe('1.6')
    }
  })

  it('renders the tablet status bar with dedicated SVG system icons', () => {
    const wrapper = mount(TabletFrame)
    const statusIcons = wrapper.findAll('[data-dc-status-icon]')

    expect(statusIcons.map(icon => icon.attributes('data-dc-status-icon'))).toEqual(['wifi', 'battery'])
    expect(statusIcons.every(icon => icon.element.tagName.toLowerCase() === 'svg')).toBe(true)
    expect(statusIcons.every(icon => icon.attributes('data-dc-status-style') === 'ios-modern')).toBe(true)
  })

  it('keeps the iPhone 8 status bar in the classic three-column layout', () => {
    const wrapper = mount(IPhone8Frame)

    expect(wrapper.find('.dc-phone-status__leading').text()).toContain('Carrier')
    expect(wrapper.find('.dc-device-frame__status-time').text()).toBe('9:41')
    expect(wrapper.find('.dc-phone-status__battery-percent').text()).toBe('100%')
    expect(wrapper.find('.dc-device-frame__home-indicator').exists()).toBe(false)
  })

  it('keeps device dimensions and cutout columns fixed without narrowing viewports', () => {
    const iphoneCss = readFileSync(path.resolve(process.cwd(), 'src/styles/iphone.css'), 'utf8')
    const androidCss = readFileSync(path.resolve(process.cwd(), 'src/styles/android.css'), 'utf8')

    expect(iphoneCss).toContain('grid-template-columns: minmax(0, 1fr) 126px minmax(0, 1fr)')
    expect(iphoneCss).toContain('grid-template-columns: minmax(0, 1fr) 209px minmax(0, 1fr)')
    expect(androidCss).toContain('grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr)')

    for (const [css, selector, height] of [
      [iphoneCss, '.dc-device-frame--iphone .dc-device-frame__viewport', '852px'],
      [iphoneCss, '.dc-device-frame--iphone-x .dc-device-frame__viewport', '812px'],
      [iphoneCss, '.dc-device-frame--iphone-8 .dc-device-frame__viewport', '667px'],
      [androidCss, '.dc-device-frame--android .dc-device-frame__viewport', '720px'],
      [androidCss, '.dc-device-frame--android-waterdrop .dc-device-frame__viewport', '720px'],
    ] as const) {
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rule = css.match(new RegExp(`${escapedSelector}\\s*\\{[^}]*\\}`))?.[0]
      expect(rule).toContain(`height: ${height}`)
      expect(rule).not.toMatch(/padding|inset/)
    }
  })
})
