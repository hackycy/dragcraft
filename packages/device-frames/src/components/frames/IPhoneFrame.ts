import { createPhoneFrame } from './phone-frame'

/** iPhone 15 Pro frame with Dynamic Island system chrome. */
export default createPhoneFrame({
  name: 'DcIPhoneFrame',
  modifierClass: 'dc-device-frame--iphone',
  statusBar: 'iphone-dynamic-island',
  navigation: 'home-indicator',
})
