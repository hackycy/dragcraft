import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'dragcraft',
  description: '面向小程序装修场景的可视化页面搭建引擎',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['superpowers/**'],
  themeConfig: {
    siteTitle: 'dragcraft',
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '参考', link: '/reference/overview' },
      { text: '架构', link: 'https://github.com/hackycy/dragcraft/tree/main/.github/architecture' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心心智模型', link: '/guide/mental-model' },
            { text: 'Schema 与布局', link: '/guide/schema-and-layout' },
            { text: '集成设计器', link: '/guide/designer-integration' },
            { text: '物料与字段', link: '/guide/materials-and-fields' },
            { text: '主题与设备框架', link: '/guide/themes-and-device-frames' },
            { text: '导入导出与国际化', link: '/guide/import-export-and-i18n' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'API 参考',
          items: [
            { text: '总览', link: '/reference/overview' },
            { text: '@dragcraft/designer', link: '/reference/designer' },
            { text: '@dragcraft/core', link: '/reference/core' },
            { text: '@dragcraft/renderer', link: '/reference/renderer' },
            { text: '@dragcraft/form-generator', link: '/reference/form-generator' },
            { text: '@dragcraft/device-frames', link: '/reference/device-frames' },
            { text: 'widgets 与 fields', link: '/reference/widgets-and-fields' },
            { text: 'themes 与 utils', link: '/reference/themes-and-utils' },
          ],
        },
      ],
      '/': [
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心心智模型', link: '/guide/mental-model' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hackycy/dragcraft' },
    ],
  },
})
