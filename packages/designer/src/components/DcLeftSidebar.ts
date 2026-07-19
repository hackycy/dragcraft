import type { Component } from 'vue'
import type { LeftPanelTabKey } from '../types'
import { useI18n } from '@dragcraft/i18n'
import { IconChevronLeft, IconChevronRight, IconMaterial, IconStructureTree } from '@dragcraft/icons'
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
    const { engine, extensions, leftPanelActiveTab, workspace } = ctx

    const renderTabButton = (tab: LeftPanelTab) => {
      const label = t(tab.labelKey, tab.fallback)
      const active = leftPanelActiveTab.value === tab.key

      return h('button', {
        'type': 'button',
        'class': [
          'dc-left-sidebar__tab',
          { 'dc-left-sidebar__tab--active': active },
        ],
        'data-dc-part': 'tab',
        'title': label,
        'aria-label': label,
        'aria-pressed': active,
        'onClick': () => {
          workspace.openLeft(tab.key)
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

    return () => {
      const open = workspace.leftOpen.value
      const toggleLabel = open
        ? t('workspace.left.close', '收起左侧栏')
        : t('workspace.left.open', '展开左侧栏')
      const railExtension = extensions.leftRailRenderer?.({ engine, workspace, t })

      return h('div', {
        'class': 'dc-left-sidebar',
        'data-dc-component': 'left-sidebar',
        'data-dc-state': open ? 'open' : 'closed',
      }, [
        h('div', {
          'class': 'dc-left-sidebar__surface',
          'data-dc-part': 'surface',
          'aria-hidden': workspace.mode.value === 'compact' && !open,
          'inert': workspace.mode.value === 'compact' && !open ? '' : undefined,
        }, [
          h('div', {
            'class': 'dc-left-sidebar__rail',
            'data-dc-part': 'rail',
            'role': 'tablist',
            'aria-label': t('workspace.left.label', '物料与结构'),
          }, [
            ...LEFT_PANEL_TABS.map(tab => renderTabButton(tab)),
            railExtension ? h('div', { 'class': 'dc-sidebar-rail__extension', 'data-dc-part': 'rail-extension' }, [railExtension]) : null,
          ]),
          h('div', { 'class': 'dc-left-sidebar__content', 'data-dc-part': 'content' }, [renderActivePanel()]),
        ]),
        h('button', {
          'type': 'button',
          'class': 'dc-sidebar-toggle dc-sidebar-toggle--left',
          'data-dc-part': 'toggle',
          'title': toggleLabel,
          'aria-label': toggleLabel,
          'aria-expanded': open,
          'data-dc-workspace-control': 'left',
          'onMousedown': (event: MouseEvent) => event.preventDefault(),
          'onClick': () => workspace.toggleLeft(),
        }, [h(open ? IconChevronLeft : IconChevronRight, { size: 14 })]),
      ])
    }
  },
})
