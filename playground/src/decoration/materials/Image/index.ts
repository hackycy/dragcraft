import type { MaterialDefinition } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'

import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import ImageMaterialIcon from './ImageMaterialIcon.vue'
import ImagePreview from './ImagePreview.vue'

export const IMAGE_MATERIAL_TYPE = 'miniapp.image'

const imageDefaultProps = {
  src: '',
  link: '',
  height: 200,
  objectFit: 'cover',
}

const imageMaterialDefinition: MaterialDefinition = {
  type: IMAGE_MATERIAL_TYPE,
  schema: {
    defaultProps: imageDefaultProps,
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
              key: 'src',
              label: '图片地址',
              component: 'ImageSourceField',
              bindTo: 'props.src',
              defaultValue: imageDefaultProps.src,
            },
            {
              key: 'link',
              label: '跳转链接',
              component: 'Input',
              bindTo: 'props.link',
              defaultValue: imageDefaultProps.link,
            },
            {
              key: 'height',
              label: '图片高度',
              component: 'SliderNumberInput',
              bindTo: 'props.height',
              componentProps: {
                min: 0,
                max: 1000,
              },
              defaultValue: imageDefaultProps.height,
            },
            {
              key: 'objectFit',
              label: '图片适应方式',
              component: 'Select',
              bindTo: 'props.objectFit',
              componentProps: {
                options: [
                  { label: '等比剪切', value: 'cover' },
                  { label: '等比缩放', value: 'contain' },
                  { label: '铺满', value: 'fill' },
                ],
                style: { width: '100%' },
              },
              defaultValue: imageDefaultProps.objectFit,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '图片',
    group: DECORATION_MATERIAL_GROUPS.basic.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.basic.title,
    icon: ImageMaterialIcon,
  },
  presentation: {
    kind: 'visual',
    preview: ImagePreview,
  },
}

export const imageMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(imageMaterialDefinition),
)
