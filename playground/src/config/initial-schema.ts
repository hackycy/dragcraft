import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Pre-populated initial schema to display a non-empty canvas on load.
 * Flat widget list under root — no containers or nesting.
 */
export const initialSchema: DesignerSchema = {
  version: '1.0.0',
  globalConfig: {
    title: 'Dragcraft Demo',
    description: '低代码设计器演示页面',
    backgroundColor: '#ffffff',
    padding: 16,
    maxWidth: 800,
  },
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      // ── Header ────────────────────────────────
      {
        id: 'header-title',
        type: 'text',
        props: {
          content: 'Dragcraft 设计器',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1890ff',
          textAlign: 'left',
        },
      },
      {
        id: 'header-btn',
        type: 'button',
        props: {
          text: '开始使用',
          type: 'button',
          disabled: false,
          size: 'medium',
        },
      },

      // ── Divider ───────────────────────────────
      {
        id: 'divider-1',
        type: 'divider',
        props: {
          direction: 'horizontal',
          color: '#e8e8e8',
          thickness: 1,
        },
        style: {
          width: '100%',
          margin: '8px 0',
        },
      },

      // ── Content ───────────────────────────────
      {
        id: 'intro-text',
        type: 'text',
        props: {
          content: '欢迎使用 Dragcraft 低代码设计引擎。从左侧物料面板拖拽组件到画布中，点击选中组件后可在右侧面板编辑属性。',
          fontSize: 14,
          fontWeight: 'normal',
          color: '#666666',
          textAlign: 'left',
        },
      },
      {
        id: 'demo-image',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/dragcraft/600/200',
          alt: '示例图片',
          objectFit: 'cover',
        },
        style: {
          width: '100%',
          height: '150px',
        },
      },
      {
        id: 'demo-link',
        type: 'link',
        props: {
          text: '了解更多 →',
          href: '#',
          target: '_self',
          color: '#1890ff',
        },
      },

      // ── Divider 2 ─────────────────────────────
      {
        id: 'divider-2',
        type: 'divider',
        props: {
          direction: 'horizontal',
          color: '#e8e8e8',
          thickness: 1,
        },
        style: {
          width: '100%',
          margin: '8px 0',
        },
      },

      // ── Form Section ──────────────────────────
      {
        id: 'form-title',
        type: 'text',
        props: {
          content: '表单示例',
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333333',
          textAlign: 'left',
        },
      },
      {
        id: 'form-name',
        type: 'form-input',
        props: {
          label: '姓名',
          placeholder: '请输入您的姓名',
          value: '',
          required: true,
          disabled: false,
        },
        style: { width: '100%' },
      },
      {
        id: 'form-email',
        type: 'form-input',
        props: {
          label: '邮箱',
          placeholder: '请输入邮箱地址',
          value: '',
          required: true,
          disabled: false,
        },
        style: { width: '100%' },
      },
      {
        id: 'form-role',
        type: 'form-select',
        props: {
          label: '角色',
          placeholder: '请选择',
          value: '',
          options: [
            { label: '开发者', value: 'developer' },
            { label: '设计师', value: 'designer' },
            { label: '产品经理', value: 'pm' },
          ],
          required: false,
          disabled: false,
        },
        style: { width: '100%' },
      },
      {
        id: 'form-agree',
        type: 'form-checkbox',
        props: {
          label: '我同意服务条款',
          checked: false,
          disabled: false,
        },
      },
      {
        id: 'form-submit',
        type: 'button',
        props: {
          text: '提交',
          type: 'submit',
          disabled: false,
          size: 'medium',
        },
      },
    ],
  },
}
