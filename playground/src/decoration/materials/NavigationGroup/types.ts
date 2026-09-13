export type NavigationDisplayStyle = 'image-text' | 'image' | 'text'
export type NavigationDisplayMode = 'fixed' | 'paged'
export type NavigationScrollMode = 'scrollx' | 'fade'
export type NavigationObjectFit = 'cover' | 'contain' | 'fill'
export type NavigationTitleTextStyle = 'normal' | 'bold' | 'italic'
export type NavigationBadgeType = 'text' | 'image'
export type NavigationIndicatorPosition = 'top' | 'bottom' | 'left' | 'right'
export type NavigationIndicatorAlign = 'start' | 'center' | 'end'
export type NavigationIndicatorStyle = 'dot' | 'bar' | 'number'

export interface NavigationBadge {
  enabled: boolean
  type: NavigationBadgeType
  text: string
  image: string
  offsetTop: number
  offsetRight: number
  backgroundColor: string
  radius: number
}

export interface NavigationItem {
  icon: string
  title: string
  link: string
  badge: NavigationBadge
}

export interface NavigationGroupProps {
  navigationStyle: NavigationDisplayStyle
  columnCount: number
  displayMode: NavigationDisplayMode
  rowCount: number
  content: NavigationItem[]
  imageTextGap: number
  imageRadius: number
  imageSize: number
  objectFit: NavigationObjectFit
  titleColor: string
  titleTextStyle: NavigationTitleTextStyle
  titleFontSize: number
  autoplay: boolean
  interval: number
  scrollMode: NavigationScrollMode
  showIndicator: boolean
  indicatorPosition: NavigationIndicatorPosition
  indicatorAlign: NavigationIndicatorAlign
  indicatorStyle: NavigationIndicatorStyle
  indicatorActiveColor: string
  indicatorInactiveColor: string
  indicatorSize: number
  indicatorRadius: number
  indicatorMargin: number
}

export const DEFAULT_NAVIGATION_BADGE: NavigationBadge = {
  enabled: false,
  type: 'text',
  text: '',
  image: '',
  offsetTop: 0,
  offsetRight: 0,
  backgroundColor: '#ff4d4f',
  radius: 8,
}

export function createNavigationItem(): NavigationItem {
  return {
    icon: '',
    title: '测试标题',
    link: '',
    badge: { ...DEFAULT_NAVIGATION_BADGE },
  }
}

export const NAVIGATION_GROUP_DEFAULT_PROPS: NavigationGroupProps = {
  navigationStyle: 'image-text',
  columnCount: 4,
  displayMode: 'fixed',
  rowCount: 1,
  content: Array.from({ length: 4 }, createNavigationItem),
  imageTextGap: 6,
  imageRadius: 0,
  imageSize: 48,
  objectFit: 'cover',
  titleColor: '#333333',
  titleTextStyle: 'normal',
  titleFontSize: 14,
  autoplay: true,
  interval: 3,
  scrollMode: 'scrollx',
  showIndicator: true,
  indicatorPosition: 'bottom',
  indicatorAlign: 'center',
  indicatorStyle: 'dot',
  indicatorActiveColor: '#1677ff',
  indicatorInactiveColor: '#d9d9d9',
  indicatorSize: 8,
  indicatorRadius: 8,
  indicatorMargin: 8,
}

export function normalizeNavigationItems(value: unknown): NavigationItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = isRecord(item) ? item : {}
    const badgeRecord = isRecord(record.badge) ? record.badge : {}

    return {
      icon: stringValue(record.icon),
      title: truncateNavigationTitle(stringValue(record.title)),
      link: stringValue(record.link),
      badge: {
        enabled: badgeRecord.enabled === true,
        type: badgeRecord.type === 'image' ? 'image' : 'text',
        text: stringValue(badgeRecord.text),
        image: stringValue(badgeRecord.image),
        offsetTop: numberValue(badgeRecord.offsetTop, DEFAULT_NAVIGATION_BADGE.offsetTop, -100, 100),
        offsetRight: numberValue(
          badgeRecord.offsetRight,
          DEFAULT_NAVIGATION_BADGE.offsetRight,
          -100,
          100,
        ),
        backgroundColor: stringValue(badgeRecord.backgroundColor) || DEFAULT_NAVIGATION_BADGE.backgroundColor,
        radius: numberValue(badgeRecord.radius, DEFAULT_NAVIGATION_BADGE.radius, 0, 50),
      },
    }
  })
}

export function truncateNavigationTitle(value: string) {
  return Array.from(value).slice(0, 10).join('')
}

export function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const candidate = typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.min(max, Math.max(min, Math.round(candidate)))
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
