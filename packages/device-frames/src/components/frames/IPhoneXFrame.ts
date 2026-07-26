import { createPhoneFrame } from './phone-frame'

/** iPhone X frame with wide notch system chrome. */
export default createPhoneFrame({
  name: 'DcIPhoneXFrame',
  modifierClass: 'dc-device-frame--iphone-x',
  statusBar: 'iphone-notch',
  navigation: 'home-indicator',
})
