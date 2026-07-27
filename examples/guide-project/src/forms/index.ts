import type { FieldComponentMap } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { defineComponent, h } from 'vue'

export const AssetField = defineComponent({
  name: 'GuideAssetField',
  props: {
    modelValue: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('button', {
      type: 'button',
      class: 'guide-asset-field',
      onClick: () => emit('update:modelValue', props.modelValue
        ? ''
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'),
    }, props.modelValue ? '移除背景图' : '选择示例背景图')
  },
})

// #region tutorial-field-adapter
export function createGuideFieldComponentMap(): FieldComponentMap {
  return {
    ...createAntDesignVueFields(),
    Asset: {
      component: AssetField,
      modelPropName: 'modelValue',
      updateEventName: 'onUpdate:modelValue',
    },
  }
}
// #endregion tutorial-field-adapter
