import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
// playground/src/widgets/TabBarWidget.ts
import { defineComponent, h } from 'vue'

interface TabItem {
  label: string
  icon: string
}

const DEFAULT_TABS: TabItem[] = [
  { label: '首页', icon: 'home' },
  { label: '我的', icon: 'user' },
]

const ICON_MAP: Record<string, string> = {
  home: '⌂',
  category: '☷',
  cart: '#',
  user: '*',
  search: '~',
  heart: '♡',
  star: '☆',
  settings: '⚙',
}

export const tabBarWidgetMeta: WidgetMeta = {
  type: 'tab-bar',
  title: 'Tab 栏',
  group: 'navigation',
  icon: 'tabbar',
  draggable: false,
  sortable: false,
  defaultProps: {
    tabs: DEFAULT_TABS,
    activeIndex: 0,
    backgroundColor: '#ffffff',
    activeColor: '#07C160',
    inactiveColor: '#999999',
  },
  defaultStyle: {
    width: '100%',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          {
            key: 'tabs',
            label: 'Tab 配置 (JSON)',
            component: 'textarea',
            defaultValue: DEFAULT_TABS,
            props: { rows: 4, placeholder: 'JSON 数组，每项包含 label 和 icon' },
          },
          {
            key: 'activeIndex',
            label: '当前选中',
            component: 'number',
            defaultValue: 0,
            props: { min: 0, max: 10 },
          },
        ],
      },
      {
        title: '样式设置',
        fields: [
          {
            key: 'backgroundColor',
            label: '背景颜色',
            component: 'color',
            defaultValue: '#ffffff',
          },
          {
            key: 'activeColor',
            label: '选中颜色',
            component: 'color',
            defaultValue: '#07C160',
          },
          {
            key: 'inactiveColor',
            label: '未选中颜色',
            component: 'color',
            defaultValue: '#999999',
          },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcTabBarWidget',

  props: {
    tabs: {
      type: Array as PropType<TabItem[]>,
      default: () => DEFAULT_TABS,
    },
    activeIndex: {
      type: Number as PropType<number>,
      default: 0,
    },
    backgroundColor: {
      type: String as PropType<string>,
      default: '#ffffff',
    },
    activeColor: {
      type: String as PropType<string>,
      default: '#07C160',
    },
    inactiveColor: {
      type: String as PropType<string>,
      default: '#999999',
    },
  },

  setup(props) {
    return () =>
      h('div', {
        class: 'dc-widget-tabbar',
        style: {
          position: 'sticky',
          bottom: '0',
          zIndex: '100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          boxSizing: 'border-box',
          height: '50px',
          paddingBottom: '8px',
          backgroundColor: props.backgroundColor,
          borderTop: '1px solid #f0f0f0',
        },
      }, props.tabs.map((tab, i) =>
        h('div', {
          key: i,
          class: 'dc-widget-tabbar__item',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: i === props.activeIndex ? props.activeColor : props.inactiveColor,
            fontSize: '10px',
          },
        }, [
          h('span', { style: { fontSize: '18px' } }, ICON_MAP[tab.icon] || tab.icon),
          h('span', null, tab.label),
        ]),
      ))
  },
})
