import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Pre-populated initial schema to display a non-empty canvas on load.
 * Demonstrates multiple widget types and nested containers.
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
    nodeType: 'container',
    props: {},
    children: [
      // ── Header Section ──────────────────────
      {
        id: 'header-row',
        type: 'flex-row',
        nodeType: 'container',
        props: {
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
          wrap: false,
        },
        style: {
          padding: '12px 16px',
          minHeight: '50px',
        },
        children: [
          {
            id: 'header-title',
            type: 'text',
            nodeType: 'widget',
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
            nodeType: 'widget',
            props: {
              text: '开始使用',
              type: 'button',
              disabled: false,
              size: 'medium',
            },
          },
        ],
      },

      // ── Divider ─────────────────────────────
      {
        id: 'divider-1',
        type: 'divider',
        nodeType: 'widget',
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

      // ── Content Section ─────────────────────
      {
        id: 'content-column',
        type: 'flex-column',
        nodeType: 'container',
        props: {
          gap: 12,
          justifyContent: 'flex-start',
          alignItems: 'stretch',
        },
        style: {
          padding: '8px',
          minHeight: '100px',
        },
        children: [
          {
            id: 'intro-text',
            type: 'text',
            nodeType: 'widget',
            props: {
              content: '欢迎使用 Dragcraft 低代码设计引擎。从左侧物料面板拖拽组件到画布中，点击选中组件后可在右侧面板编辑属性。',
              fontSize: 14,
              fontWeight: 'normal',
              color: '#666666',
              textAlign: 'left',
            },
          },

          // ── Image Demo ────────────────────────
          {
            id: 'demo-image',
            type: 'image',
            nodeType: 'widget',
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

          // ── Link Demo ─────────────────────────
          {
            id: 'demo-link',
            type: 'link',
            nodeType: 'widget',
            props: {
              text: '了解更多 →',
              href: '#',
              target: '_self',
              color: '#1890ff',
            },
          },
        ],
      },

      // ── Divider 2 ───────────────────────────
      {
        id: 'divider-2',
        type: 'divider',
        nodeType: 'widget',
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

      // ── Form Section ────────────────────────
      {
        id: 'form-column',
        type: 'flex-column',
        nodeType: 'container',
        props: {
          gap: 10,
          justifyContent: 'flex-start',
          alignItems: 'stretch',
        },
        style: {
          padding: '12px 16px',
          minHeight: '100px',
        },
        children: [
          {
            id: 'form-title',
            type: 'text',
            nodeType: 'widget',
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
            nodeType: 'widget',
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
            nodeType: 'widget',
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
            nodeType: 'widget',
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
            nodeType: 'widget',
            props: {
              label: '我同意服务条款',
              checked: false,
              disabled: false,
            },
          },
          {
            id: 'form-row',
            type: 'flex-row',
            nodeType: 'container',
            props: {
              gap: 8,
              justifyContent: 'flex-end',
              alignItems: 'center',
              wrap: false,
            },
            style: {
              padding: '4px 0',
              minHeight: '40px',
            },
            children: [
              {
                id: 'form-submit',
                type: 'button',
                nodeType: 'widget',
                props: {
                  text: '提交',
                  type: 'submit',
                  disabled: false,
                  size: 'medium',
                },
              },
            ],
          },
        ],
      },
    ],
  },
}
