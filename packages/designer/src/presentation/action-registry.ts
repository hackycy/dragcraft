import type { DocumentSchema, NodeDefinition } from '@dragcraft/core'
import type { Component } from 'vue'
import type { ActionInterceptor, ActionRisk } from './action-runtime'
import type { MaybePromise } from './event-hooks'
import type { DeepReadonly, NodeOwner } from './semantic'
import type { AuthoringAction, RendererContext, RendererWidgetMeta } from './types'
import { IconArrowDown, IconArrowUp, IconCopy, IconDelete, IconDrag } from '@dragcraft/icons'
import { runActionPipeline } from './action-runtime'
import { isInsertAllowed, isMoveAllowed, isRemoveAllowed, isSchemaManagedWidget } from './semantic'

function canReorder(ctx: NodeActionContext): boolean {
  return ctx.owner.kind !== 'root' || ctx.sortScope !== false
}

function getScopedLockedIndices(ctx: NodeActionContext): Set<number> {
  if (ctx.lockedIndices)
    return ctx.lockedIndices
  if (ctx.owner.kind === 'container') {
    const owner = ctx.owner
    const nodes = ctx.session.document.getRegionNodes(owner.containerId, owner.regionId)
    return ctx.materials.getLockedIndices(nodes)
  }
  const nodes = ctx.session.document.rootNodes.value
  return ctx.materials.getLockedIndices(nodes)
}

// ──────────────────────────────────────────
// Node action context
// ──────────────────────────────────────────

/**
 * Context provided to action predicates and handlers.
 */
export interface NodeActionContext {
  /** The schema node this action applies to */
  node: NodeDefinition
  /** Structural owner whose child array defines sibling ordering. */
  owner: NodeOwner
  /** The node's index among siblings */
  index: number
  /** Total sibling count */
  siblingCount: number
  /** Sort scope this action context belongs to, or false when unsorted */
  sortScope: string | false
  /** The widget meta, if registered */
  meta: RendererWidgetMeta | undefined
  /** Semantic material and authoring facts from the session read projection. */
  materials: RendererContext['session']['materials']
  /** The only authoring entry point available to Renderer. */
  session: RendererContext['session']
  /** Safe schema snapshot shared by all action predicates for this resolution. */
  schema: DeepReadonly<DocumentSchema> | null
  /** Precomputed lock set for the owning sort scope or container region. */
  lockedIndices?: Set<number>
}

// ──────────────────────────────────────────
// Node action definition
// ──────────────────────────────────────────

/**
 * Definition of a single node action.
 */
export interface NodeActionDefinition {
  /** Unique action key (e.g., 'drag', 'move-up', 'move-down', 'delete') */
  key: string
  /** Display label for the action */
  label: string
  /** Icon content: a string character, or a Vue component */
  icon?: string | Component
  /** 'button' renders as button, 'drag-handle' renders as draggable element */
  type: 'button' | 'drag-handle'
  /** Sort order. Built-in actions use 100, 200, 300, 400. */
  order: number
  /** Risk level used by action interceptors. */
  risk?: ActionRisk
  /** Optional metadata passed through action interceptors. */
  metadata?: Record<string, unknown>
  /**
   * Whether this action is visible.
   * Return false to hide the action for this node.
   */
  visible?: (ctx: NodeActionContext) => boolean
  /**
   * Whether this action is available (usable) for this node.
   * Return false to render the action in disabled state.
   * Distinct from `visible` — an action can be visible but unavailable.
   */
  available?: (ctx: NodeActionContext) => boolean
  /**
   * Whether this action is disabled.
   * Return true to render the button in disabled state.
   */
  disabled?: (ctx: NodeActionContext) => boolean
  /**
   * Authoring intent invoked when the action is triggered.
   * Backends translate it privately to their own write model.
   */
  action?: (ctx: NodeActionContext, event: MouseEvent) => AuthoringAction | null | undefined
  /**
   * Handler invoked when the action is triggered.
   * Use this for side effects or actions that do not map to a core command.
   */
  handler?: (ctx: NodeActionContext, event: MouseEvent) => MaybePromise<void>
  /**
   * CSS class name(s) to add to the action element.
   */
  className?: string
}

// ──────────────────────────────────────────
// Resolved node action
// ──────────────────────────────────────────

/**
 * A resolved action with computed visible/disabled state for a specific node.
 */
export interface ResolvedNodeAction {
  key: string
  label: string
  icon?: string | Component
  type: 'button' | 'drag-handle'
  order: number
  risk: ActionRisk
  metadata?: Record<string, unknown>
  visible: boolean
  disabled: boolean
  handler: (event: MouseEvent) => void | Promise<void>
  className?: string
}

