import { createPhoneFrame } from './phone-frame'

/** iPhone 8 frame with classic pre-notch iOS status chrome. */
export default createPhoneFrame({
  name: 'DcIPhone8Frame',
  modifierClass: 'dc-device-frame--iphone-8',
  statusBar: 'iphone-classic',
})
