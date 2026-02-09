export type Id = string
export type WidgetType = string
export type ConfigType = string
export type RendererType = string

export type Dict<T = unknown> = Record<string, T>

export type StyleSchema = Record<string, string | number | undefined>

export type FormSchema = unknown

export interface WidgetSchema {
  id: Id
  type: WidgetType
  props?: Dict
  style?: StyleSchema
}

export interface PageSchema {
  id: Id
  type: ConfigType
  props?: Dict
  style?: StyleSchema
}

export interface GlobalConfigSchema {
  id: Id
  type: ConfigType
  props?: Dict
  style?: StyleSchema
}

export interface EngineState {
  page: PageSchema
  widgets: WidgetSchema[]
  globalConfigs: GlobalConfigSchema[]
  activeId: Id | null
}

export interface WidgetDefinition {
  type: WidgetType
  title: string
  icon?: string
  defaultProps?: Dict
  defaultStyle?: StyleSchema
  formSchema?: FormSchema
  view?: unknown
}

export interface ConfigDefinition {
  type: ConfigType
  title: string
  defaultProps?: Dict
  defaultStyle?: StyleSchema
  formSchema?: FormSchema
}

export interface RendererDefinition {
  type: RendererType
  renderer: unknown
}

export interface CreateWidgetPayload {
  type: WidgetType
  id?: Id
  props?: Dict
  style?: StyleSchema
}
