import type { FieldRenderFactory, MaterialDefinition } from '@dragcraft/designer'
import type { NavigationItem } from './types'
import { defineMaterial } from '@dragcraft/designer'

import { h } from 'vue'
import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import NavigationGroupMaterialIcon from './NavigationGroupMaterialIcon.vue'
import NavigationGroupPreview from './NavigationGroupPreview.vue'
import NavigationItemsField from './NavigationItemsField.vue'
import {
  NAVIGATION_GROUP_DEFAULT_PROPS,
  normalizeNavigationItems,
} from './types'

export const NAVIGATION_GROUP_MATERIAL_TYPE = 'miniapp.navigation-group'

const renderNavigationItemsField: FieldRenderFactory = (ctx) => {
  return () =>
    h(NavigationItemsField, {
      'value': ctx.value.value as NavigationItem[] | undefined,
      'disabled': ctx.disabled.value,
      'onUpdate:value': ctx.setValue,
    })
}

/**
 * 不写 `MaterialDefinition<NavigationGroupProps>`：`defineMaterial` 的约束容不下带 props 类型的
 * 物料定义（库缺陷，见 map 的 Not yet specified）。本仓物料一律沿用这个写法。
 */
const navigationGroupMaterialDefinition: MaterialDefinition = {
  type: NAVIGATION_GROUP_MATERIAL_TYPE,
  schema: {
    defaultProps: NAVIGATION_GROUP_DEFAULT_PROPS,
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
              key: 'navigationStyle',
              label: '导航样式',
              component: 'RadioGroup',
              bindTo: 'props.navigationStyle',
              componentProps: {
                options: [
                  { label: '图片加文字', value: 'image-text' },
                  { label: '图片', value: 'image' },
                  { label: '文字', value: 'text' },
                ],
              },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.navigationStyle,
            },
            {
              key: 'columnCount',
              label: '显示设置',
              component: 'RadioGroup',
              bindTo: 'props.columnCount',
              componentProps: {
                options: [
                  { label: '三列展示', value: 3 },
                  { label: '四列展示', value: 4 },
                  { label: '五列展示', value: 5 },
                ],
              },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.columnCount,
            },
            {
              key: 'displayMode',
              label: '展示样式',
              component: 'RadioGroup',
              bindTo: 'props.displayMode',
              componentProps: {
                options: [
                  { label: '固定显示', value: 'fixed' },
                  { label: '分页滑动', value: 'paged' },
                ],
              },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.displayMode,
            },
            {
              key: 'rowCount',
              label: '显示行数',
              component: 'RadioGroup',
              bindTo: 'props.rowCount',
              componentProps: {
                options: [
                  { label: '1行', value: 1 },
                  { label: '2行', value: 2 },
                  { label: '3行', value: 3 },
                  { label: '4行', value: 4 },
                ],
              },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.rowCount,
            },
          ],
        },
        {
          title: '内容设置',
          fields: [
            {
              key: 'content',
              label: '内容',
              component: renderNavigationItemsField,
              bindTo: 'props.content',
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.content,
              parseValue: normalizeNavigationItems,
            },
          ],
        },
        {
          title: '样式设置',
          fields: [
            {
              key: 'imageTextGap',
              label: '图文间距',
              component: 'SliderNumberInput',
              bindTo: 'props.imageTextGap',
              componentProps: { min: 0, max: 48 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.imageTextGap,
              ifShow: ctx => ctx.values.navigationStyle === 'image-text',
            },
            {
              key: 'imageRadius',
              label: '图片圆角',
              component: 'SliderNumberInput',
              bindTo: 'props.imageRadius',
              componentProps: { min: 0, max: 50 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.imageRadius,
              ifShow: ctx => ctx.values.navigationStyle !== 'text',
            },
            {
              key: 'imageSize',
              label: '图片大小',
              component: 'SliderNumberInput',
              bindTo: 'props.imageSize',
              componentProps: { min: 16, max: 160 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.imageSize,
              ifShow: ctx => ctx.values.navigationStyle !== 'text',
            },
            {
              key: 'objectFit',
              label: '图片适应方式',
              component: 'RadioGroup',
              bindTo: 'props.objectFit',
              componentProps: {
                options: [
                  { label: '等比剪切', value: 'cover' },
                  { label: '等比缩放', value: 'contain' },
                  { label: '铺满', value: 'fill' },
                ],
              },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.objectFit,
              ifShow: ctx => ctx.values.navigationStyle !== 'text',
            },
            {
              key: 'titleColor',
              label: '标题颜色',
              component: 'ColorField',
              bindTo: 'props.titleColor',
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.titleColor,
              ifShow: ctx => ctx.values.navigationStyle !== 'image',
            },
            {
              key: 'titleTextStyle',
              label: '标题文字样式',
              component: 'RadioGroup',
              bindTo: 'props.titleTextStyle',
              componentProps: {
                options: [
                  { label: '正常', value: 'normal' },
                  { label: '加粗', value: 'bold' },
                  { label: '倾斜', value: 'italic' },
                ],
              },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.titleTextStyle,
              ifShow: ctx => ctx.values.navigationStyle !== 'image',
            },
            {
              key: 'titleFontSize',
              label: '标题字号',
              component: 'SliderNumberInput',
              bindTo: 'props.titleFontSize',
              componentProps: { min: 10, max: 32 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.titleFontSize,
              ifShow: ctx => ctx.values.navigationStyle !== 'image',
            },
          ],
        },
        {
          title: '轮播设置',
          fields: [
            {
              key: 'autoplay',
              label: '自动轮播',
              component: 'Switch',
              bindTo: 'props.autoplay',
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.autoplay,
            },
            {
              key: 'interval',
              label: '间隔时间（秒）',
              component: 'SliderNumberInput',
              bindTo: 'props.interval',
              componentProps: { min: 1, max: 100 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.interval,
            },
            {
              key: 'scrollMode',
              label: '滚动方式',
              component: 'RadioGroup',
              bindTo: 'props.scrollMode',
              componentProps: {
                options: [
                  { label: '平移', value: 'scrollx' },
                  { label: '切屏', value: 'fade' },
                ],
              },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.scrollMode,
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
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.showIndicator,
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
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorPosition,
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
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorAlign,
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
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorStyle,
            },
            {
              key: 'indicatorActiveColor',
              label: '激活颜色',
              component: 'ColorField',
              bindTo: 'props.indicatorActiveColor',
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorActiveColor,
            },
            {
              key: 'indicatorInactiveColor',
              label: '未激活颜色',
              component: 'ColorField',
              bindTo: 'props.indicatorInactiveColor',
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorInactiveColor,
            },
            {
              key: 'indicatorSize',
              label: '指示器大小',
              component: 'SliderNumberInput',
              bindTo: 'props.indicatorSize',
              componentProps: { min: 4, max: 48 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorSize,
            },
            {
              key: 'indicatorRadius',
              label: '圆角',
              component: 'SliderNumberInput',
              bindTo: 'props.indicatorRadius',
              componentProps: { min: 0, max: 50 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorRadius,
            },
            {
              key: 'indicatorMargin',
              label: '边距',
              component: 'SliderNumberInput',
              bindTo: 'props.indicatorMargin',
              componentProps: { min: 0, max: 100 },
              defaultValue: NAVIGATION_GROUP_DEFAULT_PROPS.indicatorMargin,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '导航组',
    group: DECORATION_MATERIAL_GROUPS.basic.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.basic.title,
    icon: NavigationGroupMaterialIcon,
  },
  presentation: {
    kind: 'visual',
    preview: NavigationGroupPreview,
  },
}

export const navigationGroupMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(navigationGroupMaterialDefinition),
)
