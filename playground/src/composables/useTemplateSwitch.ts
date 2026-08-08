import type { TemplateEntry } from '../config/templates'

import { ref } from 'vue'

export interface UseTemplateSwitchOptions<Schema> {
  importSchema: (schema: Schema) => unknown
  exportSchema: () => Schema | null
  templates: readonly TemplateEntry<Schema>[]
  confirmSwitch?: () => boolean | Promise<boolean>
}

export function useTemplateSwitch<Schema>(options: UseTemplateSwitchOptions<Schema>) {
  const { importSchema, exportSchema, templates, confirmSwitch } = options

  const activeTemplateId = ref(templates[0]!.id)

  function getActiveTemplate(): TemplateEntry<Schema> {
    return templates.find(t => t.id === activeTemplateId.value) ?? templates[0]!
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
