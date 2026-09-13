import type { FieldRenderFactory, MaterialDefinition } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'
import { h } from 'vue'

import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import CarouselItemsField from './CarouselItemsField.vue'
import CarouselMaterialIcon from './CarouselMaterialIcon.vue'
import CarouselPreview from './CarouselPreview.vue'

export const CAROUSEL_MATERIAL_TYPE = 'miniapp.carousel'

interface CarouselItem {
  src: string
  link: string
}

const carouselDefaultProps = {
  height: 200,
  objectFit: 'cover',
  autoplay: true,
  interval: 3,
  showIndicator: true,
  indicatorPosition: 'bottom',
  indicatorAlign: 'center',
  indicatorStyle: 'dot',
  indicatorActiveColor: '#1677ff',
  indicatorInactiveColor: '#d9d9d9',
  indicatorSize: 8,
  indicatorRadius: 8,
  indicatorMargin: 8,
  items: [{ src: '', link: '' }] as CarouselItem[],
}

const renderCarouselItemsField: FieldRenderFactory = (ctx) => {
  return () =>
    h(CarouselItemsField, {
      'value': ctx.value.value as CarouselItem[] | undefined,
      'disabled': ctx.disabled.value,
      'onUpdate:value': ctx.setValue,
    })
}

function parseCarouselItems(value: unknown): CarouselItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { src: '', link: '' }
    }

    const record = item as Record<string, unknown>

    return {
      src: typeof record.src === 'string' ? record.src : '',
      link: typeof record.link === 'string' ? record.link : '',
    }
  })
}

const carouselMaterialDefinition: MaterialDefinition = {
  type: CAROUSEL_MATERIAL_TYPE,
  schema: {
    defaultProps: carouselDefaultProps,
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
              label: '图片高度',
              component: 'SliderNumberInput',
              bindTo: 'props.height',
              componentProps: {
                min: 0,
                max: 1000,
              },
              defaultValue: carouselDefaultProps.height,
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
              defaultValue: carouselDefaultProps.objectFit,
            },
            {
              key: 'autoplay',
              label: '自动轮播',
              component: 'Switch',
              bindTo: 'props.autoplay',
              defaultValue: carouselDefaultProps.autoplay,
            },
            {
              key: 'interval',
              label: '间隔时间（秒）',
              component: 'SliderNumberInput',
              bindTo: 'props.interval',
              componentProps: {
                min: 1,
                max: 100,
              },
              defaultValue: carouselDefaultProps.interval,
              ifShow: ctx => ctx.values.autoplay === true,
            },
          ],
        },
        {
          title: '内容设置',
          fields: [
            {
              key: 'items',
              label: '图片列表',
              component: renderCarouselItemsField,
              bindTo: 'props.items',
              defaultValue: carouselDefaultProps.items,
              parseValue: parseCarouselItems,
            },
          ],
        },
        {
          title: '指示器设置',
          fields: [
            {
              key: 'showIndicator',
              label: '是否显示',
              component: 'Switch',
              bindTo: 'props.showIndicator',
              defaultValue: carouselDefaultProps.showIndicator,
            },
            {
              key: 'indicatorPosition',
              label: '位置',
              component: 'RadioGroup',
              bindTo: 'props.indicatorPosition',
              componentProps: {
                options: [
                  { label: '上', value: 'top' },
                  { label: '下', value: 'bottom' },
                  { label: '左', value: 'left' },
                  { label: '右', value: 'right' },
                ],
              },
              defaultValue: carouselDefaultProps.indicatorPosition,
            },
            {
              key: 'indicatorAlign',
              label: '对齐方式',
              component: 'RadioGroup',
              bindTo: 'props.indicatorAlign',
              componentProps: {
                options: [
                  { label: '上对齐', value: 'start' },
                  { label: '居中', value: 'center' },
                  { label: '下对齐', value: 'end' },
                ],
              },
              defaultValue: carouselDefaultProps.indicatorAlign,
            },
            {
              key: 'indicatorStyle',
              label: '样式',
              component: 'RadioGroup',
              bindTo: 'props.indicatorStyle',
              componentProps: {
                options: [
                  { label: '点', value: 'dot' },
                  { label: '长条线', value: 'bar' },
                  { label: '数字', value: 'number' },
                ],
              },
              defaultValue: carouselDefaultProps.indicatorStyle,
            },
            {
              key: 'indicatorActiveColor',
              label: '激活颜色',
              component: 'ColorField',
              bindTo: 'props.indicatorActiveColor',
              defaultValue: carouselDefaultProps.indicatorActiveColor,
            },
            {
              key: 'indicatorInactiveColor',
              label: '未激活颜色',
              component: 'ColorField',
              bindTo: 'props.indicatorInactiveColor',
              defaultValue: carouselDefaultProps.indicatorInactiveColor,
            },
            {
              key: 'indicatorSize',
              label: '指示器大小',
              component: 'SliderNumberInput',
              bindTo: 'props.indicatorSize',
              componentProps: { min: 4, max: 48 },
              defaultValue: carouselDefaultProps.indicatorSize,
            },
            {
              key: 'indicatorRadius',
              label: '圆角',
              component: 'SliderNumberInput',
              bindTo: 'props.indicatorRadius',
              componentProps: { min: 0, max: 50 },
              defaultValue: carouselDefaultProps.indicatorRadius,
            },
            {
              key: 'indicatorMargin',
              label: '边距',
              component: 'SliderNumberInput',
              bindTo: 'props.indicatorMargin',
              componentProps: { min: 0, max: 100 },
              defaultValue: carouselDefaultProps.indicatorMargin,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '轮播图',
    group: DECORATION_MATERIAL_GROUPS.basic.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.basic.title,
    icon: CarouselMaterialIcon,
  },
  presentation: {
    kind: 'visual',
    preview: CarouselPreview,
  },
}

export const carouselMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(carouselMaterialDefinition),
)
