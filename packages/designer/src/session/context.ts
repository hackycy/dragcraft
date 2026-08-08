import type { InjectionKey } from 'vue'
import type { DesignerSession } from './types'
import { inject } from 'vue'

export const DESIGNER_SESSION_KEY: InjectionKey<DesignerSession> = Symbol('dc-designer-session')

export function useDesignerSession(): DesignerSession {
  const session = inject(DESIGNER_SESSION_KEY)
  if (!session)
    throw new Error('[dragcraft/designer] DesignerSession not found.')
  return session
}
