import type { MaterialDefinition } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'

import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import TitleMaterialIcon from './TitleMaterialIcon.vue'
import TitlePreview from './TitlePreview.vue'
import { TITLE_DEFAULT_PROPS } from './types'

export const TITLE_MATERIAL_TYPE = 'miniapp.title'

/**
 * 同前面的物料：不写 `MaterialDefinition<TitleProps>`，因为 `defineMaterial` 的约束容不下带
 * props 类型的物料定义（库缺陷，见 map 的 Not yet specified）。
 */
const titleMaterialDefinition: MaterialDefinition = {
  type: TITLE_MATERIAL_TYPE,
  schema: {
    defaultProps: TITLE_DEFAULT_PROPS,
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
          title: '标题设置',
          fields: [
            {
              key: 'title',
              label: '标题属性',
              component: 'Input',
              bindTo: 'props.title',
              defaultValue: TITLE_DEFAULT_PROPS.title,
            },
            {
              key: 'titleLink',
              label: '标题链接',
              component: 'Input',
              bindTo: 'props.titleLink',
              defaultValue: TITLE_DEFAULT_PROPS.titleLink,
            },
            {
              key: 'titleCentered',
              label: '标题居中',
              component: 'Switch',
              bindTo: 'props.titleCentered',
              defaultValue: TITLE_DEFAULT_PROPS.titleCentered,
            },
            {
              key: 'icon',
              label: '图标',
              // prod 的 JImageUpload -> ImageSourceField。icon 属图标类，沿用 prod 的 1MB 上限；
              // fileMax（数量）与 listType（展示形态）是 JImageUpload 专有，对本字段无意义故不搬。
              component: 'ImageSourceField',
              bindTo: 'props.icon',
              componentProps: {
                fileMaxSize: 1,
              },
              defaultValue: TITLE_DEFAULT_PROPS.icon,
            },
            {
              key: 'subtitle',
              label: '副标题',
              component: 'Input',
              bindTo: 'props.subtitle',
              defaultValue: TITLE_DEFAULT_PROPS.subtitle,
            },
            {
              key: 'subtitleCentered',
              label: '副标题居中',
              component: 'Switch',
              bindTo: 'props.subtitleCentered',
              defaultValue: TITLE_DEFAULT_PROPS.subtitleCentered,
              disabled: ctx => ctx.values.sameLine === true,
            },
            {
              key: 'sameLine',
              label: '标题同行',
              component: 'Switch',
              bindTo: 'props.sameLine',
              defaultValue: TITLE_DEFAULT_PROPS.sameLine,
            },
            {
              key: 'titleColor',
              label: '标题颜色',
              component: 'ColorField',
              bindTo: 'props.titleColor',
              defaultValue: TITLE_DEFAULT_PROPS.titleColor,
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
              defaultValue: TITLE_DEFAULT_PROPS.titleTextStyle,
            },
            {
              key: 'titleFontSize',
              label: '标题字号',
              component: 'SliderNumberInput',
              bindTo: 'props.titleFontSize',
              componentProps: { min: 10, max: 32 },
              defaultValue: TITLE_DEFAULT_PROPS.titleFontSize,
            },
            {
              key: 'subtitleColor',
              label: '副标题颜色',
              component: 'ColorField',
              bindTo: 'props.subtitleColor',
              defaultValue: TITLE_DEFAULT_PROPS.subtitleColor,
            },
            {
              key: 'subtitleTextStyle',
              label: '副标题文字样式',
              component: 'RadioGroup',
              bindTo: 'props.subtitleTextStyle',
              componentProps: {
                options: [
                  { label: '正常', value: 'normal' },
                  { label: '加粗', value: 'bold' },
                  { label: '倾斜', value: 'italic' },
                ],
              },
              defaultValue: TITLE_DEFAULT_PROPS.subtitleTextStyle,
            },
            {
              key: 'subtitleFontSize',
              label: '副标题字号',
              component: 'SliderNumberInput',
              bindTo: 'props.subtitleFontSize',
              componentProps: { min: 10, max: 32 },
              defaultValue: TITLE_DEFAULT_PROPS.subtitleFontSize,
            },
          ],
        },
        {
          title: '更多设置',
          fields: [
            {
              key: 'showMore',
              label: '右侧按钮',
              component: 'Switch',
              bindTo: 'props.showMore',
              defaultValue: TITLE_DEFAULT_PROPS.showMore,
            },
            {
              key: 'moreText',
              label: '右侧文字',
              component: 'Input',
              bindTo: 'props.moreText',
              defaultValue: TITLE_DEFAULT_PROPS.moreText,
              ifShow: ctx => ctx.values.showMore === true,
            },
            {
              key: 'moreLink',
              label: '链接',
              component: 'Input',
              bindTo: 'props.moreLink',
              defaultValue: TITLE_DEFAULT_PROPS.moreLink,
              ifShow: ctx => ctx.values.showMore === true,
            },
            {
              key: 'moreColor',
              label: '更多文字颜色',
              component: 'ColorField',
              bindTo: 'props.moreColor',
              defaultValue: TITLE_DEFAULT_PROPS.moreColor,
              ifShow: ctx => ctx.values.showMore === true,
            },
            {
              key: 'moreTextStyle',
              label: '更多文字样式',
              component: 'RadioGroup',
              bindTo: 'props.moreTextStyle',
              componentProps: {
                options: [
                  { label: '正常', value: 'normal' },
                  { label: '加粗', value: 'bold' },
                  { label: '倾斜', value: 'italic' },
                ],
              },
              defaultValue: TITLE_DEFAULT_PROPS.moreTextStyle,
              ifShow: ctx => ctx.values.showMore === true,
            },
            {
              key: 'moreFontSize',
              label: '更多文字字号',
              component: 'SliderNumberInput',
              bindTo: 'props.moreFontSize',
              componentProps: { min: 10, max: 32 },
              defaultValue: TITLE_DEFAULT_PROPS.moreFontSize,
              ifShow: ctx => ctx.values.showMore === true,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '标题',
    group: DECORATION_MATERIAL_GROUPS.tools.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.tools.title,
    icon: TitleMaterialIcon,
    description: '主标题、副标题和右侧更多入口',
  },
  presentation: {
    kind: 'visual',
    preview: TitlePreview,
  },
}

export const titleMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(titleMaterialDefinition),
)
