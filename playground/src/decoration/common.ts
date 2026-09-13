import type { FormSchema, MaterialDefinition } from '@dragcraft/designer'
import type { Component } from 'vue'
import type { DiyV2BackgroundConfig } from './context'

import { defineComponent, h } from 'vue'

import {
  createDiyV2BackgroundStyle,
  createTransparentDiyV2BackgroundConfig,
  normalizeDiyV2BackgroundConfig,
} from './background'
import { DIY_V2_QUAD_MAX, DIY_V2_QUAD_MIN, parseDiyV2CssQuad } from './inspector/quad'
import { getFileAccessHttpUrl } from './shims/file-url'

const TRANSPARENT_BACKGROUND_COLOR = 'transparent'
const DIY_V2_UPWARD_OFFSET_MAX = 600

export type DiyV2CommonMaterialMode = 'full' | 'backgroundOnly'

export interface DiyV2CommonMaterialOptions {
  mode?: DiyV2CommonMaterialMode
  /** Used for node creation, inspector defaults, and legacy preview fallback. */
  defaultBackground?: DiyV2BackgroundConfig
}

/**
 * 给视觉物料包上公共容器：统一承载 `style.container` 的层级/上浮与 `style.content` 的
 * 间距、圆角、裁剪、阴影、背景，并把结构化的 `style.content.background` 翻译成真正的 CSS。
 *
 * dragcraft 的 node-host 会把 `style.content` 当内联样式对象原样透传，所以
 * `background` 这个结构化对象必须由这里的 preview wrapper 解释，否则物料的背景不会生效。
 */
export function createDiyV2CommonMaterialDefinition<Props extends object>(
  definition: MaterialDefinition<Props>,
  options: DiyV2CommonMaterialOptions = {},
): MaterialDefinition<Props> {
  if (definition.presentation.kind !== 'visual') {
    return definition
  }

  const mode = options.mode || 'full'
  const defaultBackground = options.defaultBackground
    ? normalizeDiyV2BackgroundConfig(options.defaultBackground)
    : undefined
  const schema = createSchemaWithDefaultBackground(definition.schema, defaultBackground)

  return {
    ...definition,
    schema,
    inspector: {
      ...definition.inspector,
      formSchema: createCommonMaterialFormSchema(
        definition.inspector?.formSchema,
        mode,
        defaultBackground,
      ),
    },
    presentation: {
      ...definition.presentation,
      preview: createCommonMaterialPreview(definition.presentation.preview, defaultBackground),
    },
  }
}

function createSchemaWithDefaultBackground<Props extends object>(
  schema: MaterialDefinition<Props>['schema'],
  defaultBackground: DiyV2BackgroundConfig | undefined,
) {
  if (!defaultBackground) {
    return schema
  }

  const defaultStyle = schema?.defaultStyle
  const defaultContent = defaultStyle?.content
  const content = isRecord(defaultContent) ? defaultContent : {}

  return {
    ...schema,
    defaultStyle: {
      ...defaultStyle,
      content: {
        ...content,
        background: normalizeDiyV2BackgroundConfig(defaultBackground),
      },
    },
  }
}

function createCommonMaterialFormSchema(
  formSchema: FormSchema | undefined,
  mode: DiyV2CommonMaterialMode,
  defaultBackground: DiyV2BackgroundConfig | undefined,
): FormSchema {
  return {
    sections: [
      ...(formSchema?.sections || []),
      ...(mode === 'full' ? [createCommonLayoutSection()] : []),
      createCommonStyleSection(defaultBackground),
    ],
  }
}

function createCommonLayoutSection(): FormSchema['sections'][number] {
  return {
    title: '通用布局',
    fields: [
      {
        key: 'commonUpwardOffset',
        label: '组件上浮',
        component: 'SliderNumberInput',
        bindTo: {
          scope: 'node',
          path: 'style.container.marginTop',
        },
        componentProps: {
          min: DIY_V2_QUAD_MIN,
          max: DIY_V2_UPWARD_OFFSET_MAX,
        },
        defaultValue: DIY_V2_QUAD_MIN,
        valueFormat: value => normalizeUpwardOffsetNumber(Math.abs(readStyleNumber(value))),
        parseValue: (value) => {
          const offset = normalizeUpwardOffsetNumber(value)
          return offset ? `-${offset}px` : '0px'
        },
      },
      {
        key: 'commonLayer',
        label: '组件层级',
        component: 'SliderNumberInput',
        bindTo: {
          scope: 'node',
          path: 'style.container.zIndex',
        },
        componentProps: {
          min: DIY_V2_QUAD_MIN,
          max: DIY_V2_QUAD_MAX,
        },
        defaultValue: DIY_V2_QUAD_MIN,
        valueFormat: value => normalizeCommonNumber(readStyleNumber(value)),
        parseValue: normalizeCommonNumber,
      },
    ],
  }
}

