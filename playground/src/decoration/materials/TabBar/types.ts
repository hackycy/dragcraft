export const TAB_BAR_MIN_ITEMS = 2
export const TAB_BAR_MAX_ITEMS = 5

export interface TabBarItem {
  name: string
  icon: string
  activeIcon: string
  /** prod 里是 `MiniAppPagePath`（小程序页面枚举）。playground 无页面注册表，改为自由文本路径。 */
  path: string
  activeColor: string
  inactiveColor: string
}

export interface TabBarProps {
  content: TabBarItem[]
  /**
   * **playground 新增，prod 没有这一项。** prod 靠 `useDiyV2Context().pagePath` 判断哪一项是激活态；
   * playground 无页面概念，改成检查器里可调的索引。
   */
  activeIndex: number
}

export function createTabBarItem(): TabBarItem {
  // prod 的默认名称取自页面标题（TicketHome -> 首页、UserCenterMine -> 我的）；
  // playground 无页面注册表，所以调用方显式给名称。见 createDefaultTabBarItems。
  return {
    name: '导航',
    icon: '',
    activeIcon: '',
    path: '',
    activeColor: '',
    inactiveColor: '',
  }
}

export function createDefaultTabBarItems(): TabBarItem[] {
  return [
    { ...createTabBarItem(), name: '首页' },
    { ...createTabBarItem(), name: '我的' },
  ]
}

export const TAB_BAR_DEFAULT_PROPS: TabBarProps = {
  content: createDefaultTabBarItems(),
  activeIndex: 0,
}

export function normalizeTabBarItems(value: unknown): TabBarItem[] {
  const source = Array.isArray(value) ? value.slice(0, TAB_BAR_MAX_ITEMS) : []
  const normalized = source.map((item) => {
    const record = isRecord(item) ? item : {}

    return {
      name: truncateTabBarName(stringValue(record.name)),
      icon: stringValue(record.icon),
      activeIcon: stringValue(record.activeIcon),
      path: stringValue(record.path),
      activeColor: stringValue(record.activeColor),
      inactiveColor: stringValue(record.inactiveColor),
    }
  })

  const defaults = createDefaultTabBarItems()
  while (normalized.length < TAB_BAR_MIN_ITEMS && defaults.length) {
    normalized.push({ ...defaults[normalized.length % defaults.length] })
  }

  return normalized
}

export function truncateTabBarName(value: string) {
  return Array.from(value).slice(0, 10).join('')
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
