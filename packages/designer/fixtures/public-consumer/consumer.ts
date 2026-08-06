/* eslint-disable import/no-duplicates, perfectionist/sort-imports */
import {
  createDesigner,
  DcDesigner,
  defineMaterial,
  DesignerRegionOutlet,
  DesignerViewportPortal,

  useSurfaceReservation,
} from '@dragcraft/designer'
import type { DocumentSchema, FieldSchema, FormSchema, JsonObject, MaterialPreviewContext } from '@dragcraft/designer'
import { IPHONE_DEVICE_FRAME } from '@dragcraft/device-frames'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { defineComponent, h, ref } from 'vue'

// @ts-expect-error Phase 5 removes the Core Engine from the public package.
import type { Engine } from '@dragcraft/designer'
// @ts-expect-error Phase 5 removes Core commands from the public package.
import type { Command } from '@dragcraft/designer'
// @ts-expect-error ResolvedDocument remains behind DesignerInstance.
import type { ResolvedDocument } from '@dragcraft/designer'
// @ts-expect-error SchemaOperation remains behind AuthoringAction.
import type { SchemaOperation } from '@dragcraft/designer'
// @ts-expect-error The legacy widget ComponentMap is not a public form type.
import type { ComponentMap } from '@dragcraft/designer'
// @ts-expect-error WidgetDefinition is replaced by MaterialDefinition.
import type { WidgetDefinition } from '@dragcraft/designer'
// @ts-expect-error NodeHost remains Designer Presentation implementation.
import type { NodeHost } from '@dragcraft/designer'
// @ts-expect-error GeometryRegistry remains Designer Presentation implementation.
import type { GeometryRegistry } from '@dragcraft/designer'
// @ts-expect-error DesignerSchema has no compatibility alias.
import type { DesignerSchema } from '@dragcraft/designer'
// @ts-expect-error The old Engine factory is not exported.
import { createEngine } from '@dragcraft/designer'
// @ts-expect-error Renderer values are not exported by Designer.
import { RootRenderer } from '@dragcraft/designer'

export type RemovedPublicTypes = [
  Engine,
  Command,
  ResolvedDocument,
  SchemaOperation,
  ComponentMap,
  WidgetDefinition,
  NodeHost,
  GeometryRegistry,
  DesignerSchema,
]

interface BannerProps extends JsonObject {
  text: string
}

const bannerForm: FormSchema = {
  sections: [{
    title: 'Banner',
    fields: [{ key: 'text', label: 'Text', component: 'Input' } satisfies FieldSchema],
  }],
}

const FixedFrame = defineComponent({
  setup(_, { slots }) {
    const element = ref<HTMLElement | null>(null)
    const reservation = useSurfaceReservation(element, {
      edge: 'block-start',
      fallbackSize: 48,
    })
    return () => h(DesignerViewportPortal, null, {
      default: () => h('header', {
        'ref': element,
        'data-offset': reservation.offset.value,
      }, slots.default?.()),
    })
  },
})

const visual = defineMaterial({
  type: 'banner',
  schema: { defaultProps: { text: 'Hello' } },
  inspector: { formSchema: bannerForm },
  presentation: {
    kind: 'visual',
    preview: defineComponent({
      props: { context: { type: Object, required: true } },
      setup(props) {
        const context = props.context as MaterialPreviewContext<BannerProps>
        return () => h('strong', context.node.props.text)
      },
    }),
    frame: FixedFrame,
  },
})

const container = defineMaterial({
  type: 'container',
  schema: { container: { regions: [{ id: 'content', accepts: { types: ['banner'] } }] } },
  presentation: {
    kind: 'visual',
    preview: defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    }),
  },
})

const headless = defineMaterial({
  type: 'analytics',
  presentation: { kind: 'headless' },
})

const schema: DocumentSchema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [
    { id: 'container-1', type: 'container', props: {} },
    { id: 'banner-1', type: 'banner', props: { text: 'Hello' } },
    { id: 'analytics-1', type: 'analytics', props: {} },
  ],
  structure: {
    root: ['container-1', 'analytics-1'],
    containers: { 'container-1': { regions: { content: ['banner-1'] } } },
  },
}

const designer = createDesigner({
  materials: [visual, container, headless],
  containerShell: IPHONE_DEVICE_FRAME.containerShell,
  fieldComponentMap: createAntDesignVueFields(),
})
const loadResult = designer.importSchema(schema)
if (loadResult.status === 'rejected')
  loadResult.diagnostics.items.forEach(item => item.code)
designer.exportSchema()
h(DcDesigner, { instance: designer })

void [createEngine, RootRenderer]
