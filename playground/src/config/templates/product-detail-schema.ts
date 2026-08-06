import type { DocumentSchema } from '@dragcraft/designer'

export const productDetailSchema: DocumentSchema = {
  version: '1',
  globalConfig: {
    title: '商品详情',
    description: '商品详情页',
    backgroundColor: '#ffffff',
  },
  page: {
    props: { title: '商品详情' },
    style: { backgroundColor: '#ffffff' },
  },
  nodes: [
    { id: 'nav-product', type: 'navbar', props: { title: '商品详情' } },
    { id: 'product-hero', type: 'image', props: { src: 'https://picsum.photos/seed/product-hero/750/750', alt: '商品主图', objectFit: 'cover', height: 300 } },
    { id: 'price-current', type: 'text', props: { content: '¥ 199.00', fontSize: 24, fontWeight: 'bold', color: '#d9363e', textAlign: 'left' } },
    { id: 'price-original', type: 'text', props: { content: '原价 ¥ 399.00', fontSize: 13, fontWeight: 'normal', color: '#777777', textAlign: 'left' } },
    { id: 'product-name', type: 'text', props: { content: '轻奢简约真皮手提包 | 头层牛皮 手工缝制', fontSize: 17, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' } },
    { id: 'product-desc', type: 'text', props: { content: '精选头层牛皮，意大利进口五金，大容量内袋设计，适合通勤与日常出行。', fontSize: 13, fontWeight: 'normal', color: '#555555', textAlign: 'left' } },
    { id: 'divider-product-1', type: 'divider', props: { direction: 'horizontal', color: '#eeeeee', thickness: 8 } },
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
    },
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
    },
    { id: 'quantity-note', type: 'text', props: { content: '库存充足，下单后 48 小时内发货', fontSize: 12, fontWeight: 'normal', color: '#777777', textAlign: 'left' } },
    { id: 'purchase-actions', type: 'purchase-bar', props: { secondaryLabel: '加入购物车', primaryLabel: '立即购买' } },
    { id: 'member-offer-dialog', type: 'promo-dialog', props: { title: '会员专享', content: '登录会员账号后，本商品可再享 9 折。' } },
  ],
  structure: {
    root: [
      'nav-product',
      'product-hero',
      'price-current',
      'price-original',
      'product-name',
      'product-desc',
      'divider-product-1',
      'spec-color',
      'spec-size',
      'quantity-note',
      'purchase-actions',
      'member-offer-dialog',
    ],
    containers: {},
  },
}
