<template>
  <FormItemRest>
    <div class="navigation-items-field">
      <VueDraggable
        :model-value="innerItems"
        class="navigation-items-field__list"
        handle=".navigation-items-field__handle"
        :animation="150"
        :disabled="disabled"
        @update:model-value="handleReorder"
      >
        <Card
          v-for="(item, index) in innerItems"
          :key="item.id"
          class="navigation-items-field__card"
          size="small"
          bordered
        >
          <template #title>
            <span class="navigation-items-field__title">
              <Icon class="navigation-items-field__handle" icon="fluent:re-order-dots-vertical-24-regular" :size="14" />
              导航项 {{ index + 1 }}
            </span>
          </template>
          <template #extra>
            <Button
              type="link"
              class="navigation-items-field__delete-button"
              :disabled="disabled"
              aria-label="删除导航项"
              @click="handleDelete(item.id)"
            >
              <Icon class="navigation-items-field__delete" icon="fluent:dismiss-circle-24-regular" :size="14" />
            </Button>
          </template>

          <div class="navigation-items-field__inputs">
            <ImageSourceField
              :value="item.icon"
              :disabled="disabled"
              @update:value="(icon) => handleIconChange(item.id, icon)"
            />
            <Input
              :value="item.title"
              :disabled="disabled"
              :maxlength="10"
              show-count
              placeholder="导航标题"
              @update:value="(title) => handleTitleChange(item.id, title)"
            />
            <Input
              :value="item.link"
              :disabled="disabled"
              placeholder="跳转链接"
              @update:value="(link) => handleLinkChange(item.id, link)"
            />
          </div>

          <div class="navigation-items-field__badge-switch">
            <span>角标</span>
            <Switch
              :checked="item.badge.enabled"
              :disabled="disabled"
              @update:checked="(enabled) => handleBadgeEnabledChange(item.id, enabled)"
            />
          </div>

          <div v-if="item.badge.enabled" class="navigation-items-field__badge-settings">
            <RadioGroup
              :value="item.badge.type"
              :disabled="disabled"
              :options="badgeTypeOptions"
              option-type="button"
              button-style="solid"
              @update:value="(type) => handleBadgeTypeChange(item.id, type)"
            />

            <Input
              v-if="item.badge.type === 'text'"
              :value="item.badge.text"
              :disabled="disabled"
              placeholder="角标文本"
              @update:value="(text) => handleBadgeTextChange(item.id, text)"
            />
            <ImageSourceField
              v-else
              class="navigation-items-field__badge-image"
              :value="item.badge.image"
              :disabled="disabled"
              @update:value="(image) => handleBadgeImageChange(item.id, image)"
            />

            <div class="navigation-items-field__badge-grid">
              <label class="navigation-items-field__setting">
                <span>上间距</span>
                <SliderNumberInput
                  :value="item.badge.offsetTop"
                  :min="-100"
                  :max="100"
                  :disabled="disabled"
                  @update:value="(offsetTop) => handleBadgeChange(item.id, { offsetTop })"
                />
              </label>
              <label class="navigation-items-field__setting">
                <span>右间距</span>
                <SliderNumberInput
                  :value="item.badge.offsetRight"
                  :min="-100"
                  :max="100"
                  :disabled="disabled"
                  @update:value="(offsetRight) => handleBadgeChange(item.id, { offsetRight })"
                />
              </label>
              <label class="navigation-items-field__setting">
                <span>背景色</span>
                <ColorField
                  :value="item.badge.backgroundColor"
                  :disabled="disabled"
                  @update:value="(backgroundColor) => handleBadgeChange(item.id, { backgroundColor })"
                />
              </label>
              <label class="navigation-items-field__setting">
                <span>圆角</span>
                <SliderNumberInput
                  :value="item.badge.radius"
                  :min="0"
                  :max="50"
                  :disabled="disabled"
                  @update:value="(radius) => handleBadgeChange(item.id, { radius })"
                />
              </label>
            </div>
          </div>
        </Card>
      </VueDraggable>

      <Button block :disabled="disabled" @click="handleAdd">
        添加导航项
      </Button>
    </div>
  </FormItemRest>
</template>

