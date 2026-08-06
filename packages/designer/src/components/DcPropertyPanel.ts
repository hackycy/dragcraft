import type { FieldChangePayload } from '@dragcraft/form-generator'
import { FormGenerator } from '@dragcraft/form-generator'
import { useI18n } from '@dragcraft/i18n'
import { DcScrollArea } from '@dragcraft/ui'
import { defineComponent, h, watch } from 'vue'
import { usePropertyBinding } from '../composables/usePropertyBinding'
import { useDesignerContext } from '../context'

export default defineComponent({
  name: 'DcPropertyPanel',
  setup() {
    const context = useDesignerContext()
    const { t } = useI18n()
    const binding = usePropertyBinding(context.designer, {
      globalConfigSchema: context.globalConfigSchema,
    })
    watch(context.designer.selection.selectedNodeId, (nodeId) => {
      if (nodeId)
        context.workspace.activeRightPanel.value = 'widget'
    })
    return () => {
      const selected = binding.selectedNode.value
      const currentTab = context.workspace.activeRightPanel.value
      const tab = currentTab === 'widget' && !selected ? 'global' : currentTab
      let content = null
      if (tab === 'global' && context.globalConfigSchema) {
        content = h(FormGenerator, {
          key: '__global__',
          schema: context.globalConfigSchema,
          values: binding.globalConfigValues.value,
          fieldComponentMap: context.fieldComponentMap,
          onChange: (payload: FieldChangePayload) => binding.handleGlobalConfigChange(payload.key, payload.value),
        })
      }
      else if (tab === 'widget' && selected && binding.selectedFormSchema.value) {
        content = h(FormGenerator, {
          key: selected.id,
          schema: binding.selectedFormSchema.value,
          values: binding.selectedNodeProps.value,
          fieldComponentMap: context.fieldComponentMap,
          onChange: (payload: FieldChangePayload) => binding.handlePropertyChange(payload.key, payload.value),
        })
      }
      else {
        content = h('div', { 'class': 'dc-property-panel__empty', 'data-dc-part': 'empty' }, tab === 'global'
          ? t('panel.empty.no-global-config', '暂无全局配置')
          : t('panel.empty.select-widget', '请选择组件'))
      }
      return h('div', { 'class': 'dc-property-panel', 'data-dc-component': 'property-panel' }, [
        h(DcScrollArea, {
          'id': `dc-property-panel-${tab}`,
          'class': 'dc-property-panel__content',
          'data-dc-part': 'content',
          'role': 'tabpanel',
          'aria-labelledby': `dc-property-tab-${tab}`,
        }, { default: () => h('div', { class: 'dc-property-panel__content-inner' }, [content]) }),
      ])
    }
  },
})
