import type { FieldComponentMap } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

import BackgroundColorConfig from './inspector/BackgroundColorConfig.vue'
import BackgroundImageModeField from './inspector/BackgroundImageModeField.vue'
import ColorField from './inspector/ColorField.vue'
import ImageSourceField from './inspector/ImageSourceField.vue'
import { parseDiyV2CssQuad, serializeDiyV2CssQuad } from './inspector/quad'
import QuadNumberInput from './inspector/QuadNumberInput.vue'
import ShadowConfig from './inspector/ShadowConfig.vue'
import SliderNumberInput from './inspector/SliderNumberInput.vue'

const VALUE_BINDING = {
  modelPropName: 'value',
  updateEventName: 'onUpdate:value',
} as const

const decorationFields: FieldComponentMap = {
  SliderNumberInput: { component: SliderNumberInput, ...VALUE_BINDING },
  // Schema 里存的是 CSS 简写字符串（"0px"），组件消费的是四边对象，故双向转换。
  QuadNumberInput: {
    component: QuadNumberInput,
    ...VALUE_BINDING,
    formatValue: value => parseDiyV2CssQuad(value),
    normalizeValue: value => serializeDiyV2CssQuad(value),
  },
  ShadowConfig: { component: ShadowConfig, ...VALUE_BINDING },
  BackgroundColorConfig: { component: BackgroundColorConfig, ...VALUE_BINDING },
  BackgroundImageModeField: { component: BackgroundImageModeField, ...VALUE_BINDING },
  ImageSourceField: { component: ImageSourceField, ...VALUE_BINDING },
  ColorField: { component: ColorField, ...VALUE_BINDING },
}

export function createDecorationFieldComponentMap(): FieldComponentMap {
  return {
    ...createAntDesignVueFields(),
    ...decorationFields,
  }
}
