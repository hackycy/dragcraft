export interface MaterialEditorMetadata {
  type: string
  title: string
  titleKey?: string
  group: string
  icon?: string
  defaultProps: Record<string, any>
  defaultStyle?: Record<string, any>
  formSchema: any
  material?: { title?: string, titleKey?: string, icon?: string, description?: string, descriptionKey?: string, tags?: string[], keywords?: string[] }
  authoring?: string
  creatable?: any
  draggable?: any
  sortable?: any
  defaultLayout?: unknown
  [key: string]: unknown
}

export interface ResolveDropIndexContext {
  event: DragEvent
  regionElement: HTMLElement
  itemElements: readonly HTMLElement[]
  nodes: readonly any[]
}
