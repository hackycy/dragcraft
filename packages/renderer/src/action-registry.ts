import type { DesignerEngine, InstanceBehaviorContext, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { Component } from 'vue'
import type { MaybePromise, RendererEventHooks } from './event-hooks'
import { CommandType, getLockedIndices, isMoveAllowed, isRemoveAllowed, resolveBehavior } from '@dragcraft/core'
import { fireAfterHook, resolveBeforeHook } from './event-hooks'

/**
 * Builds an InstanceBehaviorContext from a NodeActionContext.
 * Schema is already read reactively by the calling computed (in useNodeActions).
 */
function toInstanceCtx(ctx: NodeActionContext): InstanceBehaviorContext {
  return { node: ctx.node, schema: ctx.engine.store.getRawSchema() }
}

/**
 * Runs an action through a before/after hook pair.
 * Handles sync (boolean/void) and async (Promise) hook results uniformly.
 * If the before hook is absent, the action executes unconditionally.
 * When pendingGuard is provided, it is set to true while an async hook
 * is in-flight and reset to false on resolution.
 */
function runWithHook<T>(
  hook: ((payload: T) => MaybePromise<boolean | void>) | undefined,
  payload: T,
  execute: () => void,
  afterHook?: (payload: T) => MaybePromise<void>,
  pendingGuard?: { value: boolean },
): void | Promise<void> {
  if (!hook) {
    execute()
    fireAfterHook(afterHook, payload)
    return
  }

  const result = hook(payload)

  // Fast path: sync hook returned a non-promise value
  if (typeof result === 'boolean' || result === undefined) {
    if (result === false)
      return
    execute()
    fireAfterHook(afterHook, payload)
    return
  }

  // Async path: hook returned a Promise
  if (pendingGuard)
    pendingGuard.value = true
  return resolveBeforeHook(result).then((allowed) => {
    if (pendingGuard)
      pendingGuard.value = false
    if (!allowed)
      return
    execute()
    fireAfterHook(afterHook, payload)
  })
}

// ──────────────────────────────────────────
// Node action context
// ──────────────────────────────────────────

/**
 * Context provided to action predicates and handlers.
 */
export interface NodeActionContext {
  /** The schema node this action applies to */
  node: SchemaNode
  /** The node's index among siblings */
  index: number
  /** Total sibling count */
  siblingCount: number
  /** The widget meta, if registered */
  meta: WidgetMeta | undefined
  /** The engine instance for executing commands */
  engine: DesignerEngine
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
  /**
   * Whether this action is visible.
   * Return false to hide the action for this node.
   */
  visible?: (ctx: NodeActionContext) => boolean
  /**
   * Whether this action is disabled.
   * Return true to render the button in disabled state.
   */
  disabled?: (ctx: NodeActionContext) => boolean
  /**
   * Handler invoked when the action is triggered (clicked).
   * Not applicable for 'drag-handle' type.
   */
  handler?: (ctx: NodeActionContext, event: MouseEvent) => void
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
  resolve: (ctx: NodeActionContext, eventHooks: RendererEventHooks) => ResolvedNodeAction[]
}

// ──────────────────────────────────────────
// Built-in action keys
// ──────────────────────────────────────────

export const ActionKey = {
  DRAG: 'drag',
  MOVE_UP: 'move-up',
  MOVE_DOWN: 'move-down',
  DELETE: 'delete',
} as const

// ──────────────────────────────────────────
// Built-in default actions
// ──────────────────────────────────────────

export function createDefaultActions(): NodeActionDefinition[] {
  return [
    {
      key: ActionKey.DRAG,
      label: '拖拽排序',
      icon: '\u2630',
      type: 'drag-handle',
      order: 100,
      visible: (ctx) => {
        const instanceCtx = toInstanceCtx(ctx)
        return resolveBehavior(ctx.meta?.draggable, instanceCtx)
          && resolveBehavior(ctx.meta?.sortable, instanceCtx)
      },
    },
    {
      key: ActionKey.MOVE_UP,
      label: '上移',
      icon: '\u2191',
      type: 'button',
      order: 200,
      visible: (ctx) => {
        const instanceCtx = toInstanceCtx(ctx)
        return resolveBehavior(ctx.meta?.draggable, instanceCtx)
          && resolveBehavior(ctx.meta?.sortable, instanceCtx)
      },
      disabled: (ctx) => {
        if (ctx.index === 0)
          return true
        const children = ctx.engine.store.getRawSchema().root.children ?? []
        const lockedIndices = getLockedIndices(children, ctx.engine.registry, ctx.engine.store.getRawSchema())
        if (lockedIndices.size === 0)
          return false
        return !isMoveAllowed(ctx.index, ctx.index - 1, lockedIndices)
      },
      handler: (ctx, e) => {
        e.stopPropagation()
        if (ctx.index > 0) {
          ctx.engine.execute({
            type: CommandType.MOVE_NODE,
            payload: { nodeId: ctx.node.id, index: ctx.index - 1 },
          })
        }
      },
    },
    {
      key: ActionKey.MOVE_DOWN,
      label: '下移',
      icon: '\u2193',
      type: 'button',
      order: 300,
      visible: (ctx) => {
        const instanceCtx = toInstanceCtx(ctx)
        return resolveBehavior(ctx.meta?.draggable, instanceCtx)
          && resolveBehavior(ctx.meta?.sortable, instanceCtx)
      },
      disabled: (ctx) => {
        if (ctx.index >= ctx.siblingCount - 1)
          return true
        const children = ctx.engine.store.getRawSchema().root.children ?? []
        const lockedIndices = getLockedIndices(children, ctx.engine.registry, ctx.engine.store.getRawSchema())
        if (lockedIndices.size === 0)
          return false
        return !isMoveAllowed(ctx.index, ctx.index + 1, lockedIndices)
      },
      handler: (ctx, e) => {
        e.stopPropagation()
        if (ctx.index < ctx.siblingCount - 1) {
          ctx.engine.execute({
            type: CommandType.MOVE_NODE,
            payload: { nodeId: ctx.node.id, index: ctx.index + 1 },
          })
        }
      },
    },
    {
      key: ActionKey.DELETE,
      label: '删除',
      icon: '\u2715',
      type: 'button',
      order: 400,
      className: 'dc-node__toolbar-btn--delete',
      visible: ctx => resolveBehavior(ctx.meta?.deletable, toInstanceCtx(ctx)),
      disabled: (ctx) => {
        const children = ctx.engine.store.getRawSchema().root.children ?? []
        const lockedIndices = getLockedIndices(children, ctx.engine.registry, ctx.engine.store.getRawSchema())
        if (lockedIndices.size === 0)
          return false
        return !isRemoveAllowed(ctx.index, lockedIndices)
      },
      handler: (ctx, e) => {
        e.stopPropagation()
        ctx.engine.execute({
          type: CommandType.REMOVE_NODE,
          payload: { nodeId: ctx.node.id },
        })
      },
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

    resolve(ctx: NodeActionContext, eventHooks: RendererEventHooks): ResolvedNodeAction[] {
      // Get per-widget action overrides from WidgetMeta
      const widgetActions = ctx.meta?.actions

      // Start with global actions
      let actionDefs = this.getActions()

      // Apply per-widget overrides
      if (widgetActions) {
        if (widgetActions.only) {
          const allowedKeys = new Set(widgetActions.only)
          actionDefs = actionDefs.filter(a => allowedKeys.has(a.key))
        }
        if (widgetActions.exclude) {
          const excludeKeys = new Set(widgetActions.exclude)
          actionDefs = actionDefs.filter(a => !excludeKeys.has(a.key))
        }
        if (widgetActions.extra) {
          actionDefs = [...actionDefs, ...widgetActions.extra]
            .sort((a, b) => a.order - b.order)
        }
      }

      return actionDefs
        .map((def): ResolvedNodeAction | null => {
          const visible = def.visible ? def.visible(ctx) : true
          if (!visible)
            return null

          const disabled = def.disabled ? def.disabled(ctx) : false

          // Per-action guard against concurrent async invocations
          const pending = { value: false }

          return {
            key: def.key,
            label: def.label,
            icon: def.icon,
            type: def.type,
            order: def.order,
            visible: true,
            disabled,
            handler: (event: MouseEvent): void | Promise<void> => {
              if (pending.value)
                return

              const execute = () => def.handler?.(ctx, event)

              // ── DELETE action ──
              if (def.key === ActionKey.DELETE) {
                const payload = { nodeId: ctx.node.id, event }
                if (eventHooks.onBeforeDelete || eventHooks.onAfterDelete) {
                  return runWithHook(eventHooks.onBeforeDelete, payload, execute, eventHooks.onAfterDelete, pending)
                }
                execute()
                return
              }

              // ── MOVE UP / MOVE DOWN actions ──
              if (def.key === ActionKey.MOVE_UP || def.key === ActionKey.MOVE_DOWN) {
                const direction = def.key === ActionKey.MOVE_UP ? 'up' as const : 'down' as const
                const payload = {
                  nodeId: ctx.node.id,
                  direction,
                  fromIndex: ctx.index,
                  toIndex: direction === 'up' ? ctx.index - 1 : ctx.index + 1,
                  event,
                }
                if (eventHooks.onBeforeMove || eventHooks.onAfterMove) {
                  return runWithHook(eventHooks.onBeforeMove, payload, execute, eventHooks.onAfterMove, pending)
                }
                execute()
                return
              }

              // ── Custom / other actions: just call the handler ──
              execute()
            },
            className: def.className,
          }
        })
        .filter((a): a is ResolvedNodeAction => a !== null)
    },
  }
}
