import type { FormSchema } from '@dragcraft/designer'

export const guideGlobalConfigSchema: FormSchema = {
  sections: [{
    title: '页面设置',
    fields: [
      { key: 'title', label: '页面标题', component: 'Input' },
      {
        key: 'backgroundColor',
        label: '背景颜色',
        component: 'Input',
        bindTo: { scope: 'schema', path: 'root.style.surface.backgroundColor' },
      },
    ],
  }],
}
