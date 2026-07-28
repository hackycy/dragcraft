import { defineComponent, h } from 'vue'
import { renderSystemBattery, renderSystemWifi } from '../frames/system-icons'
import { renderCanvasViewport, renderDeviceContainerShell } from './device-container-shell'

export default defineComponent({
  name: 'DcTabletContainerShell',

  setup(_, { slots }) {
    return () => renderDeviceContainerShell('dc-device-frame--tablet', [
      h('div', { class: 'dc-device-frame__status-bar' }, [
        h('span', { class: 'dc-device-frame__status-time' }, '9:41'),
        h('span', { class: 'dc-device-frame__status-icons' }, [
          renderSystemWifi('ios-modern'),
          renderSystemBattery('ios-modern'),
        ]),
      ]),
      renderCanvasViewport(slots.default?.()),
    ])
  },
})
