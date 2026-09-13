export type NoticeStyle = 'style1' | 'style2'
export type NoticeButtonType = 'none' | 'text' | 'icon'
export type NoticeStyleOneScrollMode = 'vertical' | 'horizontal'
export type NoticeTextStyle = 'normal' | 'bold' | 'italic'

export interface NoticeItem {
  title: string
  link: string
  enabled: boolean
}

export interface NoticeProps {
  displayStyle: NoticeStyle
  showNoticeIcon: boolean
  noticeIcon: string
  textColor: string
  textFontSize: number
  textStyle: NoticeTextStyle
  items: NoticeItem[]
  content: string
  buttonType: NoticeButtonType
  buttonText: string
  buttonIcon: string
  buttonLink: string
  buttonFontSize: number
  buttonTextStyle: NoticeTextStyle
  styleOneScrollMode: NoticeStyleOneScrollMode
  styleOneInterval: number
  styleTwoShowAll: boolean
  styleTwoScrolling: boolean
  styleTwoDuration: number
}

export const NOTICE_DEFAULT_PROPS: NoticeProps = {
  displayStyle: 'style1',
  showNoticeIcon: true,
  noticeIcon: '',
  textColor: '#8c5a00',
  textFontSize: 14,
  textStyle: 'normal',
  items: [createNoticeItem()],
  content: '',
  buttonType: 'none',
  buttonText: '更多',
  buttonIcon: '',
  buttonLink: '',
  buttonFontSize: 13,
  buttonTextStyle: 'normal',
  styleOneScrollMode: 'vertical',
  styleOneInterval: 3,
  styleTwoShowAll: true,
  styleTwoScrolling: false,
  styleTwoDuration: 10,
}

export function createNoticeItem(): NoticeItem {
  return {
    title: '这是一条公告',
    link: '',
    enabled: true,
  }
}

export function normalizeNoticeItems(value: unknown): NoticeItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = isRecord(item) ? item : {}

    return {
      title: stringValue(record.title),
      link: stringValue(record.link),
      enabled: record.enabled === true,
    }
  })
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
