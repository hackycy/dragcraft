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

const BACKGROUND_STYLE_KEYS = new Set([
  'background',
  'backgroundAttachment',
  'backgroundBlendMode',
  'backgroundClip',
  'backgroundColor',
  'backgroundImage',
  'backgroundOrigin',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundSize',
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

export function pickBackgroundStyle(style: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!style)
    return undefined

  const backgroundStyle: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(style)) {
    if (BACKGROUND_STYLE_KEYS.has(key))
      backgroundStyle[key] = value
  }
  return Object.keys(backgroundStyle).length > 0 ? backgroundStyle : undefined
}
