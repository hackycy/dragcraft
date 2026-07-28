import type { DeviceFrameDefinition, DeviceFrameGroup, DeviceFrameViewport } from './types'
import { IconDesktop, IconLaptop, IconPhone, IconRobot } from '@dragcraft/icons'
import AndroidContainerShell from './components/shells/AndroidContainerShell'
import AndroidWaterdropContainerShell from './components/shells/AndroidWaterdropContainerShell'
import DesktopContainerShell from './components/shells/DesktopContainerShell'
import IPhone8ContainerShell from './components/shells/IPhone8ContainerShell'
import IPhoneContainerShell from './components/shells/IPhoneContainerShell'
import IPhoneXContainerShell from './components/shells/IPhoneXContainerShell'
import TabletContainerShell from './components/shells/TabletContainerShell'

const IPHONE_GROUP: DeviceFrameGroup = Object.freeze({
  id: 'iphone',
  label: 'iPhone',
  labelKey: 'device.groups.iphone',
})

const ANDROID_GROUP: DeviceFrameGroup = Object.freeze({
  id: 'android',
  label: 'Android',
  labelKey: 'device.groups.android',
})

const OTHER_GROUP: DeviceFrameGroup = Object.freeze({
  id: 'other',
  label: 'Other',
  labelKey: 'device.groups.other',
})

function viewport(width: number, height: number): DeviceFrameViewport {
  return Object.freeze({ width, height })
}

export const IPHONE_DEVICE_FRAME: DeviceFrameDefinition = Object.freeze({
  id: 'iphone',
  label: 'iPhone 15 Pro',
  labelKey: 'device.iphone',
  icon: IconPhone,
  group: IPHONE_GROUP,
  viewport: viewport(393, 852),
  containerShell: IPhoneContainerShell,
})

export const IPHONE_X_DEVICE_FRAME: DeviceFrameDefinition = Object.freeze({
  id: 'iphone-x',
  label: 'iPhone X',
  labelKey: 'device.iphoneX',
  icon: IconPhone,
  group: IPHONE_GROUP,
  viewport: viewport(375, 812),
  containerShell: IPhoneXContainerShell,
})

export const IPHONE_8_DEVICE_FRAME: DeviceFrameDefinition = Object.freeze({
  id: 'iphone-8',
  label: 'iPhone 8',
  labelKey: 'device.iphone8',
  icon: IconPhone,
  group: IPHONE_GROUP,
  viewport: viewport(375, 667),
  containerShell: IPhone8ContainerShell,
})

export const ANDROID_DEVICE_FRAME: DeviceFrameDefinition = Object.freeze({
  id: 'android',
  label: 'Android',
  labelKey: 'device.android',
  icon: IconRobot,
  group: ANDROID_GROUP,
  viewport: viewport(360, 720),
  containerShell: AndroidContainerShell,
})

export const ANDROID_WATERDROP_DEVICE_FRAME: DeviceFrameDefinition = Object.freeze({
  id: 'android-waterdrop',
  label: 'Android Waterdrop',
  labelKey: 'device.androidWaterdrop',
  icon: IconRobot,
  group: ANDROID_GROUP,
  viewport: viewport(360, 720),
  containerShell: AndroidWaterdropContainerShell,
})

export const TABLET_DEVICE_FRAME: DeviceFrameDefinition = Object.freeze({
  id: 'tablet',
  label: 'Tablet',
  labelKey: 'device.tablet',
  icon: IconLaptop,
  group: OTHER_GROUP,
  viewport: viewport(768, 1024),
  containerShell: TabletContainerShell,
})

export const DESKTOP_DEVICE_FRAME: DeviceFrameDefinition = Object.freeze({
  id: 'desktop',
  label: 'Desktop',
  labelKey: 'device.desktop',
  icon: IconDesktop,
  group: OTHER_GROUP,
  viewport: viewport(1280, 800),
  containerShell: DesktopContainerShell,
})

export const BUILT_IN_DEVICE_FRAMES: readonly DeviceFrameDefinition[] = Object.freeze([
  IPHONE_DEVICE_FRAME,
  IPHONE_X_DEVICE_FRAME,
  IPHONE_8_DEVICE_FRAME,
  ANDROID_DEVICE_FRAME,
  ANDROID_WATERDROP_DEVICE_FRAME,
  TABLET_DEVICE_FRAME,
  DESKTOP_DEVICE_FRAME,
])
