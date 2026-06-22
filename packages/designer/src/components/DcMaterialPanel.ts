import { useI18n } from '@dragcraft/utils'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import DcMaterialGroup from './DcMaterialGroup'

export default defineComponent({
  name: 'DcMaterialPanel',

  setup() {
    const ctx = useDesignerContext()
    const { t } = useI18n()
    const { engine, searchQuery, widgetGroups } = ctx

    // Filter widgets by search query, grouped by widget group
    const filteredGroups = computed(() => {
      const allWidgets = engine.registry.getAllWidgets()
      const query = searchQuery.value.toLowerCase().trim()

      // Use provided widget groups, or derive from registered widgets
      const groups = widgetGroups
        ?? [...new Set(allWidgets.map(w => w.group))].map(name => ({ name, title: name, titleKey: undefined }))

      return groups
        .map((group) => {
          const widgets = allWidgets.filter(w => w.group === group.name)
          const filtered = query
            ? widgets.filter(w =>
                w.title.toLowerCase().includes(query)
                || w.type.toLowerCase().includes(query),
              )
            : widgets
          return { ...group, widgets: filtered }
        })
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
