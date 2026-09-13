<template>
  <div class="image-source-field">
    <div class="image-source-field__row">
      <Input
        class="image-source-field__input"
        :value="props.value ?? ''"
        :disabled="props.disabled"
        placeholder="图片 URL"
        @update:value="handleTextInput"
      />
      <Button :disabled="props.disabled" @click="openFilePicker">
        本地文件
      </Button>
    </div>
    <input
      ref="fileInput"
      class="image-source-field__file"
      type="file"
      accept="image/*"
      @change="handleFileChange"
    >
    <div v-if="errorMessage" class="image-source-field__error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button, Input } from 'ant-design-vue'
import { computed, ref } from 'vue'

/**
 * prod 的图片由宿主 `JImageUpload` 上传到存储服务后存 URL。playground 没有后端，
 * 所以这里同时支持两条路径：直接填/粘贴图片 URL，或选本地文件转成 data URL。
 * 后者让导出的 schema 自包含（不依赖外部图床），代价是体积变大，故按 prod 的
 * `fileMaxSize` 约定限制在 2MB。
 */
const DEFAULT_FILE_MAX_SIZE_MB = 2

const props = withDefaults(
  defineProps<{
    value?: string
    disabled?: boolean
    /**
     * 单文件大小上限（MB）。沿用 prod `JImageUpload` 的 `fileMaxSize` 语义：
     * 普通图片 2MB、图标类 1MB（见 prod 的 AGENTS.md）。
     */
    fileMaxSize?: number
  }>(),
  {
    disabled: false,
    fileMaxSize: DEFAULT_FILE_MAX_SIZE_MB,
  },
)

const emit = defineEmits<{
  'update:value': [value: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')

const maxFileSizeBytes = computed(() => props.fileMaxSize * 1024 * 1024)

function openFilePicker() {
  errorMessage.value = ''
  fileInput.value?.click()
}

function handleTextInput(value: unknown) {
  if (typeof value === 'string') {
    errorMessage.value = ''
    emit('update:value', value)
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  // 允许重复选择同一个文件
  target.value = ''

  if (!file) return

  if (file.size > maxFileSizeBytes.value) {
    errorMessage.value = `图片不能超过 ${props.fileMaxSize}MB（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`
    return
  }

  readAsDataUrl(file)
}

function readAsDataUrl(file: File) {
  const reader = new FileReader()

  reader.onload = () => {
    if (typeof reader.result === 'string') {
      errorMessage.value = ''
      emit('update:value', reader.result)
    }
  }
  reader.onerror = () => {
    errorMessage.value = '读取图片失败'
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
.image-source-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  width: 100%;
}

.image-source-field__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.image-source-field__input {
  flex: 1 1 0;
  min-width: 0;
}

.image-source-field__file {
  display: none;
}

.image-source-field__error {
  color: var(--dc-color-danger);
  font-size: 12px;
}
</style>
