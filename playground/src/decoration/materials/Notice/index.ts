import type { FieldRenderFactory, MaterialDefinition } from '@dragcraft/designer'
import type { NoticeItem } from './types'
import { defineMaterial } from '@dragcraft/designer'

import { h } from 'vue'
import { createDefaultDiyV2BackgroundConfig } from '../../background'
import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import NoticeItemsField from './NoticeItemsField.vue'
import NoticeMaterialIcon from './NoticeMaterialIcon.vue'
import NoticePreview from './NoticePreview.vue'
import {
  normalizeNoticeItems,
  NOTICE_DEFAULT_PROPS,
} from './types'

export const NOTICE_MATERIAL_TYPE = 'miniapp.notice'

const renderNoticeItemsField: FieldRenderFactory = (ctx) => {
  return () =>
    h(NoticeItemsField, {
      'value': ctx.value.value as NoticeItem[] | undefined,
      'disabled': ctx.disabled.value,
      'onUpdate:value': ctx.setValue,
    })
}

/**
 * 不写 `MaterialDefinition<NoticeProps>`：`defineMaterial` 的约束容不下带 props 类型的物料定义
 * （库缺陷，见 map 的 Not yet specified）。本仓物料一律沿用这个写法。
 */
const noticeMaterialDefinition: MaterialDefinition = {
  type: NOTICE_MATERIAL_TYPE,
  schema: {
    defaultProps: NOTICE_DEFAULT_PROPS,
    defaultStyle: {
      content: {
        padding: '10px 12px',
      },
    },
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
              key: 'displayStyle',
              label: '选择风格',
              component: 'RadioGroup',
              bindTo: 'props.displayStyle',
              componentProps: {
                options: [
                  { label: '风格一', value: 'style1' },
                  { label: '风格二', value: 'style2' },
                ],
              },
              defaultValue: NOTICE_DEFAULT_PROPS.displayStyle,
            },
          ],
        },
        {
          title: '内容设置',
          fields: [
            {
              key: 'items',
              label: '公告列表',
              component: renderNoticeItemsField,
              bindTo: 'props.items',
              defaultValue: NOTICE_DEFAULT_PROPS.items,
              parseValue: normalizeNoticeItems,
              ifShow: ctx => ctx.values.displayStyle === 'style1',
            },
            {
              key: 'content',
              label: '公告内容',
              component: 'Textarea',
              bindTo: 'props.content',
              componentProps: {
                autoSize: { minRows: 4, maxRows: 8 },
                placeholder: '请输入公告内容',
              },
              defaultValue: NOTICE_DEFAULT_PROPS.content,
              ifShow: ctx => ctx.values.displayStyle === 'style2',
            },
          ],
        },
        {
          title: '按钮设置',
          fields: [
            {
              key: 'buttonType',
              label: '右侧按钮',
              component: 'RadioGroup',
              bindTo: 'props.buttonType',
              componentProps: {
                options: [
                  { label: '无', value: 'none' },
                  { label: '文字', value: 'text' },
                  { label: '图标', value: 'icon' },
                ],
              },
              defaultValue: NOTICE_DEFAULT_PROPS.buttonType,
            },
            {
              key: 'buttonText',
              label: '右侧文字',
              component: 'Input',
              bindTo: 'props.buttonText',
              componentProps: { placeholder: '请输入右侧文字' },
              defaultValue: NOTICE_DEFAULT_PROPS.buttonText,
              ifShow: ctx => ctx.values.buttonType === 'text',
            },
            {
              key: 'buttonFontSize',
              label: '按钮文字大小',
              component: 'SliderNumberInput',
              bindTo: 'props.buttonFontSize',
              componentProps: { min: 10, max: 32 },
              defaultValue: NOTICE_DEFAULT_PROPS.buttonFontSize,
              ifShow: ctx => ctx.values.buttonType === 'text',
            },
            {
              key: 'buttonTextStyle',
              label: '按钮字体样式',
              component: 'RadioGroup',
              bindTo: 'props.buttonTextStyle',
              componentProps: {
                options: [
                  { label: '正常', value: 'normal' },
                  { label: '加粗', value: 'bold' },
                  { label: '倾斜', value: 'italic' },
                ],
              },
              defaultValue: NOTICE_DEFAULT_PROPS.buttonTextStyle,
              ifShow: ctx => ctx.values.buttonType === 'text',
            },
            {
              key: 'buttonIcon',
              label: '右侧图标',
              // prod 的 JImageUpload -> ImageSourceField；fileMaxSize 语义相同（图标类 1MB）
              component: 'ImageSourceField',
              bindTo: 'props.buttonIcon',
              componentProps: {
                fileMaxSize: 1,
              },
              defaultValue: NOTICE_DEFAULT_PROPS.buttonIcon,
              ifShow: ctx => ctx.values.buttonType === 'icon',
            },
            {
              key: 'buttonLink',
              label: '按钮跳转',
              component: 'Input',
              bindTo: 'props.buttonLink',
              defaultValue: NOTICE_DEFAULT_PROPS.buttonLink,
              ifShow: ctx => ctx.values.buttonType !== 'none',
            },
          ],
        },
        {
          title: '公告风格',
          fields: [
            {
              key: 'showNoticeIcon',
              label: '显示公告图标',
              component: 'Switch',
              bindTo: 'props.showNoticeIcon',
              defaultValue: NOTICE_DEFAULT_PROPS.showNoticeIcon,
            },
            {
              key: 'noticeIcon',
              label: '公告图标',
              component: 'ImageSourceField',
              bindTo: 'props.noticeIcon',
              componentProps: {
                fileMaxSize: 1,
              },
              defaultValue: NOTICE_DEFAULT_PROPS.noticeIcon,
              ifShow: ctx => ctx.values.showNoticeIcon !== false,
            },
            {
              key: 'textColor',
              label: '文字颜色',
              component: 'ColorField',
              bindTo: 'props.textColor',
              defaultValue: NOTICE_DEFAULT_PROPS.textColor,
            },
            {
              key: 'textFontSize',
              label: '公告文字大小',
              component: 'SliderNumberInput',
              bindTo: 'props.textFontSize',
              componentProps: { min: 10, max: 32 },
              defaultValue: NOTICE_DEFAULT_PROPS.textFontSize,
            },
            {
              key: 'textStyle',
              label: '公告字体样式',
              component: 'RadioGroup',
              bindTo: 'props.textStyle',
              componentProps: {
                options: [
                  { label: '正常', value: 'normal' },
                  { label: '加粗', value: 'bold' },
                  { label: '倾斜', value: 'italic' },
                ],
              },
              defaultValue: NOTICE_DEFAULT_PROPS.textStyle,
            },
            {
              key: 'styleOneScrollMode',
              label: '滚动方式',
              component: 'RadioGroup',
              bindTo: 'props.styleOneScrollMode',
              componentProps: {
                options: [
                  { label: '上下滚动', value: 'vertical' },
                  { label: '左右滚动', value: 'horizontal' },
                ],
              },
              defaultValue: NOTICE_DEFAULT_PROPS.styleOneScrollMode,
              ifShow: ctx => ctx.values.displayStyle === 'style1',
            },
            {
              key: 'styleOneInterval',
              label: '间隔时间（秒）',
              component: 'SliderNumberInput',
              bindTo: 'props.styleOneInterval',
              componentProps: { min: 1, max: 100 },
              defaultValue: NOTICE_DEFAULT_PROPS.styleOneInterval,
              ifShow: ctx => ctx.values.displayStyle === 'style1',
            },
            {
              key: 'styleTwoShowAll',
              label: '全部显示',
              component: 'Switch',
              bindTo: 'props.styleTwoShowAll',
              defaultValue: NOTICE_DEFAULT_PROPS.styleTwoShowAll,
              ifShow: ctx => ctx.values.displayStyle === 'style2',
              disabled: ctx => ctx.values.styleTwoScrolling === true,
            },
            {
              key: 'styleTwoScrolling',
              label: '开启滚动',
              component: 'Switch',
              bindTo: 'props.styleTwoScrolling',
              defaultValue: NOTICE_DEFAULT_PROPS.styleTwoScrolling,
              ifShow: ctx => ctx.values.displayStyle === 'style2',
            },
            {
              key: 'styleTwoDuration',
              label: '滚动时长（秒）',
              component: 'SliderNumberInput',
              bindTo: 'props.styleTwoDuration',
              componentProps: { min: 1, max: 100 },
              defaultValue: NOTICE_DEFAULT_PROPS.styleTwoDuration,
              ifShow: ctx =>
                ctx.values.displayStyle === 'style2' && ctx.values.styleTwoScrolling === true,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '公告',
    group: DECORATION_MATERIAL_GROUPS.basic.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.basic.title,
    icon: NoticeMaterialIcon,
  },
  presentation: {
    kind: 'visual',
    preview: NoticePreview,
  },
}

export const noticeMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(noticeMaterialDefinition, {
    defaultBackground: createDefaultDiyV2BackgroundConfig(),
  }),
)
