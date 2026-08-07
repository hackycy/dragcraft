import type { CreateDesignerOptions } from '@dragcraft/designer'

export const playgroundWidgetMessages: NonNullable<CreateDesignerOptions['messages']> = {
  'zh-CN': {
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
      spacing: {
        bottom: '下',
        left: '左',
        link: '启用联动',
        linked: '联动',
        margin: '外边距',
        padding: '内边距',
        right: '右',
        sectionTitle: '容器边距',
        top: '上',
        unlink: '取消联动',
      },
    },
    group: {
      action: '操作组件',
      basic: '基础展示',
      form: '表单交互',
      layout: '布局容器',
      navigation: '导航容器',
    },
    widget: {
      'text': {
        title: '文本',
        form: { content: { title: '内容' }, style: { title: '样式' } },
        field: {
          content: { label: '文本内容' },
          fontSize: { label: '字号' },
          fontWeight: { label: '字重', option: { normal: '常规', bold: '粗体' } },
          color: { label: '文字颜色' },
          textAlign: { label: '对齐方式', option: { left: '左', center: '中', right: '右' } },
        },
      },
      'button': {
        title: '按钮',
        form: { basic: { title: '基础设置' } },
        field: {
          text: { label: '按钮文字', placeholder: '请输入按钮文字' },
          type: { label: '按钮类型', option: { button: '普通按钮', submit: '提交按钮', reset: '重置按钮' } },
          size: { label: '尺寸', option: { small: '小', medium: '中', large: '大' } },
          disabled: { label: '禁用' },
        },
      },
      'image': {
        title: '图片',
        form: { basic: { title: '基础设置' } },
        field: {
          src: { label: '图片地址', placeholder: '请输入图片 URL' },
          alt: { label: '替代文本', placeholder: '图片无法显示时的替代文本' },
          objectFit: { label: '填充方式', option: { cover: '覆盖', contain: '包含' } },
        },
      },
      'link': {
        title: '链接',
        form: { basic: { title: '基础设置' } },
        field: {
          text: { label: '链接文字', placeholder: '请输入链接文字' },
          href: { label: '链接地址', placeholder: 'https://example.com' },
          target: { label: '打开方式', option: { _self: '当前窗口', _blank: '新窗口' } },
          color: { label: '链接颜色' },
        },
      },
      'divider': {
        title: '分割线',
        form: { basic: { title: '基础设置' } },
        field: {
          direction: { label: '方向', option: { horizontal: '水平', vertical: '垂直' } },
          color: { label: '颜色' },
          thickness: { label: '粗细' },
        },
      },
      'form-input': {
        title: '输入框',
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
        form: { basic: { title: '基础设置' } },
        field: { label: { label: '标签' }, checked: { label: '默认选中' }, disabled: { label: '禁用' } },
      },
      'form-radio-group': {
        title: '单选组',
        form: { basic: { title: '基础设置' } },
        field: {
          label: { label: '标签' },
          direction: { label: '方向', option: { horizontal: '水平', vertical: '垂直' } },
          disabled: { label: '禁用' },
        },
      },
      'navbar': {
        title: '导航栏',
        form: { title: { title: '标题设置' } },
        field: { title: { label: '标题' } },
      },
      'tab-bar': {
        title: 'Tab 栏',
        form: { tabs: { title: 'Tab 配置' }, style: { title: '样式设置' } },
        field: {
          tabs: {
            label: 'Tab 列表',
            item: {
              label: { label: '标签文字', placeholder: '请输入标签文字' },
              icon: { label: '图标', placeholder: 'home/category/cart/user' },
            },
          },
          activeIndex: { label: '当前选中' },
          backgroundColor: { label: '背景颜色' },
          activeColor: { label: '选中颜色' },
          inactiveColor: { label: '未选中颜色' },
        },
      },
      'floating-button': {
        title: '浮动按钮',
        form: { content: { title: '内容' }, position: { title: '位置' }, style: { title: '样式' } },
        field: {
          label: { label: '按钮文字' },
          side: { label: '水平位置', option: { right: '右侧', left: '左侧' } },
          bottom: { label: '底部距离' },
          sideOffset: { label: '侧边距离' },
          size: { label: '尺寸' },
          backgroundColor: { label: '背景颜色' },
          textColor: { label: '文字颜色' },
        },
      },
      'swiper': {
        title: '轮播',
        form: { basic: { title: '基础设置' }, style: { title: '样式设置' } },
        field: {
          images: { label: '图片列表', placeholder: '每行一个图片 URL' },
          showIndicator: { label: '显示指示器' },
          height: { label: '高度 (px)' },
          borderRadius: { label: '圆角 (px)' },
        },
      },
      'purchase-bar': { title: '购买栏' },
      'promo-dialog': { title: '浮层对话框' },
      'analytics-config': {
        title: '分析配置',
        form: { event: { title: '事件设置' } },
        field: { eventName: { label: '事件名' } },
      },
      'flex-container': {
        title: 'Flex 容器',
        form: { layout: { title: '布局' } },
        field: {
          direction: { label: '方向', option: { row: '横向', column: '纵向' } },
          wrap: { label: '自动换行' },
          gap: { label: '间距' },
          align: { label: '对齐', option: { 'stretch': '拉伸', 'flex-start': '起点', 'center': '居中', 'flex-end': '终点' } },
        },
      },
      'split-container': {
        title: '异形容器',
        form: { layout: { title: '布局' } },
        field: { gap: { label: '间距' }, primarySize: { label: '主区域尺寸' } },
      },
      'global': {
        form: { page: { title: '页面设置' }, style: { title: '样式设置' } },
        field: {
          title: { label: '页面标题', placeholder: '请输入页面标题' },
          description: { label: '页面描述', placeholder: '请输入页面描述' },
          backgroundColor: { label: '背景颜色' },
          backgroundImage: { label: '背景图片', placeholder: 'url(https://example.com/bg.png)' },
          backgroundSize: { label: '背景尺寸', option: { cover: '覆盖', contain: '包含', auto: '自动' } },
          padding: { label: '内边距 (px)' },
        },
      },
    },
  },
  'en': {
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
      spacing: {
        bottom: 'Bottom',
        left: 'Left',
        link: 'Link values',
        linked: 'Link',
        margin: 'Margin',
        padding: 'Padding',
        right: 'Right',
        sectionTitle: 'Container spacing',
        top: 'Top',
        unlink: 'Unlink values',
      },
    },
    group: {
      action: 'Action',
      basic: 'Basic',
      form: 'Form',
      layout: 'Layout',
      navigation: 'Navigation',
    },
    widget: {
      'text': {
        title: 'Text',
        form: { content: { title: 'Content' }, style: { title: 'Style' } },
        field: {
          content: { label: 'Text content' },
          fontSize: { label: 'Font size' },
          fontWeight: { label: 'Font weight', option: { normal: 'Regular', bold: 'Bold' } },
          color: { label: 'Text color' },
          textAlign: { label: 'Alignment', option: { left: 'Left', center: 'Center', right: 'Right' } },
        },
      },
      'button': {
        title: 'Button',
        form: { basic: { title: 'Basic settings' } },
        field: {
          text: { label: 'Button text', placeholder: 'Enter button text' },
          type: { label: 'Button type', option: { button: 'Button', submit: 'Submit', reset: 'Reset' } },
          size: { label: 'Size', option: { small: 'Small', medium: 'Medium', large: 'Large' } },
          disabled: { label: 'Disabled' },
        },
      },
      'image': {
        title: 'Image',
        form: { basic: { title: 'Basic settings' } },
        field: {
          src: { label: 'Image URL', placeholder: 'Enter an image URL' },
          alt: { label: 'Alternative text', placeholder: 'Text shown when the image is unavailable' },
          objectFit: { label: 'Fit', option: { cover: 'Cover', contain: 'Contain' } },
        },
      },
      'link': {
        title: 'Link',
        form: { basic: { title: 'Basic settings' } },
        field: {
          text: { label: 'Link text', placeholder: 'Enter link text' },
          href: { label: 'Link URL', placeholder: 'https://example.com' },
          target: { label: 'Open in', option: { _self: 'Current window', _blank: 'New window' } },
          color: { label: 'Link color' },
        },
      },
      'divider': {
        title: 'Divider',
        form: { basic: { title: 'Basic settings' } },
        field: {
          direction: { label: 'Direction', option: { horizontal: 'Horizontal', vertical: 'Vertical' } },
          color: { label: 'Color' },
          thickness: { label: 'Thickness' },
        },
      },
      'form-input': {
        title: 'Input',
        form: { basic: { title: 'Basic settings' } },
        field: {
          label: { label: 'Label' },
          placeholder: { label: 'Placeholder' },
          value: { label: 'Default value' },
          required: { label: 'Required' },
          disabled: { label: 'Disabled' },
        },
      },
      'form-textarea': {
        title: 'Textarea',
        form: { basic: { title: 'Basic settings' } },
        field: {
          label: { label: 'Label' },
          placeholder: { label: 'Placeholder' },
          value: { label: 'Default value' },
          rows: { label: 'Rows' },
          required: { label: 'Required' },
          disabled: { label: 'Disabled' },
        },
      },
      'form-select': {
        title: 'Select',
        form: { basic: { title: 'Basic settings' } },
        field: {
          label: { label: 'Label' },
          placeholder: { label: 'Placeholder' },
          required: { label: 'Required' },
          disabled: { label: 'Disabled' },
        },
      },
      'form-checkbox': {
        title: 'Checkbox',
        form: { basic: { title: 'Basic settings' } },
        field: { label: { label: 'Label' }, checked: { label: 'Checked by default' }, disabled: { label: 'Disabled' } },
      },
      'form-radio-group': {
        title: 'Radio Group',
        form: { basic: { title: 'Basic settings' } },
        field: {
          label: { label: 'Label' },
          direction: { label: 'Direction', option: { horizontal: 'Horizontal', vertical: 'Vertical' } },
          disabled: { label: 'Disabled' },
        },
      },
      'navbar': {
        title: 'Navigation Bar',
        form: { title: { title: 'Title settings' } },
        field: { title: { label: 'Title' } },
      },
      'tab-bar': {
        title: 'Tab Bar',
        form: { tabs: { title: 'Tab settings' }, style: { title: 'Style settings' } },
        field: {
          tabs: {
            label: 'Tab list',
            item: {
              label: { label: 'Label', placeholder: 'Enter a label' },
              icon: { label: 'Icon', placeholder: 'home/category/cart/user' },
            },
          },
          activeIndex: { label: 'Active item' },
          backgroundColor: { label: 'Background color' },
          activeColor: { label: 'Active color' },
          inactiveColor: { label: 'Inactive color' },
        },
      },
      'floating-button': {
        title: 'Floating Button',
        form: { content: { title: 'Content' }, position: { title: 'Position' }, style: { title: 'Style' } },
        field: {
          label: { label: 'Button text' },
          side: { label: 'Horizontal position', option: { right: 'Right', left: 'Left' } },
          bottom: { label: 'Bottom offset' },
          sideOffset: { label: 'Side offset' },
          size: { label: 'Size' },
          backgroundColor: { label: 'Background color' },
          textColor: { label: 'Text color' },
        },
      },
      'swiper': {
        title: 'Carousel',
        form: { basic: { title: 'Basic settings' }, style: { title: 'Style settings' } },
        field: {
          images: { label: 'Image list', placeholder: 'One image URL per line' },
          showIndicator: { label: 'Show indicators' },
          height: { label: 'Height (px)' },
          borderRadius: { label: 'Corner radius (px)' },
        },
      },
      'purchase-bar': { title: 'Purchase Bar' },
      'promo-dialog': { title: 'Dialog' },
      'analytics-config': {
        title: 'Analytics',
        form: { event: { title: 'Event settings' } },
        field: { eventName: { label: 'Event name' } },
      },
      'flex-container': {
        title: 'Flex Container',
        form: { layout: { title: 'Layout' } },
        field: {
          direction: { label: 'Direction', option: { row: 'Row', column: 'Column' } },
          wrap: { label: 'Wrap' },
          gap: { label: 'Gap' },
          align: { label: 'Alignment', option: { 'stretch': 'Stretch', 'flex-start': 'Start', 'center': 'Center', 'flex-end': 'End' } },
        },
      },
      'split-container': {
        title: 'Split Container',
        form: { layout: { title: 'Layout' } },
        field: { gap: { label: 'Gap' }, primarySize: { label: 'Primary region size' } },
      },
      'global': {
        form: { page: { title: 'Page settings' }, style: { title: 'Style settings' } },
        field: {
          title: { label: 'Page title', placeholder: 'Enter a page title' },
          description: { label: 'Page description', placeholder: 'Enter a page description' },
          backgroundColor: { label: 'Background color' },
          backgroundImage: { label: 'Background image', placeholder: 'url(https://example.com/bg.png)' },
          backgroundSize: { label: 'Background size', option: { cover: 'Cover', contain: 'Contain', auto: 'Auto' } },
          padding: { label: 'Padding (px)' },
        },
      },
    },
  },
}
