// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { MaterialPreviewContext } from './index'
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, shallowRef } from 'vue'
import { createDesigner, DcDesigner, defineMaterial, DesignerRegionOutlet } from './index'

const textMaterial = defineMaterial({
  type: 'text',
  schema: { defaultProps: { text: 'Hello' } },
  inspector: {
    formSchema: {
      sections: [{
        title: 'Text',
        fields: [{ key: 'text', label: 'Text', component: 'Input' }],
      }],
    },
  },
  panel: { title: 'Text', group: 'basic' },
  presentation: {
    kind: 'visual',
    preview: defineComponent({
      setup(props, { attrs }) {
        return () => h('span', { ...attrs }, (props as { text?: string }).text)
      },
    }),
  },
})

const initialSchema: DocumentSchema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [{ id: 'text-1', type: 'text', props: { text: 'Hello' } }],
  structure: { root: ['text-1'], containers: {} },
}

const containerMaterial = defineMaterial({
  type: 'container',
  schema: { container: { regions: [{ id: 'content' }] } },
  panel: { title: 'Container', group: 'layout' },
  presentation: {
    kind: 'visual',
    preview: defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    }),
  },
})

describe('phase 5 workbench cutover', () => {
  it('renders the new ApplicationSurface from the public DesignerInstance seam', async () => {
    const designer = createDesigner({ materials: [textMaterial], schema: initialSchema })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector('[data-dc-component="application-surface"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="root-renderer"]')).toBeNull()
      expect(host.querySelector('[data-dc-component="material-item"]')?.textContent).toContain('Text')
      expect(host.querySelector('[data-dc-node-id="text-1"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('routes structure-tree actions through closed AuthoringAction values', async () => {
    const designer = createDesigner({
      materials: [containerMaterial, textMaterial],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'container-1', type: 'container', props: {} },
          { id: 'child-1', type: 'text', props: { text: 'Child' } },
          { id: 'text-2', type: 'text', props: { text: 'Tail' } },
        ],
        structure: {
          root: ['container-1', 'text-2'],
          containers: { 'container-1': { regions: { content: ['child-1'] } } },
        },
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const structureTab = Array.from(host.querySelectorAll<HTMLButtonElement>('.dc-left-sidebar__tab'))
        .find(button => button.title === '结构树')!
      structureTab.click()
      await nextTick()

      expect(Array.from(host.querySelectorAll<HTMLElement>('[data-dc-component="structure-item"]'))
        .map(element => element.dataset.dcNodeId)).toEqual(['container-1', 'child-1', 'text-2'])
      const child = host.querySelector<HTMLElement>('[data-dc-component="structure-item"][data-dc-node-id="child-1"]')!
      child.querySelector<HTMLButtonElement>('.dc-structure-panel__select')!.click()
      child.querySelector<HTMLButtonElement>('[data-dc-action="remove"]')!.click()
      await nextTick()

      expect(designer.selection.selectedNodeId.value).toBeNull()
      expect(designer.exportSchema()?.structure.containers['container-1']?.regions.content).toEqual([])
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('asks the host before a protected workbench action is retried', async () => {
    let resolveConfirmation!: (confirmed: boolean) => void
    let request: unknown
    const confirmation = new Promise<boolean>((resolve) => {
      resolveConfirmation = resolve
    })
    const protectedMaterial = defineMaterial({
      type: 'protected-text',
      authoring: { policy: { remove: 'confirmation-required' } },
      panel: { title: 'Protected text', group: 'basic' },
      presentation: { kind: 'headless' },
    })
    const designer = createDesigner({
      materials: [protectedMaterial],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'protected-1', type: 'protected-text', props: {} }],
        structure: { root: ['protected-1'], containers: {} },
      },
      confirmAuthoringAction(value) {
        request = value
        return confirmation
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const structureTab = Array.from(host.querySelectorAll<HTMLButtonElement>('.dc-left-sidebar__tab'))
        .find(button => button.title === '结构树')!
      structureTab.click()
      await nextTick()
      host.querySelector<HTMLButtonElement>('[data-dc-action="remove"]')!.click()

      expect(request).toEqual({
        action: 'remove',
        code: 'POLICY_CONFIRMATION_REQUIRED',
        materialType: 'protected-text',
        nodeId: 'protected-1',
      })
      expect(Object.isFrozen(request)).toBe(true)
      expect(designer.exportSchema()?.structure.root).toEqual(['protected-1'])

      resolveConfirmation(true)
      await confirmation
      await nextTick()

      expect(designer.exportSchema()?.structure.root).toEqual([])
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('routes protected material self-updates through host confirmation', async () => {
    let request: unknown
    const protectedMaterial = defineMaterial({
      type: 'protected-preview',
      authoring: { policy: { update: 'confirmation-required' } },
      presentation: {
        kind: 'visual',
        preview: defineComponent({
          props: {
            context: { type: Object as PropType<MaterialPreviewContext>, required: true },
          },
          setup(props) {
            return () => h('button', {
              'data-test-update-self': '',
              'onClick': () => props.context.updateSelf({ value: 'After' }),
            }, 'Update')
          },
        }),
      },
    })
    const designer = createDesigner({
      materials: [protectedMaterial],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'protected-1', type: 'protected-preview', props: { value: 'Before' } }],
        structure: { root: ['protected-1'], containers: {} },
      },
      confirmAuthoringAction(value) {
        request = value
        return true
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      host.querySelector<HTMLButtonElement>('[data-test-update-self]')!.click()
      await Promise.resolve()
      await nextTick()

      expect(request).toEqual({
        action: 'update',
        code: 'POLICY_CONFIRMATION_REQUIRED',
        materialType: 'protected-preview',
        nodeId: 'protected-1',
      })
      expect(designer.exportSchema()?.nodes[0]?.props.value).toBe('After')
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('projects the same resolved action state to Canvas and Structure without actions for read-only nodes', async () => {
    const restrictedMaterial = defineMaterial({
      type: 'restricted',
      authoring: {
        policy: {
          duplicate: 'denied',
          move: 'denied',
          remove: 'denied',
        },
      },
      panel: { title: 'Restricted', group: 'basic' },
      presentation: { kind: 'headless' },
    })
    const designer = createDesigner({
      materials: [restrictedMaterial],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'first', type: 'restricted', props: {} },
          { id: 'restricted', type: 'restricted', props: {} },
          { id: 'unknown', type: 'remote-card', props: {} },
        ],
        structure: { root: ['first', 'restricted', 'unknown'], containers: {} },
      },
    })
    designer.execute({ type: 'select-node', nodeId: 'restricted' })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const restricted = host.querySelector<HTMLElement>('[data-dc-node-id="restricted"]')!
      const unknown = host.querySelector<HTMLElement>('[data-dc-node-id="unknown"]')!
      surface.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
      restricted.getBoundingClientRect = () => ({
        left: 10,
        top: 60,
        right: 110,
        bottom: 100,
        width: 100,
        height: 40,
      }) as DOMRect
      unknown.getBoundingClientRect = () => ({
        left: 10,
        top: 100,
        right: 110,
        bottom: 140,
        width: 100,
        height: 40,
      }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      const canvasToolbar = host.querySelector<HTMLElement>(
        '[data-dc-component="node-toolbar"][data-dc-node-id="restricted"]',
      )!
      const canvasAction = (name: string) => canvasToolbar.querySelector<HTMLButtonElement>(`[data-dc-action="${name}"]`)
      expect(canvasAction('drag')?.getAttribute('draggable')).toBe('false')
      expect(canvasAction('drag')?.getAttribute('aria-disabled')).toBe('true')
      expect(['move-up', 'move-down', 'duplicate', 'remove'].map(name => canvasAction(name)?.disabled))
        .toEqual([true, true, true, true])

      Array.from(host.querySelectorAll<HTMLButtonElement>('.dc-left-sidebar__tab'))
        .find(button => button.title === '结构树')!
        .click()
      await nextTick()

      const structureItem = host.querySelector<HTMLElement>(
        '[data-dc-component="structure-item"][data-dc-node-id="restricted"]',
      )!
      const structureActions = Array.from(structureItem.querySelectorAll<HTMLButtonElement>('[data-dc-action]'))
      expect(structureActions.map(action => action.dataset.dcAction)).toEqual([
        'move-up',
        'move-down',
        'duplicate',
        'remove',
      ])
      expect(structureActions.map(action => action.disabled)).toEqual([true, true, true, true])

      designer.execute({ type: 'select-node', nodeId: 'unknown' })
      await nextTick()

      expect(host.querySelector('[data-dc-component="node-toolbar"][data-dc-node-id="unknown"]')).toBeNull()
      expect(host.querySelectorAll(
        '[data-dc-component="structure-item"][data-dc-node-id="unknown"] [data-dc-action]',
      )).toHaveLength(0)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('translates property edits into update-node Authoring Actions', async () => {
    const InputField = defineComponent({
      props: { modelValue: { type: String, default: '' } },
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        return () => h('input', {
          'data-test-field': 'text',
          'value': props.modelValue,
          'onInput': (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        })
      },
    })
    const designer = createDesigner({
      materials: [textMaterial],
      schema: initialSchema,
      fieldComponentMap: { Input: { component: InputField } },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      host.querySelector<HTMLElement>('[data-dc-node-id="text-1"]')!.click()
      await nextTick()
      const input = host.querySelector<HTMLInputElement>('[data-test-field="text"]')!
      input.value = 'Updated'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      expect(designer.exportSchema()?.nodes[0]?.props.text).toBe('Updated')
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('keeps the Interaction Plane outside a switchable Device Frame shell', async () => {
    const FirstShell = defineComponent({
      setup(_, { slots }) {
        return () => h('div', { class: 'first-device-shell' }, slots.default?.())
      },
    })
    const SecondShell = defineComponent({
      setup(_, { slots }) {
        return () => h('section', { class: 'second-device-shell' }, slots.default?.())
      },
    })
    const shell = shallowRef(FirstShell)
    const designer = createDesigner({
      materials: [textMaterial],
      schema: initialSchema,
      containerShell: shell,
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const interaction = surface.querySelector<HTMLElement>(':scope > [data-dc-plane="interaction"]')
      expect(host.querySelector('.first-device-shell [data-dc-plane="document"]')).not.toBeNull()
      expect(interaction).not.toBeNull()
      expect(host.querySelector('.first-device-shell [data-dc-plane="interaction"]')).toBeNull()

      shell.value = SecondShell
      await nextTick()
      expect(host.querySelector('.first-device-shell')).toBeNull()
      expect(host.querySelector('.second-device-shell [data-dc-plane="document"]')).not.toBeNull()
      expect(surface.querySelector(':scope > [data-dc-plane="interaction"]')).toBe(interaction)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('drops a material through a structural destination owned by Schema order', async () => {
    const designer = createDesigner({
      materials: [textMaterial],
      schema: {
        ...initialSchema,
        nodes: [{ id: 'text-1', type: 'text', props: { text: 'Existing' } }],
        structure: { root: ['text-1'], containers: {} },
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: () => {},
      setDragImage: () => {},
    }
    const dragEvent = (type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })
      return event
    }

    try {
      app.mount(host)
      await nextTick()
      const material = host.querySelector<HTMLElement>('[data-dc-component="material-item"]')!
      material.dispatchEvent(dragEvent('dragstart'))
      const rootPlane = host.querySelector<HTMLElement>('[data-dc-plane="document"]')!
      rootPlane.dispatchEvent(dragEvent('dragover'))
      rootPlane.dispatchEvent(dragEvent('drop'))
      await nextTick()

      const schema = designer.exportSchema()!
      expect(schema.structure.root).toHaveLength(2)
      expect(schema.nodes.find(node => node.id === schema.structure.root[1])?.type).toBe('text')
      expect(schema.nodes.find(node => node.id === schema.structure.root[1])?.props.text).toBe('Hello')
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
