export type TitleTextStyle = 'normal' | 'bold' | 'italic'

export interface TitleProps {
  title: string
  titleLink: string
  titleCentered: boolean
  icon: string
  subtitle: string
  subtitleCentered: boolean
  sameLine: boolean
  titleColor: string
  titleTextStyle: TitleTextStyle
  titleFontSize: number
  subtitleColor: string
  subtitleTextStyle: TitleTextStyle
  subtitleFontSize: number
  showMore: boolean
  moreText: string
  moreLink: string
  moreColor: string
  moreTextStyle: TitleTextStyle
  moreFontSize: number
}

export const TITLE_DEFAULT_PROPS: TitleProps = {
  title: '标题',
  titleLink: '',
  titleCentered: false,
  icon: '',
  subtitle: '',
  subtitleCentered: false,
  sameLine: false,
  titleColor: '#333333',
  titleTextStyle: 'normal',
  titleFontSize: 16,
  subtitleColor: '#999999',
  subtitleTextStyle: 'normal',
  subtitleFontSize: 12,
  showMore: false,
  moreText: '更多',
  moreLink: '',
  moreColor: '#999999',
  moreTextStyle: 'normal',
  moreFontSize: 12,
}
