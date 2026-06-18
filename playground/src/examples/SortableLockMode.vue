<script setup lang="ts">
import { createDesigner, DcDesigner, useDesigner } from '@dragcraft/designer'
import type { DesignerSchema, InstanceBehaviorContext, TypeBehaviorContext, WidgetMeta } from '@dragcraft/designer'
import { defineComponent, h, ref } from 'vue'

// ──────────────────────────────────────────
// Widget: Locked Header (锁定页头)
// sortable: false — 始终固定在 index 0
// deletable: false — 不可删除
// creatable: 单例
// ──────────────────────────────────────────

const headerMeta: WidgetMeta = {
  type: 'locked-header',
  title: '锁定页头',
  group: 'locked',
  icon: 'H',
  defaultProps: {
    title: '页面标题',
    bgColor: '#1677ff',
  },
  formSchema: {
    sections: [
      {
        title: '页头设置',
        fields: [
          { key: 'title', label: '标题', component: 'input', defaultValue: '页面标题' },
          { key: 'bgColor', label: '背景色', component: 'color', defaultValue: '#1677ff' },
        ],
      },
    ],
  },
  creatable: (ctx: TypeBehaviorContext) => {
    return !ctx.schema.root.children?.some(c => c.type === 'locked-header')
  },
  sortable: false,
  deletable: false,
}

const HeaderWidget = defineComponent({
  name: 'LockedHeaderWidget',
  props: {
    title: { type: String, default: '页面标题' },
    bgColor: { type: String, default: '#1677ff' },
  },
  setup(props) {
    return () =>
      h('div', {
        style: `background:${props.bgColor};padding:20px 16px;text-align:center;`,
      }, [
        h('div', {
          style: 'font-size:18px;font-weight:700;color:#fff;font-family:sans-serif;',
        }, props.title),
        h('div', {
          style: 'margin-top:4px;font-size:11px;color:rgba(255,255,255,0.6);font-family:sans-serif;',
        }, 'sortable: false \u00B7 deletable: false'),
      ])
  },
})

// ──────────────────────────────────────────
// Widget: Locked Footer (锁定页脚)
// sortable: false — 始终固定在末尾
// deletable: false — 不可删除
// creatable: 单例
// ──────────────────────────────────────────

const footerMeta: WidgetMeta = {
  type: 'locked-footer',
  title: '锁定页脚',
  group: 'locked',
  icon: 'F',
  defaultProps: {
    copyright: '\u00A9 2025 Dragcraft',
    bgColor: '#fafafa',
  },
  formSchema: {
    sections: [
      {
        title: '页脚设置',
        fields: [
          { key: 'copyright', label: '版权文字', component: 'input', defaultValue: '\u00A9 2025 Dragcraft' },
          { key: 'bgColor', label: '背景色', component: 'color', defaultValue: '#fafafa' },
        ],
      },
    ],
  },
  creatable: (ctx: TypeBehaviorContext) => {
    return !ctx.schema.root.children?.some(c => c.type === 'locked-footer')
  },
  sortable: false,
  deletable: false,
}

const FooterWidget = defineComponent({
  name: 'LockedFooterWidget',
  props: {
    copyright: { type: String, default: '\u00A9 2025 Dragcraft' },
    bgColor: { type: String, default: '#fafafa' },
  },
  setup(props) {
    return () =>
      h('div', {
        style: `background:${props.bgColor};padding:14px 16px;text-align:center;border-top:1px solid #e8e8e8;`,
      }, [
        h('div', {
          style: 'font-size:11px;color:#999;font-family:sans-serif;',
        }, props.copyright),
        h('div', {
          style: 'margin-top:2px;font-size:10px;color:#ccc;font-family:sans-serif;',
        }, 'sortable: false \u00B7 deletable: false'),
      ])
  },
})

// ──────────────────────────────────────────
// Widget: Content Block (普通内容块)
// sortable: true (default) — 可自由排序
// ──────────────────────────────────────────

const contentMeta: WidgetMeta = {
  type: 'content-block',
  title: '内容块',
  group: 'content',
  icon: 'B',
  defaultProps: {
    title: '内容块',
    text: '可自由排序的内容区域',
    color: '#f0f5ff',
  },
  defaultStyle: {
    padding: '12px 16px',
  },
  formSchema: {
    sections: [
      {
        title: '内容设置',
        fields: [
          { key: 'title', label: '标题', component: 'input', defaultValue: '内容块' },
          { key: 'text', label: '文本', component: 'input', defaultValue: '可自由排序的内容区域' },
          { key: 'color', label: '背景色', component: 'color', defaultValue: '#f0f5ff' },
        ],
      },
    ],
  },
}

const ContentBlockWidget = defineComponent({
  name: 'ContentBlockWidget',
  props: {
    title: { type: String, default: '内容块' },
    text: { type: String, default: '可自由排序的内容区域' },
    color: { type: String, default: '#f0f5ff' },
  },
  setup(props) {
    return () =>
      h('div', {
        style: `background:${props.color};border-radius:8px;padding:16px;border:1px solid rgba(0,0,0,0.06);font-family:sans-serif;`,
      }, [
        h('div', {
          style: 'font-size:15px;font-weight:600;color:#333;margin-bottom:6px;',
        }, props.title),
        h('div', {
          style: 'font-size:13px;color:#666;line-height:1.5;',
        }, props.text),
      ])
  },
})

