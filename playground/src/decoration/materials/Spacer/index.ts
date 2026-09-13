import type { MaterialDefinition } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'

import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import SpacerMaterialIcon from './SpacerMaterialIcon.vue'
import SpacerPreview from './SpacerPreview.vue'

export const SPACER_MATERIAL_TYPE = 'miniapp.spacer'

const spacerDefaultProps = {
  height: 20,
}

const spacerMaterialDefinition: MaterialDefinition = {
  type: SPACER_MATERIAL_TYPE,
  schema: {
    defaultProps: spacerDefaultProps,
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
              key: 'height',
              label: '高度',
              component: 'SliderNumberInput',
              bindTo: 'props.height',
              componentProps: {
                min: 0,
                max: 200,
              },
              defaultValue: spacerDefaultProps.height,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '辅助空白',
    group: DECORATION_MATERIAL_GROUPS.tools.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.tools.title,
    icon: SpacerMaterialIcon,
  },
  presentation: {
    kind: 'visual',
    preview: SpacerPreview,
  },
}

export const spacerMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(spacerMaterialDefinition),
)
