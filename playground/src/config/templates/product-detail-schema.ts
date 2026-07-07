import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Template 3: Product Detail Page
 * Simulates a WeChat mini-program product detail page.
 */
export const productDetailSchema: DesignerSchema = {
  version: '1.0.0',
  globalConfig: {
    title: '商品详情',
    description: '商品详情页',
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
        id: 'nav-product',
        type: 'navbar',
        props: {
          title: '商品详情',
          showBack: true,
          backgroundColor: '#ffffff',
          textColor: '#1a1a1a',
          transparent: false,
        },
        style: { content: { width: '100%' } },
        layout: { placement: { kind: 'chrome', edge: 'block-start', position: 'fixed', reserve: { mode: 'measure', size: 44 }, avoidContent: true } },
      },
      // Product hero image
      {
        id: 'product-hero',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/product-hero/750/750',
          alt: '商品主图',
          objectFit: 'cover',
        },
        style: { content: { width: '100%', height: '300px' } },
      },
      // Price row
      {
        id: 'price-current',
        type: 'text',
        props: {
          content: '¥ 199.00',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#e64340',
          textAlign: 'left',
        },
        style: { container: { padding: '16px 16px 0' } },
      },
      {
        id: 'price-original',
        type: 'text',
        props: {
          content: '原价 ¥ 399.00',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: { container: { padding: '4px 16px 8px' }, content: { textDecoration: 'line-through' } },
      },
      // Product name
      {
        id: 'product-name',
        type: 'text',
        props: {
          content: '轻奢简约真皮手提包 | 头层牛皮 手工缝制',
          fontSize: 17,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        style: { container: { padding: '8px 16px 4px' } },
      },
      // Product description
      {
        id: 'product-desc',
        type: 'text',
        props: {
          content: '精选头层牛皮，意大利进口五金，大容量内袋设计，适合通勤与日常出行。',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#666666',
          textAlign: 'left',
        },
        style: { container: { padding: '0 16px 12px' } },
      },
      // Divider
      {
        id: 'divider-1',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 8 },
        style: { content: { width: '100%' } },
      },
      // Color spec
      {
        id: 'spec-color',
        type: 'form-select',
        props: {
          label: '颜色',
          placeholder: '请选择颜色',
          value: '',
          options: [
            { label: '经典黑', value: 'black' },
            { label: '复古棕', value: 'brown' },
            { label: '奶白色', value: 'white' },
          ],
          required: false,
          disabled: false,
        },
        style: { container: { padding: '12px 16px 0' }, content: { width: '100%' } },
      },
      // Size spec
      {
        id: 'spec-size',
        type: 'form-select',
        props: {
          label: '尺寸',
          placeholder: '请选择尺寸',
          value: '',
          options: [
            { label: '小号 (20cm)', value: 'S' },
            { label: '中号 (25cm)', value: 'M' },
            { label: '大号 (30cm)', value: 'L' },
          ],
          required: false,
          disabled: false,
        },
        style: { container: { padding: '8px 16px 12px' }, content: { width: '100%' } },
      },
      // Divider
      {
        id: 'divider-2',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 1 },
        style: { content: { width: '100%' } },
      },
      // Quantity note
      {
        id: 'quantity-note',
        type: 'text',
        props: {
          content: '库存充足，下单后 48 小时内发货',
          fontSize: 12,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: { container: { padding: '12px 16px' } },
      },
      // Divider
      {
        id: 'divider-3',
        type: 'divider',
        props: { direction: 'horizontal', color: '#f0f0f0', thickness: 8 },
        style: { content: { width: '100%' } },
      },
      // Action buttons
      {
        id: 'cart-btn',
        type: 'button',
        props: { text: '加入购物车', type: 'button', disabled: false, size: 'large' },
        style: { container: { padding: '16px 16px 8px' }, content: { width: '100%' } },
      },
      {
        id: 'buy-btn',
        type: 'button',
        props: { text: '立即购买', type: 'button', disabled: false, size: 'large' },
        style: { container: { padding: '8px 16px 24px' }, content: { width: '100%' } },
      },
    ],
  },
}
