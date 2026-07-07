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
    padding: 0,
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
        padding: 0,
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
      // Title
      {
        id: 'article-title',
        type: 'text',
        props: {
          content: '如何用 Dragcraft 搭建小程序页面',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        style: { container: { padding: '20px 16px 8px' } },
      },
      // Author info
      {
        id: 'author-info',
        type: 'text',
        props: {
          content: 'Dragcraft 团队 · 2026-06-26',
          fontSize: 12,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: { container: { padding: '0 16px 16px' } },
      },
      // Divider
      {
        id: 'divider-1',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 },
        style: { content: { width: '100%' } },
      },
      // Body paragraph 1
      {
        id: 'body-1',
        type: 'text',
        props: {
          content: 'Dragcraft 是一个面向小程序装修场景的可视化页面搭建引擎。采用 Core Engine + UI Shell + Headless Themes 架构，构建核心与 UI 分离的页面设计引擎。',
          fontSize: 15,
          fontWeight: 'normal',
          color: '#333333',
          textAlign: 'left',
        },
        style: { container: { padding: '16px 16px 8px' }, content: { lineHeight: '1.8' } },
      },
      // Inline image
      {
        id: 'inline-img',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/dragcraft-demo/750/300',
          alt: '架构示意图',
          objectFit: 'cover',
        },
        style: { container: { padding: '8px 16px' }, content: { width: '100%', height: '180px' } },
      },
      // Body paragraph 2
      {
        id: 'body-2',
        type: 'text',
        props: {
          content: '所有 UI 包仅输出语义化 BEM 类名，不捆绑任何 CSS。视觉样式由 @dragcraft/themes 独立提供，支持完全自定义样式（无头模式）。',
          fontSize: 15,
          fontWeight: 'normal',
          color: '#333333',
          textAlign: 'left',
        },
        style: { container: { padding: '8px 16px 16px' }, content: { lineHeight: '1.8' } },
      },
      // Divider
      {
        id: 'divider-2',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 },
        style: { content: { width: '100%' } },
      },
      // Action buttons
      {
        id: 'follow-btn',
        type: 'button',
        props: { text: '关注作者', type: 'button', disabled: false, size: 'medium' },
        style: { container: { padding: '16px 16px 8px' }, content: { width: '100%' } },
      },
      {
        id: 'share-link',
        type: 'link',
        props: { text: '分享给朋友', href: '#', target: '_self', color: '#07C160' },
        style: { container: { padding: '8px 16px 24px' } },
      },
    ],
  },
}
