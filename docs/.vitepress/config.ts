import process from 'node:process'
import { defineConfig } from 'vitepress'
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  lang: 'zh-CN',
  title: 'dragcraft',
  description: '面向小程序装修场景的可视化页面搭建引擎',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['superpowers/**'],
  vite: {
    plugins: [llmstxt()],
    server: {
      host: '0.0.0.0',
    },
  },
  themeConfig: {
    siteTitle: 'dragcraft',
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '参考', link: '/reference/overview' },
      {
        text: 'Playground',
        link: 'https://hackycy.github.io/dragcraft/playground/',
        target: '_self',
      },
      { text: '架构', link: 'https://github.com/hackycy/dragcraft/tree/main/.github/architecture' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始接入',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心心智模型', link: '/guide/mental-model' },
            { text: 'Schema 与布局', link: '/guide/schema-and-layout' },
            { text: '集成设计器', link: '/guide/designer-integration' },
          ],
        },
        {
          text: '扩展设计器',
          items: [
            { text: '自定义物料', link: '/guide/materials-and-fields' },
            { text: '外部容器物料', link: '/guide/container-materials' },
            { text: '配置表单与字段', link: '/guide/forms-and-fields' },
            { text: '动作与视图扩展', link: '/guide/extending-the-designer' },
            { text: '主题与设备框架', link: '/guide/themes-and-device-frames' },
            { text: '编辑器国际化', link: '/guide/i18n' },
          ],
        },
        {
          text: '从编辑到上线',
          items: [
            { text: 'Schema 生命周期', link: '/guide/import-export-and-i18n' },
            { text: '保存草稿与发布', link: '/guide/saving-and-publishing' },
            { text: '运行时集成边界', link: '/guide/runtime-integration' },
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
  markdown: {
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons)
    },
  },
})
