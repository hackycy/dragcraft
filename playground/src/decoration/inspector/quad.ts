export interface DiyV2QuadValue {
  top: number
  right: number
  bottom: number
  left: number
}

export const DIY_V2_QUAD_MIN = 0
export const DIY_V2_QUAD_MAX = 100

export function parseDiyV2CssQuad(
  value: unknown,
  min = DIY_V2_QUAD_MIN,
  max = DIY_V2_QUAD_MAX,
): DiyV2QuadValue {
  if (isRecord(value)) {
    return {
      top: normalizeDiyV2QuadNumber(value.top, min, max),
      right: normalizeDiyV2QuadNumber(value.right, min, max),
      bottom: normalizeDiyV2QuadNumber(value.bottom, min, max),
      left: normalizeDiyV2QuadNumber(value.left, min, max),
    }
  }

  const tokens = toTokens(value)
  const values = tokens.map(token => normalizeDiyV2QuadNumber(token, min, max))

  switch (values.length) {
    case 1:
      return createQuad(values[0])
    case 2:
      return {
        top: values[0],
        right: values[1],
        bottom: values[0],
        left: values[1],
      }
    case 3:
      return {
        top: values[0],
        right: values[1],
        bottom: values[2],
        left: values[1],
      }
    case 4:
      return {
        top: values[0],
        right: values[1],
        bottom: values[2],
        left: values[3],
      }
    default:
      return createQuad(0)
  }
}

export function serializeDiyV2CssQuad(
  value: unknown,
  min = DIY_V2_QUAD_MIN,
  max = DIY_V2_QUAD_MAX,
) {
  const normalized = parseDiyV2CssQuad(value, min, max)
  const { top, right, bottom, left } = normalized

  if (top === right && right === bottom && bottom === left) {
    return toPx(top)
  }

  if (top === bottom && right === left) {
    return `${toPx(top)} ${toPx(right)}`
  }

  if (right === left) {
    return `${toPx(top)} ${toPx(right)} ${toPx(bottom)}`
  }

  return `${toPx(top)} ${toPx(right)} ${toPx(bottom)} ${toPx(left)}`
}

export function isDiyV2QuadLinked(value: DiyV2QuadValue) {
  return value.top === value.right && value.right === value.bottom && value.bottom === value.left
}

export function normalizeDiyV2QuadNumber(value: unknown, min: number, max: number) {
  const candidate = toNumber(value)
  const normalizedMin = Number.isFinite(min) ? Math.round(min) : DIY_V2_QUAD_MIN
  const normalizedMax = Number.isFinite(max) ? Math.round(max) : DIY_V2_QUAD_MAX
  const lowerBound = Math.min(normalizedMin, normalizedMax)
  const upperBound = Math.max(normalizedMin, normalizedMax)

  return Math.min(upperBound, Math.max(lowerBound, Math.round(candidate ?? lowerBound)))
}

function createQuad(value: number): DiyV2QuadValue {
  return { top: value, right: value, bottom: value, left: value }
}

function toTokens(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.slice(0, 4)
  }

  if (typeof value === 'number') {
    return [value]
  }

  if (typeof value !== 'string') {
    return []
  }

  const normalized = value.trim()
  return normalized ? normalized.split(/\s+/).slice(0, 4) : []
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const match = /^(-?(?:\d+|\d*\.\d+))(?:px)?$/i.exec(value.trim())
  if (!match) {
    return undefined
  }

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : undefined
}

function toPx(value: number) {
  return `${value}px`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
