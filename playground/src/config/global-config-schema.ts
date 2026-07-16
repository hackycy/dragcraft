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
          bindTo: { scope: 'schema', path: 'root.style.surface.backgroundColor' },
        },
        {
          key: 'backgroundImage',
          label: '背景图片',
          component: 'Input',
          defaultValue: '',
          bindTo: { scope: 'schema', path: 'root.style.surface.backgroundImage' },
          componentProps: {
            placeholder: 'url(https://example.com/bg.png)',
          },
        },
        {
          key: 'backgroundSize',
          label: '背景尺寸',
          component: 'Select',
          defaultValue: 'cover',
          bindTo: { scope: 'schema', path: 'root.style.surface.backgroundSize' },
          componentProps: {
            options: [
              { label: '覆盖', value: 'cover' },
              { label: '包含', value: 'contain' },
              { label: '自动', value: 'auto' },
            ],
          },
        },
        {
          key: 'padding',
          label: '内边距 (px)',
          component: 'InputNumber',
          defaultValue: 0,
          bindTo: { scope: 'schema', path: 'root.style.surface.padding' },
          componentProps: {
            min: 0,
            max: 100,
          },
        },
      ],
    },
  ],
}
