import type { DesignerSchema } from '@dragcraft/designer'
import { ref } from 'vue'

export function useSchemaIO(
  exportSchema: () => DesignerSchema,
  importSchema: (schema: DesignerSchema) => void,
) {
  const showExportModal = ref(false)
  const showImportModal = ref(false)
  const exportJson = ref('')
  const importJson = ref('')
  const importError = ref('')

  function handleExport() {
    const schema = exportSchema()
    exportJson.value = JSON.stringify(schema, null, 2)
    showExportModal.value = true
  }

  function handleImportOpen() {
    importJson.value = ''
    importError.value = ''
    showImportModal.value = true
  }

  function handleImportConfirm() {
    try {
      const schema: DesignerSchema = JSON.parse(importJson.value)
      if (!schema.version || !schema.root) {
        importError.value = '无效的 Schema 格式：缺少 version 或 root 字段'
        return
      }
      importSchema(schema)
      showImportModal.value = false
    }
    catch {
      importError.value = 'JSON 解析失败，请检查格式'
    }
  }

  function handleCopyExport() {
    navigator.clipboard.writeText(exportJson.value)
  }

  return {
    showExportModal,
    showImportModal,
    exportJson,
    importJson,
    importError,
    handleExport,
    handleImportOpen,
    handleImportConfirm,
    handleCopyExport,
  }
}
