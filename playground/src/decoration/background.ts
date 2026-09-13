import type {
  DiyV2BackgroundColor,
  DiyV2BackgroundConfig,
  DiyV2BackgroundDirection,
  DiyV2BackgroundImageMode,
  DiyV2BackgroundStop,
} from './context'

import {
  DEFAULT_BACKGROUND_DIRECTION,
  DEFAULT_BACKGROUND_IMAGE_MODE,
  DEFAULT_PAGE_BACKGROUND_COLOR,
} from './context'

const MAX_BACKGROUND_STOPS = 8
const BACKGROUND_IMAGE_MODES: readonly DiyV2BackgroundImageMode[] = [
  'top',
  'bottom',
  'center',
  'repeat',
  'cover',
]
const BACKGROUND_DIRECTIONS: readonly DiyV2BackgroundDirection[] = [
  'vertical',
  'horizontal',
  'diagonalLeft',
  'diagonalRight',
]

export interface DiyV2BackgroundStyle {
  backgroundColor: string
  backgroundImage: string
  backgroundPosition: string
  backgroundRepeat: string
  backgroundSize: string
}

export interface DiyV2BackgroundColorStyle {
  backgroundColor: string
  backgroundImage: string
}

export function createDefaultDiyV2BackgroundColor(): DiyV2BackgroundColor {
  return {
    direction: DEFAULT_BACKGROUND_DIRECTION,
    stops: [{ id: 'stop-1', color: DEFAULT_PAGE_BACKGROUND_COLOR, percent: 0 }],
  }
}

export function createDefaultDiyV2BackgroundConfig(): DiyV2BackgroundConfig {
  return {
    image: '',
    imageMode: DEFAULT_BACKGROUND_IMAGE_MODE,
    color: createDefaultDiyV2BackgroundColor(),
  }
}

export function createTransparentDiyV2BackgroundConfig(): DiyV2BackgroundConfig {
  return {
    image: '',
    imageMode: DEFAULT_BACKGROUND_IMAGE_MODE,
    color: {
      direction: DEFAULT_BACKGROUND_DIRECTION,
      stops: [{ id: 'stop-1', color: 'transparent', percent: 0 }],
    },
  }
}

export function normalizeDiyV2BackgroundColor(
  value: unknown,
  legacyColor?: unknown,
): DiyV2BackgroundColor {
  const record = isRecord(value) ? value : undefined
  const direction = isBackgroundDirection(record?.direction)
    ? record.direction
    : DEFAULT_BACKGROUND_DIRECTION
  const rawStops = Array.isArray(record?.stops) ? record.stops : []
  const usedStopIds = new Set<string>()
  const stops = rawStops
    .slice(0, MAX_BACKGROUND_STOPS)
    .map((stop, index) => normalizeBackgroundStop(stop, index, usedStopIds))

  if (stops.length > 0) {
    return {
      direction,
      stops,
    }
  }

  const fallbackColor = normalizeColor(legacyColor) || DEFAULT_PAGE_BACKGROUND_COLOR
  return {
    direction,
    stops: [{ id: 'stop-1', color: fallbackColor, percent: 0 }],
  }
}

export function normalizeDiyV2BackgroundConfig(
  value: unknown,
  legacyColor?: unknown,
): DiyV2BackgroundConfig {
  const record = isRecord(value) ? value : undefined
  const image = typeof record?.image === 'string' ? record.image.trim() : ''
  const imageMode = isBackgroundImageMode(record?.imageMode)
    ? record.imageMode
    : DEFAULT_BACKGROUND_IMAGE_MODE

  return {
    image,
    imageMode,
    color: normalizeDiyV2BackgroundColor(record?.color, legacyColor),
  }
}

