<template>
  <FormItemRest>
    <div class="notice-items-field">
      <VueDraggable
        :model-value="innerItems"
        class="notice-items-field__list"
        handle=".notice-items-field__handle"
        :animation="150"
        :disabled="disabled"
        @update:model-value="handleReorder"
      >
        <Card
          v-for="(item, index) in innerItems"
          :key="item.id"
          class="notice-items-field__card"
          size="small"
          bordered
        >
          <template #title>
            <span class="notice-items-field__title">
              <Icon class="notice-items-field__handle" icon="fluent:re-order-dots-vertical-24-regular" :size="14" />
              公告 {{ index + 1 }}
            </span>
          </template>
          <template #extra>
            <div class="notice-items-field__actions">
              <span class="notice-items-field__status-label">显示</span>
              <Switch
                :checked="item.enabled"
                :disabled="disabled"
                size="small"
                @update:checked="(enabled) => handleEnabledChange(item.id, enabled)"
              />
              <Button
                type="text"
                class="notice-items-field__delete-button"
                :disabled="disabled"
                aria-label="删除公告"
                @click="handleDelete(item.id)"
              >
                <Icon class="notice-items-field__delete" icon="fluent:dismiss-circle-24-regular" :size="14" />
              </Button>
            </div>
          </template>

          <div class="notice-items-field__content">
            <div class="notice-items-field__field">
              <span class="notice-items-field__field-label">公告标题</span>
              <Input
                :value="item.title"
                :disabled="disabled"
                placeholder="请输入公告标题"
                @update:value="(title) => handleTitleChange(item.id, title)"
              />
            </div>
            <div class="notice-items-field__field">
              <span class="notice-items-field__field-label">跳转内容</span>
              <Input
                :value="item.link"
                :disabled="disabled"
                placeholder="跳转链接"
                @update:value="(link) => handleLinkChange(item.id, link)"
              />
            </div>
          </div>
        </Card>
      </VueDraggable>

      <Button block :disabled="disabled" @click="handleAdd">
        添加公告
      </Button>
    </div>
  </FormItemRest>
</template>

<script lang="ts" setup>
import { Button, Card, FormItemRest, Input, Switch } from 'ant-design-vue'
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { Icon } from '../../icons/Icon'
import { buildUUID } from '../../shims/uuid'
import { createNoticeItem, normalizeNoticeItems, type NoticeItem } from './types'

interface NoticeItemView extends NoticeItem {
  id: string
}

const props = withDefaults(
  defineProps<{
    value?: NoticeItem[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:value': [value: NoticeItem[]]
}>()

const innerItems = ref<NoticeItemView[]>([])
let lastEmitted = ''

watch(
  () => props.value,
  (value) => {
    const next = normalizeNoticeItems(value)
    const serialized = JSON.stringify(next)

    if (serialized === lastEmitted) {
      return
    }

    lastEmitted = serialized
    innerItems.value = next.map(item => ({ ...item, id: buildUUID() }))
  },
  { immediate: true, deep: true },
)

function handleReorder(value: NoticeItemView[]) {
  innerItems.value = value
  commit()
}

function handleAdd() {
  innerItems.value = [...innerItems.value, { ...createNoticeItem(), id: buildUUID() }]
  commit()
}

function handleDelete(id: string) {
  innerItems.value = innerItems.value.filter(item => item.id !== id)
  commit()
}

function handleTitleChange(id: string, title: unknown) {
  patchItem(id, { title: typeof title === 'string' ? title : '' })
}

function handleLinkChange(id: string, link: unknown) {
  patchItem(id, { link: typeof link === 'string' ? link : '' })
}

function handleEnabledChange(id: string, enabled: unknown) {
  patchItem(id, { enabled: enabled === true })
}

function patchItem(id: string, patch: Partial<NoticeItem>) {
  innerItems.value = innerItems.value.map(item =>
    item.id === id ? { ...item, ...patch } : item,
  )
  commit()
}

function commit() {
  const payload = innerItems.value.map(item => ({
    title: item.title,
    link: item.link,
    enabled: item.enabled,
  }))

  lastEmitted = JSON.stringify(payload)
  emit('update:value', payload)
}
</script>

<style scoped>
.notice-items-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.notice-items-field__list,
.notice-items-field__content,
.notice-items-field__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-items-field__field-label {
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  line-height: 16px;
}

.notice-items-field__title,
.notice-items-field__actions {
  display: inline-flex;
  align-items: center;
}

.notice-items-field__title {
  gap: 8px;
}

.notice-items-field__actions {
  gap: 8px;
}

.notice-items-field__status-label {
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
}

.notice-items-field__handle {
  color: #8c8c8c;
  cursor: grab;
}

.notice-items-field__delete-button {
  margin: 0;
  padding: 0;
}

.notice-items-field__delete {
  color: #8c8c8c;
}
</style>
