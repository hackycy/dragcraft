<script setup lang="ts">
import { createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
import type { DesignerSchema, InstanceBehaviorContext, TypeBehaviorContext, WidgetMeta } from '@dragcraft/designer'
import { defineComponent, h, ref } from 'vue'

// ──────────────────────────────────────────
// Widget: Singleton Header (单例页面头部)
// creatable: only one instance allowed
// draggable: false (fixed position)
// ──────────────────────────────────────────

const headerMeta: WidgetMeta = {
  type: 'singleton-header',
  title: '页面头部',
  group: 'singleton',
  icon: 'H',
  defaultProps: {
    title: '页面标题',
    subtitle: '副标题描述文字',
    bgColor: '#1677ff',
  },
  formSchema: {
    sections: [
      {
        title: '头部设置',
        fields: [
          { key: 'title', label: '标题', component: 'input', defaultValue: '页面标题' },
          { key: 'subtitle', label: '副标题', component: 'input', defaultValue: '副标题描述文字' },
          { key: 'bgColor', label: '背景色', component: 'color', defaultValue: '#1677ff' },
        ],
      },
    ],
  },
  creatable: (ctx: TypeBehaviorContext) => {
    return !ctx.schema.root.children?.some(c => c.type === 'singleton-header')
  },
  deletable: true,
  draggable: false,
}

const HeaderWidget = defineComponent({
  name: 'HeaderWidget',
  props: {
    title: { type: String, default: '页面标题' },
    subtitle: { type: String, default: '副标题描述文字' },
    bgColor: { type: String, default: '#1677ff' },
  },
  setup(props) {
    return () =>
      h('div', {
        style: `background:${props.bgColor};padding:24px 16px;text-align:center;`,
      }, [
        h('div', {
          style: 'font-size:20px;font-weight:700;color:#fff;margin-bottom:4px;font-family:sans-serif;',
        }, props.title),
        h('div', {
          style: 'font-size:13px;color:rgba(255,255,255,0.8);font-family:sans-serif;',
        }, props.subtitle),
      ])
  },
})

// ──────────────────────────────────────────
// Widget: Singleton Footer (单例页面底部)
// creatable: only one instance allowed
// draggable: false (fixed position)
// ──────────────────────────────────────────

const footerMeta: WidgetMeta = {
  type: 'singleton-footer',
  title: '页面底部',
  group: 'singleton',
  icon: 'F',
  defaultProps: {
    copyright: '2025 Dragcraft. All rights reserved.',
    bgColor: '#fafafa',
  },
  formSchema: {
    sections: [
      {
        title: '底部设置',
        fields: [
          { key: 'copyright', label: '版权文字', component: 'input', defaultValue: '2025 Dragcraft. All rights reserved.' },
          { key: 'bgColor', label: '背景色', component: 'color', defaultValue: '#fafafa' },
        ],
      },
    ],
  },
  creatable: (ctx: TypeBehaviorContext) => {
    return !ctx.schema.root.children?.some(c => c.type === 'singleton-footer')
  },
  deletable: true,
  draggable: false,
}

const FooterWidget = defineComponent({
  name: 'FooterWidget',
  props: {
    copyright: { type: String, default: '2025 Dragcraft. All rights reserved.' },
    bgColor: { type: String, default: '#fafafa' },
  },
  setup(props) {
    return () =>
      h('div', {
        style: `background:${props.bgColor};padding:16px;text-align:center;border-top:1px solid #e8e8e8;`,
      }, [
        h('div', {
          style: 'font-size:11px;color:#999;font-family:sans-serif;',
        }, props.copyright),
      ])
  },
})

// ──────────────────────────────────────────
// Widget: Dynamic Card (动态行为内容卡片)
// creatable: max 5 instances
// deletable: must keep at least 1
// draggable: depends on locked prop
// ──────────────────────────────────────────

const cardMeta: WidgetMeta = {
  type: 'dynamic-card',
  title: '内容卡片',
  group: 'dynamic',
  icon: 'C',
  defaultProps: {
    title: '卡片标题',
    description: '卡片描述内容',
    locked: false,
    cardColor: '#f0f5ff',
  },
  defaultStyle: {
    padding: '12px 16px',
  },
  formSchema: {
    sections: [
      {
        title: '卡片设置',
        fields: [
          { key: 'title', label: '标题', component: 'input', defaultValue: '卡片标题' },
          { key: 'description', label: '描述', component: 'input', defaultValue: '卡片描述内容' },
          { key: 'locked', label: '锁定（禁止拖拽）', component: 'switch', defaultValue: false },
          { key: 'cardColor', label: '卡片颜色', component: 'color', defaultValue: '#f0f5ff' },
        ],
      },
    ],
  },
  creatable: (ctx: TypeBehaviorContext) => {
    const cards = (ctx.schema.root.children ?? []).filter(c => c.type === 'dynamic-card')
    return cards.length < 5
  },
  deletable: (ctx: InstanceBehaviorContext) => {
    const cards = ctx.schema.root.children?.filter(c => c.type === 'dynamic-card') ?? []
    return cards.length > 1
  },
  draggable: (ctx: InstanceBehaviorContext) => {
    return ctx.node.props?.locked !== true
  },
}

const CardWidget = defineComponent({
  name: 'CardWidget',
  props: {
    title: { type: String, default: '卡片标题' },
    description: { type: String, default: '卡片描述内容' },
    locked: { type: Boolean, default: false },
    cardColor: { type: String, default: '#f0f5ff' },
  },
  setup(props) {
    return () =>
      h('div', {
        style: `background:${props.cardColor};border-radius:8px;padding:16px;border:1px solid rgba(0,0,0,0.06);font-family:sans-serif;`,
      }, [
        h('div', {
          style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
        }, [
          h('div', {
            style: 'font-size:15px;font-weight:600;color:#333;',
          }, props.title),
          props.locked
            ? h('span', {
              style: 'font-size:14px;color:#faad14;',
              title: '已锁定 — 不可拖拽',
            }, '\uD83D\uDD12')
            : null,
        ]),
        h('div', {
          style: 'font-size:13px;color:#666;line-height:1.5;',
        }, props.description),
      ])
  },
})

// ──────────────────────────────────────────
// Field Components
// ──────────────────────────────────────────

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

const SwitchField = defineComponent({
  name: 'SwitchField',
  props: { field: { type: Object, required: true }, modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('label', {
        style: 'display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;user-select:none;',
      }, [
        h('div', {
          style: `position:relative;width:36px;height:20px;border-radius:10px;background:${props.modelValue ? '#1677ff' : '#d9d9d9'};transition:background 0.2s;cursor:pointer;`,
          onClick: () => emit('update:modelValue', !props.modelValue),
        }, [
          h('div', {
            style: `position:absolute;top:2px;${props.modelValue ? 'left:18px' : 'left:2px'};width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s;`,
          }),
        ]),
        h('span', { style: 'color:#666;' }, props.modelValue ? '已锁定' : '未锁定'),
      ])
  },
})

// ──────────────────────────────────────────
// Assemble
// ──────────────────────────────────────────

const widgetMetas = [headerMeta, footerMeta, cardMeta]

const componentMap: Record<string, ReturnType<typeof defineComponent>> = {
  'singleton-header': HeaderWidget,
  'singleton-footer': FooterWidget,
  'dynamic-card': CardWidget,
}

const fieldComponentMap: Record<string, ReturnType<typeof defineComponent>> = {
  input: InputField,
  number: NumberField,
  color: ColorField,
  slider: SliderField,
  switch: SwitchField,
}

// ──────────────────────────────────────────
// Initial schema
// ──────────────────────────────────────────

const initialSchema = {
  version: '1.0.0',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      {
        id: 'header-1',
        type: 'singleton-header',
        props: { title: '欢迎使用 Dragcraft', subtitle: '动态行为控制演示', bgColor: '#1677ff' },
      },
      {
        id: 'card-1',
        type: 'dynamic-card',
        props: { title: '卡片 A', description: '可拖拽、可删除', locked: false, cardColor: '#f0f5ff' },
        style: { padding: '12px 16px' },
      },
      {
        id: 'card-2',
        type: 'dynamic-card',
        props: { title: '卡片 B（已锁定）', description: '锁定后不可拖拽排序，在属性面板中取消锁定可恢复', locked: true, cardColor: '#fff7e6' },
        style: { padding: '12px 16px' },
      },
    ],
  },
}

// ── Create designer instance ─────────────────

const designer = createDesigner({
  engineOptions: {
    initialSchema,
    maxHistorySize: 50,
  },
  widgetMetas,
  componentMap,
  fieldComponentMap,
  widgetGroups: [
    { name: 'singleton', title: '单例组件' },
    { name: 'dynamic', title: '动态行为' },
  ],
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
      <span class="playground-actions__label">Dynamic Behavior Mode (creatable / deletable / draggable)</span>
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
