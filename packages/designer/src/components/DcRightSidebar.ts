import type { Component } from 'vue'
import type { PropertyTabKey } from '../types'
import { useI18n } from '@dragcraft/i18n'
import { IconChevronLeft, IconChevronRight, IconGlobalConfig, IconProperties } from '@dragcraft/icons'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import DcPropertyPanel from './DcPropertyPanel'

interface RightPanelTab {
  readonly key: PropertyTabKey
  readonly labelKey: string
  readonly fallback: string
  readonly icon: Component
}

const TABS: readonly RightPanelTab[] = [
  { key: 'global', labelKey: 'panel.tab.global', fallback: '全局配置', icon: IconGlobalConfig },
  { key: 'widget', labelKey: 'panel.tab.widget', fallback: '组件配置', icon: IconProperties },
]

export default defineComponent({
  name: 'DcRightSidebar',
  setup() {
    const { t } = useI18n()
    const context = useDesignerContext()
    const { designer, extensions, workspace } = context
    const hasSelectedNode = computed(() => designer.selection.selectedNodeId.value !== null)
    return () => {
      const open = workspace.rightOpen.value
      const PropertyPanel = extensions.propertyPanelRenderer ?? DcPropertyPanel
      const extension = extensions.rightRailRenderer?.({ designer, workspace, t })
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
            ...TABS.map((tab) => {
              const disabled = tab.key === 'widget' && !hasSelectedNode.value
              const active = workspace.activeRightPanel.value === tab.key && !disabled
              const label = t(tab.labelKey, tab.fallback)
              return h('button', {
                'id': `dc-property-tab-${tab.key}`,
                'type': 'button',
                'role': 'tab',
                'class': ['dc-right-sidebar__tab', { 'dc-right-sidebar__tab--active': active }],
                'data-dc-part': 'tab',
                disabled,
                'title': label,
                'aria-label': label,
                'aria-selected': active,
                'aria-controls': `dc-property-panel-${tab.key}`,
                'onClick': () => workspace.openRight(tab.key),
              }, [h(tab.icon, { size: 18 })])
            }),
            extension ? h('div', { 'class': 'dc-sidebar-rail__extension', 'data-dc-part': 'rail-extension' }, [extension]) : null,
          ]),
          h('div', { 'class': 'dc-right-sidebar__content', 'data-dc-part': 'content' }, [h(PropertyPanel)]),
        ]),
        h('button', {
          'type': 'button',
          'class': 'dc-sidebar-toggle dc-sidebar-toggle--right',
          'data-dc-part': 'toggle',
          'data-dc-workspace-control': 'right',
          'title': open ? t('workspace.right.close', '收起属性栏') : t('workspace.right.open', '展开属性栏'),
          'aria-label': open ? t('workspace.right.close', '收起属性栏') : t('workspace.right.open', '展开属性栏'),
          'aria-expanded': open,
          'onMousedown': (event: MouseEvent) => event.preventDefault(),
          'onClick': () => workspace.toggleRight(),
        }, [h(open ? IconChevronRight : IconChevronLeft, { size: 14 })]),
      ])
    }
  },
})
