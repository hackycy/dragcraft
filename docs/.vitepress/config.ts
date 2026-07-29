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
            { text: '准备项目', link: '/guide/learn/prerequisites' },
            { text: '快速开始：挂载编辑器', link: '/guide/learn/first-editor' },
            { text: '理解 Dragcraft 的边界', link: '/guide/learn/mental-model' },
          ],
        },
        {
          text: '从零构建活动页编辑器',
          items: [
            { text: '保存 Schema，并通过命令写入', link: '/guide/learn/schema-and-write-path' },
            { text: '添加物料、字段和页面设置', link: '/guide/learn/material-and-property-panel' },
            { text: '保存草稿并预览运行时', link: '/guide/learn/persistence-and-runtime' },
            { text: '安排内容、Chrome 和浮层', link: '/guide/learn/page-layout' },
            { text: '让业务容器承载子节点', link: '/guide/learn/containers' },
            { text: '管理模板节点和工具栏动作', link: '/guide/learn/schema-managed-actions' },
            { text: '完成检查', link: '/guide/learn/completion' },
          ],
        },
        {
          text: '按需扩展',
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
            { text: '准备项目', link: '/guide/learn/prerequisites' },
            { text: '快速开始：挂载编辑器', link: '/guide/learn/first-editor' },
            { text: '理解 Dragcraft 的边界', link: '/guide/learn/mental-model' },
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
