import type { DesignerWidgetMeta, WidgetGroupConfig } from '@dragcraft/designer'
import type { WidgetDefinition } from '@dragcraft/widgets'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/widgets'
import { basicWidgetDefinitions } from './basic'
import { formWidgetDefinitions } from './form'
import { playgroundWidgetMessages } from './messages'
import { miniProgramWidgetDefinitions } from './mini-program'

export const playgroundWidgetDefinitions: WidgetDefinition<DesignerWidgetMeta>[] = [
  ...basicWidgetDefinitions,
  ...formWidgetDefinitions,
  ...miniProgramWidgetDefinitions,
].map(definition => ({
  ...definition,
  meta: {
    ...definition.meta,
    formSchema: {
      ...definition.meta.formSchema,
      sections: [
        ...definition.meta.formSchema.sections,
        {
          title: '容器边距',
          titleKey: 'field.spacing.sectionTitle',
          fields: [
            {
              key: 'containerMargin',
              label: '外边距',
              labelKey: 'field.spacing.margin',
              component: 'Spacing',
              bindTo: { scope: 'node', path: 'style.container' },
              defaultValue: {},
              componentProps: { type: 'margin', min: -120, max: 120 },
            },
            {
              key: 'containerPadding',
              label: '内边距',
              labelKey: 'field.spacing.padding',
              component: 'Spacing',
              bindTo: { scope: 'node', path: 'style.container' },
              defaultValue: {},
              componentProps: { type: 'padding', min: 0, max: 120 },
            },
          ],
        },
      ],
    },
  },
}))

export const playgroundWidgetGroups: WidgetGroupConfig[] = [
  { name: 'basic', title: '基础展示', titleKey: 'group.basic' },
  { name: 'form', title: '表单交互', titleKey: 'group.form' },
  { name: 'navigation', title: '导航容器', titleKey: 'group.navigation' },
  { name: 'action', title: '操作组件', titleKey: 'group.action' },
]

export const playgroundWidgetMetas = getWidgetMetas(playgroundWidgetDefinitions)
export const playgroundComponentMap = buildComponentMap(playgroundWidgetDefinitions)

export { playgroundWidgetMessages }
