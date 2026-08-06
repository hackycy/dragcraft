import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcRegionRecovery',
  props: {
    containerId: { type: String, required: true },
    regionId: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () => h('div', {
      'data-dc-component': 'presentation-recovery',
      'data-dc-container-id': props.containerId,
      'data-dc-presentation-diagnostic': 'REGION_OUTLET_MISSING',
      'data-dc-recovery-region': props.regionId,
    }, slots.default?.())
  },
})
