import { widgetGroups } from '@dragcraft/widgets'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import DcMaterialGroup from './DcMaterialGroup'

export default defineComponent({
  name: 'DcMaterialPanel',

  setup() {
    const ctx = useDesignerContext()
    const { engine, searchQuery } = ctx

    // Filter widgets by search query, grouped by widget group
    const filteredGroups = computed(() => {
      const allWidgets = engine.registry.getAllWidgets()
      const query = searchQuery.value.toLowerCase().trim()

      return widgetGroups
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
            placeholder: '搜索组件...',
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
              title: group.title,
              widgets: group.widgets,
            }),
          ),
        ),
      ])
  },
})