// ──────────────────────────────────────────
// Widget: Lockable Card (可切换锁定的卡片)
// sortable: dynamic — 由 props.locked 控制
// ──────────────────────────────────────────

const lockableCardMeta: WidgetMeta = {
  type: 'lockable-card',
  title: '可锁定卡片',
  group: 'content',
  icon: 'L',
  defaultProps: {
    title: '可锁定卡片',
    description: '通过属性面板切换锁定状态',
    locked: false,
    cardColor: '#fff7e6',
  },
  defaultStyle: {
    padding: '12px 16px',
  },
  formSchema: {
    sections: [
      {
        title: '卡片设置',
        fields: [
          { key: 'title', label: '标题', component: 'input', defaultValue: '可锁定卡片' },
          { key: 'description', label: '描述', component: 'input', defaultValue: '通过属性面板切换锁定状态' },
          { key: 'locked', label: '锁定位置', component: 'switch', defaultValue: false },
          { key: 'cardColor', label: '卡片颜色', component: 'color', defaultValue: '#fff7e6' },
        ],
      },
    ],
  },
  sortable: (ctx: InstanceBehaviorContext) => {
    return ctx.node.props?.locked !== true
  },
}

const LockableCardWidget = defineComponent({
  name: 'LockableCardWidget',
  props: {
    title: { type: String, default: '可锁定卡片' },
    description: { type: String, default: '通过属性面板切换锁定状态' },
    locked: { type: Boolean, default: false },
    cardColor: { type: String, default: '#fff7e6' },
  },
  setup(props) {
    return () =>
      h('div', {
        style: `background:${props.cardColor};border-radius:8px;padding:16px;border:1px solid rgba(0,0,0,0.06);font-family:sans-serif;`
          + (props.locked ? 'border-left:3px solid #faad14;' : ''),
      }, [
        h('div', {
          style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
        }, [
          h('div', {
            style: 'font-size:15px;font-weight:600;color:#333;',
          }, props.title),
          h('span', {
            style: `font-size:14px;color:${props.locked ? '#faad14' : '#52c41a'};`,
            title: props.locked ? '已锁定位置' : '未锁定',
          }, props.locked ? '\uD83D\uDD12' : '\uD83D\uDD13'),
        ]),
        h('div', {
          style: 'font-size:13px;color:#666;line-height:1.5;',
        }, props.description),
        h('div', {
          style: `margin-top:8px;font-size:11px;color:#999;font-family:sans-serif;`,
        }, props.locked ? 'sortable: false (locked)' : 'sortable: true (unlocked)'),
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
          style: `position:relative;width:36px;height:20px;border-radius:10px;background:${props.modelValue ? '#faad14' : '#d9d9d9'};transition:background 0.2s;cursor:pointer;`,
          onClick: () => emit('update:modelValue', !props.modelValue),
        }, [
          h('div', {
            style: `position:absolute;top:2px;${props.modelValue ? 'left:18px' : 'left:2px'};width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s;`,
          }),
        ]),
        h('span', { style: 'color:#666;' }, props.modelValue ? '\uD83D\uDD12 已锁定' : '\uD83D\uDD13 未锁定'),
      ])
  },
})

// ──────────────────────────────────────────
// Assemble
// ──────────────────────────────────────────

const widgetMetas = [headerMeta, footerMeta, contentMeta, lockableCardMeta]

const componentMap: Record<string, ReturnType<typeof defineComponent>> = {
  'locked-header': HeaderWidget,
  'locked-footer': FooterWidget,
  'content-block': ContentBlockWidget,
  'lockable-card': LockableCardWidget,
}

const fieldComponentMap: Record<string, ReturnType<typeof defineComponent>> = {
  input: InputField,
  color: ColorField,
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
        type: 'locked-header',
        props: { title: 'Sortable Lock Demo', bgColor: '#1677ff' },
      },
      {
        id: 'block-1',
        type: 'content-block',
        props: { title: '内容块 A', text: '可自由拖拽排序，但不能移到页头之前或页脚之后', color: '#f0f5ff' },
        style: { padding: '12px 16px' },
      },
      {
        id: 'lockable-1',
        type: 'lockable-card',
        props: { title: '可锁定卡片（已锁定）', description: '当前已锁定位置，在属性面板取消锁定可恢复排序', locked: true, cardColor: '#fff7e6' },
        style: { padding: '12px 16px' },
      },
      {
        id: 'block-2',
        type: 'content-block',
        props: { title: '内容块 B', text: '试试拖拽——不能跨越锁定的卡片', color: '#f6ffed' },
        style: { padding: '12px 16px' },
      },
      {
        id: 'lockable-2',
        type: 'lockable-card',
        props: { title: '可锁定卡片（未锁定）', description: '当前未锁定，可自由移动；在属性面板开启锁定', locked: false, cardColor: '#f9f0ff' },
        style: { padding: '12px 16px' },
      },
      {
        id: 'block-3',
        type: 'content-block',
        props: { title: '内容块 C', text: '只能在合法的位置之间移动', color: '#fff0f6' },
        style: { padding: '12px 16px' },
      },
      {
        id: 'footer-1',
        type: 'locked-footer',
        props: { copyright: '\u00A9 2025 Dragcraft \u00B7 Sortable Lock Demo', bgColor: '#fafafa' },
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
    { name: 'locked', title: '锁定组件' },
    { name: 'content', title: '内容组件' },
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
      <span class="playground-actions__label">Sortable Lock Mode (sortable: false / dynamic sortable)</span>
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
