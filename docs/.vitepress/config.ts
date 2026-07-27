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
      { text: '指南', link: '/guide/learn/prerequisites' },
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
          text: '从零搭建页面编辑器',
          items: [
            { text: '准备开发', link: '/guide/learn/prerequisites' },
            { text: '挂载最小编辑器', link: '/guide/learn/first-editor' },
            { text: '理解 Schema 与写入链路', link: '/guide/learn/schema-and-write-path' },
            { text: '添加物料与属性面板', link: '/guide/learn/material-and-property-panel' },
            { text: '保存草稿并预览运行时', link: '/guide/learn/persistence-and-runtime' },
            { text: '完成检查', link: '/guide/learn/completion' },
          ],
        },
        {
          text: '高级自定义',
          items: [
            { text: '选择扩展点', link: '/guide/customization/overview' },
            { text: '业务物料', link: '/guide/customization/materials' },
            { text: '表单与字段', link: '/guide/customization/forms-and-fields' },
            { text: '页面布局与容器', link: '/guide/customization/layout-and-containers' },
            { text: '动作与业务策略', link: '/guide/customization/actions-and-policies' },
            { text: '面板与画布', link: '/guide/customization/panels-and-canvas' },
            { text: '主题、设备与国际化', link: '/guide/customization/theme-device-and-i18n' },
            { text: '生命周期与运行时', link: '/guide/customization/lifecycle-and-runtime' },
          ],
        },
        {
          text: '工具',
          items: [
            { text: 'AI 辅助开发', link: '/guide/tools/ai-assisted-development' },
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
            { text: '@dragcraft/ui', link: '/reference/ui' },
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
            { text: '准备开发', link: '/guide/learn/prerequisites' },
            { text: '挂载最小编辑器', link: '/guide/learn/first-editor' },
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
