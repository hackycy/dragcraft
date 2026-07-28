import type { VNode, VNodeChild } from 'vue'
import type { AndroidNavigationIcon } from '../frames/system-icons'
import { defineComponent, h } from 'vue'
import { renderAndroidNavigationIcon, renderHomeIndicator, renderSystemBattery, renderSystemCellular, renderSystemWifi, renderWaterdropCamera } from '../frames/system-icons'
import { renderCanvasViewport, renderDeviceContainerShell } from './device-container-shell'

type PhoneStatusBar
  = 'iphone-dynamic-island'
    | 'iphone-notch'
    | 'iphone-classic'
    | 'android-standard'
    | 'android-waterdrop'

type PhoneNavigation
  = 'home-indicator'
    | 'android-standard'
    | 'android-waterdrop'

interface PhoneContainerShellProfile {
  name: string
  modifierClass: string
  statusBar: PhoneStatusBar
  navigation?: PhoneNavigation
}

function renderIPhoneStatusIcons(): VNode {
  return h('span', { class: 'dc-device-frame__status-icons dc-phone-status__trailing' }, [
    renderSystemCellular('ios-modern'),
    renderSystemWifi('ios-modern'),
    renderSystemBattery('ios-modern'),
  ])
}

function renderIPhoneCutoutStatusBar(kind: 'dynamic-island' | 'notch'): VNode {
  return h('div', {
    class: `dc-device-frame__status-bar dc-phone-status dc-phone-status--${kind}`,
  }, [
    h('span', { class: 'dc-device-frame__status-time dc-phone-status__leading' }, '9:41'),
    h('div', {
      'class': `dc-device-frame__notch dc-device-frame__notch--${kind}`,
      'data-dc-phone-cutout': kind,
      'aria-hidden': 'true',
    }),
    renderIPhoneStatusIcons(),
  ])
}

function renderClassicIPhoneStatusBar(): VNode {
  return h('div', {
    class: 'dc-device-frame__status-bar dc-phone-status dc-phone-status--classic-ios',
  }, [
    h('span', { class: 'dc-device-frame__status-icons dc-phone-status__leading' }, [
      renderSystemCellular('ios-classic'),
      h('span', { class: 'dc-phone-status__carrier' }, 'Carrier'),
      renderSystemWifi('ios-classic'),
    ]),
    h('span', { class: 'dc-device-frame__status-time' }, '9:41'),
    h('span', { class: 'dc-device-frame__status-icons dc-phone-status__trailing' }, [
      h('span', { class: 'dc-phone-status__battery-percent' }, '100%'),
      renderSystemBattery('ios-classic'),
    ]),
  ])
}

function renderAndroidStatusIcons(): VNode {
  return h('span', { class: 'dc-device-frame__status-icons dc-phone-status__trailing' }, [
    renderSystemWifi('android'),
    renderSystemCellular('android'),
    renderSystemBattery('android'),
  ])
}

function renderAndroidStatusBar(waterdrop: boolean): VNode {
  return h('div', {
    class: [
      'dc-device-frame__status-bar',
      'dc-phone-status',
      waterdrop ? 'dc-phone-status--waterdrop' : 'dc-phone-status--android',
    ],
  }, [
    h('span', { class: 'dc-device-frame__status-time dc-phone-status__leading' }, '12:00'),
    waterdrop
      ? h('div', {
          'class': 'dc-device-frame__notch dc-device-frame__notch--waterdrop',
          'data-dc-phone-cutout': 'waterdrop',
          'aria-hidden': 'true',
        }, [renderWaterdropCamera()])
      : null,
    renderAndroidStatusIcons(),
  ])
}

function renderStatusBar(statusBar: PhoneStatusBar): VNode {
  switch (statusBar) {
    case 'iphone-dynamic-island':
      return renderIPhoneCutoutStatusBar('dynamic-island')
    case 'iphone-notch':
      return renderIPhoneCutoutStatusBar('notch')
    case 'iphone-classic':
      return renderClassicIPhoneStatusBar()
    case 'android-waterdrop':
      return renderAndroidStatusBar(true)
    default:
      return renderAndroidStatusBar(false)
  }
}

function renderAndroidNavigation(navigation: 'android-standard' | 'android-waterdrop'): VNode {
  const icons: AndroidNavigationIcon[] = ['back', 'home', 'recent']

  return h('div', {
    'class': `dc-device-frame__nav-bar dc-device-frame__nav-bar--${navigation}`,
    'aria-hidden': 'true',
  }, icons.map(icon => h('span', {
    class: 'dc-device-frame__nav-btn',
    key: icon,
  }, [renderAndroidNavigationIcon(icon)])))
}

function renderNavigation(navigation: PhoneNavigation | undefined): VNodeChild {
  if (navigation === 'home-indicator')
    return renderHomeIndicator()
  if (navigation === 'android-standard' || navigation === 'android-waterdrop')
    return renderAndroidNavigation(navigation)
  return null
}

export function createPhoneContainerShell(profile: PhoneContainerShellProfile) {
  return defineComponent({
    name: profile.name,

    setup(_, { slots }) {
      return () => renderDeviceContainerShell(profile.modifierClass, [
        renderStatusBar(profile.statusBar),
        renderCanvasViewport(slots.default?.()),
        renderNavigation(profile.navigation),
      ])
    },
  })
}
