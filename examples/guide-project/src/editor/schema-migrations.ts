import type { DesignerEngine, DesignerSchema } from '@dragcraft/designer'
import { GUIDE_SCHEMA_VERSION } from './initial-schema'

export function registerGuideSchemaMigrations(engine: DesignerEngine): void {
  engine.registerMigration({
    fromVersion: '1.0.0',
    toVersion: GUIDE_SCHEMA_VERSION,
    migrate(schema) {
      const migrated: DesignerSchema = {
        ...schema,
        version: GUIDE_SCHEMA_VERSION,
        globalConfig: { ...schema.globalConfig },
      }
      const legacyTitle = migrated.globalConfig.pageName
      if (typeof legacyTitle === 'string' && migrated.globalConfig.title === undefined)
        migrated.globalConfig.title = legacyTitle
      delete migrated.globalConfig.pageName
      return migrated
    },
  })
}