function createCommonStyleSection(
  defaultBackground: DiyV2BackgroundConfig | undefined,
): FormSchema['sections'][number] {
  return {
    title: '通用样式',
    fields: [
      {
        key: 'commonPadding',
        label: '内边距',
        component: 'QuadNumberInput',
        bindTo: {
          scope: 'node',
          path: 'style.content.padding',
        },
        componentProps: {
          kind: 'spacing',
          min: DIY_V2_QUAD_MIN,
          max: DIY_V2_QUAD_MAX,
        },
        defaultValue: '0px',
      },
      {
        key: 'commonMargin',
        label: '外边距',
        component: 'QuadNumberInput',
        bindTo: {
          scope: 'node',
          path: 'style.content.margin',
        },
        componentProps: {
          kind: 'spacing',
          min: DIY_V2_QUAD_MIN,
          max: DIY_V2_QUAD_MAX,
        },
        defaultValue: '0px',
      },
      {
        key: 'commonBorderRadius',
        label: '圆角',
        component: 'QuadNumberInput',
        bindTo: {
          scope: 'node',
          path: 'style.content.borderRadius',
        },
        componentProps: {
          kind: 'radius',
          min: DIY_V2_QUAD_MIN,
          max: DIY_V2_QUAD_MAX,
        },
        defaultValue: '0px',
      },
      {
        key: 'commonBoxShadow',
        label: '阴影',
        component: 'ShadowConfig',
        bindTo: {
          scope: 'node',
          path: 'style.content.boxShadow',
        },
        defaultValue: '',
      },
      ...createBackgroundFields(defaultBackground),
    ],
  }
}

function createBackgroundFields(
  defaultBackground: DiyV2BackgroundConfig | undefined,
): FormSchema['sections'][number]['fields'] {
  const background = defaultBackground || createTransparentDiyV2BackgroundConfig()

  return [
    {
      key: 'commonBackgroundImage',
      label: '背景图',
      component: 'ImageSourceField',
      bindTo: {
        scope: 'node',
        path: 'style.content.background.image',
      },
      // prod 这里是 JImageUpload 的 fileMax（数量 1）与 listType（picture-card），都是那个组件专有的；
      // ImageSourceField 天然只产出一个字符串，故无需搬。2MB 上限是它的默认值。
      defaultValue: background.image,
    },
    {
      key: 'commonBackgroundImageMode',
      label: '背景图展示方式',
      component: 'BackgroundImageModeField',
      bindTo: {
        scope: 'node',
        path: 'style.content.background.imageMode',
      },
      ifShow: ({ values }) => Boolean(values.commonBackgroundImage),
      defaultValue: background.imageMode,
    },
    {
      key: 'commonBackgroundColor',
      label: '背景色',
      component: 'BackgroundColorConfig',
      bindTo: {
        scope: 'node',
        path: 'style.content.background.color',
      },
      defaultValue: background.color,
    },
  ]
}

function createCommonMaterialPreview(
  preview: Component,
  defaultBackground: DiyV2BackgroundConfig | undefined,
) {
  return defineComponent({
    name: 'DiyV2CommonMaterialPreview',
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => {
        const { style, class: className, ...previewAttrs } = attrs
        const { componentAttrs, surfaceAttrs } = splitPreviewAttrs(previewAttrs)

        return h(
          'div',
          {
            ...surfaceAttrs,
            class: ['pg-common-material-preview', className],
            style: createPreviewStyle(style, defaultBackground),
          },
          [h(preview, componentAttrs)],
        )
      }
    },
  })
}

function splitPreviewAttrs(attrs: Record<string, unknown>) {
  const componentAttrs: Record<string, unknown> = {}
  const surfaceAttrs: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('data-dc-') || key.startsWith('on')) {
      surfaceAttrs[key] = value
    }
    else {
      componentAttrs[key] = value
    }
  }

  return { componentAttrs, surfaceAttrs }
}

function createPreviewStyle(value: unknown, defaultBackground?: DiyV2BackgroundConfig) {
  if (!isRecord(value)) {
    return defaultBackground ? createPreviewBackgroundStyle(defaultBackground) : value
  }

  const clippingStyle = hasVisibleBorderRadius(value.borderRadius) ? { overflow: 'hidden' } : {}
  const background = isRecord(value.background) ? value.background : defaultBackground
  if (!isRecord(background)) {
    return { ...value, ...clippingStyle }
  }

  const style = { ...value }
  delete style.background
  const config = normalizeDiyV2BackgroundConfig(
    background,
    defaultBackground?.color.stops[0]?.color || TRANSPARENT_BACKGROUND_COLOR,
  )

  return {
    ...style,
    ...clippingStyle,
    ...createPreviewBackgroundStyle(config),
  }
}

function createPreviewBackgroundStyle(config: DiyV2BackgroundConfig) {
  const backgroundStyle = createDiyV2BackgroundStyle(
    config,
    config.image ? getFileAccessHttpUrl(config.image) : '',
  )

  return {
    ...backgroundStyle,
    '--dc-internal-material-background-color': backgroundStyle.backgroundColor,
    '--dc-internal-material-background-image': backgroundStyle.backgroundImage,
    '--dc-internal-material-background-position': backgroundStyle.backgroundPosition,
    '--dc-internal-material-background-repeat': backgroundStyle.backgroundRepeat,
    '--dc-internal-material-background-size': backgroundStyle.backgroundSize,
  }
}

function hasVisibleBorderRadius(value: unknown) {
  return Object.values(parseDiyV2CssQuad(value)).some(radius => radius > 0)
}

function normalizeCommonNumber(value: unknown) {
  return normalizeNumber(value, DIY_V2_QUAD_MAX)
}

function normalizeUpwardOffsetNumber(value: unknown) {
  return normalizeNumber(value, DIY_V2_UPWARD_OFFSET_MAX)
}

function normalizeNumber(value: unknown, max: number) {
  return Math.min(max, Math.max(DIY_V2_QUAD_MIN, Math.round(readStyleNumber(value))))
}

function readStyleNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return 0
  }

  const match = /^-?(?:\d+|\d*\.\d+)(?:px)?$/i.exec(value.trim())
  return match ? Number(match[0].replace(/px$/i, '')) : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
