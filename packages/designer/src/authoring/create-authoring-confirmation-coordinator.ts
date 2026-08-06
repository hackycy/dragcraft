import type { NodeType } from '@dragcraft/core'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type { MaterialAuthoringPolicyAction } from '../materials/types'
import type { AuthoringAction, AuthoringEngine, AuthoringResult, SchemaAuthoringAction } from './types'

export interface AuthoringConfirmationRequest {
  readonly action: MaterialAuthoringPolicyAction
  readonly code: 'POLICY_CONFIRMATION_REQUIRED'
  readonly materialType: NodeType
  readonly nodeId?: string
}

export type ConfirmAuthoringAction = (
  request: AuthoringConfirmationRequest,
) => boolean | Promise<boolean>

export interface AuthoringConfirmationCoordinator {
  readonly dispose: () => void
  readonly execute: (action: AuthoringAction) => AuthoringResult
}

export interface CreateAuthoringConfirmationCoordinatorOptions {
  readonly catalog: MaterialCatalog
  readonly confirm?: ConfirmAuthoringAction
  readonly engine: AuthoringEngine
}

function policyActionFor(action: SchemaAuthoringAction): MaterialAuthoringPolicyAction | undefined {
  switch (action.type) {
    case 'create-node':
      return 'create'
    case 'duplicate-node':
      return 'duplicate'
    case 'move-node':
      return 'move'
    case 'remove-node':
      return 'remove'
    case 'unwrap-container':
      return 'unwrap'
    case 'update-node':
      return 'update'
    case 'update-global-config':
    case 'update-page':
      return undefined
  }
}

function nodeIdFor(action: SchemaAuthoringAction): string | undefined {
  switch (action.type) {
    case 'duplicate-node':
    case 'move-node':
    case 'remove-node':
    case 'update-node':
      return action.nodeId
    case 'unwrap-container':
      return action.containerId
    case 'create-node':
    case 'update-global-config':
    case 'update-page':
      return undefined
  }
}

export function createAuthoringConfirmationCoordinator(
  options: CreateAuthoringConfirmationCoordinatorOptions,
): AuthoringConfirmationCoordinator {
  let pending: object | null = null
  let disposed = false

  function currentSchema(): object | null {
    const state = options.engine.document.value
    return state.status === 'rejected' ? null : state.schema
  }

  function confirmationRequest(action: SchemaAuthoringAction): AuthoringConfirmationRequest | null {
    const policyAction = policyActionFor(action)
    if (!policyAction)
      return null
    const nodeId = nodeIdFor(action)
    const state = options.engine.document.value
    const materialType = action.type === 'create-node'
      ? action.materialType
      : state.status === 'rejected'
        ? undefined
        : state.schema.nodes.find(node => node.id === nodeId)?.type
    if (!materialType || !options.catalog.getMaterial(materialType))
      return null
    return Object.freeze({
      action: policyAction,
      code: 'POLICY_CONFIRMATION_REQUIRED' as const,
      materialType,
      ...(nodeId ? { nodeId } : {}),
    })
  }

  function actionAwaitingConfirmation(
    action: AuthoringAction,
    result: Extract<AuthoringResult, { readonly status: 'confirmation-required' }>,
  ): SchemaAuthoringAction | undefined {
    return action.type === 'batch'
      ? action.actions[result.actionIndex ?? -1]
      : action.type === 'select-node' || action.type === 'hover-node'
        || action.type === 'undo' || action.type === 'redo'
        ? undefined
        : action
  }

  function confirmAction(
    action: AuthoringAction,
    result: Extract<AuthoringResult, { readonly status: 'confirmation-required' }>,
  ): void {
    if (!options.confirm)
      return
    const target = actionAwaitingConfirmation(action, result)
    const request = target ? confirmationRequest(target) : null
    if (!target || !request)
      return
    const schema = currentSchema()
    const token = {}
    pending = token
    try {
      Promise.resolve(options.confirm(request)).then((confirmed) => {
        if (pending !== token)
          return
        pending = null
        if (!confirmed || disposed || currentSchema() !== schema)
          return
        const retry: AuthoringAction = action.type === 'batch'
          ? {
              ...action,
              actions: action.actions.map((child, index) => index === result.actionIndex
                ? { ...child, confirmed: true }
                : child),
            }
          : { ...target, confirmed: true }
        const retryResult = options.engine.execute(retry)
        if (retryResult.status === 'confirmation-required')
          confirmAction(retry, retryResult)
      }, () => {
        if (pending === token)
          pending = null
      })
    }
    catch {
      pending = null
    }
  }

  function execute(action: AuthoringAction): AuthoringResult {
    if (pending && action.type !== 'select-node' && action.type !== 'hover-node')
      return { status: 'rejected', code: 'CONFIRMATION_PENDING' }
    const result = options.engine.execute(action)
    if (result.status === 'confirmation-required')
      confirmAction(action, result)
    return result
  }

  return Object.freeze({
    dispose() {
      disposed = true
      pending = null
    },
    execute,
  })
}
