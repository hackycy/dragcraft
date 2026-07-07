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
          component: 'Input',
          defaultValue: 'My Page',
          componentProps: {
            placeholder: '请输入页面标题',
          },
        },
        {
          key: 'description',
          label: '页面描述',
          component: 'Textarea',
          defaultValue: '',
          componentProps: {
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
          component: 'Color',
          defaultValue: '#ffffff',
        },
        {
          key: 'padding',
          label: '内边距 (px)',
          component: 'InputNumber',
          defaultValue: 0,
          componentProps: {
            min: 0,
            max: 100,
          },
        },
        {
          key: 'maxWidth',
          label: '最大宽度 (px)',
          component: 'InputNumber',
          defaultValue: 375,
          componentProps: {
            min: 320,
            max: 1920,
          },
        },
      ],
    },
  ],
}
