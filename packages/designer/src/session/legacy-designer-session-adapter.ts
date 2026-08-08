import type { Command, CommandExecutionResult, DesignerEngine, DesignerSchema, NodeDestination, NodeOwner, PlacementDecision, SchemaNode } from '@dragcraft/core'
import type { AuthoringAction, AuthoringDecision, AuthoringResult, RendererWidgetMeta } from '@dragcraft/renderer'
import type { DesignerSession, DesignerSessionDropRejectionReason } from './types'
import {
  buildSchemaIndex,
  CommandType,
  createContainerPlan,
  createLayoutPlan,
  getLockedIndicesFromNodes,
  resolveAuthoringCapability,
  resolveDestination,
  resolveNodeLayout,
  validateSubtreeCreation,
  validateSubtreeDeletion,
} from '@dragcraft/core'
import { computed, ref } from 'vue'

function evaluateLegacyAction(engine: DesignerEngine, action: AuthoringAction): AuthoringDecision {
  if (action.type === 'history.undo')
    return { allowed: engine.history.state.value.canUndo }
  if (action.type === 'history.redo')
    return { allowed: engine.history.state.value.canRedo }
  return { allowed: true }
}

function toLegacyCommand(action: AuthoringAction): Command | null {
  switch (action.type) {
    case 'node.add':
      return { type: CommandType.ADD_NODE, payload: { node: action.node, destination: action.destination } }
    case 'node.move':
      return { type: CommandType.MOVE_NODE, payload: { nodeId: action.nodeId, destination: action.destination } }
    case 'node.remove':
      return { type: CommandType.REMOVE_NODE, payload: { nodeId: action.nodeId } }
    case 'node.duplicate':
      return { type: CommandType.DUPLICATE_NODE, payload: { nodeId: action.nodeId } }
    case 'node.update':
      return { type: CommandType.UPDATE_PROPS, payload: { nodeId: action.nodeId, props: action.props, style: action.style } }
    case 'container.change-variant':
      return { type: CommandType.CHANGE_CONTAINER_VARIANT, payload: { containerId: action.containerId, variant: action.variant } }
    case 'global-config.update':
      return { type: CommandType.SET_GLOBAL_CONFIG, payload: { config: action.config } }
    default:
      return null
  }
}

function asAuthoringResult(result: CommandExecutionResult): AuthoringResult {
  return result
}

/**
 * Projects the one existing legacy Engine state source through DesignerSession.
 * This is the only new module allowed to read legacy Engine internals during G1.
 */
