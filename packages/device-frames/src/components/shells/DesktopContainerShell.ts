import { defineComponent, h } from 'vue'
import { renderCanvasViewport, renderDeviceContainerShell } from './device-container-shell'

export default defineComponent({
  name: 'DcDesktopContainerShell',

  setup(_, { slots }) {
    return () => renderDeviceContainerShell('dc-device-frame--desktop', [
      h('div', { class: 'dc-device-frame__title-bar' }, [
        h('div', { class: 'dc-device-frame__traffic-lights' }, [
          h('span', { class: 'dc-device-frame__traffic-dot dc-device-frame__traffic-dot--close' }),
          h('span', { class: 'dc-device-frame__traffic-dot dc-device-frame__traffic-dot--minimize' }),
          h('span', { class: 'dc-device-frame__traffic-dot dc-device-frame__traffic-dot--maximize' }),
        ]),
        h('div', { class: 'dc-device-frame__url-bar' }, 'localhost:5173'),
      ]),
      renderCanvasViewport(slots.default?.()),
    ])
  },
})
