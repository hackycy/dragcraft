import type { DocumentSchema, SchemaLoadResult } from '@dragcraft/designer'
import type { TemplateEntry } from '../config/templates'
import { ref } from 'vue'
import { templateRegistry } from '../config/templates'

export interface UseTemplateSwitchOptions {
  importSchema: (schema: DocumentSchema) => SchemaLoadResult
  exportSchema: () => DocumentSchema | null
  confirmSwitch?: () => boolean | Promise<boolean>
}

export function useTemplateSwitch(options: UseTemplateSwitchOptions) {
  const activeTemplateId = ref(templateRegistry[0].id)
  const templates: TemplateEntry[] = templateRegistry

  function getActiveTemplate(): TemplateEntry {
    return templates.find(template => template.id === activeTemplateId.value) ?? templates[0]!
  }

  function isModified(): boolean {
    return JSON.stringify(options.exportSchema()) !== JSON.stringify(getActiveTemplate().schema)
  }

  async function switchTemplate(id: string): Promise<void> {
    if (id === activeTemplateId.value)
      return
    const target = templates.find(template => template.id === id)
    if (!target)
      return
    if (isModified() && options.confirmSwitch && !await options.confirmSwitch())
      return
    const result = options.importSchema(target.schema)
    if (result.status !== 'rejected')
      activeTemplateId.value = id
  }

  function resetTemplate() {
    options.importSchema(getActiveTemplate().schema)
  }

  return { activeTemplateId, templates, switchTemplate, resetTemplate }
}
