import type {
  ContainerDefinition,
  ContainerVariantMigrationContext,
  ContainerVariantMigrationResult,
  DesignerWidgetMeta,
  ResolveContainerDropIndexContext,
  SchemaNode,
} from '@dragcraft/designer'
import type { PropType } from 'vue'
import { ContainerRegionOutlet, useContainerRuntime } from '@dragcraft/designer'
import { defineContainerWidget } from '@dragcraft/widgets'
import { defineComponent, h } from 'vue'

type FlexDirection = 'row' | 'column'
type FlexAlign = 'stretch' | 'flex-start' | 'center' | 'flex-end'

export function resolveLinearDropIndex(
  ctx: ResolveContainerDropIndexContext,
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

export const flexContainerMeta: DesignerWidgetMeta & { container: ContainerDefinition } = {
  type: 'flex-container',
  title: 'Flex 容器',
  titleKey: 'widget.flex-container.title',
  group: 'layout',
  material: {
    description: '由外部物料定义方向、换行和插入轴',
    descriptionKey: 'widget.flex-container.material.description',
    tags: ['布局'],
  },
  defaultProps: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
  formSchema: { sections: [makeFlexPropertySection()] },
  container: {
    defaultVariant: 'single',
    variants: {
      single: {
        title: '默认',
        titleKey: 'widget.flex-container.variant.single',
        regions: [{
          id: 'default',
          title: '内容',
          titleKey: 'widget.flex-container.region.default',
          constraints: { maxItems: 12 },
        }],
      },
    },
  },
  containerAdapter: {
    resolveDropIndex: ctx => resolveLinearDropIndex(ctx, 'y'),
  },
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
    return () => h(ContainerRegionOutlet, {
      regionId: 'default',
      resolveDropIndex: (ctx: ResolveContainerDropIndexContext) =>
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

const splitVariants = {
  'left-one-right-two': {
    title: '左一右二',
    titleKey: 'widget.split-container.variant.left-one-right-two',
    regions: [
      { id: 'left', title: '左侧', titleKey: 'widget.split-container.region.left', constraints: { maxItems: 8 } },
      { id: 'rightTop', title: '右上', titleKey: 'widget.split-container.region.rightTop', constraints: { maxItems: 8 } },
      { id: 'rightBottom', title: '右下', titleKey: 'widget.split-container.region.rightBottom', constraints: { maxItems: 8 } },
    ],
  },
  'top-one-bottom-two': {
    title: '上一下二',
    titleKey: 'widget.split-container.variant.top-one-bottom-two',
    regions: [
      { id: 'top', title: '顶部', titleKey: 'widget.split-container.region.top', constraints: { maxItems: 8 } },
      { id: 'bottomLeft', title: '左下', titleKey: 'widget.split-container.region.bottomLeft', constraints: { maxItems: 8 } },
      { id: 'bottomRight', title: '右下', titleKey: 'widget.split-container.region.bottomRight', constraints: { maxItems: 8 } },
    ],
  },
}

function migrateSplitVariant(
  ctx: ContainerVariantMigrationContext,
): ContainerVariantMigrationResult {
  const nodes = Object.values(ctx.state.regions).flat()
  const targetIds = ctx.toVariant.regions.map(region => region.id)
  if (targetIds.length === 0)
    return { allowed: false, code: 'SPLIT_VARIANT_HAS_NO_REGIONS' }
  const regions = Object.fromEntries(targetIds.map(id => [id, [] as SchemaNode[]]))
  nodes.forEach((node, index) => {
    const targetId = targetIds[Math.min(index, targetIds.length - 1)]!
    regions[targetId].push(node)
  })
  return { allowed: true, state: { variant: ctx.toVariantId, regions } }
}

export const splitContainerMeta: DesignerWidgetMeta & { container: ContainerDefinition } = {
  type: 'split-container',
  title: '异形容器',
  titleKey: 'widget.split-container.title',
  group: 'layout',
  material: {
    description: '由外部物料定义三分区结构和变体迁移',
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
          key: 'variant',
          label: '布局变体',
          labelKey: 'widget.split-container.field.variant.label',
          optionKeyPrefix: 'widget.split-container.field.variant.option',
          component: 'Select',
          bindTo: { scope: 'container', path: 'variant' },
          componentProps: {
            options: [
              { label: '左一右二', value: 'left-one-right-two' },
              { label: '上一下二', value: 'top-one-bottom-two' },
            ],
          },
        },
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
  container: {
    defaultVariant: 'left-one-right-two',
    variants: splitVariants,
    migrateVariant: migrateSplitVariant,
  },
  containerAdapter: {
    resolveDropIndex: ctx => resolveLinearDropIndex(ctx, 'y'),
  },
}

function region(regionId: string, className: string) {
  return h(ContainerRegionOutlet, {
    regionId,
    class: className,
    resolveDropIndex: (ctx: ResolveContainerDropIndexContext) => resolveLinearDropIndex(ctx, 'y'),
  })
}

export const SplitContainer = defineComponent({
  name: 'PlaygroundSplitContainer',
  props: {
    gap: { type: Number, default: 12 },
    primarySize: { type: String, default: '40%' },
  },
  setup(props) {
    const runtime = useContainerRuntime()
    const style = () => ({
      '--pg-split-gap': `${props.gap}px`,
      '--pg-split-primary-size': props.primarySize,
    })
    return () => runtime.variant.value === 'left-one-right-two'
      ? h('div', { class: 'pg-split pg-split--left-one-right-two', style: style() }, [
          region('left', 'pg-split__left'),
          h('div', { class: 'pg-split__right' }, [
            region('rightTop', 'pg-split__right-top'),
            region('rightBottom', 'pg-split__right-bottom'),
          ]),
        ])
      : h('div', { class: 'pg-split pg-split--top-one-bottom-two', style: style() }, [
          region('top', 'pg-split__top'),
          h('div', { class: 'pg-split__bottom' }, [
            region('bottomLeft', 'pg-split__bottom-left'),
            region('bottomRight', 'pg-split__bottom-right'),
          ]),
        ])
  },
})

export const playgroundContainerWidgetDefinitions = [
  defineContainerWidget({ meta: flexContainerMeta, component: FlexContainer }),
  defineContainerWidget({ meta: splitContainerMeta, component: SplitContainer }),
]
