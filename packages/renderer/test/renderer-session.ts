import type { Command, DesignerEngine, DesignerSchema, NodeDestination, PlacementDecision, SchemaNode } from '@dragcraft/legacy-core'
import type { AuthoringAction, AuthoringResult, RendererSessionProjection, RendererWidgetMeta } from '../src/types'
import {
  buildSchemaIndex,
  CommandType,
  createContainerPlan,
  createLayoutPlan,
  getLockedIndicesFromNodes,
  resolveAuthoringCapability,
  resolveNodeLayout,
  validateSubtreeCreation,
  validateSubtreeDeletion,
} from '@dragcraft/legacy-core'
import { computed, ref } from 'vue'

/** Test-only Legacy projection for mounting Renderer without importing Designer. */
export function createRendererTestSession(engine: DesignerEngine): RendererSessionProjection {
  const schema = computed(() => engine.store.schema.value)
  const index = computed(() => buildSchemaIndex(schema.value as DesignerSchema))
  const activeDestination = ref<NodeDestination | null>(null)
  const containerDropDecision = ref<PlacementDecision | null>(null)
  const isForbidden = ref(false)
  const forbiddenReason = ref(null)

  function execute(action: AuthoringAction): AuthoringResult {
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
      engine.store.setDragTarget(action.target)
      return { ok: true, changed: true }
    }
    if (action.type === 'history.undo') {
      if (!engine.history.state.value.canUndo)
        return { ok: false, code: 'ACTION_NOT_ALLOWED' }
      engine.history.undo()
      return { ok: true, changed: true }
    }
    if (action.type === 'history.redo') {
      if (!engine.history.state.value.canRedo)
        return { ok: false, code: 'ACTION_NOT_ALLOWED' }
      engine.history.redo()
      return { ok: true, changed: true }
    }
    if (action.type === 'schema.import') {
      const result = engine.importSchema(action.schema)
      return result.ok
        ? { ok: true, changed: true }
        : { ok: false, code: 'SCHEMA_IMPORT_REJECTED', details: { diagnostics: result.diagnostics } }
    }

    const command: Command = action.type === 'node.add'
      ? { type: CommandType.ADD_NODE, payload: { node: action.node, destination: action.destination } }
      : action.type === 'node.move'
        ? { type: CommandType.MOVE_NODE, payload: { nodeId: action.nodeId, destination: action.destination } }
        : action.type === 'node.remove'
          ? { type: CommandType.REMOVE_NODE, payload: { nodeId: action.nodeId } }
          : action.type === 'node.duplicate'
            ? { type: CommandType.DUPLICATE_NODE, payload: { nodeId: action.nodeId } }
            : action.type === 'node.update'
              ? { type: CommandType.UPDATE_PROPS, payload: { nodeId: action.nodeId, props: action.props, style: action.style } }
              : action.type === 'container.change-variant'
                ? { type: CommandType.CHANGE_CONTAINER_VARIANT, payload: { containerId: action.containerId, variant: action.variant } }
                : { type: CommandType.SET_GLOBAL_CONFIG, payload: { config: action.config } }
    return engine.execute(command)
  }

  return {
    document: {
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
            kind: 'root' as const,
            ...(layout.sortScope === false ? {} : { sortScope: layout.sortScope }),
          }
        }
        return location.regionId
          ? { kind: 'container' as const, containerId: location.owner, regionId: location.regionId }
          : null
      },
      getStructurePosition: (nodeId) => {
        const location = index.value.index.get(nodeId)
        if (!location)
          return null
        if (location.owner !== 'root') {
          const nodes = schema.value.root.children
            ?.find(node => node.id === location.owner)
            ?.container
            ?.regions[location.regionId ?? ''] ?? []
          return {
            owner: { kind: 'container' as const, containerId: location.owner, regionId: location.regionId ?? '' },
            index: location.index,
            siblingCount: nodes.length,
            sortScope: false as const,
            lockedIndices: getLockedIndicesFromNodes(nodes as SchemaNode[], engine.registry, schema.value as DesignerSchema),
          }
        }
        const layout = resolveNodeLayout(location.node, engine.registry, schema.value as DesignerSchema)
        if (layout.sortScope === false) {
          return {
            owner: { kind: 'root' as const },
            index: location.index,
            siblingCount: schema.value.root.children?.length ?? 0,
            sortScope: false as const,
            lockedIndices: new Set<number>(),
          }
        }
        const entries = createLayoutPlan(schema.value as DesignerSchema, engine.registry)
          .sortScopes
          .get(layout.sortScope) ?? []
        return {
          owner: { kind: 'root' as const, sortScope: layout.sortScope },
          index: entries.findIndex(entry => entry.node.id === nodeId),
          siblingCount: entries.length,
          sortScope: layout.sortScope,
          lockedIndices: getLockedIndicesFromNodes(
            entries.map(entry => entry.node),
            engine.registry,
            schema.value as DesignerSchema,
          ),
        }
      },
      getRegionNodes: (containerId, regionId) =>
        index.value.index.get(containerId)?.node.container?.regions[regionId] ?? [],
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
    evaluate: () => ({ allowed: true }),
    execute,
  }
}
