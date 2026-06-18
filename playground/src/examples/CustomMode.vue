<script setup lang="ts">
import { createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
import type { DesignerSchema, WidgetMeta } from '@dragcraft/designer'
import { defineComponent, h, ref } from 'vue'

// ──────────────────────────────────────────
// Custom Widget: Counter
// ──────────────────────────────────────────

const counterWidgetMeta: WidgetMeta = {
  type: 'custom-counter',
  title: '计数器',
  group: 'custom',
  icon: '#',
  defaultProps: {
    label: '点击计数',
    initialValue: 0,
  },
  defaultStyle: {
    padding: '16px',
  },
  formSchema: {
    sections: [
      {
        title: '计数器设置',
        fields: [
          { key: 'label', label: '标签', component: 'input', defaultValue: '点击计数' },
          { key: 'initialValue', label: '初始值', component: 'number', defaultValue: 0 },
        ],
      },
    ],
  },
}

const CounterWidget = defineComponent({
  name: 'CounterWidget',
  props: {
    label: { type: String, default: '点击计数' },
    initialValue: { type: Number, default: 0 },
  },
  setup(props) {
    const count = ref(props.initialValue)
    return () =>
      h('div', { style: 'display:flex;align-items:center;gap:12px;font-family:sans-serif;' }, [
        h('span', { style: 'font-size:14px;color:#333;' }, props.label),
        h('button', {
          style: 'width:28px;height:28px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;font-size:16px;line-height:1;',
          onClick: (e: Event) => { e.stopPropagation(); count.value-- },
        }, '-'),
        h('span', { style: 'min-width:32px;text-align:center;font-size:16px;font-weight:600;color:#1677ff;' }, count.value),
        h('button', {
          style: 'width:28px;height:28px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;font-size:16px;line-height:1;',
          onClick: (e: Event) => { e.stopPropagation(); count.value++ },
        }, '+'),
      ])
  },
})

// ──────────────────────────────────────────
// Custom Widget: Badge
// ──────────────────────────────────────────

const badgeWidgetMeta: WidgetMeta = {
  type: 'custom-badge',
  title: '徽章',
  group: 'custom',
  icon: 'B',
  defaultProps: {
    text: 'NEW',
    color: '#1677ff',
  },
  defaultStyle: {
    padding: '8px 16px',
  },
  formSchema: {
    sections: [
      {
        title: '徽章设置',
        fields: [
          { key: 'text', label: '文本', component: 'input', defaultValue: 'NEW' },
          { key: 'color', label: '颜色', component: 'color', defaultValue: '#1677ff' },
        ],
      },
    ],
  },
}

const BadgeWidget = defineComponent({
  name: 'BadgeWidget',
  props: {
    text: { type: String, default: 'NEW' },
    color: { type: String, default: '#1677ff' },
  },
  setup(props) {
    return () =>
      h('span', {
        style: `display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600;color:#fff;background:${props.color};font-family:sans-serif;`,
      }, props.text)
  },
})

// ──────────────────────────────────────────
// Custom Widget: Progress Bar
// ──────────────────────────────────────────

const progressWidgetMeta: WidgetMeta = {
  type: 'custom-progress',
  title: '进度条',
  group: 'custom',
  icon: '%',
  defaultProps: {
    percent: 60,
    color: '#52c41a',
    height: 8,
  },
  defaultStyle: {
    padding: '8px 16px',
  },
  formSchema: {
    sections: [
      {
        title: '进度设置',
        fields: [
          { key: 'percent', label: '百分比', component: 'slider', defaultValue: 60, props: { min: 0, max: 100 } },
          { key: 'color', label: '颜色', component: 'color', defaultValue: '#52c41a' },
          { key: 'height', label: '高度 (px)', component: 'number', defaultValue: 8, props: { min: 2, max: 32 } },
        ],
      },
    ],
  },
}

const ProgressWidget = defineComponent({
  name: 'ProgressWidget',
  props: {
    percent: { type: Number, default: 60 },
    color: { type: String, default: '#52c41a' },
    height: { type: Number, default: 8 },
  },
  setup(props) {
    return () =>
      h('div', { style: 'display:flex;align-items:center;gap:8px;font-family:sans-serif;' }, [
        h('div', {
          style: `flex:1;height:${props.height}px;background:#f0f0f0;border-radius:${props.height / 2}px;overflow:hidden;`,
        }, [
          h('div', {
            style: `width:${Math.min(100, Math.max(0, props.percent))}%;height:100%;background:${props.color};border-radius:${props.height / 2}px;transition:width 0.3s;`,
          }),
        ]),
        h('span', { style: 'font-size:12px;color:#666;min-width:36px;text-align:right;' }, `${props.percent}%`),
      ])
  },
})

// ──────────────────────────────────────────
// Custom Field: Icon Picker
// ──────────────────────────────────────────

const IconPickerField = defineComponent({
  name: 'IconPickerField',
  props: {
    field: { type: Object, required: true },
    modelValue: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const icons = ['#', 'B', '%', '?', '!', '*', '@', '&']
    return () =>
      h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap;' },
        icons.map(icon =>
          h('button', {
            key: icon,
            style: `width:32px;height:32px;border:1px solid ${props.modelValue === icon ? '#1677ff' : '#d9d9d9'};border-radius:4px;background:${props.modelValue === icon ? '#e6f4ff' : '#fff'};cursor:pointer;font-size:14px;`,
            onClick: () => emit('update:modelValue', icon),
          }, icon),
        ),
      )
  },
})

