<template>
  <FormItemRest>
    <div class="tab-bar-items-field">
      <VueDraggable
        :model-value="innerItems"
        class="tab-bar-items-field__list"
        handle=".tab-bar-items-field__handle"
        :animation="150"
        :disabled="disabled"
        @update:model-value="handleReorder"
      >
        <Card
          v-for="(item, index) in innerItems"
          :key="item.id"
          class="tab-bar-items-field__card"
          size="small"
          bordered
        >
          <div class="tab-bar-items-field__heading">
            <span class="tab-bar-items-field__title">
              <Icon class="tab-bar-items-field__handle" icon="ant-design:drag-outlined" :size="14" />
              导航项 {{ String(index + 1).padStart(2, '0') }}
            </span>
            <Button
              type="link"
              class="tab-bar-items-field__delete-button"
              :disabled="disabled || innerItems.length <= TAB_BAR_MIN_ITEMS"
              aria-label="删除导航项"
              @click="handleDelete(item.id)"
            >
              <Icon class="tab-bar-items-field__delete" icon="ant-design:close-circle-filled" :size="14" />
            </Button>
          </div>

          <div class="tab-bar-items-field__basic-info">
            <span class="tab-bar-items-field__section-title">基本信息</span>
            <label class="tab-bar-items-field__field">
              <span>标题</span>
              <Input
                :value="item.name"
                :disabled="disabled"
                :maxlength="10"
                placeholder="导航名称"
                @update:value="(name) => handleNameChange(item.id, name)"
              />
            </label>
            <label class="tab-bar-items-field__field">
              <span>页面路径</span>
              <Input
                :value="item.path"
                :disabled="disabled"
                placeholder="目标路径（自由文本）"
                @update:value="(path) => handlePathChange(item.id, path)"
              />
            </label>
          </div>

          <div class="tab-bar-items-field__appearance">
            <div class="tab-bar-items-field__state-heading">
              <span class="tab-bar-items-field__section-title">显示状态</span>
              <Segmented
                :value="getEditingState(item)"
                :options="getStateOptions(item)"
                :disabled="disabled"
                size="small"
                @update:value="(state) => handleEditingStateChange(item.id, state)"
              />
            </div>

            <div class="tab-bar-items-field__state-editor">
              <label class="tab-bar-items-field__icon-setting">
                <span>图标</span>
                <ImageSourceField
                  :value="getEditingIcon(item)"
                  :file-max-size="1"
                  :disabled="isEditingDisabled(item)"
                  @update:value="(icon) => handleEditingIconChange(item, icon)"
                />
              </label>
              <label class="tab-bar-items-field__color-setting">
                <span>标题颜色</span>
                <ColorField
                  :value="getEditingColor(item)"
                  :disabled="isEditingDisabled(item)"
                  @update:value="(color) => handleEditingColorChange(item, color)"
                />
              </label>
            </div>
          </div>
        </Card>
      </VueDraggable>

      <Button
        block
        :disabled="disabled || innerItems.length >= TAB_BAR_MAX_ITEMS"
        @click="handleAdd"
      >
        添加导航项
      </Button>
    </div>
  </FormItemRest>
</template>

<script lang="ts" setup>
import { Button, Card, FormItemRest, Input, Segmented } from 'ant-design-vue'
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { Icon } from '../../icons/Icon'
import ColorField from '../../inspector/ColorField.vue'
import ImageSourceField from '../../inspector/ImageSourceField.vue'
import { buildUUID } from '../../shims/uuid'
import {
  createTabBarItem,
  normalizeTabBarItems,
  TAB_BAR_MAX_ITEMS,
  TAB_BAR_MIN_ITEMS,
  truncateTabBarName,
  type TabBarItem,
} from './types'

interface TabBarItemView extends TabBarItem {
  id: string
}

type TabBarItemEditingState = 'inactive' | 'active'

