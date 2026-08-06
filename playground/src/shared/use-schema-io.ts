import type { DocumentSchema, SchemaLoadResult } from '@dragcraft/designer'
import { ref } from 'vue'

export function useSchemaIO(
  exportSchema: () => DocumentSchema | null,
  importSchema: (schema: unknown) => SchemaLoadResult,
) {
  const showExportModal = ref(false)
  const showImportModal = ref(false)
  const exportJson = ref('')
  const importJson = ref('')
  const importError = ref('')

  function handleExport() {
    exportJson.value = JSON.stringify(exportSchema(), null, 2)
    showExportModal.value = true
  }

  function handleImportOpen() {
    importJson.value = ''
    importError.value = ''
    showImportModal.value = true
  }

  function handleImportConfirm() {
    try {
      const result = importSchema(JSON.parse(importJson.value))
      if (result.status === 'rejected') {
        importError.value = `无效的 DocumentSchema：${result.diagnostics.items[0]?.code ?? 'UNKNOWN'}`
        return
      }
      showImportModal.value = false
    }
    catch {
      importError.value = 'JSON 解析失败，请检查格式'
    }
  }

  function handleCopyExport() {
    return navigator.clipboard.writeText(exportJson.value)
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
