<template>
  <FormItemRest>
    <div class="carousel-items-field">
      <VueDraggable
        :model-value="innerItems"
        class="carousel-items-field__list"
        handle=".carousel-items-field__handle"
        :animation="150"
        :disabled="disabled"
        @update:model-value="handleReorder"
      >
        <Card
          v-for="(item, index) in innerItems"
          :key="item.id"
          class="carousel-items-field__card"
          size="small"
          bordered
        >
          <template #title>
            <span class="carousel-items-field__title">
              <Icon class="carousel-items-field__handle" icon="fluent:re-order-dots-vertical-24-regular" :size="14" />
              图片 {{ index + 1 }}
            </span>
          </template>
          <template #extra>
            <Button
              type="link"
              class="carousel-items-field__delete-button"
              :disabled="disabled || innerItems.length <= 1"
              @click="handleDelete(item.id)"
            >
              <Icon class="carousel-items-field__delete" icon="fluent:dismiss-circle-24-regular" :size="14" />
            </Button>
          </template>

          <ImageSourceField
            :value="item.src"
            :disabled="disabled"
            @update:value="(src) => handleSrcChange(item.id, src)"
          />

          <div class="carousel-items-field__link">
            <span class="carousel-items-field__link-label">跳转链接</span>
            <Input
              class="carousel-items-field__link-control"
              :value="item.link"
              :disabled="disabled"
              @update:value="(link) => handleLinkChange(item.id, link)"
            />
          </div>
        </Card>
      </VueDraggable>

      <Button block :disabled="disabled" @click="handleAdd">
        添加
      </Button>
    </div>
  </FormItemRest>
</template>

<script lang="ts" setup>
import { Button, Card, FormItemRest, Input } from 'ant-design-vue'
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import ImageSourceField from '../../inspector/ImageSourceField.vue'
import { Icon } from '../../icons/Icon'
import { buildUUID } from '../../shims/uuid'

interface CarouselItem {
  src: string
  link: string
}

interface CarouselItemView extends CarouselItem {
  id: string
}

const props = withDefaults(
  defineProps<{
    value?: CarouselItem[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:value': [value: CarouselItem[]]
}>()

const innerItems = ref<CarouselItemView[]>([])
let lastEmitted = ''

watch(
  () => props.value,
  (value) => {
    const next = normalizeItems(value)
    const serialized = JSON.stringify(next)

    if (serialized === lastEmitted) {
      return
    }

    lastEmitted = serialized
    innerItems.value = next.map(item => ({
      id: buildUUID(),
      src: item.src,
      link: item.link,
    }))
  },
  { immediate: true, deep: true },
)

function handleReorder(value: CarouselItemView[]) {
  innerItems.value = value
  commit()
}

function handleAdd() {
  innerItems.value = [
    ...innerItems.value,
    {
      id: buildUUID(),
      src: '',
      link: '',
    },
  ]
  commit()
}

function handleDelete(id: string) {
  if (innerItems.value.length <= 1) {
    return
  }

  innerItems.value = innerItems.value.filter(item => item.id !== id)
  commit()
}

function handleSrcChange(id: string, src: unknown) {
  patchItem(id, { src: typeof src === 'string' ? src : '' })
}

function handleLinkChange(id: string, link: unknown) {
  patchItem(id, { link: typeof link === 'string' ? link : '' })
}

function patchItem(id: string, patch: Partial<CarouselItem>) {
  innerItems.value = innerItems.value.map(item => (item.id === id ? { ...item, ...patch } : item))
  commit()
}

function commit() {
  const payload = innerItems.value.map(({ src, link }) => ({ src, link }))
  lastEmitted = JSON.stringify(payload)
  emit('update:value', payload)
}

function normalizeItems(value: unknown): CarouselItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { src: '', link: '' }
    }

    const record = item as Record<string, unknown>

    return {
      src: typeof record.src === 'string' ? record.src : '',
      link: typeof record.link === 'string' ? record.link : '',
    }
  })
}
</script>

<style scoped>
.carousel-items-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.carousel-items-field__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.carousel-items-field__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.carousel-items-field__handle {
  color: #8c8c8c;
  cursor: grab;
}

.carousel-items-field__delete-button {
  height: 24px;
  margin: 0;
  padding: 0;
}

.carousel-items-field__delete {
  color: #8c8c8c;
}

.carousel-items-field__link {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  width: 100%;
}

.carousel-items-field__link-label {
  flex: none;
  color: rgba(0, 0, 0, 0.88);
  font-size: 12px;
}

.carousel-items-field__link-control {
  flex: 1;
  min-width: 0;
}
</style>
