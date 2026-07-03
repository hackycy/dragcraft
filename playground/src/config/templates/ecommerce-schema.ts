import type { DesignerSchema } from '@dragcraft/designer'

/**
 * Template 1: Mini-Program E-commerce Homepage
 * Simulates a WeChat mini-program e-commerce page layout.
 */
export const ecommerceSchema: DesignerSchema = {
  version: '1.0.0',
  globalConfig: {
    title: '好物精选',
    description: '小程序商城首页',
    backgroundColor: '#ffffff',
    padding: 0,
    maxWidth: 375,
  },
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      // ── Navbar ─────────────────────────────
      {
        id: 'nav-ecommerce',
        type: 'navbar',
        props: {
          title: '好物精选',
          showBack: false,
          backgroundColor: '#ffffff',
          textColor: '#1a1a1a',
          transparent: false,
        },
        style: { width: '100%' },
        layout: { placement: { kind: 'chrome', edge: 'block-start', position: 'fixed', reserve: { mode: 'measure', size: 44 }, avoidContent: true } },
      },

      // ── TabBar (schema order independent) ─────
      {
        id: 'tabbar-main',
        type: 'tab-bar',
        props: {
          tabs: [
            { label: '首页', icon: 'home' },
            { label: '分类', icon: 'category' },
            { label: '购物车', icon: 'cart' },
            { label: '我的', icon: 'user' },
          ],
          activeIndex: 0,
          backgroundColor: '#ffffff',
          activeColor: '#07C160',
          inactiveColor: '#999999',
        },
        style: { width: '100%' },
        layout: { placement: { kind: 'chrome', edge: 'block-end', position: 'fixed', reserve: { mode: 'measure', size: 50 }, avoidContent: true } },
      },

      // ── Floating Action Button (material self-positioned) ──
      {
        id: 'floating-cart',
        type: 'floating-button',
        props: {
          label: '+',
          side: 'right',
          bottom: 14,
          sideOffset: 16,
          size: 52,
          backgroundColor: '#07C160',
          textColor: '#ffffff',
        },
        layout: { placement: { kind: 'layer', layer: 'float', mode: 'self', avoid: ['safe-area', 'chrome'] } },
      },

      // ── Swiper Banner ─────────────────────
      {
        id: 'swiper-banner',
        type: 'swiper',
        props: {
          images: [
            'https://picsum.photos/seed/store-banner/750/300',
            'https://picsum.photos/seed/store-banner2/750/300',
            'https://picsum.photos/seed/store-banner3/750/300',
          ],
          showIndicator: true,
          height: 180,
          borderRadius: 0,
        },
        style: { width: '100%' },
      },

      // ── Shop Title ────────────────────────
      {
        id: 'shop-title',
        type: 'text',
        props: {
          content: '好物精选商城',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        style: {
          padding: '16px 16px 4px',
        },
      },

      // ── Shop Description ──────────────────
      {
        id: 'shop-desc',
        type: 'text',
        props: {
          content: '精选好物，品质生活。每日上新，限时特惠！',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: {
          padding: '0 16px 12px',
        },
      },

      // ── Divider ───────────────────────────
      {
        id: 'divider-1',
        type: 'divider',
        props: {
          direction: 'horizontal',
          color: '#f0f0f0',
          thickness: 1,
        },
        style: {
          width: '100%',
        },
      },

      // ── Product Image ─────────────────────
      {
        id: 'product-img',
        type: 'image',
        props: {
          src: 'https://picsum.photos/seed/product-1/750/400',
          alt: '热销商品',
          objectFit: 'cover',
        },
        style: {
          width: '100%',
          height: '200px',
          padding: '12px 16px 0',
        },
      },

      // ── Product Name ──────────────────────
      {
        id: 'product-name',
        type: 'text',
        props: {
          content: '限量款轻奢手提包 | 头层牛皮',
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        style: {
          padding: '12px 16px 4px',
        },
      },

      // ── Product Price ─────────────────────
      {
        id: 'product-price',
        type: 'text',
        props: {
          content: '¥ 299.00',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#e64340',
          textAlign: 'left',
        },
        style: {
          padding: '0 16px 12px',
        },
      },

      // ── Buy Button ────────────────────────
      {
        id: 'buy-btn',
        type: 'button',
        props: {
          text: '立即购买',
          type: 'button',
          disabled: false,
          size: 'large',
        },
        style: {
          padding: '0 16px 16px',
          width: '100%',
        },
      },

      // ── Divider 2 ─────────────────────────
      {
        id: 'divider-2',
        type: 'divider',
        props: {
          direction: 'horizontal',
          color: '#f0f0f0',
          thickness: 8,
        },
        style: {
          width: '100%',
        },
      },

      // ── Member Section Title ──────────────
      {
        id: 'member-title',
        type: 'text',
        props: {
          content: '会员登记',
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        style: {
          padding: '16px 16px 4px',
        },
      },
      {
        id: 'member-desc',
        type: 'text',
        props: {
          content: '注册会员即享 9 折优惠',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#999999',
          textAlign: 'left',
        },
        style: {
          padding: '0 16px 12px',
        },
      },

      // ── Form: Name ────────────────────────
      {
        id: 'form-name',
        type: 'form-input',
        props: {
          label: '姓名',
          placeholder: '请输入您的姓名',
          value: '',
          required: true,
          disabled: false,
        },
        style: {
          width: '100%',
          padding: '0 16px',
        },
      },

      // ── Form: Phone ───────────────────────
      {
        id: 'form-phone',
        type: 'form-input',
        props: {
          label: '手机号',
          placeholder: '请输入手机号码',
          value: '',
          required: true,
          disabled: false,
        },
        style: {
          width: '100%',
          padding: '0 16px',
        },
      },

      // ── Form: Gender ──────────────────────
      {
        id: 'form-gender',
        type: 'form-radio-group',
        props: {
          label: '性别',
          value: '',
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
          ],
          disabled: false,
        },
        style: {
          width: '100%',
          padding: '0 16px',
        },
      },

      // ── Form: Agreement ───────────────────
      {
        id: 'form-agree',
        type: 'form-checkbox',
        props: {
          label: '我已阅读并同意《会员服务条款》',
          checked: false,
          disabled: false,
        },
        style: {
          padding: '4px 16px',
        },
      },

      // ── Submit Button ─────────────────────
      {
        id: 'form-submit',
        type: 'button',
        props: {
          text: '提交登记',
          type: 'submit',
          disabled: false,
          size: 'large',
        },
        style: {
          padding: '8px 16px 24px',
          width: '100%',
        },
      },
    ],
  },
}
