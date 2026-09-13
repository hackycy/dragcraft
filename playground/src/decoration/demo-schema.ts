import type { DocumentSchema } from '@dragcraft/designer'

import { DEFAULT_THEME_COLOR } from './context'
import { DECORATION_MATERIALS } from './registry'

type SchemaNode = DocumentSchema['nodes'][number]
type SchemaProps = SchemaNode['props']

/**
 * playground 打开时的初始画布：一屏很简单的示例，只由四个物料组成——
 * 导航栏 → 轮播图 → 辅助空白 → 导航组。
 *
 * （早期版本曾用全部 14 个物料拼一屏，后按需要收窄；其余物料仍全部注册在物料栏里可用。）
 *
 * 顺序、文案、图片都是刻意选的演示点：轮播配了 3 张图、导航组 4 列 × 2 行共 8 项。
 * 每个节点的 props 都由该物料的 `defaultProps` 派生后再覆盖少数几项，这样不会漏 key
 * （物料的默认值是唯一真源，未来改了默认值示例也不会失配）。
 */
function defaultPropsFor(type: string): SchemaProps {
  const material = DECORATION_MATERIALS.find(item => item.type === type)
  if (!material) {
    throw new Error(`示例 schema 引用了未注册的物料: ${type}`)
  }

  // 物料目录已保证 defaultProps 是合法 JSON，这里只是深拷一份
  return cloneJson(material.schema?.defaultProps ?? {}) as SchemaProps
}

function createNode(id: string, type: string, props: SchemaProps = {}): SchemaNode {
  return {
    id,
    type,
    props: { ...defaultPropsFor(type), ...props },
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function image(seed: string, width: number, height: number) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

function navigationItem(title: string) {
  return {
    icon: '',
    title,
    link: '',
    badge: {
      enabled: false,
      type: 'text',
      text: '',
      image: '',
      offsetTop: 0,
      offsetRight: 0,
      backgroundColor: '#ff4d4f',
      radius: 8,
    },
  }
}

const NAV_BAR_ID = 'demo-nav-bar'

export const DECORATION_DEMO_SCHEMA: DocumentSchema = {
  version: '1',
  globalConfig: {
    themeColor: DEFAULT_THEME_COLOR,
    background: {
      image: '',
      imageMode: 'cover',
      color: {
        direction: 'vertical',
        // 浅灰页面底色，好让白色的顶栏与底栏、以及导航组的卡片看得出来
        stops: [{ id: 'stop-1', color: '#F2F3F5', percent: 0 }],
      },
    },
  },
  page: {
    props: {},
    style: {
      surface: {},
    },
  },
  nodes: [
    createNode(NAV_BAR_ID, 'miniapp.nav-bar', { title: '首页' }),

    createNode('demo-carousel', 'miniapp.carousel', {
      height: 180,
      interval: 4,
      items: [
        { src: image('dragcraft-carousel-1', 750, 300), link: '' },
        { src: image('dragcraft-carousel-2', 750, 300), link: '' },
        { src: image('dragcraft-carousel-3', 750, 300), link: '' },
      ],
    }),

    createNode('demo-spacer', 'miniapp.spacer', { height: 16 }),

    createNode('demo-navigation-group', 'miniapp.navigation-group', {
      columnCount: 4,
      rowCount: 2,
      content: [
        '景点门票',
        '酒店住宿',
        '特色美食',
        '游玩攻略',
        '交通指南',
        '游客服务',
        '停车缴费',
        '客服中心',
      ].map(navigationItem),
    }),
  ],
  structure: {
    root: [NAV_BAR_ID, 'demo-carousel', 'demo-spacer', 'demo-navigation-group'],
    containers: {},
  },
}
