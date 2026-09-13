import type { MaterialDefinition } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'

import { DECORATION_MATERIAL_GROUPS } from '../groups'
import FloatingButtonFrame from './FloatingButtonFrame.vue'
import FloatingButtonMaterialIcon from './FloatingButtonMaterialIcon.vue'
import FloatingButtonPreview from './FloatingButtonPreview.vue'

export const FLOATING_BUTTON_MATERIAL_TYPE = 'miniapp.floating-button'

/**
 * 与 NavBar 一样**不走公共 wrapper**（prod 里这两个是仅有的例外），所以检查器里没有
 * "通用布局/通用样式"分区。policy 与 prod 逐条一致：单例 create、`duplicate`/`unwrap` denied，
 * 但 **`move` 是 allowed**（与 NavBar/TabBar 不同——它靠 props 里的 position/offset 定位，
 * 不靠 frame 钉死，所以移动有意义）。
 */
const floatingButtonMaterialDefinition: MaterialDefinition = {
  type: FLOATING_BUTTON_MATERIAL_TYPE,
  schema: {
    defaultProps: {
      image: '',
      link: '',
      position: 'right',
      horizontalOffset: 16,
      verticalOffset: 16,
      size: 48,
      borderRadius: 24,
    },
  },
  authoring: {
    policy: {
      create: ({ schema }) =>
        schema.nodes.some(node => node.type === FLOATING_BUTTON_MATERIAL_TYPE) ? 'denied' : 'allowed',
      duplicate: 'denied',
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
              key: 'image',
              label: '上传图片',
              // prod 的 JImageUpload -> ImageSourceField；图标类沿用 1MB 上限
              component: 'ImageSourceField',
              bindTo: 'props.image',
              componentProps: {
                fileMaxSize: 1,
              },
              defaultValue: '',
            },
            {
              key: 'link',
              label: '按钮跳转',
              component: 'Input',
              bindTo: 'props.link',
              defaultValue: '',
            },
            {
              key: 'size',
              label: '按钮大小',
              component: 'SliderNumberInput',
              bindTo: 'props.size',
              componentProps: {
                min: 24,
                max: 120,
              },
              defaultValue: 48,
            },
            {
              key: 'borderRadius',
              label: '圆角',
              component: 'SliderNumberInput',
              bindTo: 'props.borderRadius',
              componentProps: {
                min: 0,
                max: 60,
              },
              defaultValue: 24,
            },
            {
              key: 'position',
              label: '悬浮位置',
              component: 'RadioGroup',
              bindTo: 'props.position',
              componentProps: {
                options: [
                  { label: '左下', value: 'left' },
                  { label: '右下', value: 'right' },
                ],
              },
              defaultValue: 'right',
            },
            {
              key: 'horizontalOffset',
              label: '水平间距',
              component: 'SliderNumberInput',
              bindTo: 'props.horizontalOffset',
              componentProps: {
                min: 0,
                max: 100,
              },
              defaultValue: 16,
            },
            {
              key: 'verticalOffset',
              label: '垂直间距',
              component: 'SliderNumberInput',
              bindTo: 'props.verticalOffset',
              componentProps: {
                min: 0,
                max: 100,
              },
              defaultValue: 16,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '悬浮按钮',
    group: DECORATION_MATERIAL_GROUPS.tools.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.tools.title,
    icon: FloatingButtonMaterialIcon,
    description: '悬浮在页面固定位置的操作入口',
  },
  presentation: {
    kind: 'visual',
    preview: FloatingButtonPreview,
    frame: FloatingButtonFrame,
  },
}

export const floatingButtonMaterial = defineMaterial(floatingButtonMaterialDefinition)
