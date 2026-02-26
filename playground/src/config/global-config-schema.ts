import type { FormSchema } from '@dragcraft/designer'

/**
 * Global configuration form schema for the property panel "Global" tab.
 * Demonstrates how users can define page-level settings.
 */
export const globalConfigSchema: FormSchema = {
  sections: [
    {
      title: '页面设置',
      fields: [
        {
          key: 'title',
          label: '页面标题',
          component: 'input',
          defaultValue: 'My Page',
          props: {
            placeholder: '请输入页面标题',
          },
        },
        {
          key: 'description',
          label: '页面描述',
          component: 'textarea',
          defaultValue: '',
          props: {
            placeholder: '请输入页面描述',
            rows: 2,
          },
        },
      ],
    },
    {
      title: '样式设置',
      fields: [
        {
          key: 'backgroundColor',
          label: '背景颜色',
          component: 'color',
          defaultValue: '#ffffff',
        },
        {
          key: 'padding',
          label: '内边距 (px)',
          component: 'number',
          defaultValue: 0,
          props: {
            min: 0,
            max: 100,
          },
        },
        {
          key: 'maxWidth',
          label: '最大宽度 (px)',
          component: 'number',
          defaultValue: 375,
          props: {
            min: 320,
            max: 1920,
          },
        },
      ],
    },
  ],
}
