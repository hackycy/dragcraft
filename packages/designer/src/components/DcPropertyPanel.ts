import type { FieldChangePayload } from '@dragcraft/form-generator'
import { FormGenerator } from '@dragcraft/form-generator'
import { useI18n } from '@dragcraft/i18n'
import { DcScrollArea } from '@dragcraft/ui'
import { defineComponent, h, watch } from 'vue'
import { usePropertyBinding } from '../composables/usePropertyBinding'
import { useDesignerContext } from '../context'
import { useDesignerSession } from '../session/context'

export default defineComponent({
  name: 'DcPropertyPanel',

  setup() {
    const ctx = useDesignerContext()
    const session = useDesignerSession()
    const { t } = useI18n()
    const { fieldComponentMap, globalConfigSchema, activeTab } = ctx
    const {
      selectedNode,
      selectedFormSchema,
      selectedNodeProps,
      globalConfigValues,
      handlePropertyChange,
      handleGlobalConfigChange,
    } = usePropertyBinding(session, { globalConfigSchema, t })

    // Auto-switch to Widget tab when a node is selected
    watch(
      () => session.state.selectedNodeId.value,
      (newId) => {
        if (newId) {
          activeTab.value = 'widget'
        }
      },
    )

    return () => {
      const currentTab = activeTab.value
      // Fall back to global if widget tab is selected but no node
      const effectiveTab = (currentTab === 'widget' && !selectedNode.value)
        ? 'global'
        : currentTab

      let tabContent = null

      if (effectiveTab === 'global' && globalConfigSchema) {
        tabContent = h(FormGenerator, {
          key: '__global__',
          schema: globalConfigSchema,
          values: globalConfigValues.value,
          fieldComponentMap,
          onChange: (payload: FieldChangePayload) => {
            handleGlobalConfigChange(payload.key, payload.value)
          },
        })
      }
      else if (effectiveTab === 'widget' && selectedFormSchema.value && selectedNode.value) {
        tabContent = h(FormGenerator, {
          key: selectedNode.value.id,
          schema: selectedFormSchema.value,
          values: selectedNodeProps.value,
          fieldComponentMap,
          onChange: (payload: FieldChangePayload) => {
            handlePropertyChange(payload.key, payload.value)
          },
        })
      }
      else {
        tabContent = h(
          'div',
          { 'class': 'dc-property-panel__empty', 'data-dc-part': 'empty' },
          effectiveTab === 'global'
            ? t('panel.empty.no-global-config', '暂无全局配置')
            : t('panel.empty.select-widget', '请选择组件'),
        )
      }

      return h('div', { 'class': 'dc-property-panel', 'data-dc-component': 'property-panel' }, [
        h(DcScrollArea, {
          'id': `dc-property-panel-${effectiveTab}`,
          'class': 'dc-property-panel__content',
          'data-dc-part': 'content',
          'role': 'tabpanel',
          'aria-labelledby': `dc-property-tab-${effectiveTab}`,
        }, {
          default: () => h('div', { class: 'dc-property-panel__content-inner' }, [tabContent]),
        }),
      ])
    }
  },
})
