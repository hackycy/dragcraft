import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Template 2: Content Detail Page
 * Simulates a WeChat mini-program article/blog detail page.
 */
export const contentDetailSchema: DesignerSchema = {
  version: '1.0.0',
  globalConfig: {
    title: '精选文章',
    description: '内容详情页',
    backgroundColor: '#ffffff',
    maxWidth: 375,
  },
  root: {
    id: 'root',
    type: 'root',
    props: {},
    style: {
      surface: {
        backgroundColor: '#ffffff',
        backgroundSize: 'cover',
        maxWidth: 375,
      },
    },
    children: [
      // Navbar
      {
        id: 'nav-content',
        type: 'navbar',
        props: {
          title: '精选文章',
          showBack: true,
          backgroundColor: '#ffffff',
          textColor: '#1a1a1a',
          transparent: false,
        },
        style: { content: { width: '100%' } },
        layout: { placement: { kind: 'chrome', edge: 'block-start', position: 'fixed', reserve: { mode: 'measure', size: 44 }, avoidContent: true } },
      },
      // Cover image
      {
        id: 'cover-img',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/article-cover/750/400',
          alt: '文章封面',
          objectFit: 'cover',
        },
        style: { content: { width: '100%', height: '200px' } },
      },
      // External single-region flex material
      {
        id: 'article-flow',
        type: 'flex-container',
        props: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
        container: {
          variant: 'single',
          regions: {
            default: [
              {
                id: 'article-title',
                type: 'text',
                props: { content: '如何用 Dragcraft 搭建小程序页面', fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' },
              },
              {
                id: 'author-info',
                type: 'text',
                props: { content: 'Dragcraft 团队 · 2026-06-26', fontSize: 12, fontWeight: 'normal', color: '#999999', textAlign: 'left' },
              },
              {
                id: 'divider-1',
                type: 'divider',
                props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 },
                style: { content: { width: '100%' } },
              },
              {
                id: 'body-1',
                type: 'text',
                props: { content: 'Dragcraft 是一个面向小程序装修场景的可视化页面搭建引擎。采用 Core Engine + UI Shell + Headless Themes 架构，构建核心与 UI 分离的页面设计引擎。', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
                style: { content: { lineHeight: '1.8' } },
              },
              {
                id: 'inline-img',
                type: 'image',
                props: { src: 'https://picsum.photos/seed/dragcraft-demo/750/300', alt: '架构示意图', objectFit: 'cover' },
                style: { content: { width: '100%', height: '180px' } },
              },
              {
                id: 'body-2',
                type: 'text',
                props: { content: '容器的 DOM、CSS、区域和插入几何都由外部物料负责，框架只提供结构协议与交互出口。', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
                style: { content: { lineHeight: '1.8' } },
              },
            ],
          },
        },
      },
      // External three-region material using its non-default variant
      {
        id: 'article-actions',
        type: 'split-container',
        props: { gap: 8, primarySize: '44%' },
        container: {
          variant: 'top-one-bottom-two',
          regions: {
            top: [{
              id: 'follow-btn',
              type: 'button',
              props: { text: '关注作者', type: 'button', disabled: false, size: 'medium' },
              style: { content: { width: '100%' } },
            }],
            bottomLeft: [{
              id: 'share-link',
              type: 'link',
              props: { text: '分享给朋友', href: '#', target: '_self', color: '#07C160' },
            }],
            bottomRight: [{
              id: 'favorite-link',
              type: 'link',
              props: { text: '收藏文章', href: '#', target: '_self', color: '#1677ff' },
            }],
          },
        },
      },
    ],
  },
}
