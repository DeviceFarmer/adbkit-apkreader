import BinaryXmlParser from './binaryxml'
import type {
  Application,
  Attributes,
  Component,
  IntentFilter,
  Manifest,
  ParserOptions,
  Provider,
  XmlElement,
  XmlNode
} from '../types'

// const NS_ANDROID = 'http://schemas.android.com/apk/res/android'
const INTENT_MAIN = 'android.intent.action.MAIN'
const CATEGORY_LAUNCHER = 'android.intent.category.LAUNCHER'
const CATEGORY_LEANBACK_LAUNCHER = 'android.intent.category.LEANBACK_LAUNCHER'

// Only elements reach the switches below, so the CDATA nodes that share
// childNodes with them are never collapsed.
const children = (element: XmlElement) => element.childNodes as XmlElement[]

class ManifestParser {
  buffer: Buffer
  xmlParser: BinaryXmlParser

  constructor(buffer: Buffer, options: ParserOptions = {}) {
    this.buffer = buffer
    this.xmlParser = new BinaryXmlParser(this.buffer, options)
  }

  collapseAttributes(element: XmlNode): Attributes {
    const collapsed: Attributes = Object.create(null)
    for (const attr of Array.from((element as XmlElement).attributes)) {
      collapsed[attr.name] = attr.typedValue.value
    }
    return collapsed
  }

  parseIntents(element: XmlElement, target: Record<string, unknown>): void {
    const component = target as Component
    component.intentFilters = []
    component.metaData = []

    return children(element).forEach(element => {
      switch (element.nodeName) {
        case 'intent-filter': {
          const intentFilter = this.collapseAttributes(element) as IntentFilter

          intentFilter.actions = []
          intentFilter.categories = []
          intentFilter.data = []

          children(element).forEach(element => {
            switch (element.nodeName) {
              case 'action':
                intentFilter.actions.push(this.collapseAttributes(element))
                break
              case 'category':
                intentFilter.categories.push(this.collapseAttributes(element))
                break
              case 'data':
                intentFilter.data.push(this.collapseAttributes(element))
                break
            }
          })

          component.intentFilters.push(intentFilter)
          break
        }
        case 'meta-data':
          component.metaData.push(this.collapseAttributes(element))
          break
      }
    })
  }

  parseApplication(element: XmlElement): Application {
    const app = this.collapseAttributes(element) as Application

    app.activities = []
    app.activityAliases = []
    app.launcherActivities = []
    app.leanbackLauncherActivities = []
    app.services = []
    app.receivers = []
    app.providers = []
    app.usesLibraries = []

    children(element).forEach(element => {
      switch (element.nodeName) {
        case 'activity': {
          const activity = this.collapseAttributes(element) as Component
          this.parseIntents(element, activity)
          app.activities.push(activity)
          if (this.isLauncherActivity(activity)) {
            app.launcherActivities.push(activity)
          }
          if (this.isLeanbackLauncherActivity(activity)) {
            app.leanbackLauncherActivities.push(activity)
          }
          break
        }
        case 'activity-alias': {
          const activityAlias = this.collapseAttributes(element) as Component
          this.parseIntents(element, activityAlias)
          app.activityAliases.push(activityAlias)
          if (this.isLauncherActivity(activityAlias)) {
            app.launcherActivities.push(activityAlias)
          }
          if (this.isLeanbackLauncherActivity(activityAlias)) {
            app.leanbackLauncherActivities.push(activityAlias)
          }
          break
        }
        case 'service': {
          const service = this.collapseAttributes(element) as Component
          this.parseIntents(element, service)
          app.services.push(service)
          break
        }
        case 'receiver': {
          const receiver = this.collapseAttributes(element) as Component
          this.parseIntents(element, receiver)
          app.receivers.push(receiver)
          break
        }
        case 'provider': {
          const provider = this.collapseAttributes(element) as Provider

          provider.grantUriPermissions = []
          provider.metaData = []
          provider.pathPermissions = []

          children(element).forEach(element => {
            switch (element.nodeName) {
              case 'grant-uri-permission':
                provider.grantUriPermissions.push(
                  this.collapseAttributes(element)
                )
                break
              case 'meta-data':
                provider.metaData.push(this.collapseAttributes(element))
                break
              case 'path-permission':
                provider.pathPermissions.push(this.collapseAttributes(element))
                break
            }
          })

          app.providers.push(provider)
          break
        }
        case 'uses-library':
          app.usesLibraries.push(this.collapseAttributes(element))
          break
      }
    })

    return app
  }

  isLauncherActivity(activity: Component): boolean {
    return activity.intentFilters.some(function (filter) {
      const hasMain = filter.actions.some(action => action.name === INTENT_MAIN)
      if (!hasMain) {
        return false
      }
      return filter.categories.some(
        category => category.name === CATEGORY_LAUNCHER
      )
    })
  }

  isLeanbackLauncherActivity(activity: Component): boolean {
    return activity.intentFilters.some(function (filter) {
      const hasMain = filter.actions.some(action => action.name === INTENT_MAIN)
      if (!hasMain) {
        return false
      }
      return filter.categories.some(
        category => category.name === CATEGORY_LEANBACK_LAUNCHER
      )
    })
  }

  parse(): Manifest {
    // A document without a root element fails in collapseAttributes(), as
    // it always has.
    const document = this.xmlParser.parse()!
    const manifest = this.collapseAttributes(document) as Manifest

    manifest.usesPermissions = []
    manifest.permissions = []
    manifest.permissionTrees = []
    manifest.permissionGroups = []
    manifest.instrumentation = null
    manifest.usesSdk = null
    manifest.usesConfiguration = null
    manifest.usesFeatures = []
    manifest.supportsScreens = null
    manifest.compatibleScreens = []
    manifest.supportsGlTextures = []
    manifest.application = Object.create(null)

    children(document).forEach(element => {
      switch (element.nodeName) {
        case 'uses-permission':
          manifest.usesPermissions.push(this.collapseAttributes(element))
          break
        case 'permission':
          manifest.permissions.push(this.collapseAttributes(element))
          break
        case 'permission-tree':
          manifest.permissionTrees.push(this.collapseAttributes(element))
          break
        case 'permission-group':
          manifest.permissionGroups.push(this.collapseAttributes(element))
          break
        case 'instrumentation':
          manifest.instrumentation = this.collapseAttributes(element)
          break
        case 'uses-sdk':
          manifest.usesSdk = this.collapseAttributes(element)
          break
        case 'uses-configuration':
          manifest.usesConfiguration = this.collapseAttributes(element)
          break
        case 'uses-feature':
          manifest.usesFeatures.push(this.collapseAttributes(element))
          break
        case 'supports-screens':
          manifest.supportsScreens = this.collapseAttributes(element)
          break
        case 'compatible-screens':
          children(element).forEach(screen => {
            return manifest.compatibleScreens.push(
              this.collapseAttributes(screen)
            )
          })
          break
        case 'supports-gl-texture':
          manifest.supportsGlTextures.push(this.collapseAttributes(element))
          break
        case 'application':
        case 'com.stub.StubApp': // 360 encryption services (adbkit-apkreader#13)
          manifest.application = this.parseApplication(element)
          break
      }
    })

    return manifest
  }
}

export = ManifestParser
