import type { MessageTree } from '@dragcraft/utils'

export const builtinWidgetsMessages: Record<string, MessageTree> = {
  'zh-CN': {
    group: {
      basic: '基础展示',
      form: '表单交互',
    },
    widget: {
      'text': {
        title: '文本',
        form: {
          basic: { title: '基础设置' },
          style: { title: '样式设置' },
        },
        field: {
          content: { label: '文本内容', placeholder: '请输入文本' },
          fontSize: { label: '字体大小' },
          fontWeight: {
            label: '字体粗细',
            option: {
              normal: '正常',
              bold: '粗体',
              300: '较细',
              600: '较粗',
            },
          },
          color: { label: '文字颜色' },
          textAlign: {
            label: '对齐方式',
            option: {
              left: '左对齐',
              center: '居中',
              right: '右对齐',
            },
          },
        },
      },
      'button': {
        title: '按钮',
        form: {
          basic: { title: '基础设置' },
        },
        field: {
          text: { label: '按钮文字', placeholder: '请输入按钮文字' },
          type: {
            label: '按钮类型',
            option: {
              button: '普通按钮',
              submit: '提交按钮',
              reset: '重置按钮',
            },
          },
          size: {
            label: '按钮尺寸',
            option: {
              small: '小',
              medium: '中',
              large: '大',
            },
          },
          disabled: { label: '禁用状态' },
        },
      },
      'image': {
        title: '图片',
        form: {
          basic: { title: '基础设置' },
        },
        field: {
          src: { label: '图片地址', placeholder: '请输入图片 URL' },
          alt: { label: '替代文本', placeholder: '图片无法显示时的替代文本' },
          objectFit: {
            label: '填充方式',
            option: {
              contain: '包含',
              cover: '覆盖',
              fill: '拉伸',
              none: '原始',
            },
          },
        },
      },
      'link': {
        title: '链接',
        form: {
          basic: { title: '基础设置' },
        },
        field: {
          text: { label: '链接文字', placeholder: '请输入链接文字' },
          href: { label: '链接地址' },
          target: {
            label: '打开方式',
            option: {
              _self: '当前窗口',
              _blank: '新窗口',
            },
          },
          color: { label: '链接颜色' },
        },
      },
      'divider': {
        title: '分割线',
        form: {
          basic: { title: '基础设置' },
        },
        field: {
          direction: {
            label: '方向',
            option: {
              horizontal: '水平',
              vertical: '垂直',
            },
          },
          color: { label: '颜色' },
          thickness: { label: '粗细' },
        },
      },
      'form-input': {
        title: '输入框',
        form: {
          basic: { title: '基础设置' },
        },
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
        form: {
          basic: { title: '基础设置' },
        },
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
        form: {
          basic: { title: '基础设置' },
        },
        field: {
          label: { label: '标签' },
          placeholder: { label: '占位文本' },
          required: { label: '必填' },
          disabled: { label: '禁用' },
        },
      },
      'form-checkbox': {
        title: '复选框',
        form: {
          basic: { title: '基础设置' },
        },
        field: {
          label: { label: '标签' },
          checked: { label: '默认选中' },
          disabled: { label: '禁用' },
        },
      },
      'form-radio': {
        title: '单选组',
        form: {
          basic: { title: '基础设置' },
        },
        field: {
          label: { label: '标签' },
          direction: {
            label: '排列方向',
            option: {
              horizontal: '水平',
              vertical: '垂直',
            },
          },
          disabled: { label: '禁用' },
        },
      },
    },
  },
  'en': {
    group: {
      basic: 'Basic',
      form: 'Form',
    },
    widget: {
      'text': {
        title: 'Text',
        form: {
          basic: { title: 'Basic' },
          style: { title: 'Style' },
        },
        field: {
          content: { label: 'Content', placeholder: 'Enter text' },
          fontSize: { label: 'Font Size' },
          fontWeight: {
            label: 'Font Weight',
            option: {
              normal: 'Normal',
              bold: 'Bold',
              300: 'Light',
              600: 'Semi-Bold',
            },
          },
          color: { label: 'Color' },
          textAlign: {
            label: 'Text Align',
            option: {
              left: 'Left',
              center: 'Center',
              right: 'Right',
            },
          },
        },
      },
      'button': {
        title: 'Button',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          text: { label: 'Text', placeholder: 'Enter button text' },
          type: {
            label: 'Type',
            option: {
              button: 'Button',
              submit: 'Submit',
              reset: 'Reset',
            },
          },
          size: {
            label: 'Size',
            option: {
              small: 'Small',
              medium: 'Medium',
              large: 'Large',
            },
          },
          disabled: { label: 'Disabled' },
        },
      },
      'image': {
        title: 'Image',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          src: { label: 'Image URL', placeholder: 'Enter image URL' },
          alt: { label: 'Alt Text', placeholder: 'Alternative text when image fails to load' },
          objectFit: {
            label: 'Object Fit',
            option: {
              contain: 'Contain',
              cover: 'Cover',
              fill: 'Fill',
              none: 'None',
            },
          },
        },
      },
      'link': {
        title: 'Link',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          text: { label: 'Link Text', placeholder: 'Enter link text' },
          href: { label: 'URL' },
          target: {
            label: 'Open Mode',
            option: {
              _self: 'Current Window',
              _blank: 'New Window',
            },
          },
          color: { label: 'Color' },
        },
      },
      'divider': {
        title: 'Divider',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          direction: {
            label: 'Direction',
            option: {
              horizontal: 'Horizontal',
              vertical: 'Vertical',
            },
          },
          color: { label: 'Color' },
          thickness: { label: 'Thickness' },
        },
      },
      'form-input': {
        title: 'Input',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          label: { label: 'Label' },
          placeholder: { label: 'Placeholder' },
          value: { label: 'Default Value' },
          required: { label: 'Required' },
          disabled: { label: 'Disabled' },
        },
      },
      'form-textarea': {
        title: 'Textarea',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          label: { label: 'Label' },
          placeholder: { label: 'Placeholder' },
          value: { label: 'Default Value' },
          rows: { label: 'Rows' },
          required: { label: 'Required' },
          disabled: { label: 'Disabled' },
        },
      },
      'form-select': {
        title: 'Select',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          label: { label: 'Label' },
          placeholder: { label: 'Placeholder' },
          required: { label: 'Required' },
          disabled: { label: 'Disabled' },
        },
      },
      'form-checkbox': {
        title: 'Checkbox',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          label: { label: 'Label' },
          checked: { label: 'Default Checked' },
          disabled: { label: 'Disabled' },
        },
      },
      'form-radio': {
        title: 'Radio Group',
        form: {
          basic: { title: 'Basic' },
        },
        field: {
          label: { label: 'Label' },
          direction: {
            label: 'Direction',
            option: {
              horizontal: 'Horizontal',
              vertical: 'Vertical',
            },
          },
          disabled: { label: 'Disabled' },
        },
      },
    },
  },
}
