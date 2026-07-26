import { createPhoneFrame } from './phone-frame'

/** Generic Android frame with a standard status bar. */
export default createPhoneFrame({
  name: 'DcAndroidFrame',
  modifierClass: 'dc-device-frame--android',
  statusBar: 'android-standard',
  navigation: 'android-standard',
})
