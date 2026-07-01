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
  defaultLayout: {
    slot: 'tab-bar.surface',
    sortScope: false,
  },
  layoutManifest: {
    slots: {
      'tab-bar.surface': {
        allocation: 'reserve',
        axis: 'block',
        edge: 'end',
        order: 10,
      },
    },
  },
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(c => c.type === 'tab-bar')
  },
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
        title: 'Tab 配置',
        fields: [
          {
            key: 'tabs',
            label: 'Tab 列表',
            component: 'array',
            props: {
              itemFields: [
                {
                  key: 'label',
                  label: '标签文字',
                  component: 'input',
                  props: { placeholder: '请输入标签文字' },
                },
                {
                  key: 'icon',
                  label: '图标',
                  component: 'input',
                  props: { placeholder: '请输入图标名称' },
                },
              ],
              defaultItem: { label: '新标签', icon: 'home' },
              sortable: true,
              minItems: 2,
              maxItems: 5,
            },
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
