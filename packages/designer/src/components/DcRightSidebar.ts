import type { Component } from 'vue'
import type { PropertyTabKey } from '../types'
import { useI18n } from '@dragcraft/i18n'
import { IconChevronLeft, IconChevronRight, IconGlobalConfig, IconProperties } from '@dragcraft/icons'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import DcPropertyPanel from './DcPropertyPanel'

interface RightPanelTab {
  key: PropertyTabKey
  labelKey: string
  fallback: string
  icon: Component
}

const RIGHT_PANEL_TABS: RightPanelTab[] = [
  {
    key: 'global',
    labelKey: 'panel.tab.global',
    fallback: '全局配置',
    icon: IconGlobalConfig,
  },
  {
    key: 'widget',
    labelKey: 'panel.tab.widget',
    fallback: '组件配置',
    icon: IconProperties,
  },
]

export default defineComponent({
  name: 'DcRightSidebar',

  setup() {
    const { t } = useI18n()
    const { engine, extensions, activeTab, workspace } = useDesignerContext()
    const hasSelectedNode = computed(() => engine.store.selectedNodeId.value !== null)

    const renderTabButton = (tab: RightPanelTab) => {
      const label = t(tab.labelKey, tab.fallback)
      const disabled = tab.key === 'widget' && !hasSelectedNode.value
      const active = activeTab.value === tab.key && !disabled

      return h('button', {
        'id': `dc-property-tab-${tab.key}`,
        'type': 'button',
        'role': 'tab',
        'class': [
          'dc-right-sidebar__tab',
          { 'dc-right-sidebar__tab--active': active },
        ],
        'data-dc-part': 'tab',
        'title': label,
        'aria-label': label,
        'aria-selected': active,
        'aria-controls': `dc-property-panel-${tab.key}`,
        'disabled': disabled,
        'onClick': () => workspace.openRight(tab.key),
      }, [h(tab.icon, { size: 18 })])
    }

    return () => {
      const PropertyPanel = extensions.propertyPanelRenderer ?? DcPropertyPanel
      const open = workspace.rightOpen.value
      const toggleLabel = open
        ? t('workspace.right.close', '收起属性栏')
        : t('workspace.right.open', '展开属性栏')
      const railExtension = extensions.rightRailRenderer?.({ engine, workspace, t })

      return h('div', {
        'class': 'dc-right-sidebar',
        'data-dc-component': 'right-sidebar',
        'data-dc-state': open ? 'open' : 'closed',
      }, [
        h('div', {
          'class': 'dc-right-sidebar__surface',
          'data-dc-part': 'surface',
          'aria-hidden': workspace.mode.value === 'compact' && !open,
          'inert': workspace.mode.value === 'compact' && !open ? '' : undefined,
        }, [
          h('div', {
            'class': 'dc-right-sidebar__rail',
            'data-dc-part': 'rail',
            'role': 'tablist',
            'aria-label': t('workspace.right.label', '属性检查器'),
          }, [
            ...RIGHT_PANEL_TABS.map(renderTabButton),
            railExtension ? h('div', { 'class': 'dc-sidebar-rail__extension', 'data-dc-part': 'rail-extension' }, [railExtension]) : null,
          ]),
          h('div', { 'class': 'dc-right-sidebar__content', 'data-dc-part': 'content' }, [h(PropertyPanel)]),
        ]),
        h('button', {
          'type': 'button',
          'class': 'dc-sidebar-toggle dc-sidebar-toggle--right',
          'data-dc-part': 'toggle',
          'title': toggleLabel,
          'aria-label': toggleLabel,
          'aria-expanded': open,
          'data-dc-workspace-control': 'right',
          'onMousedown': (event: MouseEvent) => event.preventDefault(),
          'onClick': () => workspace.toggleRight(),
        }, [h(open ? IconChevronRight : IconChevronLeft, { size: 14 })]),
      ])
    }
  },
})
