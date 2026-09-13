import type { MaterialDefinition } from '@dragcraft/designer'
import { defineMaterial } from '@dragcraft/designer'

import { DECORATION_MATERIAL_GROUPS } from '../groups'
import NavBarFrame from './NavBarFrame.vue'
import NavBarMaterialIcon from './NavBarMaterialIcon.vue'
import NavBarPreview from './NavBarPreview.vue'

export const NAV_BAR_MATERIAL_TYPE = 'miniapp.nav-bar'

/**
 * 与 prod 的两处刻意偏离（playground 是单页、无页面策略）：
 *
 * 1. **面板可见且可拖**：prod 里它是系统维护的隐藏固定物料（`panel.visible: false`、policy 除
 *    update 外全禁）。playground 让它成为普通物料，故补上 group/groupTitle/icon 并置 visible。
 * 2. **policy 用单例 create**，而不是"全 allowed"。原因：prod 从不让用户创建它；它的 frame 用
 *    `useSurfaceReservation({ edge: 'block-start' })` 把内容绝对定位到顶部，两个 NavBar 会**完全重叠**
 *    且各自占位。这与 TabBar（底部同类）和 FloatingButton 的单例规则是同一类理由。
 *
 * 另外它**不走公共 wrapper**（与 prod 一致，NavBar 和 FloatingButton 是 prod 的例外），所以检查器里
 * 没有"通用布局/通用样式"分区。
 */
const navBarMaterialDefinition: MaterialDefinition = {
  type: NAV_BAR_MATERIAL_TYPE,
  schema: {
    defaultProps: {
      title: '',
    },
  },
  authoring: {
    policy: {
      create: ({ schema }) =>
        schema.nodes.some(node => node.type === NAV_BAR_MATERIAL_TYPE) ? 'denied' : 'allowed',
      duplicate: 'denied',
      move: 'denied',
      remove: 'allowed',
      unwrap: 'denied',
      update: 'allowed',
    },
  },
  inspector: {
    formSchema: {
      sections: [
        {
          title: '展示设置',
          fields: [
            {
              key: 'title',
              label: '标题',
              component: 'Input',
              bindTo: 'props.title',
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '导航栏',
    group: DECORATION_MATERIAL_GROUPS.basic.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.basic.title,
    icon: NavBarMaterialIcon,
    visible: true,
  },
  presentation: {
    kind: 'visual',
    preview: NavBarPreview,
    frame: NavBarFrame,
  },
}

export const navBarMaterial = defineMaterial(navBarMaterialDefinition)
