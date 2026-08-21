import type { FormSchema } from '@dragcraft/designer'
import { h } from 'vue'

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
    {
      title: '发布流程',
      fields: [
        {
          key: 'enableReview',
          label: '开启审核',
          component: 'Switch',
          defaultValue: true,
          helpMessage: '开启后，发布前需要填写审核备注。',
        },
        {
          key: 'reviewNote',
          label: ctx => ctx.values.enableReview !== false
            ? h('span', { class: 'pg-field-presentation-label' }, [
                h('span', null, '审核备注'),
                h('span', { class: 'pg-field-presentation-label__badge' }, '动态标签'),
              ])
            : '',
          component: 'Textarea',
          defaultValue: '',
          componentProps: {
            placeholder: '记录本次发布的审核结论',
            rows: 2,
          },
          helpMessage: ctx => ctx.values.enableReview !== false
            ? '该备注仅对审核人可见。'
            : '',
        },
        {
          key: 'releaseChannel',
          label: '',
          component: 'Select',
          defaultValue: 'scheduled',
          componentProps: {
            options: [
              { label: '按计划发布', value: 'scheduled' },
              { label: '立即发布', value: 'immediate' },
            ],
          },
          helpMessage: '选择内容上线的渠道。',
        },
        {
          key: 'publicationStatus',
          label: '发布状态',
          component: ({ values }) => () => {
            const reviewEnabled = values.enableReview !== false
            return h('div', { class: 'pg-field-presentation-status' }, [
              h('span', {
                class: [
                  'pg-field-presentation-status__indicator',
                  { 'pg-field-presentation-status__indicator--ready': !reviewEnabled },
                ],
              }),
              h('div', { class: 'pg-field-presentation-status__content' }, [
                h('strong', null, reviewEnabled ? '等待审核' : '可以发布'),
                h('span', null, reviewEnabled ? '通过审核后将进入发布批次' : '将进入下一个发布批次'),
              ]),
            ])
          },
          helpMessage: ctx => ctx.values.enableReview !== false
            ? '审核状态变化后会自动更新。'
            : '关闭审核后会直接进入发布批次。',
        },
      ],
    },
  ],
}
