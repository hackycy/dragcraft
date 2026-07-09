import type { DesignerWidgetMeta } from '../types'
import { useI18n } from '@dragcraft/utils'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import { materialItemMatchesQuery, resolveMaterialItem } from '../material'
import DcMaterialGroup from './DcMaterialGroup'

export default defineComponent({
  name: 'DcMaterialPanel',

  setup() {
    const ctx = useDesignerContext()
    const { t } = useI18n()
    const { engine, searchQuery, widgetGroups } = ctx

    // Filter widgets by search query, grouped by widget group
    const filteredGroups = computed(() => {
      const allWidgets = engine.registry.getAllWidgets() as DesignerWidgetMeta[]
      const query = searchQuery.value.toLowerCase().trim()

      // Use provided widget groups, or derive from registered widgets
      const groups = widgetGroups
        ?? [...new Set(allWidgets.map(w => w.group))].map(name => ({ name, title: name, titleKey: undefined }))

      const widgetsByGroup = new Map<string, typeof allWidgets>()
      for (const widget of allWidgets) {
        const material = resolveMaterialItem(widget, t)
        if (!materialItemMatchesQuery(widget, material, query)) {
          continue
        }

        const widgets = widgetsByGroup.get(widget.group)
        if (widgets) {
          widgets.push(widget)
        }
        else {
          widgetsByGroup.set(widget.group, [widget])
        }
      }

      return groups
        .map(group => ({ ...group, widgets: widgetsByGroup.get(group.name) ?? [] }))
        .filter(g => g.widgets.length > 0)
    })

    const handleSearchInput = (e: Event) => {
      searchQuery.value = (e.target as HTMLInputElement).value
    }

    return () =>
      h('div', { class: 'dc-material-panel' }, [
        // Search input
        h('div', { class: 'dc-material-panel__search' }, [
          h('input', {
            type: 'text',
            class: 'dc-material-panel__search-input',
            placeholder: t('panel.search.placeholder', '搜索组件...'),
            value: searchQuery.value,
            onInput: handleSearchInput,
          }),
        ]),
        // Widget groups
        h(
          'div',
          { class: 'dc-material-panel__groups' },
          filteredGroups.value.map(group =>
            h(DcMaterialGroup, {
              key: group.name,
              title: group.titleKey ? t(group.titleKey, group.title) : group.title,
              widgets: group.widgets,
            }),
          ),
        ),
      ])
  },
})
