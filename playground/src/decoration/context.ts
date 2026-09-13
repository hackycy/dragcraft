export const DEFAULT_THEME_COLOR = '#475AF6'
export const DEFAULT_PAGE_BACKGROUND_COLOR = '#FFFFFF'

export const DEFAULT_BACKGROUND_IMAGE_MODE = 'cover' as const
export const DEFAULT_BACKGROUND_DIRECTION = 'vertical' as const

export type DiyV2BackgroundImageMode = 'top' | 'bottom' | 'center' | 'repeat' | 'cover'
export type DiyV2BackgroundDirection = 'vertical' | 'horizontal' | 'diagonalLeft' | 'diagonalRight'

export interface DiyV2BackgroundStop {
  id: string
  color: string
  percent: number | null
}

export interface DiyV2BackgroundColor {
  direction: DiyV2BackgroundDirection
  stops: DiyV2BackgroundStop[]
}

export interface DiyV2BackgroundConfig {
  image: string
  imageMode: DiyV2BackgroundImageMode
  color: DiyV2BackgroundColor
}

export interface DiyV2GlobalConfig {
  themeColor: string
  background: DiyV2BackgroundConfig
}
