import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { Component } from 'vue'
import type { RendererEventHooks } from './event-hooks'
import { CommandType } from '@dragcraft/core'
import { fireAfterHook, resolveBeforeHook } from './event-hooks'

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
      visible: ctx => ctx.meta?.draggable !== false,
    },
    {
      key: ActionKey.MOVE_UP,
      label: '上移',
      icon: '\u2191',
      type: 'button',
      order: 200,
      visible: ctx => ctx.meta?.draggable !== false,
      disabled: ctx => ctx.index === 0,
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
      visible: ctx => ctx.meta?.draggable !== false,
      disabled: ctx => ctx.index >= ctx.siblingCount - 1,
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
      visible: ctx => ctx.meta?.deletable !== false,
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
          let pending = false

          return {
            key: def.key,
            label: def.label,
            icon: def.icon,
            type: def.type,
            order: def.order,
            visible: true,
            disabled,
            handler: (event: MouseEvent): void | Promise<void> => {
              if (pending)
                return

              // ── DELETE action ──
              if (def.key === ActionKey.DELETE) {
                const beforeHook = eventHooks.onBeforeDelete
                if (beforeHook) {
                  const hookResult = beforeHook({ nodeId: ctx.node.id, event })

                  // Fast path: sync hook returned a non-promise value
                  if (typeof hookResult === 'boolean' || hookResult === undefined) {
                    if (hookResult === false)
                      return
                    def.handler?.(ctx, event)
                    fireAfterHook(eventHooks.onAfterDelete, { nodeId: ctx.node.id, event })
                    return
                  }

                  // Async path: hook returned a Promise
                  pending = true
                  return resolveBeforeHook(hookResult).then((allowed) => {
                    pending = false
                    if (!allowed)
                      return
                    def.handler?.(ctx, event)
                    fireAfterHook(eventHooks.onAfterDelete, { nodeId: ctx.node.id, event })
                  })
                }

                def.handler?.(ctx, event)
                fireAfterHook(eventHooks.onAfterDelete, { nodeId: ctx.node.id, event })
                return
              }

              // ── MOVE UP / MOVE DOWN actions ──
              if (def.key === ActionKey.MOVE_UP || def.key === ActionKey.MOVE_DOWN) {
                const direction = def.key === ActionKey.MOVE_UP ? 'up' as const : 'down' as const
                const toIndex = direction === 'up' ? ctx.index - 1 : ctx.index + 1
                const movePayload = {
                  nodeId: ctx.node.id,
                  direction,
                  fromIndex: ctx.index,
                  toIndex,
                  event,
                }

                const beforeHook = eventHooks.onBeforeMove
                if (beforeHook) {
                  const hookResult = beforeHook(movePayload)

                  // Fast path: sync
                  if (typeof hookResult === 'boolean' || hookResult === undefined) {
                    if (hookResult === false)
                      return
                    def.handler?.(ctx, event)
                    fireAfterHook(eventHooks.onAfterMove, movePayload)
                    return
                  }

                  // Async path
                  pending = true
                  return resolveBeforeHook(hookResult).then((allowed) => {
                    pending = false
                    if (!allowed)
                      return
                    def.handler?.(ctx, event)
                    fireAfterHook(eventHooks.onAfterMove, movePayload)
                  })
                }

                def.handler?.(ctx, event)
                fireAfterHook(eventHooks.onAfterMove, movePayload)
                return
              }

              // ── Custom / other actions: just call the handler ──
              def.handler?.(ctx, event)
            },
            className: def.className,
          }
        })
        .filter((a): a is ResolvedNodeAction => a !== null)
    },
  }
}
