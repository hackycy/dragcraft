import { defineComponent, h, inject, onBeforeUnmount } from 'vue'
import { PRESENTATION_DIAGNOSTIC_REGISTRY_KEY } from '../presentation-diagnostics'

export default defineComponent({
  name: 'DcRegionRecovery',
  props: {
    containerId: { type: String, required: true },
    regionId: { type: String, required: true },
  },
  setup(props, { slots }) {
    const diagnostics = inject(PRESENTATION_DIAGNOSTIC_REGISTRY_KEY)
    const unregister = diagnostics?.register({
      code: 'REGION_OUTLET_MISSING',
      containerId: props.containerId,
      regionId: props.regionId,
    })
    onBeforeUnmount(() => unregister?.())
    return () => h('div', {
      'data-dc-component': 'presentation-recovery',
      'data-dc-container-id': props.containerId,
      'data-dc-presentation-diagnostic': 'REGION_OUTLET_MISSING',
      'data-dc-recovery-region': props.regionId,
    }, slots.default?.())
  },
})
