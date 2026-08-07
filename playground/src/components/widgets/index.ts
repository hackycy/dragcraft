import type { MaterialDefinition } from '@dragcraft/designer'
import { basicMaterials } from './basic'
import { containerMaterials } from './container'
import { formMaterials } from './form'
import { miniProgramMaterials } from './mini-program'

const baseMaterials: readonly MaterialDefinition[] = [
  ...basicMaterials,
  ...formMaterials,
  ...miniProgramMaterials,
  ...containerMaterials,
]

function withSpacingInspector(material: MaterialDefinition): MaterialDefinition {
  if (material.type === 'navbar')
    return material
  return {
    ...material,
    inspector: {
      ...material.inspector,
      formSchema: {
        sections: [
          ...(material.inspector?.formSchema?.sections ?? []),
          {
            title: '容器边距',
            titleKey: 'field.spacing.sectionTitle',
            fields: [
              {
                key: 'containerMargin',
                label: '外边距',
                labelKey: 'field.spacing.margin',
                component: 'Spacing',
                bindTo: { scope: 'node', path: 'style.margin' },
                defaultValue: '0px',
                componentProps: { type: 'margin', min: -120, max: 120 },
              },
              {
                key: 'containerPadding',
                label: '内边距',
                labelKey: 'field.spacing.padding',
                component: 'Spacing',
                bindTo: { scope: 'node', path: 'style.padding' },
                defaultValue: '0px',
                componentProps: { type: 'padding', min: 0, max: 120 },
              },
            ],
          },
        ],
      },
    },
  }
}

export const playgroundMaterials: readonly MaterialDefinition[] = baseMaterials.map(withSpacingInspector)
