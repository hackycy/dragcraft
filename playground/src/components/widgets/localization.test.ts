import type { FieldSchema, FormSchema } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import { describe, expect, it } from 'vitest'
import { globalConfigSchema } from '../../config/global-config-schema'
import { playgroundMaterials } from './index'
import { playgroundWidgetMessages } from './messages'

function staticComponentProps(field: FieldSchema): Record<string, unknown> | undefined {
  return typeof field.componentProps === 'object' ? field.componentProps : undefined
}

describe('playground localization contract', () => {
  it('translates material and inspector text through the public designer locale seam', () => {
    const designer = createDesigner({
      materials: playgroundMaterials,
      messages: playgroundWidgetMessages,
    })
    const schemas: FormSchema[] = [
      globalConfigSchema,
      ...playgroundMaterials.flatMap(material => material.inspector?.formSchema ?? []),
    ]

    try {
      for (const locale of ['zh-CN', 'en']) {
        designer.localization.setLocale(locale)
        const expectTranslation = (key: string | undefined) => {
          expect(key).toBeTypeOf('string')
          expect(designer.localization.translate(key!, '__missing__')).not.toBe('__missing__')
        }

        for (const material of playgroundMaterials)
          expectTranslation(material.panel?.titleKey)

        for (const schema of schemas) {
          for (const section of schema.sections) {
            expectTranslation(section.titleKey)
            for (const field of section.fields) {
              expectTranslation(field.labelKey)
              const componentProps = staticComponentProps(field)
              if (typeof componentProps?.placeholder === 'string')
                expectTranslation(field.placeholderKey)
              const options = componentProps?.options
              if (!Array.isArray(options))
                continue
              expect(field.optionKeyPrefix).toBeTypeOf('string')
              for (const option of options as Array<{ value: string | number }>)
                expectTranslation(`${field.optionKeyPrefix}.${option.value}`)
            }
          }
        }
      }
    }
    finally {
      designer.dispose()
    }
  })

  it('preserves the basic and form inspector field sets from main', () => {
    const expectedFields: Record<string, string[]> = {
      'text': ['content', 'fontSize', 'fontWeight', 'color', 'textAlign'],
      'button': ['text', 'type', 'size', 'disabled'],
      'image': ['src', 'alt', 'objectFit'],
      'link': ['text', 'href', 'target', 'color'],
      'divider': ['direction', 'color', 'thickness'],
      'form-input': ['label', 'placeholder', 'value', 'required', 'disabled'],
      'form-textarea': ['label', 'placeholder', 'value', 'rows', 'required', 'disabled'],
      'form-select': ['label', 'placeholder', 'required', 'disabled'],
      'form-checkbox': ['label', 'checked', 'disabled'],
      'form-radio-group': ['label', 'direction', 'disabled'],
    }

    for (const [type, expected] of Object.entries(expectedFields)) {
      const material = playgroundMaterials.find(item => item.type === type)!
      const actual = material.inspector!.formSchema!.sections
        .flatMap(section => section.fields)
        .map(field => field.key)
        .filter(key => key !== 'containerMargin' && key !== 'containerPadding')
      expect(actual, type).toEqual(expected)
    }
  })

  it('preserves the mini-program inspector field sets from main', () => {
    const expectedFields: Record<string, string[]> = {
      'navbar': ['title'],
      'tab-bar': ['tabs', 'activeIndex', 'backgroundColor', 'activeColor', 'inactiveColor'],
      'floating-button': ['label', 'side', 'bottom', 'sideOffset', 'size', 'backgroundColor', 'textColor'],
      'swiper': ['images', 'showIndicator', 'height', 'borderRadius'],
    }

    for (const [type, expected] of Object.entries(expectedFields)) {
      const material = playgroundMaterials.find(item => item.type === type)!
      const actual = material.inspector!.formSchema!.sections
        .flatMap(section => section.fields)
        .map(field => field.key)
        .filter(key => key !== 'containerMargin' && key !== 'containerPadding')
      expect(actual, type).toEqual(expected)
    }
  })
})
