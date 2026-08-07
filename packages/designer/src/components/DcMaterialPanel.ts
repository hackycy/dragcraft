import type { MaterialDefinition } from '../materials/types'
import { useI18n } from '@dragcraft/i18n'
import { IconClose, IconSearch } from '@dragcraft/icons'
import { DcScrollArea } from '@dragcraft/ui'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import { materialItemMatchesQuery, resolveMaterialItem } from '../material'
import DcMaterialGroup from './DcMaterialGroup'

export default defineComponent({
  name: 'DcMaterialPanel',
  setup() {
    const context = useDesignerContext()
    const { t } = useI18n()
    const filteredGroups = computed(() => {
      const byGroup = new Map<string, MaterialDefinition[]>()
      for (const material of context.catalog.materials) {
        if (!material.panel)
          continue
        const display = resolveMaterialItem(material, t)
        if (!materialItemMatchesQuery(material, display, context.searchQuery.value))
          continue
        const group = material.panel?.group ?? 'default'
        const entries = byGroup.get(group) ?? []
        entries.push(material)
        byGroup.set(group, entries)
      }
      return Array.from(byGroup, ([name, materials]) => ({
        name,
        title: name === 'default' ? t('panel.materials.title', '物料') : t(`group.${name}`, name),
        materials,
      }))
    })
    const onSearch = (event: Event) => {
      context.searchQuery.value = (event.target as HTMLInputElement).value
    }
    return () => h('div', { 'class': 'dc-material-panel', 'data-dc-component': 'material-panel' }, [
      h('div', { 'class': 'dc-material-panel__header', 'data-dc-part': 'header' }, [
        h('h2', { 'class': 'dc-material-panel__heading', 'data-dc-part': 'heading' }, t('panel.materials.title', '物料')),
      ]),
      h('div', { 'class': 'dc-material-panel__search', 'data-dc-part': 'search' }, [
        h('span', { 'class': 'dc-material-panel__search-icon', 'data-dc-part': 'search-icon' }, [h(IconSearch, { size: 15 })]),
        h('input', {
          'class': 'dc-material-panel__search-input',
          'data-dc-part': 'search-input',
          'type': 'text',
          'placeholder': t('panel.search.placeholder', '搜索组件...'),
          'value': context.searchQuery.value,
          'onInput': onSearch,
        }),
        context.searchQuery.value
          ? h('button', {
              'type': 'button',
              'class': 'dc-material-panel__search-clear',
              'data-dc-part': 'search-clear',
              'aria-label': t('panel.search.clear', '清除搜索'),
              'title': t('panel.search.clear', '清除搜索'),
              'onClick': () => { context.searchQuery.value = '' },
            }, [h(IconClose, { size: 14 })])
          : null,
      ]),
      h(DcScrollArea, { 'class': 'dc-material-panel__groups', 'data-dc-part': 'groups' }, {
        default: () => h('div', { class: 'dc-material-panel__groups-content' }, filteredGroups.value.map(group => h(DcMaterialGroup, {
          key: group.name,
          title: group.title,
          materials: group.materials,
        }))),
      }),
    ])
  },
})
