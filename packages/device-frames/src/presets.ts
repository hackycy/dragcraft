import type { DevicePreset } from './types'
import { IconDesktop, IconLaptop, IconPhone, IconRobot } from '@dragcraft/icons'
import AndroidFrame from './components/frames/AndroidFrame'
import DesktopFrame from './components/frames/DesktopFrame'
import IPhoneFrame from './components/frames/IPhoneFrame'
import TabletFrame from './components/frames/TabletFrame'

export const IPHONE_PRESET: DevicePreset = {
  type: 'iphone',
  label: 'iPhone',
  icon: IconPhone,
  width: 375,
  height: 812,
  frameComponent: IPhoneFrame,
}

export const ANDROID_PRESET: DevicePreset = {
  type: 'android',
  label: 'Android',
  icon: IconRobot,
  width: 360,
  height: 800,
  frameComponent: AndroidFrame,
}

export const TABLET_PRESET: DevicePreset = {
  type: 'tablet',
  label: 'Tablet',
  icon: IconLaptop,
  width: 768,
  height: 1024,
  frameComponent: TabletFrame,
}

export const DESKTOP_PRESET: DevicePreset = {
  type: 'desktop',
  label: 'Desktop',
  icon: IconDesktop,
  width: 1280,
  height: 800,
  frameComponent: DesktopFrame,
}

/**
 * Returns the built-in device presets: iPhone, Android, Tablet, Desktop.
 */
export function getDefaultPresets(): DevicePreset[] {
  return [IPHONE_PRESET, ANDROID_PRESET, TABLET_PRESET, DESKTOP_PRESET]
}
