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
          text: '开始使用',
          items: [
            { text: '了解接入边界', link: '/guide/learn/prerequisites' },
            { text: '创建可运行编辑器', link: '/guide/learn/first-editor' },
            { text: '理解 Schema 与写入链路', link: '/guide/learn/schema-and-write-path' },
            { text: '接入业务物料与属性配置', link: '/guide/learn/material-and-property-panel' },
            { text: '保存、加载与只读预览', link: '/guide/learn/persistence-and-runtime' },
            { text: '检查集成结果', link: '/guide/learn/completion' },
          ],
        },
        {
          text: '核心模型',
          items: [
            { text: '框架如何协作', link: '/guide/fundamentals/architecture' },
            { text: 'Schema 与样式作用域', link: '/guide/fundamentals/schema' },
            { text: '状态、动作、历史与事件', link: '/guide/fundamentals/state-commands-and-history' },
            { text: '业务物料', link: '/guide/customization/materials' },
            { text: '表单与字段', link: '/guide/customization/forms-and-fields' },
            { text: '布局投影', link: '/guide/fundamentals/layout-system' },
            { text: '容器与 region', link: '/guide/customization/layout-and-containers' },
          ],
        },
        {
          text: '集成与定制',
          items: [
            { text: '选择扩展点', link: '/guide/customization/overview' },
            { text: '动作与业务策略', link: '/guide/customization/actions-and-policies' },
            { text: '面板与画布', link: '/guide/customization/panels-and-canvas' },
            { text: '主题、设备与国际化', link: '/guide/customization/theme-device-and-i18n' },
            { text: '迁移、草稿与生产运行时', link: '/guide/customization/lifecycle-and-runtime' },
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
            { text: 'Schema 与命令', link: '/reference/designer-schema' },
            { text: '渲染与容器', link: '/reference/designer-rendering' },
            { text: '表单与字段', link: '/reference/designer-forms' },
            { text: '样式与国际化', link: '/reference/designer-styles' },
            { text: '@dragcraft/device-frames', link: '/reference/device-frames' },
            { text: '@dragcraft/fields-ant-design-vue', link: '/reference/fields-ant-design-vue' },
          ],
        },
      ],
      '/': [
        {
          text: '开始使用',
          items: [
            { text: '了解接入边界', link: '/guide/learn/prerequisites' },
            { text: '创建可运行编辑器', link: '/guide/learn/first-editor' },
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
