import { buildComponentMap, createDesigner, getWidgetMetas } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { textWidgetDefinition } from '../domain/widgets/text'

export function createMinimalDesigner() {
  const definitions = [textWidgetDefinition]

  return createDesigner({
    engineOptions: {
      initialSchema: {
        version: '1.0.0',
        globalConfig: {},
        root: {
          id: 'root',
          type: 'root',
          props: {},
          children: [{
            id: 'welcome-text',
            type: 'guide-text',
            props: { content: '欢迎使用 DragCraft' },
          }],
        },
      },
    },
    widgetMetas: getWidgetMetas(definitions),
    componentMap: buildComponentMap(definitions),
    fieldComponentMap: createAntDesignVueFields(),
  })
}
