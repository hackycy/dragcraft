import type { DesignerInstance } from '../types'
import type { DesignerSession } from './types'

const sessions = new WeakMap<DesignerInstance, DesignerSession>()

export function registerDesignerSession(instance: DesignerInstance, session: DesignerSession): void {
  sessions.set(instance, session)
}

/** Internal lookup used by Designer presentation; it is intentionally not public API. */
export function getDesignerSession(instance: DesignerInstance): DesignerSession {
  const session = sessions.get(instance)
  if (!session)
    throw new TypeError('DesignerInstance was not created by createDesigner()')
  return session
}
