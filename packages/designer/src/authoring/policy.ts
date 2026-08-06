import type { ResolvedDocument } from '@dragcraft/core'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type {
  MaterialAuthoringPolicyAction,
  MaterialAuthoringPolicyContext,
  MaterialAuthoringPolicyDecision,
} from '../materials/types'
import type { SchemaAuthoringAction } from './types'

export type AuthoringPolicyEvaluation
  = | { readonly decision: 'allowed' }
    | { readonly decision: 'confirmation-required', readonly code: 'POLICY_CONFIRMATION_REQUIRED' }
    | { readonly decision: 'denied', readonly code: 'NODE_READ_ONLY' | 'POLICY_DENIED' }

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

export function evaluateAuthoringPolicy(
  catalog: MaterialCatalog,
  document: ResolvedDocument,
  action: SchemaAuthoringAction,
): AuthoringPolicyEvaluation {
  const policyAction = policyActionFor(action)
  if (!policyAction)
    return { decision: 'allowed' }

  const nodeId = nodeIdFor(action)
  const resolvedNode = nodeId ? document.nodesById.get(nodeId) : undefined
  if (resolvedNode?.readOnly)
    return { decision: 'denied', code: 'NODE_READ_ONLY' }

  const materialType = action.type === 'create-node'
    ? action.materialType
    : resolvedNode?.node.type
  const rule = materialType
    ? catalog.getAuthoring(materialType)?.policy?.[policyAction]
    : undefined
  const context = {
    action: policyAction,
    ...(resolvedNode
      ? { node: resolvedNode.node as unknown as MaterialAuthoringPolicyContext['node'] }
      : {}),
    schema: document.schema as unknown as MaterialAuthoringPolicyContext['schema'],
  } as MaterialAuthoringPolicyContext
  const decision: MaterialAuthoringPolicyDecision = typeof rule === 'function'
    ? rule(context)
    : rule ?? 'allowed'

  if (decision === 'denied')
    return { decision, code: 'POLICY_DENIED' }
  if (decision === 'confirmation-required')
    return { decision, code: 'POLICY_CONFIRMATION_REQUIRED' }
  return { decision: 'allowed' }
}
