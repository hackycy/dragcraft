import type { FieldRenderFactory, MaterialDefinition } from '@dragcraft/designer'
import type { TabBarItem } from './types'
import { defineMaterial } from '@dragcraft/designer'

import { h } from 'vue'
import { createDefaultDiyV2BackgroundConfig } from '../../background'
import { createDiyV2CommonMaterialDefinition } from '../../common'
import { DECORATION_MATERIAL_GROUPS } from '../groups'
import TabBarFrame from './TabBarFrame.vue'
import TabBarItemsField from './TabBarItemsField.vue'
import TabBarMaterialIcon from './TabBarMaterialIcon.vue'
import TabBarPreview from './TabBarPreview.vue'
import { normalizeTabBarItems, TAB_BAR_DEFAULT_PROPS } from './types'

export const TAB_BAR_MATERIAL_TYPE = 'miniapp.tab-bar'

const renderTabBarItemsField: FieldRenderFactory = (ctx) => {
  return () =>
    h(TabBarItemsField, {
      'value': ctx.value.value as TabBarItem[] | undefined,
      'disabled': ctx.disabled.value,
      'onUpdate:value': ctx.setValue,
    })
}

/**
 * 与 prod 的三处刻意改造（playground 是单页、无页面注册表）：
 *
 * 1. 每个 tab 项的"页面"从 `MiniAppPagePath` 枚举 + `PageNavigationSelector` 页面选择弹窗，
 *    改成**自由文本路径**（字段名不变，类型从枚举收窄为 `string`）。
 * 2. prod 靠 `useDiyV2Context().pagePath` 判断激活项 —— playground 无页面概念，改用**新增的
 *    `activeIndex`**（defaultProps 与检查器里都有，prod 没有这一项）。
 * 3. prod 只在票务首页注册 TabBar（多页策略）；playground 是扁平注册、单例 create。
 *
 * policy 与 prod 逐条一致（单例 create、duplicate/move/unwrap denied、remove/update allowed）。
 * 走公共 wrapper 的 `backgroundOnly` 模式：只注入"通用样式"分区，不注入"通用布局"。
 */
const tabBarMaterialDefinition: MaterialDefinition = {
  type: TAB_BAR_MATERIAL_TYPE,
  schema: {
    defaultProps: TAB_BAR_DEFAULT_PROPS,
  },
  authoring: {
    policy: {
      create: ({ schema }) =>
        schema.nodes.some(node => node.type === TAB_BAR_MATERIAL_TYPE) ? 'denied' : 'allowed',
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
          title: '内容设置',
          fields: [
            {
              key: 'content',
              label: '内容',
              component: renderTabBarItemsField,
              bindTo: 'props.content',
              defaultValue: TAB_BAR_DEFAULT_PROPS.content,
              parseValue: normalizeTabBarItems,
            },
            {
              key: 'activeIndex',
              label: '默认选中项',
              component: 'SliderNumberInput',
              bindTo: 'props.activeIndex',
              componentProps: { min: 0, max: 4 },
              defaultValue: TAB_BAR_DEFAULT_PROPS.activeIndex,
            },
          ],
        },
      ],
    },
  },
  panel: {
    title: '底部导航',
    group: DECORATION_MATERIAL_GROUPS.basic.name,
    groupTitle: DECORATION_MATERIAL_GROUPS.basic.title,
    icon: TabBarMaterialIcon,
    description: '固定在页面底部的导航入口',
  },
  presentation: {
    kind: 'visual',
    preview: TabBarPreview,
    frame: TabBarFrame,
  },
}

export const tabBarMaterial = defineMaterial(
  createDiyV2CommonMaterialDefinition(tabBarMaterialDefinition, {
    mode: 'backgroundOnly',
    defaultBackground: createDefaultDiyV2BackgroundConfig(),
  }),
)
