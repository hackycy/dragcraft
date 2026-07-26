import { createPhoneFrame } from './phone-frame'

/** Android frame based on a Galaxy A50-era waterdrop status bar. */
export default createPhoneFrame({
  name: 'DcAndroidWaterdropFrame',
  modifierClass: 'dc-device-frame--android-waterdrop',
  statusBar: 'android-waterdrop',
  navigation: 'android-waterdrop',
})
