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

export function normalizeStyle(style: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!style)
    return undefined

  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(style)) {
    normalized[key] = typeof value === 'number' && value !== 0 && LENGTH_STYLE_KEYS.has(key)
      ? `${value}px`
      : value
  }
  return normalized
}
