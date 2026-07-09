import type { MessageTree } from '@dragcraft/utils'

export const playgroundWidgetMessages: Record<string, MessageTree> = {
  'zh-CN': {
    group: {
      basic: '基础展示',
      form: '表单交互',
      navigation: '导航容器',
      action: '操作组件',
    },
    field: {
      array: {
        add: '新增',
        collapsed: '点击编辑',
        editing: '编辑中',
        emptyCopy: '点击新增来配置列表内容。',
        emptyTitle: '暂无项目',
        moveDown: '下移',
        moveUp: '上移',
        remove: '删除',
      },
    },
    forbidden: {
      navbarExists: '页面只能配置一个导航栏',
      tabBarExists: '页面只能配置一个 Tab 栏',
    },
    widget: {
      'text': {
        title: '文本',
        material: { description: '展示标题、段落和说明文案' },
        form: { basic: { title: '内容' }, style: { title: '样式' } },
        field: {
          content: { label: '文本内容', placeholder: '请输入文本' },
          fontSize: { label: '字号' },
          fontWeight: { label: '字重', option: { normal: '常规', bold: '粗体', 300: '轻', 600: '半粗' } },
          color: { label: '文字颜色' },
          textAlign: { label: '对齐方式', option: { left: '左对齐', center: '居中', right: '右对齐' } },
        },
      },
      'button': {
        title: '按钮',
        material: { description: '触发提交、跳转和业务动作' },
        form: { basic: { title: '基础设置' } },
        field: {
          text: { label: '按钮文字', placeholder: '请输入按钮文字' },
          type: { label: '按钮类型', option: { button: '普通按钮', submit: '提交按钮', reset: '重置按钮' } },
          size: { label: '按钮尺寸', option: { small: '小', medium: '中', large: '大' } },
          disabled: { label: '禁用状态' },
        },
      },
      'image': {
        title: '图片',
        material: { description: '展示商品、横幅和内容配图' },
        form: { basic: { title: '基础设置' } },
        field: {
          src: { label: '图片地址', placeholder: '请输入图片 URL' },
          alt: { label: '替代文本', placeholder: '图片无法显示时的替代文本' },
          objectFit: { label: '填充方式', option: { contain: '包含', cover: '覆盖', fill: '拉伸', none: '原始' } },
        },
      },
      'link': {
        title: '链接',
        material: { description: '跳转到页面、活动或外部地址' },
        form: { basic: { title: '基础设置' } },
        field: {
          text: { label: '链接文字', placeholder: '请输入链接文字' },
          href: { label: '链接地址' },
          target: { label: '打开方式', option: { _self: '当前窗口', _blank: '新窗口' } },
          color: { label: '链接颜色' },
        },
      },
      'divider': {
        title: '分割线',
        material: { description: '分隔内容区块并建立视觉层次' },
        form: { basic: { title: '基础设置' } },
        field: {
          direction: { label: '方向', option: { horizontal: '水平', vertical: '垂直' } },
          color: { label: '颜色' },
          thickness: { label: '粗细' },
        },
      },
      'form-input': {
        title: '输入框',
        material: { description: '收集单行文本、手机号等信息' },
        form: { basic: { title: '基础设置' } },
        field: {
          label: { label: '标签' },
          placeholder: { label: '占位文本' },
          value: { label: '默认值' },
          required: { label: '必填' },
          disabled: { label: '禁用' },
        },
      },
      'form-textarea': {
        title: '多行文本',
        material: { description: '收集备注、反馈和长文本内容' },
        form: { basic: { title: '基础设置' } },
        field: {
          label: { label: '标签' },
          placeholder: { label: '占位文本' },
          value: { label: '默认值' },
          rows: { label: '行数' },
          required: { label: '必填' },
          disabled: { label: '禁用' },
        },
      },
      'form-select': {
        title: '下拉选择',
        material: { description: '从预设选项中选择一个值' },
        form: { basic: { title: '基础设置' } },
        field: {
          label: { label: '标签' },
          placeholder: { label: '占位文本' },
          required: { label: '必填' },
          disabled: { label: '禁用' },
        },
      },
      'form-checkbox': {
        title: '复选框',
        material: { description: '表达勾选、同意或开关状态' },
        form: { basic: { title: '基础设置' } },
        field: {
          label: { label: '标签' },
          checked: { label: '默认选中' },
          disabled: { label: '禁用' },
        },
      },
      'form-radio-group': {
        title: '单选组',
        material: { description: '在多个互斥选项中选择一个' },
        form: { basic: { title: '基础设置' } },
        field: {
          label: { label: '标签' },
          direction: { label: '排列方向', option: { horizontal: '水平', vertical: '垂直' } },
          disabled: { label: '禁用' },
        },
      },
      'navbar': { title: '导航栏', material: { description: '配置页面顶部标题和返回入口' } },
      'tab-bar': { title: 'Tab 栏', material: { description: '配置底部多页面导航入口' } },
      'floating-button': { title: '浮动按钮', material: { description: '悬浮在页面上的快捷操作入口' } },
      'swiper': { title: '轮播', material: { description: '展示多张活动图或商品图' } },
    },
  },
  'en': {
    group: {
      basic: 'Basic',
      form: 'Form',
      navigation: 'Navigation',
      action: 'Action',
    },
    field: {
      array: {
        add: 'Add',
        collapsed: 'Click to edit',
        editing: 'Editing item',
        emptyCopy: 'Add an item to configure this list.',
        emptyTitle: 'No items yet',
        moveDown: 'Move down',
        moveUp: 'Move up',
        remove: 'Remove item',
      },
    },
    forbidden: {
      navbarExists: 'Only one navigation bar can be configured on a page',
      tabBarExists: 'Only one tab bar can be configured on a page',
    },
    widget: {
      'text': { title: 'Text', material: { description: 'Display headings, paragraphs, and helper copy' } },
      'button': { title: 'Button', material: { description: 'Trigger submits, navigation, and business actions' } },
      'image': { title: 'Image', material: { description: 'Show products, banners, and content artwork' } },
      'link': { title: 'Link', material: { description: 'Navigate to pages, campaigns, or external URLs' } },
      'divider': { title: 'Divider', material: { description: 'Separate content sections and visual hierarchy' } },
      'form-input': { title: 'Input', material: { description: 'Collect single-line text and phone numbers' } },
      'form-textarea': { title: 'Textarea', material: { description: 'Collect notes, feedback, and long-form text' } },
      'form-select': { title: 'Select', material: { description: 'Choose one value from predefined options' } },
      'form-checkbox': { title: 'Checkbox', material: { description: 'Represent checked, agreed, or boolean states' } },
      'form-radio-group': { title: 'Radio Group', material: { description: 'Choose one mutually exclusive option' } },
      'navbar': { title: 'Navigation Bar', material: { description: 'Configure the page title and back entry' } },
      'tab-bar': { title: 'Tab Bar', material: { description: 'Configure bottom navigation for multiple pages' } },
      'floating-button': { title: 'Floating Button', material: { description: 'Add a quick action floating above the page' } },
      'swiper': { title: 'Carousel', material: { description: 'Show multiple campaign or product images' } },
    },
  },
}
