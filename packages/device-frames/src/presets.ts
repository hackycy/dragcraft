import type { DevicePreset } from './types'
import { IconDesktop, IconLaptop, IconPhone, IconRobot } from '@dragcraft/icons'
import AndroidFrame from './components/frames/AndroidFrame'
import AndroidWaterdropFrame from './components/frames/AndroidWaterdropFrame'
import DesktopFrame from './components/frames/DesktopFrame'
import IPhone8Frame from './components/frames/IPhone8Frame'
import IPhoneFrame from './components/frames/IPhoneFrame'
import IPhoneXFrame from './components/frames/IPhoneXFrame'
import TabletFrame from './components/frames/TabletFrame'

export const IPHONE_PRESET: DevicePreset = {
  type: 'iphone',
  label: 'iPhone 15 Pro',
  labelKey: 'device.iphone',
  icon: IconPhone,
  width: 393,
  height: 852,
  frameComponent: IPhoneFrame,
}

export const IPHONE_X_PRESET: DevicePreset = {
  type: 'iphone-x',
  label: 'iPhone X',
  labelKey: 'device.iphoneX',
  icon: IconPhone,
  width: 375,
  height: 812,
  frameComponent: IPhoneXFrame,
}

export const IPHONE_8_PRESET: DevicePreset = {
  type: 'iphone-8',
  label: 'iPhone 8',
  labelKey: 'device.iphone8',
  icon: IconPhone,
  width: 375,
  height: 667,
  frameComponent: IPhone8Frame,
}

export const ANDROID_PRESET: DevicePreset = {
  type: 'android',
  label: 'Android',
  labelKey: 'device.android',
  icon: IconRobot,
  width: 360,
  height: 720,
  frameComponent: AndroidFrame,
}

export const ANDROID_WATERDROP_PRESET: DevicePreset = {
  type: 'android-waterdrop',
  label: 'Android Waterdrop',
  labelKey: 'device.androidWaterdrop',
  icon: IconRobot,
  width: 360,
  height: 720,
  frameComponent: AndroidWaterdropFrame,
}

export const TABLET_PRESET: DevicePreset = {
  type: 'tablet',
  label: 'Tablet',
  labelKey: 'device.tablet',
  icon: IconLaptop,
  width: 768,
  height: 1024,
  frameComponent: TabletFrame,
}

export const DESKTOP_PRESET: DevicePreset = {
  type: 'desktop',
  label: 'Desktop',
  labelKey: 'device.desktop',
  icon: IconDesktop,
  width: 1280,
  height: 800,
  frameComponent: DesktopFrame,
}

/**
 * Returns all built-in device presets in picker display order.
 */
export function getDefaultPresets(): DevicePreset[] {
  return [
    IPHONE_PRESET,
    IPHONE_X_PRESET,
    IPHONE_8_PRESET,
    ANDROID_PRESET,
    ANDROID_WATERDROP_PRESET,
    TABLET_PRESET,
    DESKTOP_PRESET,
  ]
}
