// Shapes produced by the binary XML and manifest parsers. They are exposed
// through the ApkReader namespace, e.g. `ApkReader.Manifest`.

export interface ParserOptions {
  /** Logs every read of the binary XML parser to the console. */
  debug?: boolean
}

export interface Dimension {
  value: number | null
  unit: 'mm' | 'px' | 'dp' | 'sp' | 'pt' | 'in' | null
  rawUnit: number | null
}

export interface Fraction {
  value: number | null
  type: '%' | '%p' | null
  rawType: number | null
}

/** A value as described by android.util.TypedValue. */
export type TypedValue =
  | { value: number; type: 'int_dec' | 'int_hex' | 'unknown'; rawType: number }
  | { value: string; type: 'string' | 'reference'; rawType: number }
  | { value: boolean; type: 'boolean'; rawType: number }
  | { value: null; type: 'null'; rawType: number }
  | {
      value: string
      type: 'rgb8' | 'rgb4' | 'argb8' | 'argb4'
      rawType: number
    }
  | { value: Dimension; type: 'dimension'; rawType: number }
  | { value: Fraction; type: 'fraction'; rawType: number }

export type TypedValueValue = TypedValue['value']

/** 1 for elements, 2 for attributes and 4 for CDATA sections, as in the DOM. */
export type NodeType = 1 | 2 | 4

export interface XmlAttribute {
  namespaceURI: string | null
  nodeType: 2
  nodeName: string
  name: string
  value: string | null
  typedValue: TypedValue
}

export interface XmlCData {
  namespaceURI: null
  nodeType: 4
  nodeName: '#cdata'
  data: string | null
  typedValue: TypedValue
}

export interface XmlElement {
  namespaceURI: string | null
  nodeType: 1
  nodeName: string
  attributes: XmlAttribute[]
  childNodes: XmlNode[]
}

export type XmlNode = XmlElement | XmlCData

/**
 * The attributes of an element, keyed by name without the namespace prefix,
 * e.g. `{ name: 'android.intent.action.MAIN' }`. The object has no prototype.
 */
export type Attributes = Record<string, TypedValueValue>

/** An element's attributes plus the lists the parser adds to it. */
type Element<Children> = Record<string, unknown> & Children

export type IntentFilter = Element<{
  actions: Attributes[]
  categories: Attributes[]
  data: Attributes[]
}>

/** An `<activity>`, `<activity-alias>`, `<service>` or `<receiver>`. */
export type Component = Element<{
  intentFilters: IntentFilter[]
  metaData: Attributes[]
}>

export type Provider = Element<{
  grantUriPermissions: Attributes[]
  metaData: Attributes[]
  pathPermissions: Attributes[]
}>

/** Empty when the manifest has no `<application>` element. */
export type Application = Element<{
  activities: Component[]
  activityAliases: Component[]
  launcherActivities: Component[]
  leanbackLauncherActivities: Component[]
  services: Component[]
  receivers: Component[]
  providers: Provider[]
  usesLibraries: Attributes[]
}>

/**
 * The attributes of `<manifest>` (`package`, `versionCode`, `versionName` and
 * so on) plus its parsed children.
 */
export type Manifest = Element<{
  package: string
  versionCode?: number
  versionName?: string
  usesPermissions: Attributes[]
  permissions: Attributes[]
  permissionTrees: Attributes[]
  permissionGroups: Attributes[]
  instrumentation: Attributes | null
  usesSdk: Attributes | null
  usesConfiguration: Attributes | null
  usesFeatures: Attributes[]
  supportsScreens: Attributes | null
  compatibleScreens: Attributes[]
  supportsGlTextures: Attributes[]
  application: Application
}>
