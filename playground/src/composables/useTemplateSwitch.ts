import type { DesignerSchema } from '@dragcraft/designer'
import type { TemplateEntry } from '../config/templates'

import { ref } from 'vue'
import { templateRegistry } from '../config/templates'

export interface UseTemplateSwitchOptions {
  importSchema: (schema: DesignerSchema) => void
  exportSchema: () => DesignerSchema
  confirmSwitch?: () => boolean | Promise<boolean>
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

  async function switchTemplate(id: string): Promise<boolean> {
    if (id === activeTemplateId.value)
      return false

    const target = templates.find(t => t.id === id)
    if (!target)
      return false

    if (isModified()) {
      if (confirmSwitch && !(await confirmSwitch()))
        return false
    }

    importSchema(target.schema)
    activeTemplateId.value = id
    return true
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
