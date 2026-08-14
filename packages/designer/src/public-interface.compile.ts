// @ts-expect-error Renderer extension protocols are internal and must not be public.
import type { RendererEventHooks, RendererExtensions } from './index'

export type RendererProtocolsMustRemainPrivate = RendererEventHooks | RendererExtensions