// ──────────────────────────────────────────
// Action registry
// ──────────────────────────────────────────

/**
 * Registry for managing node actions.
 */
export interface NodeActionRegistry {
  /** Get all registered global action definitions */
  getActions: () => NodeActionDefinition[]
  /** Register a new action definition */
  register: (action: NodeActionDefinition) => void
  /** Unregister an action by key */
  unregister: (key: string) => void
  /**
   * Resolve actions for a specific node, applying visibility/disabled predicates
   * and per-widget overrides from WidgetMeta.
   */
  resolve: (ctx: NodeActionContext, actionInterceptors?: ActionInterceptor[], keys?: readonly string[]) => ResolvedNodeAction[]
}

// ──────────────────────────────────────────
// Built-in action keys
// ──────────────────────────────────────────

export const ActionKey = {
  DRAG: 'drag',
  MOVE_UP: 'move-up',
  MOVE_DOWN: 'move-down',
  DUPLICATE: 'duplicate',
  DELETE: 'delete',
} as const

function isBuiltInActionAuthorized(key: string, ctx: NodeActionContext): boolean | undefined {
  if (key === ActionKey.DRAG || key === ActionKey.MOVE_UP || key === ActionKey.MOVE_DOWN) {
    return ctx.materials.resolveCapability(ctx.node, 'draggable')
      && ctx.materials.resolveCapability(ctx.node, 'sortable')
  }
  if (key === ActionKey.DELETE) {
    return ctx.materials.resolveCapability(ctx.node, 'deletable')
      && ctx.materials.canDeleteSubtree(ctx.node)
  }
  if (key === ActionKey.DUPLICATE) {
    if (isSchemaManagedWidget(ctx.meta))
      return false
    return ctx.materials.canCreateSubtree(ctx.node)
  }
  return undefined
}

// ──────────────────────────────────────────
// Built-in default actions
// ──────────────────────────────────────────

export function createDefaultActions(t?: (key: string, fallback?: string) => string): NodeActionDefinition[] {
  const _t = t ?? ((_, f) => f ?? '')
  return [
    {
      key: ActionKey.DRAG,
      label: _t('action.drag', '拖拽排序'),
      icon: IconDrag,
      type: 'drag-handle',
      order: 100,
      available: canReorder,
    },
    {
      key: ActionKey.MOVE_UP,
      label: _t('action.move-up', '上移'),
      icon: IconArrowUp,
      type: 'button',
      order: 200,
      metadata: { actionType: 'node.move', direction: 'up' },
      available: canReorder,
      disabled: (ctx) => {
        if (ctx.index === 0)
          return true
        const lockedIndices = getScopedLockedIndices(ctx)
        if (lockedIndices.size === 0)
          return false
        return !isMoveAllowed(ctx.index, ctx.index - 1, lockedIndices)
      },
      action: (ctx) => {
        if (ctx.index <= 0)
          return null
        return {
          type: 'node.move',
          nodeId: ctx.node.id,
          destination: { ...ctx.owner, index: ctx.index - 1 },
        }
      },
    },
    {
      key: ActionKey.MOVE_DOWN,
      label: _t('action.move-down', '下移'),
      icon: IconArrowDown,
      type: 'button',
      order: 300,
      metadata: { actionType: 'node.move', direction: 'down' },
      available: canReorder,
      disabled: (ctx) => {
        if (ctx.index >= ctx.siblingCount - 1)
          return true
        const lockedIndices = getScopedLockedIndices(ctx)
        if (lockedIndices.size === 0)
          return false
        return !isMoveAllowed(ctx.index, ctx.index + 1, lockedIndices)
      },
      action: (ctx) => {
        if (ctx.index >= ctx.siblingCount - 1)
          return null
        return {
          type: 'node.move',
          nodeId: ctx.node.id,
          destination: { ...ctx.owner, index: ctx.index + 2 },
        }
      },
    },
    {
      key: ActionKey.DUPLICATE,
      label: _t('action.duplicate', '复制'),
      icon: IconCopy,
      type: 'button',
      order: 350,
      disabled: (ctx) => {
        if (ctx.owner.kind === 'root' && ctx.sortScope === false)
          return false
        const lockedIndices = getScopedLockedIndices(ctx)
        return !isInsertAllowed(ctx.index + 1, lockedIndices)
      },
      action: ctx => ({
        type: 'node.duplicate',
        nodeId: ctx.node.id,
      }),
    },
    {
      key: ActionKey.DELETE,
      label: _t('action.delete', '删除'),
      icon: IconDelete,
      type: 'button',
      order: 400,
      risk: 'destructive',
      metadata: { actionType: 'node.remove' },
      className: 'dc-node__toolbar-btn--delete',
      disabled: (ctx) => {
        if (ctx.owner.kind === 'root' && ctx.sortScope === false)
          return false
        const lockedIndices = getScopedLockedIndices(ctx)
        if (lockedIndices.size === 0)
          return false
        return !isRemoveAllowed(ctx.index, lockedIndices)
      },
      action: ctx => ({
        type: 'node.remove',
        nodeId: ctx.node.id,
      }),
    },
  ]
}

