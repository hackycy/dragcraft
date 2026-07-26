import type { PropType } from 'vue'
import { computed, defineComponent, h, mergeProps, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'

export type ScrollAreaType = 'auto' | 'always' | 'scroll' | 'hover'

export interface ScrollAreaProps {
  type?: ScrollAreaType
  scrollHideDelay?: number
}

interface ScrollMetrics {
  maxScrollTop: number
  maxThumbOffset: number
  paddingStart: number
  thumbSize: number
}

const SCROLL_END_DELAY = 100
const DEFAULT_THUMB_MIN_SIZE = 24

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function readPixelValue(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default defineComponent({
  name: 'DcScrollArea',

  inheritAttrs: false,

  props: {
    type: {
      type: String as PropType<ScrollAreaType>,
      default: 'hover',
    },
    scrollHideDelay: {
      type: Number,
      default: 600,
    },
  },

  emits: {
    scroll: (_event: Event) => true,
  },

  setup(props, { attrs, emit, slots }) {
    const rootRef = ref<HTMLElement | null>(null)
    const viewportRef = ref<HTMLElement | null>(null)
    const contentRef = ref<HTMLElement | null>(null)
    const scrollbarRef = ref<HTMLElement | null>(null)
    const thumbRef = ref<HTMLElement | null>(null)
    const overflowing = ref(false)
    const visible = ref(false)
    const hovered = ref(false)
    const scrolling = ref(false)
    const dragging = ref(false)

    let resizeObserver: ResizeObserver | null = null
    let updateFrame: number | null = null
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    let scrollEndTimer: ReturnType<typeof setTimeout> | null = null
    let activePointerId: number | null = null
    let pointerOffset = 0
    let lastScrollTop = 0
    let metrics: ScrollMetrics = {
      maxScrollTop: 0,
      maxThumbOffset: 0,
      paddingStart: 0,
      thumbSize: 0,
    }

    function clearHideTimer(): void {
      if (hideTimer === null)
        return
      clearTimeout(hideTimer)
      hideTimer = null
    }

    function clearScrollEndTimer(): void {
      if (scrollEndTimer === null)
        return
      clearTimeout(scrollEndTimer)
      scrollEndTimer = null
    }

    function canAutoHide(): boolean {
      return props.type === 'hover' || props.type === 'scroll'
    }

    function scheduleHide(): void {
      if (!canAutoHide() || dragging.value || scrolling.value)
        return
      if (props.type === 'hover' && hovered.value)
        return

      clearHideTimer()
      hideTimer = setTimeout(() => {
        hideTimer = null
        if (!dragging.value && !scrolling.value && !(props.type === 'hover' && hovered.value))
          visible.value = false
      }, Math.max(0, props.scrollHideDelay))
    }

    function syncVisibility(): void {
      if (props.type === 'always') {
        clearHideTimer()
        visible.value = true
        return
      }
      if (props.type === 'auto') {
        clearHideTimer()
        visible.value = overflowing.value
        return
      }
      if (!overflowing.value) {
        clearHideTimer()
        visible.value = false
        return
      }
      if (dragging.value || scrolling.value || (props.type === 'hover' && hovered.value)) {
        clearHideTimer()
        visible.value = true
      }
    }

    function updateThumbPosition(): void {
      const viewport = viewportRef.value
      const scrollbar = scrollbarRef.value
      const thumb = thumbRef.value
      if (!viewport || !scrollbar || !thumb)
        return

      const clientHeight = viewport.clientHeight
      const scrollHeight = viewport.scrollHeight
      const nextOverflowing = clientHeight > 0 && scrollHeight > clientHeight + 1
      overflowing.value = nextOverflowing

      if (!nextOverflowing) {
        metrics = { maxScrollTop: 0, maxThumbOffset: 0, paddingStart: 0, thumbSize: 0 }
        thumb.style.display = 'none'
        thumb.style.removeProperty('--_dc-scroll-area-thumb-height')
        thumb.style.removeProperty('--_dc-scroll-area-thumb-offset')
        syncVisibility()
        return
      }

      const scrollbarStyle = getComputedStyle(scrollbar)
      const thumbStyle = getComputedStyle(thumb)
      const paddingStart = readPixelValue(scrollbarStyle.paddingTop)
      const paddingEnd = readPixelValue(scrollbarStyle.paddingBottom)
      const trackSize = Math.max(0, scrollbar.clientHeight - paddingStart - paddingEnd)
      const minThumbSize = readPixelValue(thumbStyle.minHeight, DEFAULT_THUMB_MIN_SIZE)
      const thumbSize = Math.min(trackSize, Math.max(minThumbSize, trackSize * clientHeight / scrollHeight))
      const maxThumbOffset = Math.max(0, trackSize - thumbSize)
      const maxScrollTop = Math.max(0, scrollHeight - clientHeight)
      const scrollRatio = maxScrollTop > 0 ? clamp(viewport.scrollTop, 0, maxScrollTop) / maxScrollTop : 0
      const thumbOffset = paddingStart + maxThumbOffset * scrollRatio

      metrics = { maxScrollTop, maxThumbOffset, paddingStart, thumbSize }
      thumb.style.display = ''
      thumb.style.setProperty('--_dc-scroll-area-thumb-height', `${thumbSize}px`)
      thumb.style.setProperty('--_dc-scroll-area-thumb-offset', `${thumbOffset}px`)
      syncVisibility()
    }

    function scheduleUpdate(): void {
      if (updateFrame !== null)
        return
      updateFrame = window.requestAnimationFrame(() => {
        updateFrame = null
        updateThumbPosition()
      })
    }

    function markScrollActivity(): void {
      if (!overflowing.value)
        return
      scrolling.value = true
      if (canAutoHide()) {
        clearHideTimer()
        visible.value = true
      }
      clearScrollEndTimer()
      scrollEndTimer = setTimeout(() => {
        scrollEndTimer = null
        scrolling.value = false
        scheduleHide()
      }, SCROLL_END_DELAY)
    }

    function handleScroll(event: Event): void {
      const viewport = viewportRef.value
      if (viewport && viewport.scrollTop !== lastScrollTop) {
        lastScrollTop = viewport.scrollTop
        markScrollActivity()
      }
      scheduleUpdate()
      emit('scroll', event)
    }

    function handlePointerEnter(): void {
      hovered.value = true
      if (props.type === 'hover' && overflowing.value) {
        clearHideTimer()
        visible.value = true
      }
    }

    function handlePointerLeave(): void {
      hovered.value = false
      scheduleHide()
    }

    function updateScrollFromPointer(clientY: number): void {
      const viewport = viewportRef.value
      const scrollbar = scrollbarRef.value
      if (!viewport || !scrollbar || metrics.maxScrollTop <= 0)
        return

      const trackRect = scrollbar.getBoundingClientRect()
      const pointerPosition = clientY - trackRect.top - metrics.paddingStart - pointerOffset
      const ratio = metrics.maxThumbOffset > 0
        ? clamp(pointerPosition / metrics.maxThumbOffset, 0, 1)
        : 0
      viewport.scrollTop = ratio * metrics.maxScrollTop
      markScrollActivity()
      scheduleUpdate()
    }

    function finishPointerInteraction(event?: PointerEvent): void {
      if (activePointerId === null)
        return
      if (event && event.pointerId !== activePointerId)
        return

      const scrollbar = scrollbarRef.value
      if (event && scrollbar?.hasPointerCapture?.(activePointerId))
        scrollbar.releasePointerCapture(activePointerId)
      activePointerId = null
      pointerOffset = 0
      dragging.value = false
      scheduleHide()
    }

    function handlePointerDown(event: PointerEvent): void {
      if (event.button !== 0 || event.isPrimary === false || !overflowing.value)
        return

      const scrollbar = scrollbarRef.value
      const thumb = thumbRef.value
      if (!scrollbar || !thumb)
        return

      event.preventDefault()
      clearHideTimer()
      dragging.value = true
      visible.value = true
      activePointerId = event.pointerId

      const target = event.target
      if (target === thumb || (target instanceof Node && thumb.contains(target)))
        pointerOffset = event.clientY - thumb.getBoundingClientRect().top
      else
        pointerOffset = metrics.thumbSize / 2

      scrollbar.setPointerCapture?.(event.pointerId)
      updateScrollFromPointer(event.clientY)
    }

    function handlePointerMove(event: PointerEvent): void {
      if (activePointerId !== event.pointerId)
        return
      event.preventDefault()
      updateScrollFromPointer(event.clientY)
    }

    function handleWheel(event: WheelEvent): void {
      const viewport = viewportRef.value
      if (!viewport || !overflowing.value)
        return

      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? viewport.clientHeight
          : 1
      const delta = event.deltaY * unit
      const nextScrollTop = clamp(viewport.scrollTop + delta, 0, metrics.maxScrollTop)
      if (nextScrollTop === viewport.scrollTop)
        return

      event.preventDefault()
      viewport.scrollTop = nextScrollTop
      markScrollActivity()
      scheduleUpdate()
    }

    function observeSizeChanges(): void {
      const viewport = viewportRef.value
      const content = contentRef.value
      if (!viewport || !content)
        return

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(scheduleUpdate)
        resizeObserver.observe(viewport)
        resizeObserver.observe(content)
      }
      lastScrollTop = viewport.scrollTop
      void nextTick(scheduleUpdate)
    }

    watch(() => props.type, () => {
      clearHideTimer()
      if (props.type === 'hover' || props.type === 'scroll')
        visible.value = false
      syncVisibility()
    })
    watch(() => props.scrollHideDelay, () => {
      if (hideTimer !== null) {
        clearHideTimer()
        scheduleHide()
      }
    })
    onMounted(observeSizeChanges)
    onUpdated(scheduleUpdate)
    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      clearHideTimer()
      clearScrollEndTimer()
      if (updateFrame !== null)
        window.cancelAnimationFrame(updateFrame)
      activePointerId = null
    })

    const rootState = computed(() => [
      overflowing.value ? 'overflowing' : null,
      visible.value ? 'visible' : 'hidden',
      scrolling.value ? 'scrolling' : null,
      dragging.value ? 'dragging' : null,
    ].filter(Boolean).join(' '))

    const scrollbarState = computed(() => [
      visible.value ? 'visible' : 'hidden',
      dragging.value ? 'dragging' : null,
    ].filter(Boolean).join(' '))

    return () => h('div', mergeProps(attrs, {
      'ref': rootRef,
      'class': 'dc-scroll-area',
      'data-dc-component': 'scroll-area',
      'data-dc-state': rootState.value,
      'onPointerenter': handlePointerEnter,
      'onPointerleave': handlePointerLeave,
    }), [
      h('div', {
        'ref': viewportRef,
        'class': 'dc-scroll-area__viewport',
        'data-dc-part': 'viewport',
        'onScroll': handleScroll,
      }, [
        h('div', {
          'ref': contentRef,
          'class': 'dc-scroll-area__content',
          'data-dc-part': 'content',
        }, slots.default?.()),
      ]),
      h('div', {
        'ref': scrollbarRef,
        'class': 'dc-scroll-area__scrollbar',
        'data-dc-part': 'scrollbar',
        'data-dc-state': scrollbarState.value,
        'aria-hidden': 'true',
        'onPointerdown': handlePointerDown,
        'onPointermove': handlePointerMove,
        'onPointerup': finishPointerInteraction,
        'onPointercancel': finishPointerInteraction,
        'onLostpointercapture': finishPointerInteraction,
        'onWheel': handleWheel,
      }, [
        h('div', {
          'ref': thumbRef,
          'class': 'dc-scroll-area__thumb',
          'data-dc-part': 'thumb',
          'data-dc-state': scrollbarState.value,
        }),
      ]),
    ])
  },
})
