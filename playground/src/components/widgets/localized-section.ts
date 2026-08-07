import type { FieldSchema, SectionSchema } from '@dragcraft/designer'

function staticComponentProps(field: FieldSchema): Record<string, unknown> | undefined {
  return typeof field.componentProps === 'object' ? field.componentProps : undefined
}

export function localizedSection(
  widgetType: string,
  sectionId: string,
  section: SectionSchema,
): SectionSchema {
  return {
    ...section,
    titleKey: `widget.${widgetType}.form.${sectionId}.title`,
    fields: section.fields.map((field) => {
      const componentProps = staticComponentProps(field)
      return {
        ...field,
        labelKey: `widget.${widgetType}.field.${field.key}.label`,
        ...(typeof componentProps?.placeholder === 'string'
          ? { placeholderKey: `widget.${widgetType}.field.${field.key}.placeholder` }
          : {}),
        ...(Array.isArray(componentProps?.options)
          ? { optionKeyPrefix: `widget.${widgetType}.field.${field.key}.option` }
          : {}),
      }
    }),
  }
}