// ──────────────────────────────────────────
// Assemble widget metas, component map, field component map
// ──────────────────────────────────────────

const widgetMetas = [counterWidgetMeta, badgeWidgetMeta, progressWidgetMeta]

const componentMap: Record<string, ReturnType<typeof defineComponent>> = {
  'custom-counter': CounterWidget,
  'custom-badge': BadgeWidget,
  'custom-progress': ProgressWidget,
}

// Custom field map: provide icon-picker + basic input/number/color/slider
const InputField = defineComponent({
  name: 'InputField',
  props: { field: { type: Object, required: true }, modelValue: { type: [String, Number], default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'text',
      value: props.modelValue,
      placeholder: (props.field as Record<string, unknown>).placeholder as string ?? '',
      style: 'width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;box-sizing:border-box;',
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
    })
  },
})

const NumberField = defineComponent({
  name: 'NumberField',
  props: { field: { type: Object, required: true }, modelValue: { type: Number, default: 0 } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'number',
      value: props.modelValue,
      style: 'width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;box-sizing:border-box;',
      onInput: (e: Event) => emit('update:modelValue', Number((e.target as HTMLInputElement).value)),
    })
  },
})

const ColorField = defineComponent({
  name: 'ColorField',
  props: { field: { type: Object, required: true }, modelValue: { type: String, default: '#000000' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'color',
      value: props.modelValue,
      style: 'width:48px;height:28px;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;',
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
    })
  },
})

const SliderField = defineComponent({
  name: 'SliderField',
  props: { field: { type: Object, required: true }, modelValue: { type: Number, default: 0 } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const s = props.field as Record<string, unknown>
    return () => h('input', {
      type: 'range',
      value: props.modelValue,
      min: (s.props as Record<string, unknown>)?.min ?? 0,
      max: (s.props as Record<string, unknown>)?.max ?? 100,
      style: 'width:100%;',
      onInput: (e: Event) => emit('update:modelValue', Number((e.target as HTMLInputElement).value)),
    })
  },
})

const fieldComponentMap: Record<string, ReturnType<typeof defineComponent>> = {
  input: InputField,
  number: NumberField,
  color: ColorField,
  slider: SliderField,
  'icon-picker': IconPickerField,
}

// ──────────────────────────────────────────
// Initial schema for custom mode
// ──────────────────────────────────────────

const customInitialSchema = {
  version: '1.0.0',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      {
        id: 'counter-1',
        type: 'custom-counter',
        props: { label: '访问量', initialValue: 128 },
        style: { padding: '16px' },
      },
      {
        id: 'badge-1',
        type: 'custom-badge',
        props: { text: 'HOT', color: '#ff4d4f' },
        style: { padding: '8px 16px' },
      },
      {
        id: 'progress-1',
        type: 'custom-progress',
        props: { percent: 75, color: '#1677ff', height: 10 },
        style: { padding: '8px 16px' },
      },
    ],
  },
}

// ── Create designer instance ─────────────────

const designer = createDesigner({
  engineOptions: {
    initialSchema: customInitialSchema,
    maxHistorySize: 50,
  },
  widgetMetas,
  componentMap,
  fieldComponentMap,
})

const { exportSchema, importSchema } = useDesigner(designer)

// ── Import / Export state ────────────────────

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
      importError.value = '\u65E0\u6548\u7684 Schema \u683C\u5F0F\uFF1A\u7F3A\u5C11 version \u6216 root \u5B57\u6BB5'
      return
    }
    importSchema(schema)
    showImportModal.value = false
  }
  catch {
    importError.value = 'JSON \u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F'
  }
}

function handleCopyExport() {
  navigator.clipboard.writeText(exportJson.value)
}
</script>

<template>
  <div class="playground-app">
    <DcDesigner :instance="designer" />

    <!-- Action Bar -->
    <div class="playground-actions">
      <span class="playground-actions__label">Custom Mode (User-defined Widgets + Fields)</span>
      <div class="playground-actions__spacer" />
      <button class="playground-actions__btn" @click="handleImportOpen">
        Import
      </button>
      <button class="playground-actions__btn playground-actions__btn--primary" @click="handleExport">
        Export
      </button>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="playground-modal-overlay" @click.self="showExportModal = false">
      <div class="playground-modal">
        <div class="playground-modal__header">
          <span>Export Schema</span>
          <button class="playground-modal__close" @click="showExportModal = false">
            &times;
          </button>
        </div>
        <div class="playground-modal__body">
          <textarea
            class="playground-modal__textarea"
            readonly
            :value="exportJson"
          />
        </div>
        <div class="playground-modal__footer">
          <button class="playground-actions__btn" @click="handleCopyExport">
            Copy
          </button>
          <button class="playground-actions__btn" @click="showExportModal = false">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="playground-modal-overlay" @click.self="showImportModal = false">
      <div class="playground-modal">
        <div class="playground-modal__header">
          <span>Import Schema</span>
          <button class="playground-modal__close" @click="showImportModal = false">
            &times;
          </button>
        </div>
        <div class="playground-modal__body">
          <textarea
            v-model="importJson"
            class="playground-modal__textarea"
            placeholder="在此粘贴 JSON Schema..."
          />
          <div v-if="importError" style="margin-top: 8px; color: #ff4d4f; font-size: 12px;">
            {{ importError }}
          </div>
        </div>
        <div class="playground-modal__footer">
          <button class="playground-actions__btn" @click="showImportModal = false">
            Cancel
          </button>
          <button class="playground-actions__btn playground-actions__btn--primary" @click="handleImportConfirm">
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
