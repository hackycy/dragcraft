import type { PropType } from 'vue'
import type { MaterialEditorMetadata, ResolveDropIndexContext } from './contract'
import { DesignerRegionOutlet } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

type FlexDirection = 'row' | 'column'
type FlexAlign = 'stretch' | 'flex-start' | 'center' | 'flex-end'

export function resolveLinearDropIndex(
  ctx: ResolveDropIndexContext,
  axis: 'x' | 'y',
): number {
  const pointer = axis === 'x' ? ctx.event.clientX : ctx.event.clientY
  for (const [index, element] of ctx.itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    const midpoint = axis === 'x'
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2
    if (pointer < midpoint)
      return index
  }
  return ctx.itemElements.length
}

function makeFlexPropertySection() {
  return {
    title: '布局',
    titleKey: 'widget.flex-container.form.layout.title',
    fields: [
      {
        key: 'direction',
        label: '方向',
        labelKey: 'widget.flex-container.field.direction.label',
        optionKeyPrefix: 'widget.flex-container.field.direction.option',
        component: 'Select',
        defaultValue: 'column',
        componentProps: {
          options: [
            { label: '横向', value: 'row' },
            { label: '纵向', value: 'column' },
          ],
        },
      },
      {
        key: 'wrap',
        label: '自动换行',
        labelKey: 'widget.flex-container.field.wrap.label',
        component: 'Switch',
        defaultValue: false,
      },
      {
        key: 'gap',
        label: '间距',
        labelKey: 'widget.flex-container.field.gap.label',
        component: 'InputNumber',
        defaultValue: 12,
        componentProps: { min: 0, max: 64 },
      },
      {
        key: 'align',
        label: '交叉轴对齐',
        labelKey: 'widget.flex-container.field.align.label',
        optionKeyPrefix: 'widget.flex-container.field.align.option',
        component: 'Select',
        defaultValue: 'stretch',
        componentProps: {
          options: [
            { label: '拉伸', value: 'stretch' },
            { label: '起点', value: 'flex-start' },
            { label: '居中', value: 'center' },
            { label: '终点', value: 'flex-end' },
          ],
        },
      },
    ],
  }
}

export const flexContainerMeta: MaterialEditorMetadata = {
  type: 'flex-container',
  title: 'Flex 容器',
  titleKey: 'widget.flex-container.title',
  group: 'layout',
  material: {
    icon: '容',
    description: '由外部物料定义方向、换行和插入轴',
    descriptionKey: 'widget.flex-container.material.description',
    tags: ['布局'],
  },
  defaultProps: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
  formSchema: { sections: [makeFlexPropertySection()] },
}

const flexProps = {
  direction: { type: String as PropType<FlexDirection>, default: 'column' },
  wrap: { type: Boolean, default: false },
  gap: { type: Number, default: 12 },
  align: { type: String as PropType<FlexAlign>, default: 'stretch' },
}

export const FlexContainer = defineComponent({
  name: 'PlaygroundFlexContainer',
  props: flexProps,
  setup(props) {
    return () => h(DesignerRegionOutlet, {
      regionId: 'default',
      resolveDropIndex: (ctx: any) =>
        resolveLinearDropIndex(ctx, props.direction === 'row' ? 'x' : 'y'),
      class: 'pg-container-flex',
      style: {
        '--pg-container-direction': props.direction,
        '--pg-container-wrap': props.wrap ? 'wrap' : 'nowrap',
        '--pg-container-gap': `${props.gap}px`,
        '--pg-container-align': props.align,
      },
    })
  },
})

export const splitContainerMeta: MaterialEditorMetadata = {
  type: 'split-container',
  title: '异形容器',
  titleKey: 'widget.split-container.title',
  group: 'layout',
  material: {
    icon: '分',
    description: '由外部物料声明固定三分区结构',
    descriptionKey: 'widget.split-container.material.description',
    tags: ['布局'],
  },
  defaultProps: { gap: 12, primarySize: '40%' },
  formSchema: {
    sections: [{
      title: '布局',
      titleKey: 'widget.split-container.form.layout.title',
      fields: [
        {
          key: 'gap',
          label: '间距',
          labelKey: 'widget.split-container.field.gap.label',
          component: 'InputNumber',
          defaultValue: 12,
          componentProps: { min: 0, max: 64 },
        },
        {
          key: 'primarySize',
          label: '主区域尺寸',
          labelKey: 'widget.split-container.field.primarySize.label',
          component: 'Input',
          defaultValue: '40%',
        },
      ],
    }],
  },
}

function region(regionId: string, className: string) {
  return h(DesignerRegionOutlet, {
    regionId,
    class: className,
    resolveDropIndex: (ctx: any) => resolveLinearDropIndex(ctx, 'y'),
  })
}

export const SplitContainer = defineComponent({
  name: 'PlaygroundSplitContainer',
  props: {
    gap: { type: Number, default: 12 },
    primarySize: { type: String, default: '40%' },
  },
  setup(props) {
    const style = () => ({
      '--pg-split-gap': `${props.gap}px`,
      '--pg-split-primary-size': props.primarySize,
    })
    return () => h('div', { class: 'pg-split pg-split--top-one-bottom-two', style: style() }, [
      region('top', 'pg-split__top'),
      h('div', { class: 'pg-split__bottom' }, [
        region('bottomLeft', 'pg-split__bottom-left'),
        region('bottomRight', 'pg-split__bottom-right'),
      ]),
    ])
  },
})
