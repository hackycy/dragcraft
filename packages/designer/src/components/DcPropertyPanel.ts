import type { FieldChangePayload } from '@dragcraft/form-generator'
import { FormGenerator } from '@dragcraft/form-generator'
import { computed, defineComponent, h, watch } from 'vue'
import { usePropertyBinding } from '../composables/usePropertyBinding'
import { useDesignerContext } from '../context'

export default defineComponent({
  name: 'DcPropertyPanel',

  setup() {
    const ctx = useDesignerContext()
    const { engine, fieldComponentMap, globalConfigSchema, activeTab } = ctx
    const {
      selectedNode,
      selectedFormSchema,
      selectedNodeProps,
      handlePropertyChange,
      handleGlobalConfigChange,
    } = usePropertyBinding(engine)

    // Global config values from schema
    const globalConfigValues = computed(() => {
      void engine.store.schema.value
      return { ...engine.store.getRawSchema().globalConfig }
    })

    // Available tabs (Widget tab only when a node is selected)
    const tabs = computed(() => {
      const items: Array<{ key: 'global' | 'widget', label: string }> = [
        { key: 'global', label: 'Global' },
      ]
      if (selectedNode.value) {
        items.push({ key: 'widget', label: 'Widget' })
      }
      return items
    })

    const handleTabClick = (key: 'global' | 'widget') => {
      activeTab.value = key
    }

    // Auto-switch to Widget tab when a node is selected
    watch(
      () => engine.store.selectedNodeId.value,
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

      // ── Tab bar ──
      const tabBar = h(
        'div',
        { class: 'dc-property-panel__tabs' },
        tabs.value.map(tab =>
          h('div', {
            class: [
              'dc-property-panel__tab',
              { 'dc-property-panel__tab--active': effectiveTab === tab.key },
            ],
            onClick: () => handleTabClick(tab.key),
          }, tab.label),
        ),
      )

      // ── Tab content ──
      let tabContent = null

      if (effectiveTab === 'global' && globalConfigSchema) {
        tabContent = h(FormGenerator, {
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
          { class: 'dc-property-panel__empty' },
          effectiveTab === 'global'
            ? '暂无全局配置'
            : '请选择一个组件',
        )
      }

      return h('div', { class: 'dc-property-panel' }, [
        tabBar,
        h('div', { class: 'dc-property-panel__content' }, [tabContent]),
      ])
    }
  },
})
