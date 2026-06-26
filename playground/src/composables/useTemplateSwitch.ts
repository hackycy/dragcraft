import type { DesignerSchema } from '@dragcraft/designer'
import type { TemplateEntry } from '../config/templates'

import { ref } from 'vue'
import { templateRegistry } from '../config/templates'

export interface UseTemplateSwitchOptions {
  importSchema: (schema: DesignerSchema) => void
  exportSchema: () => DesignerSchema
  confirmSwitch?: () => boolean
}

export function useTemplateSwitch(options: UseTemplateSwitchOptions) {
  const { importSchema, exportSchema, confirmSwitch } = options

  const activeTemplateId = ref(templateRegistry[0].id)
  const templates: TemplateEntry[] = templateRegistry

  function getActiveTemplate(): TemplateEntry {
    return templates.find(t => t.id === activeTemplateId.value) ?? templates[0]
  }

  function isModified(): boolean {
    const current = JSON.stringify(exportSchema())
    const baseline = JSON.stringify(getActiveTemplate().schema)
    return current !== baseline
  }

  function switchTemplate(id: string) {
    if (id === activeTemplateId.value)
      return

    const target = templates.find(t => t.id === id)
    if (!target)
      return

    if (isModified()) {
      if (confirmSwitch && !confirmSwitch())
        return
    }

    importSchema(target.schema)
    activeTemplateId.value = id
  }

  function resetTemplate() {
    const template = getActiveTemplate()
    importSchema(template.schema)
  }

  return {
    activeTemplateId,
    templates,
    switchTemplate,
    resetTemplate,
  }
}
