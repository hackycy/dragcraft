// ──────────────────────────────────────────
// Command types
// ──────────────────────────────────────────

export const CommandType = {
  ADD_NODE: 'ADD_NODE',
  MOVE_NODE: 'MOVE_NODE',
  REMOVE_NODE: 'REMOVE_NODE',
  DUPLICATE_NODE: 'DUPLICATE_NODE',
  CHANGE_CONTAINER_VARIANT: 'CHANGE_CONTAINER_VARIANT',
  UPDATE_PROPS: 'UPDATE_PROPS',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG',
} as const

export type CommandTypeValue = typeof CommandType[keyof typeof CommandType]

// ──────────────────────────────────────────
// Event names (namespace:action convention)
// ──────────────────────────────────────────

export const EventName = {
  SCHEMA_CHANGED: 'schema:changed',
  SELECTION_CHANGED: 'selection:changed',
  DRAG_ENTER: 'drag:enter',
  DRAG_OVER: 'drag:over',
  DRAG_LEAVE: 'drag:leave',
  DRAG_DROP: 'drag:drop',
  HISTORY_CHANGED: 'history:changed',
  NODE_ADDED: 'node:added',
  NODE_REMOVED: 'node:removed',
  NODE_DUPLICATED: 'node:duplicated',
  NODE_MOVED: 'node:moved',
  CONTAINER_VARIANT_CHANGED: 'container:variant-changed',
  NODE_UPDATED: 'node:updated',
  GLOBAL_CONFIG_CHANGED: 'global-config:changed',
} as const

export type EventNameValue = typeof EventName[keyof typeof EventName]

// ──────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────

export const DEFAULT_SCHEMA_VERSION = '1.0.0'
export const DEFAULT_MAX_HISTORY_SIZE = 50
