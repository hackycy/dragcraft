import type { Component } from 'vue'
import type { LeftPanelTabKey } from '../types'
import { IconMaterial, IconStructureTree } from '@dragcraft/icons'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import DcMaterialPanel from './DcMaterialPanel'
import DcStructurePanel from './DcStructurePanel'

interface LeftPanelTab {
  key: LeftPanelTabKey
  labelKey: string
  fallback: string
  icon: Component
}

const LEFT_PANEL_TABS: LeftPanelTab[] = [
  {
    key: 'materials',
    labelKey: 'panel.left.materials',
    fallback: '物料',
    icon: IconMaterial,
  },
  {
    key: 'structure',
    labelKey: 'panel.left.structure',
    fallback: '结构树',
    icon: IconStructureTree,
  },
]

export default defineComponent({
  name: 'DcLeftSidebar',

  setup() {
    const ctx = useDesignerContext()
    const { t } = useI18n()
    const { extensions, leftPanelActiveTab } = ctx

    const renderTabButton = (tab: LeftPanelTab) => {
      const label = t(tab.labelKey, tab.fallback)
      const active = leftPanelActiveTab.value === tab.key

      return h('button', {
        'type': 'button',
        'class': [
          'dc-left-sidebar__tab',
          { 'dc-left-sidebar__tab--active': active },
        ],
        'title': label,
        'aria-label': label,
        'aria-pressed': active,
        'onClick': () => {
          leftPanelActiveTab.value = tab.key
        },
      }, [
        h(tab.icon, { size: 18 }),
      ])
    }

    const renderActivePanel = () => {
      if (leftPanelActiveTab.value === 'structure')
        return h(DcStructurePanel)

      const MaterialPanel = extensions.materialPanelRenderer ?? DcMaterialPanel
      return h(MaterialPanel)
    }

    return () => h('div', { class: 'dc-left-sidebar' }, [
      h('div', { class: 'dc-left-sidebar__rail', role: 'tablist' }, LEFT_PANEL_TABS.map(tab =>
        renderTabButton(tab),
      )),
      h('div', { class: 'dc-left-sidebar__content' }, [
        renderActivePanel(),
      ]),
    ])
  },
})