// ──────────────────────────────────────────
// Factory
// ──────────────────────────────────────────

export function createNodeActionRegistry(
  initialActions?: NodeActionDefinition[],
): NodeActionRegistry {
  const actions = new Map<string, NodeActionDefinition>()

  // Register initial actions
  const defaults = initialActions ?? createDefaultActions()
  for (const action of defaults) {
    actions.set(action.key, action)
  }

  return {
    getActions() {
      return Array.from(actions.values()).sort((a, b) => a.order - b.order)
    },

    register(action: NodeActionDefinition) {
      actions.set(action.key, action)
    },

    unregister(key: string) {
      actions.delete(key)
    },

    resolve(ctx: NodeActionContext, actionInterceptors: ActionInterceptor[] = [], keys?: readonly string[]): ResolvedNodeAction[] {
      // Get per-widget action overrides from WidgetMeta
      const widgetActions = ctx.meta?.actions

      const onlyKeys = widgetActions?.only ? new Set(widgetActions.only) : undefined
      const requestedKeys = keys ? new Set(keys) : undefined
      const authorizationByKey = new Map<string, boolean | undefined>()
      const resolveAuthorization = (key: string): boolean | undefined => {
        if (!authorizationByKey.has(key))
          authorizationByKey.set(key, isBuiltInActionAuthorized(key, ctx))
        return authorizationByKey.get(key)
      }

      // Start with globally registered actions admitted by explicit visibility
      // configuration. Built-in authoring policy is projected as disabled state
      // later so the toolbar keeps a stable visual footprint.
      let actionDefs = this.getActions()
      if (requestedKeys)
        actionDefs = actionDefs.filter(action => requestedKeys.has(action.key))
      actionDefs = actionDefs.filter((action) => {
        const builtInDecision = resolveAuthorization(action.key)
        if (builtInDecision !== undefined)
          return true
        return !isSchemaManagedWidget(ctx.meta) || onlyKeys?.has(action.key) === true
      })

      // Apply per-widget overrides
      if (widgetActions) {
        if (onlyKeys)
          actionDefs = actionDefs.filter(a => onlyKeys.has(a.key))
        if (widgetActions.exclude) {
          const excludeKeys = new Set(widgetActions.exclude)
          actionDefs = actionDefs.filter(a => !excludeKeys.has(a.key))
        }
        if (widgetActions.extra) {
          const admittedExtras = widgetActions.extra.filter((action) => {
            if (requestedKeys && !requestedKeys.has(action.key))
              return false
            const builtInDecision = resolveAuthorization(action.key)
            return builtInDecision ?? true
          })
          actionDefs = [...actionDefs, ...admittedExtras]
            .sort((a, b) => a.order - b.order)
        }
      }
      return actionDefs
        .map((def): ResolvedNodeAction | null => {
          const visible = def.visible ? def.visible(ctx) : true
          if (!visible)
            return null

          const authorized = resolveAuthorization(def.key) ?? true
          const disabled = !authorized
            || (def.available ? !def.available(ctx) : false)
            || (def.disabled ? def.disabled(ctx) : false)

          // Per-action guard against concurrent async invocations
          const pending = { value: false }

          return {
            key: def.key,
            label: def.label,
            icon: def.icon,
            type: def.type,
            order: def.order,
            risk: def.risk ?? 'normal',
            metadata: def.metadata,
            visible: true,
            disabled,
            handler: (event: MouseEvent): void | Promise<void> => {
              if (pending.value)
                return

              event.stopPropagation()
              const action = def.action?.(ctx, event) ?? undefined
              const execute = () => {
                if (action)
                  ctx.session.execute(action)
                return def.handler?.(ctx, event)
              }

              return runActionPipeline({
                key: def.key,
                label: def.label,
                ctx,
                event,
                risk: def.risk ?? 'normal',
                action,
                metadata: def.metadata,
              }, execute, actionInterceptors, pending)
            },
            className: def.className,
          }
        })
        .filter((a): a is ResolvedNodeAction => a !== null)
    },
  }
}
