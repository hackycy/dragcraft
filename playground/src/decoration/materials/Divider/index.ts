import type { MaterialDefinition } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'

import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import DividerMaterialIcon from './DividerMaterialIcon.vue'
import DividerPreview from './DividerPreview.vue'

export const DIVIDER_MATERIAL_TYPE = 'miniapp.divider'

const dividerDefaultProps = {
  text: '分割线',
  orientation: 'center',
  dashed: false,
  textColor: '#333333',
  textFontSize: 14,
}

const dividerMaterialDefinition: MaterialDefinition = {
  type: DIVIDER_MATERIAL_TYPE,
  schema: {
    defaultProps: dividerDefaultProps,
  },
  authoring: {
    policy: {
      create: 'allowed',
      duplicate: 'allowed',
      move: 'allowed',
      remove: 'allowed',
      unwrap: 'denied',
      update: 'allowed',
    },
  },
  inspector: {
    formSchema: {
      sections: [
        {
          title: '展示设置',
          fields: [
            {
              key: 'text',
              label: '分割线文案',
              component: 'Input',
              bindTo: 'props.text',
              defaultValue: dividerDefaultProps.text,
            },
            {
              key: 'orientation',
              label: '文案位置',
              component: 'Select',
              bindTo: 'props.orientation',
              componentProps: {
                options: [
                  { label: '居左', value: 'left' },
                  { label: '居中', value: 'center' },
                  { label: '居右', value: 'right' },
                ],
                style: { width: '100%' },
              },
              defaultValue: dividerDefaultProps.orientation,
            },
            {
              key: 'dashed',
              label: '是否虚线',
              component: 'Switch',
              bindTo: 'props.dashed',
              defaultValue: dividerDefaultProps.dashed,
            },
            {
              key: 'textColor',
              label: '文案颜色',
              component: 'ColorField',
              bindTo: 'props.textColor',
              defaultValue: dividerDefaultProps.textColor,
            },
            {
              key: 'textFontSize',
              label: '文案字号',
              component: 'SliderNumberInput',
              bindTo: 'props.textFontSize',
              componentProps: { min: 10, max: 32 },
              defaultValue: dividerDefaultProps.textFontSize,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '分割线',
    group: DECORATION_MATERIAL_GROUPS.tools.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.tools.title,
    icon: DividerMaterialIcon,
  },
  presentation: {
    kind: 'visual',
    preview: DividerPreview,
  },
}

export const dividerMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(dividerMaterialDefinition),
)
