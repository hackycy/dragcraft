import type { FormSchema } from '@dragcraft/designer'

import { createDefaultDiyV2BackgroundColor, createDefaultDiyV2BackgroundConfig } from './background'
import { DEFAULT_THEME_COLOR } from './context'

/**
 * prod 的全局配置里还有 `alertSetting`（页面弹窗配置，见 AlertSettingConfig），
 * playground 不需要，故只有主题色与背景三件套。
 * prod 只在票务首页注入 `themeColor`，playground 没有页面概念，所以总是显示。
 */
export function createDecorationGlobalConfigSchema(): FormSchema {
  const defaultBackground = createDefaultDiyV2BackgroundConfig()

  return {
    sections: [
      {
        title: '页面配置',
        fields: [
          {
            key: 'themeColor',
            label: '主题色',
            component: 'ColorField',
            bindTo: {
              scope: 'globalConfig',
              path: 'themeColor',
            },
            defaultValue: DEFAULT_THEME_COLOR,
          },
          {
            key: 'backgroundImage',
            label: '背景图',
            component: 'ImageSourceField',
            bindTo: {
              scope: 'globalConfig',
              path: 'background.image',
            },
            defaultValue: defaultBackground.image,
          },
          {
            key: 'backgroundImageMode',
            label: '背景图展示方式',
            component: 'BackgroundImageModeField',
            bindTo: {
              scope: 'globalConfig',
              path: 'background.imageMode',
            },
            ifShow: ({ values }) => Boolean(values.backgroundImage),
            defaultValue: defaultBackground.imageMode,
          },
          {
            key: 'backgroundColor',
            label: '背景色',
            component: 'BackgroundColorConfig',
            bindTo: {
              scope: 'globalConfig',
              path: 'background.color',
            },
            defaultValue: createDefaultDiyV2BackgroundColor(),
          },
        ],
      },
    ],
  }
}
