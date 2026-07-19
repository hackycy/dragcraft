import type { DeepReadonly, StyleValueMap } from './types'

const LENGTH_STYLE_KEYS = new Set([
  'bottom',
  'height',
  'left',
  'margin',
  'marginBlock',
  'marginBlockEnd',
  'marginBlockStart',
  'marginBottom',
  'marginInline',
  'marginInlineEnd',
  'marginInlineStart',
  'marginLeft',
  'marginRight',
  'marginTop',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'padding',
  'paddingBlock',
  'paddingBlockEnd',
  'paddingBlockStart',
  'paddingBottom',
  'paddingInline',
  'paddingInlineEnd',
  'paddingInlineStart',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'right',
  'top',
  'width',
])

export function normalizeStyleValueMap(
  style: DeepReadonly<StyleValueMap> | undefined,
): StyleValueMap | undefined {
  if (!style)
    return undefined

  const normalized: StyleValueMap = {}
  for (const [key, value] of Object.entries(style)) {
    normalized[key] = typeof value === 'number' && value !== 0 && LENGTH_STYLE_KEYS.has(key)
      ? `${value}px`
      : value
  }
  return normalized
}