export function createLegacyDesignerSessionAdapter(engine: DesignerEngine): DesignerSession {
  const schema = computed(() => engine.store.schema.value)
  const index = computed(() => buildSchemaIndex(schema.value as DesignerSchema))
  const activeDestination = ref<NodeDestination | null>(null)
  const containerDropDecision = ref<PlacementDecision | null>(null)
  const isForbidden = ref(false)
  const forbiddenReason = ref<DesignerSessionDropRejectionReason | null>(null)
  const structurePositions = computed(() => {
    const rootNodes = schema.value.root.children ?? []
    const plan = createLayoutPlan(schema.value as DesignerSchema, engine.registry)
    const positions = new Map<string, {
      owner: NodeOwner
      index: number
      siblingCount: number
      sortScope: string | false
      lockedIndices: ReadonlySet<number>
    }>()

    for (const entry of plan.entries) {
      if (entry.layout.sortScope === false) {
        positions.set(entry.node.id, {
          owner: { kind: 'root' },
          index: entry.arrayIndex,
          siblingCount: rootNodes.length,
          sortScope: false,
          lockedIndices: new Set(),
        })
      }
    }

    for (const [sortScope, entries] of plan.sortScopes) {
      const lockedIndices = getLockedIndicesFromNodes(
        entries.map(entry => entry.node),
        engine.registry,
        schema.value as DesignerSchema,
      )
      entries.forEach((entry, index) => positions.set(entry.node.id, {
        owner: { kind: 'root', sortScope },
        index,
        siblingCount: entries.length,
        sortScope,
        lockedIndices,
      }))
    }

    for (const container of rootNodes) {
      if (!container.container)
        continue
      for (const [regionId, nodes] of Object.entries(container.container.regions)) {
        const lockedIndices = getLockedIndicesFromNodes(
          nodes as SchemaNode[],
          engine.registry,
          schema.value as DesignerSchema,
        )
        nodes.forEach((node, index) => positions.set(node.id, {
          owner: { kind: 'container', containerId: container.id, regionId },
          index,
          siblingCount: nodes.length,
          sortScope: false,
          lockedIndices,
        }))
      }
    }

    return positions
  })

  const session: DesignerSession = {
    document: {
      schema: computed(() => schema.value),
      version: computed(() => schema.value.version),
      root: computed(() => schema.value.root),
      rootNodes: computed(() => schema.value.root.children ?? []),
      globalConfig: computed(() => schema.value.globalConfig),
      diagnostics: computed(() => index.value.diagnostics),
      getNode: (nodeId) => {
        void schema.value
        return engine.state.getNodeById(nodeId)
      },
      getOwner: (nodeId) => {
        const location = index.value.index.get(nodeId)
        if (!location)
          return null
        if (location.owner === 'root') {
          const layout = resolveNodeLayout(location.node, engine.registry, schema.value as DesignerSchema)
          return {
            kind: 'root',
            ...(layout.sortScope === false ? {} : { sortScope: layout.sortScope }),
          }
        }
        return location.regionId
          ? { kind: 'container', containerId: location.owner, regionId: location.regionId }
          : null
      },
      getStructurePosition: (nodeId) => {
        const position = structurePositions.value.get(nodeId)
        if (!position)
          return null
        return {
          owner: position.owner,
          index: position.index,
          siblingCount: position.siblingCount,
          sortScope: position.sortScope,
          lockedIndices: position.lockedIndices,
        }
      },
      getRegionNodes: (containerId, regionId) => {
        const container = index.value.index.get(containerId)?.node
        return container?.container?.regions[regionId] ?? []
      },
      resolveDestination: destination => resolveDestination(
        schema.value as DesignerSchema,
        engine.registry,
        destination,
      ),
    },
    materials: {
      get: type => engine.registry.getWidget(type) as RendererWidgetMeta | undefined,
      getAll: () => engine.registry.getAllWidgets() as RendererWidgetMeta[],
      resolveCapability: (node, capability) => resolveAuthoringCapability(
        engine.registry.getWidget(node.type),
        { node, schema: schema.value as DesignerSchema },
        capability,
      ),
      resolveLayout: node => resolveNodeLayout(node as SchemaNode, engine.registry, schema.value as DesignerSchema),
      resolveContainer: node => createContainerPlan(node as SchemaNode, engine.registry),
      getLockedIndices: nodes => getLockedIndicesFromNodes(
        nodes as SchemaNode[],
        engine.registry,
        schema.value as DesignerSchema,
      ),
      canCreateSubtree: node => validateSubtreeCreation(
        node,
        schema.value as DesignerSchema,
        engine.registry,
      ).ok,
      canDeleteSubtree: node => validateSubtreeDeletion(
        node,
        schema.value as DesignerSchema,
        engine.registry,
      ).ok,
    },
    state: {
      selectedNodeId: engine.store.selectedNodeId,
      hoveredNodeId: engine.store.hoveredNodeId,
      dragTarget: engine.store.dragTarget,
      drag: {
        activeDestination,
        containerDropDecision,
        isForbidden,
        forbiddenReason,
      },
      history: engine.history.state,
    },
    evaluate: action => evaluateLegacyAction(engine, action),
    execute: (action) => {
      const decision = evaluateLegacyAction(engine, action)
      if (!decision.allowed)
        return { ok: false, code: 'ACTION_NOT_ALLOWED', ...decision }

      if (action.type === 'history.undo') {
        engine.history.undo()
        return { ok: true, changed: true }
      }
      if (action.type === 'history.redo') {
        engine.history.redo()
        return { ok: true, changed: true }
      }
      if (action.type === 'selection.set') {
        const changed = engine.store.selectedNodeId.value !== action.nodeId
        engine.store.selectNode(action.nodeId)
        return { ok: true, changed }
      }
      if (action.type === 'hover.set') {
        const changed = engine.store.hoveredNodeId.value !== action.nodeId
        engine.store.hoverNode(action.nodeId)
        return { ok: true, changed }
      }
      if (action.type === 'drag.set') {
        const current = engine.store.dragTarget.value
        const changed = current?.sourceNodeId !== action.target?.sourceNodeId
          || current?.widgetType !== action.target?.widgetType
        engine.store.setDragTarget(action.target)
        return { ok: true, changed }
      }
      if (action.type === 'schema.import') {
        const result = engine.importSchema(action.schema)
        return result.ok
          ? { ok: true, changed: true }
          : { ok: false, code: 'SCHEMA_IMPORT_REJECTED', details: { diagnostics: result.diagnostics } }
      }

      const command = toLegacyCommand(action)
      return command
        ? asAuthoringResult(engine.execute(command))
        : { ok: false, code: 'ACTION_UNSUPPORTED' }
    },
  }

  return session
}
