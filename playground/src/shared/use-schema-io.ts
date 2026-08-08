import { ref } from 'vue'

export interface UseSchemaIOOptions<Schema> {
  exportSchema: () => Schema | null
  importSchema: (schema: Schema) => unknown
  invalidSchemaMessage: string
  isValidSchema: (input: unknown) => input is Schema
}

export function useSchemaIO<Schema>(options: UseSchemaIOOptions<Schema>) {
  const {
    exportSchema,
    importSchema,
    invalidSchemaMessage,
    isValidSchema,
  } = options
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
      const schema: unknown = JSON.parse(importJson.value)
      if (!isValidSchema(schema)) {
        importError.value = invalidSchemaMessage
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
