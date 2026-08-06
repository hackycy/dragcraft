import type { PropType } from 'vue'
import type { MaterialDefinition } from '../materials/types'
import { IconChevronDown } from '@dragcraft/icons'
import { defineComponent, h, ref } from 'vue'
import DcMaterialItem from './DcMaterialItem'

export default defineComponent({
  name: 'DcMaterialGroup',
  props: {
    materials: { type: Array as PropType<readonly MaterialDefinition[]>, required: true },
    title: { type: String, required: true },
  },
  setup(props) {
    const collapsed = ref(false)
    return () => h('div', {
      'class': ['dc-material-group', { 'dc-material-group--collapsed': collapsed.value }],
      'data-dc-component': 'material-group',
      'data-dc-state': collapsed.value ? 'collapsed' : 'expanded',
    }, [
      h('button', {
        'type': 'button',
        'class': 'dc-material-group__header',
        'data-dc-part': 'header',
        'aria-expanded': !collapsed.value,
        'onClick': () => { collapsed.value = !collapsed.value },
      }, [
        h('span', { 'class': 'dc-material-group__title', 'data-dc-part': 'title' }, props.title),
        h('span', { 'class': 'dc-material-group__toggle', 'data-dc-part': 'toggle' }, [h(IconChevronDown, { size: 15 })]),
      ]),
      collapsed.value
        ? null
        : h('div', { 'class': 'dc-material-group__body', 'data-dc-part': 'body' }, props.materials.map(material => h(DcMaterialItem, {
            key: material.type,
            material,
          }))),
    ])
  },
})