const props = withDefaults(
  defineProps<{
    value?: TabBarItem[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:value': [value: TabBarItem[]]
}>()

const innerItems = ref<TabBarItemView[]>([])
const editingStateById = ref<Record<string, TabBarItemEditingState>>({})
let lastEmitted = ''

watch(
  () => props.value,
  (value) => {
    const next = normalizeTabBarItems(value)
    const serialized = JSON.stringify(next)

    if (serialized === lastEmitted) {
      return
    }

    lastEmitted = serialized
    innerItems.value = next.map(item => ({ ...item, id: buildUUID() }))
    editingStateById.value = Object.fromEntries(
      innerItems.value.map(item => [item.id, 'inactive']),
    )
  },
  { immediate: true, deep: true },
)

function handleReorder(value: TabBarItemView[]) {
  innerItems.value = value
  commit()
}

function handleAdd() {
  if (innerItems.value.length >= TAB_BAR_MAX_ITEMS) {
    return
  }

  const item = { ...createTabBarItem(), id: buildUUID() }
  innerItems.value = [...innerItems.value, item]
  editingStateById.value = { ...editingStateById.value, [item.id]: 'inactive' }
  commit()
}

function handleDelete(id: string) {
  if (innerItems.value.length <= TAB_BAR_MIN_ITEMS) {
    return
  }

  innerItems.value = innerItems.value.filter(item => item.id !== id)
  const remainingStates = { ...editingStateById.value }
  delete remainingStates[id]
  editingStateById.value = remainingStates
  commit()
}

function handleNameChange(id: string, name: unknown) {
  patchItem(id, { name: truncateTabBarName(typeof name === 'string' ? name : '') })
}

// prod 这里走 `createTabBarItem(path).path` 把值规范化到合法的页面枚举；playground 是自由文本，直接存。
function handlePathChange(id: string, path: unknown) {
  patchItem(id, { path: typeof path === 'string' ? path : '' })
}

function handleIconChange(id: string, icon: unknown) {
  patchItem(id, { icon: typeof icon === 'string' ? icon : '' })
}

function handleActiveIconChange(id: string, activeIcon: unknown) {
  patchItem(id, { activeIcon: typeof activeIcon === 'string' ? activeIcon : '' })
}

function handleActiveColorChange(id: string, activeColor: unknown) {
  patchItem(id, { activeColor: typeof activeColor === 'string' ? activeColor : '' })
}

function handleInactiveColorChange(id: string, inactiveColor: unknown) {
  patchItem(id, { inactiveColor: typeof inactiveColor === 'string' ? inactiveColor : '' })
}

function getStateOptions(item: TabBarItemView) {
  return [
    { label: '常规态', value: 'inactive' },
    { label: '激活态', value: 'active', disabled: !hasNormalIcon(item) },
  ]
}

function getEditingState(item: TabBarItemView): TabBarItemEditingState {
  const state = editingStateById.value[item.id] || 'inactive'
  return state === 'active' && !hasNormalIcon(item) ? 'inactive' : state
}

function handleEditingStateChange(id: string, state: unknown) {
  const item = innerItems.value.find(candidate => candidate.id === id)
  if (!item || !isTabBarItemEditingState(state) || (state === 'active' && !hasNormalIcon(item))) {
    return
  }

  editingStateById.value = { ...editingStateById.value, [id]: state }
}

function getEditingIcon(item: TabBarItemView) {
  return getEditingState(item) === 'active' ? item.activeIcon : item.icon
}

function getEditingColor(item: TabBarItemView) {
  return getEditingState(item) === 'active' ? item.activeColor : item.inactiveColor
}

function isEditingDisabled(item: TabBarItemView) {
  return props.disabled || (getEditingState(item) === 'active' && !hasNormalIcon(item))
}

function handleEditingIconChange(item: TabBarItemView, icon: unknown) {
  if (getEditingState(item) === 'active') {
    handleActiveIconChange(item.id, icon)
    return
  }

  handleIconChange(item.id, icon)
}

function handleEditingColorChange(item: TabBarItemView, color: unknown) {
  if (getEditingState(item) === 'active') {
    handleActiveColorChange(item.id, color)
    return
  }

  handleInactiveColorChange(item.id, color)
}

function hasNormalIcon(item: TabBarItemView) {
  return Boolean(item.icon.trim())
}

function isTabBarItemEditingState(value: unknown): value is TabBarItemEditingState {
  return value === 'inactive' || value === 'active'
}

function patchItem(id: string, patch: Partial<TabBarItem>) {
  innerItems.value = innerItems.value.map(item =>
    item.id === id ? { ...item, ...patch } : item,
  )
  commit()
}

function commit() {
  const payload = normalizeTabBarItems(
    innerItems.value.map(item => ({
      name: item.name,
      icon: item.icon,
      activeIcon: item.activeIcon,
      path: item.path,
      activeColor: item.activeColor,
      inactiveColor: item.inactiveColor,
    })),
  )

  lastEmitted = JSON.stringify(payload)
  emit('update:value', payload)
}
</script>

<style scoped>
.tab-bar-items-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.tab-bar-items-field__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tab-bar-items-field__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin-bottom: 10px;
}

.tab-bar-items-field__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: rgba(0, 0, 0, 0.88);
  font-size: 13px;
  font-weight: 500;
}

.tab-bar-items-field__handle {
  color: #8c8c8c;
  cursor: grab;
}

.tab-bar-items-field__delete-button {
  flex: none;
  margin: 0;
  padding: 0;
}

.tab-bar-items-field__delete {
  color: #8c8c8c;
}

.tab-bar-items-field__basic-info,
.tab-bar-items-field__appearance {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tab-bar-items-field__appearance {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.tab-bar-items-field__section-title {
  color: rgba(0, 0, 0, 0.88);
  font-size: 12px;
  font-weight: 500;
}

.tab-bar-items-field__field {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
}

.tab-bar-items-field__field > :first-child {
  flex: none;
  width: 48px;
}

.tab-bar-items-field__field > :last-child {
  flex: 1;
  min-width: 0;
}

.tab-bar-items-field__state-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/*
 * prod 这里是 `grid-template-columns: 72px minmax(0, 1fr)`——左 72px 放上传缩略图、右侧放取色器。
 * playground 的 ImageSourceField 是「URL 输入 + 本地文件按钮」横向一行，塞不进 72px 的列，
 * 所以改成上下堆叠。见票据 Answer 的偏离说明。
 */
.tab-bar-items-field__state-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.tab-bar-items-field__icon-setting,
.tab-bar-items-field__color-setting {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
}
</style>
