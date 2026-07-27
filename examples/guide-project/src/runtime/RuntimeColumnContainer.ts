import type { PropType } from 'vue'
import type { RuntimeRegions } from './RuntimePage'
import { defineComponent, h } from 'vue'

// #region tutorial-runtime-container
export const RuntimeColumnContainer = defineComponent({
  name: 'GuideRuntimeColumnContainer',
  props: {
    variant: { type: String, default: 'single' },
    regions: {
      type: Object as PropType<RuntimeRegions>,
      required: true,
    },
  },
  setup(props) {
    const renderRegion = (regionId: string) => h('section', {
      class: 'guide-runtime-column-container__region',
    }, props.regions[regionId] ?? [])

    return () => props.variant === 'split'
      ? h('div', { class: 'guide-runtime-column-container guide-runtime-column-container--split' }, [
          renderRegion('left'),
          renderRegion('right'),
        ])
      : h('div', { class: 'guide-runtime-column-container' }, [
          renderRegion('content'),
        ])
  },
})
// #endregion tutorial-runtime-container
