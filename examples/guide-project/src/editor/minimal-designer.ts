import { buildComponentMap, createDesigner, getWidgetMetas } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { textWidgetDefinition } from '../domain/widgets/text'

// #region tutorial-minimal-designer
export function createMinimalDesigner() {
  const definitions = [textWidgetDefinition]

  return createDesigner({
    widgetMetas: getWidgetMetas(definitions),
    componentMap: buildComponentMap(definitions),
    fieldComponentMap: createAntDesignVueFields(),
  })
}
// #endregion tutorial-minimal-designer
