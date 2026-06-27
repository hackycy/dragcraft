// @vitest-environment happy-dom
import type { FieldSchema } from '@dragcraft/form-generator'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ArrayField from './ArrayField'

describe('arrayField', () => {
  const createField = (overrides?: Partial<FieldSchema>): FieldSchema => ({
    key: 'items',
    label: 'Items',
    component: 'array',
    props: {
      itemFields: [
        { key: 'name', label: 'Name', component: 'input' },
      ],
      defaultItem: { name: '' },
      minItems: 1,
      maxItems: 5,
      sortable: true,
    },
    ...overrides,
  })

  it('should render empty state when no items', () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [],
        field: createField(),
        disabled: false,
      },
    })
    expect(wrapper.find('.dc-array-field__empty').exists()).toBe(true)
  })

  it('should render items', () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }, { name: 'Item 2' }],
        field: createField(),
        disabled: false,
      },
    })
    expect(wrapper.findAll('.dc-array-field__item')).toHaveLength(2)
  })

  it('should add item when clicking add button', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }],
        field: createField(),
        disabled: false,
      },
    })
    await wrapper.find('.dc-array-field__add').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(2)
  })

  it('should not add item when maxItems reached', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }],
        field: createField(),
        disabled: false,
      },
    })
    const addBtn = wrapper.find('.dc-array-field__add')
    expect(addBtn.attributes('disabled')).toBeDefined()
  })

  it('should remove item when clicking remove button', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }, { name: 'Item 2' }],
        field: createField(),
        disabled: false,
      },
    })
    await wrapper.find('.dc-array-field__remove').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(1)
  })

  it('should not remove item when minItems reached', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }],
        field: createField({ props: { minItems: 1 } }),
        disabled: false,
      },
    })
    const removeBtn = wrapper.find('.dc-array-field__remove')
    expect(removeBtn.attributes('disabled')).toBeDefined()
  })

  it('should toggle item expand/collapse', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }],
        field: createField(),
        disabled: false,
      },
    })
    // First item is expanded by default
    expect(wrapper.find('.dc-array-field__item-body').exists()).toBe(true)
    // Click header to collapse
    await wrapper.find('.dc-array-field__item-header').trigger('click')
    expect(wrapper.find('.dc-array-field__item-body').exists()).toBe(false)
    // Click header again to expand
    await wrapper.find('.dc-array-field__item-header').trigger('click')
    expect(wrapper.find('.dc-array-field__item-body').exists()).toBe(true)
  })

  it('should move item up when clicking up sort button', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'A' }, { name: 'B' }],
        field: createField(),
        disabled: false,
      },
    })
    const sortButtons = wrapper.findAll('.dc-array-field__sort')
    // Second item has an "up" button
    await sortButtons[1].trigger('click')
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as Array<Record<string, unknown>>
    expect(emitted[0].name).toBe('B')
    expect(emitted[1].name).toBe('A')
  })

  it('should move item down when clicking down sort button', async () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'A' }, { name: 'B' }],
        field: createField(),
        disabled: false,
      },
    })
    const sortButtons = wrapper.findAll('.dc-array-field__sort')
    // First item has a "down" button
    await sortButtons[0].trigger('click')
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as Array<Record<string, unknown>>
    expect(emitted[0].name).toBe('B')
    expect(emitted[1].name).toBe('A')
  })

  it('should disable all controls when disabled prop is true', () => {
    const wrapper = mount(ArrayField, {
      props: {
        modelValue: [{ name: 'Item 1' }],
        field: createField(),
        disabled: true,
      },
    })
    expect(wrapper.find('.dc-array-field__add').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.dc-array-field__remove').attributes('disabled')).toBeDefined()
  })
})
