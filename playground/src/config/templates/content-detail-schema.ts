import type { DocumentSchema } from '@dragcraft/designer'

export const contentDetailSchema: DocumentSchema = {
  version: '1',
  globalConfig: {
    title: '精选文章',
    description: '内容详情页',
    backgroundColor: '#ffffff',
  },
  page: {
    props: { title: '精选文章' },
    style: { backgroundColor: '#ffffff' },
  },
  nodes: [
    { id: 'nav-content', type: 'navbar', props: { title: '精选文章' } },
    { id: 'cover-img', type: 'image', props: { src: 'https://picsum.photos/seed/article-cover/750/400', alt: '文章封面', objectFit: 'cover', height: 200 } },
    { id: 'article-flow', type: 'flex-container', props: { direction: 'column', wrap: false, gap: 12, align: 'stretch' } },
    { id: 'article-title', type: 'text', props: { content: '如何用 Dragcraft 搭建小程序页面', fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' } },
    { id: 'author-info', type: 'text', props: { content: 'Dragcraft 团队 · 2026-06-26', fontSize: 12, fontWeight: 'normal', color: '#777777', textAlign: 'left' } },
    { id: 'divider-1', type: 'divider', props: { direction: 'horizontal', color: '#eeeeee', thickness: 1 } },
    { id: 'body-1', type: 'text', props: { content: 'Dragcraft 是一个面向小程序装修场景的可视化页面设计器。文档结构、设计态展示与外部消费策略彼此独立。', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' } },
    { id: 'inline-img', type: 'image', props: { src: 'https://picsum.photos/seed/dragcraft-demo/750/300', alt: '架构示意图', objectFit: 'cover', height: 180 } },
    { id: 'body-2', type: 'text', props: { content: '容器的 DOM、CSS、regions 和插入几何由物料负责，Core 只拥有纯数据结构约束。', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' } },
    { id: 'article-actions', type: 'split-container', props: { gap: 8, primarySize: '44%' } },
    { id: 'follow-btn', type: 'button', props: { text: '关注作者', type: 'button', disabled: false, size: 'medium' } },
    { id: 'share-link', type: 'link', props: { text: '分享给朋友', href: '#', target: '_self', color: '#07c160' } },
    { id: 'favorite-link', type: 'link', props: { text: '收藏文章', href: '#', target: '_self', color: '#1677ff' } },
  ],
  structure: {
    root: ['nav-content', 'cover-img', 'article-flow', 'article-actions'],
    containers: {
      'article-flow': {
        regions: {
          content: ['article-title', 'author-info', 'divider-1', 'body-1', 'inline-img', 'body-2'],
        },
      },
      'article-actions': {
        regions: {
          top: ['follow-btn'],
          bottomLeft: ['share-link'],
          bottomRight: ['favorite-link'],
        },
      },
    },
  },
}