<script lang="ts" setup>
import { Button, Card, FormItemRest, Input, RadioGroup, Switch } from 'ant-design-vue'
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { Icon } from '../../icons/Icon'
import ColorField from '../../inspector/ColorField.vue'
import ImageSourceField from '../../inspector/ImageSourceField.vue'
import SliderNumberInput from '../../inspector/SliderNumberInput.vue'
import { buildUUID } from '../../shims/uuid'
import {
  createNavigationItem,
  normalizeNavigationItems,
  truncateNavigationTitle,
  type NavigationBadge,
  type NavigationItem,
} from './types'

interface NavigationItemView extends NavigationItem {
  id: string
}

const badgeTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
]

const props = withDefaults(
  defineProps<{
    value?: NavigationItem[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:value': [value: NavigationItem[]]
}>()

const innerItems = ref<NavigationItemView[]>([])
let lastEmitted = ''

watch(
  () => props.value,
  (value) => {
    const next = normalizeNavigationItems(value)
    const serialized = JSON.stringify(next)

    if (serialized === lastEmitted) {
      return
    }

    lastEmitted = serialized
    innerItems.value = next.map(item => ({ ...item, badge: { ...item.badge }, id: buildUUID() }))
  },
  { immediate: true, deep: true },
)

function handleReorder(value: NavigationItemView[]) {
  innerItems.value = value
  commit()
}

function handleAdd() {
  innerItems.value = [...innerItems.value, { ...createNavigationItem(), id: buildUUID() }]
  commit()
}

function handleDelete(id: string) {
  innerItems.value = innerItems.value.filter(item => item.id !== id)
  commit()
}

function handleIconChange(id: string, icon: unknown) {
  patchItem(id, { icon: typeof icon === 'string' ? icon : '' })
}

function handleTitleChange(id: string, title: unknown) {
  patchItem(id, { title: truncateNavigationTitle(typeof title === 'string' ? title : '') })
}

function handleLinkChange(id: string, link: unknown) {
  patchItem(id, { link: typeof link === 'string' ? link : '' })
}

function handleBadgeEnabledChange(id: string, enabled: unknown) {
  handleBadgeChange(id, { enabled: enabled === true })
}

function handleBadgeTypeChange(id: string, type: unknown) {
  handleBadgeChange(id, { type: type === 'image' ? 'image' : 'text' })
}

function handleBadgeTextChange(id: string, text: unknown) {
  handleBadgeChange(id, { text: typeof text === 'string' ? text : '' })
}

function handleBadgeImageChange(id: string, image: unknown) {
  handleBadgeChange(id, { image: typeof image === 'string' ? image : '' })
}

function handleBadgeChange(id: string, patch: Partial<NavigationBadge>) {
  const item = innerItems.value.find(entry => entry.id === id)

  if (!item) {
    return
  }

  patchItem(id, { badge: { ...item.badge, ...patch } })
}

function patchItem(id: string, patch: Partial<NavigationItem>) {
  innerItems.value = innerItems.value.map(item =>
    item.id === id ? { ...item, ...patch, badge: patch.badge || item.badge } : item,
  )
  commit()
}

function commit() {
  const payload = innerItems.value.map(({ id: _id, ...item }) => ({
    ...item,
    badge: { ...item.badge },
  }))

  lastEmitted = JSON.stringify(payload)
  emit('update:value', payload)
}
</script>

<style scoped>
.navigation-items-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.navigation-items-field__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.navigation-items-field__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.navigation-items-field__handle {
  color: #8c8c8c;
  cursor: grab;
}

.navigation-items-field__delete-button {
  margin: 0;
  padding: 0;
}

.navigation-items-field__delete {
  color: #8c8c8c;
}

/*
 * prod 这里是「左 64px 上传缩略图 + 右标题/链接」的左右布局，靠 JImageUpload 的
 * picture-card 形态撑出缩略图。playground 的 ImageSourceField 是横向一行，塞不进 64px 的列，
 * 所以改成上下堆叠。见票据 Answer 的偏离说明。
 */
.navigation-items-field__inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.navigation-items-field__badge-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 12px;
}

.navigation-items-field__badge-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.navigation-items-field__badge-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 10px;
}

.navigation-items-field__setting {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
}
</style>
