// @vitest-environment happy-dom
import type { LayoutPlan } from '@dragcraft/core'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DeviceFrameShell from './DeviceFrameShell'

function makePlan(): LayoutPlan {
  return {
    entries: [],
    slots: new Map([
      ['unclaimed.surface', []],
    ]),
    sortScopes: new Map(),
    slotManifests: new Map([
      ['survey.progress.surface', {
        slot: 'survey.progress.surface',
        allocation: 'reserve',
        axis: 'block',
        edge: 'start',
        order: 10,
      }],
      ['survey.submit.surface', {
        slot: 'survey.submit.surface',
        allocation: 'reserve',
        axis: 'block',
        edge: 'end',
        order: 20,
      }],
      ['survey.aside.surface', {
        slot: 'survey.aside.surface',
        allocation: 'reserve',
        axis: 'inline',
        edge: 'start',
        order: 25,
      }],
      ['assistant.floating.surface', {
        slot: 'assistant.floating.surface',
        allocation: 'overlay',
        axis: 'block',
        edge: 'start',
        order: 30,
      }],
    ]),
  }
}

describe('deviceFrameShell', () => {
  it('executes material layout manifests as reserved and overlay tracks', () => {
    const wrapper = mount(DeviceFrameShell, {
      props: { layoutPlan: makePlan() },
      slots: {
        'default': '<div data-test-id="content">content</div>',
        'survey.progress.surface': '<div data-test-id="progress">progress</div>',
        'survey.submit.surface': '<div data-test-id="submit">submit</div>',
        'survey.aside.surface': '<div data-test-id="aside">aside</div>',
        'assistant.floating.surface': '<button data-test-id="assistant">assistant</button>',
        'unclaimed.surface': '<div data-test-id="fallback">fallback</div>',
      },
    })

    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__dock--block-start [data-test-id="progress"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__dock--block-end [data-test-id="submit"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__dock--inline-start [data-test-id="aside"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__overlay [data-test-id="assistant"]').exists()).toBe(true)
    expect(wrapper.find('.dc-device-frame__content [data-test-id="fallback"]').exists()).toBe(true)
  })
})
