import type {
  ContainerDefinition,
  ContainerVariantMigrationContext,
  ContainerVariantMigrationResult,
  DesignerWidgetMeta,
  ResolveContainerDropIndexContext,
  SchemaNode,
  WidgetDefinition,
} from '@dragcraft/designer'
import { ContainerRegionOutlet, defineContainerWidget, useContainerRuntime } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

export function resolveVerticalDropIndex(ctx: ResolveContainerDropIndexContext): number {
  for (const [index, element] of ctx.itemElements.entries()) {
    const rect = element.getBoundingClientRect()
    if (ctx.event.clientY < rect.top + rect.height / 2)
      return index
  }
  return ctx.itemElements.length
}

export const columnContainerMeta: DesignerWidgetMeta & { container: ContainerDefinition } = {
  type: 'column-container',
  title: '分栏容器',
  group: 'layout',
  defaultProps: { gap: 12 },
  formSchema: {
    sections: [{
      title: '布局',
      fields: [
        {
          key: 'variant',
          label: '列数',
          component: 'Select',
          bindTo: { scope: 'container', path: 'variant' },
          componentProps: {
            options: [
              { label: '单列', value: 'single' },
              { label: '双列', value: 'split' },
            ],
          },
        },
        { key: 'gap', label: '间距', component: 'InputNumber', componentProps: { min: 0, max: 48 } },
      ],
    }],
  },
  material: {
    description: '由业务组件决定列布局和插入方向',
    tags: ['布局'],
  },
  container: {
    defaultVariant: 'single',
    variants: {
      single: {
        title: '单列',
        regions: [{ id: 'content', title: '内容', constraints: { maxItems: 4 } }],
      },
      split: {
        title: '双列',
        regions: [
          { id: 'left', title: '左列', constraints: { maxItems: 2 } },
          { id: 'right', title: '右列', constraints: { maxItems: 2 } },
        ],
      },
    },
    migrateVariant: migrateColumnVariant,
  },
  containerAdapter: {
    resolveDropIndex: resolveVerticalDropIndex,
  },
}

// #region tutorial-container-migration
export function migrateColumnVariant(
  ctx: ContainerVariantMigrationContext,
): ContainerVariantMigrationResult {
  const nodes = ctx.fromVariant.regions.flatMap(
    region => ctx.state.regions[region.id] ?? [],
  )

  if (nodes.length > 4) {
    return {
      allowed: false,
      code: 'GUIDE_CONTAINER_CAPACITY_EXCEEDED',
      details: { maxItems: 4, nodeCount: nodes.length },
    }
  }

  if (ctx.toVariantId === 'split') {
    const midpoint = Math.ceil(nodes.length / 2)
    return {
      allowed: true,
      state: {
        variant: 'split',
        regions: {
          left: nodes.slice(0, midpoint),
          right: nodes.slice(midpoint),
        },
      },
    }
  }

  return {
    allowed: true,
    state: {
      variant: 'single',
      regions: { content: nodes },
    },
  }
}
// #endregion tutorial-container-migration

function outlet(regionId: string) {
  return h(ContainerRegionOutlet, {
    regionId,
    class: 'guide-column-container__region',
    resolveDropIndex: resolveVerticalDropIndex,
  })
}

export const ColumnContainerWidget = defineComponent({
  name: 'GuideColumnContainerWidget',
  props: {
    gap: { type: Number, default: 12 },
  },
  setup(props) {
    const runtime = useContainerRuntime()
    return () => runtime.variant.value === 'split'
      ? h('div', {
          class: 'guide-column-container guide-column-container--split',
          style: { gap: `${props.gap}px` },
        }, [outlet('left'), outlet('right')])
      : h('div', {
          class: 'guide-column-container',
          style: { gap: `${props.gap}px` },
        }, [outlet('content')])
  },
})

export const columnContainerDefinition: WidgetDefinition<DesignerWidgetMeta & { container: ContainerDefinition }>
  = defineContainerWidget({
    meta: columnContainerMeta,
    component: ColumnContainerWidget,
  })

export function node(id: string): SchemaNode {
  return { id, type: 'guide-text', props: {} }
}