export function createDiyV2BackgroundColorStyle(
  color: DiyV2BackgroundColor,
): DiyV2BackgroundColorStyle {
  const normalizedColor = normalizeDiyV2BackgroundColor(color)
  const fallbackColor = normalizedColor.stops[0]?.color || DEFAULT_PAGE_BACKGROUND_COLOR
  const validStops = normalizedColor.stops.filter(stop => isValidBackgroundPercent(stop.percent))
  const backgroundImage
    = validStops.length > 1
      ? `linear-gradient(${getGradientDirection(normalizedColor.direction)}, ${validStops
        .map(stop => `${stop.color} ${stop.percent}%`)
        .join(', ')})`
      : 'none'

  return {
    backgroundColor: fallbackColor,
    backgroundImage,
  }
}

export function createDiyV2BackgroundStyle(
  config: DiyV2BackgroundConfig,
  imageUrl = config.image,
): DiyV2BackgroundStyle {
  const colorStyle = createDiyV2BackgroundColorStyle(config.color)
  const imageLayer = imageUrl ? `url(${JSON.stringify(imageUrl)})` : ''
  const colorLayer = colorStyle.backgroundImage === 'none' ? '' : colorStyle.backgroundImage
  const backgroundImage = [imageLayer, colorLayer].filter(Boolean).join(', ') || 'none'
  const imageMode = getBackgroundImageModeStyle(config.imageMode)
  const hasImage = Boolean(imageLayer)
  const hasColorLayer = Boolean(colorLayer)

  return {
    backgroundColor: colorStyle.backgroundColor,
    backgroundImage,
    backgroundPosition: hasImage
      ? `${imageMode.position}${hasColorLayer ? ', center' : ''}`
      : 'center',
    backgroundRepeat: hasImage
      ? `${imageMode.repeat}${hasColorLayer ? ', no-repeat' : ''}`
      : hasColorLayer
        ? 'no-repeat'
        : 'repeat',
    backgroundSize: hasImage
      ? `${imageMode.size}${hasColorLayer ? ', 100% 100%' : ''}`
      : hasColorLayer
        ? '100% 100%'
        : 'auto',
  }
}

function normalizeBackgroundStop(
  value: unknown,
  index: number,
  usedIds: Set<string>,
): DiyV2BackgroundStop {
  const record = isRecord(value) ? value : undefined
  const rawId = typeof record?.id === 'string' ? record.id.trim() : ''
  const baseId = rawId || `stop-${index + 1}`
  let id = baseId
  let duplicateIndex = 2
  while (usedIds.has(id)) {
    id = `${baseId}-${duplicateIndex}`
    duplicateIndex += 1
  }
  usedIds.add(id)
  const color = normalizeColor(record?.color) || 'transparent'
  const percentValue = record?.percent
  const percent
    = typeof percentValue === 'number' && Number.isFinite(percentValue) ? percentValue : null

  return { id, color, percent }
}

function isValidBackgroundPercent(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 100
}

function normalizeColor(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBackgroundImageMode(value: unknown): value is DiyV2BackgroundImageMode {
  return (
    typeof value === 'string' && BACKGROUND_IMAGE_MODES.includes(value as DiyV2BackgroundImageMode)
  )
}

function isBackgroundDirection(value: unknown): value is DiyV2BackgroundDirection {
  return (
    typeof value === 'string' && BACKGROUND_DIRECTIONS.includes(value as DiyV2BackgroundDirection)
  )
}

function getGradientDirection(direction: DiyV2BackgroundDirection) {
  switch (direction) {
    case 'horizontal':
      return 'to right'
    case 'diagonalLeft':
      return 'to bottom right'
    case 'diagonalRight':
      return 'to bottom left'
    default:
      return 'to bottom'
  }
}

function getBackgroundImageModeStyle(mode: DiyV2BackgroundImageMode) {
  switch (mode) {
    case 'top':
      return { position: 'center top', repeat: 'no-repeat', size: 'contain' }
    case 'bottom':
      return { position: 'center bottom', repeat: 'no-repeat', size: 'contain' }
    case 'center':
      return { position: 'center center', repeat: 'no-repeat', size: 'contain' }
    case 'repeat':
      return { position: '0 0', repeat: 'repeat', size: 'auto' }
    default:
      return { position: 'center center', repeat: 'no-repeat', size: 'cover' }
  }
}
