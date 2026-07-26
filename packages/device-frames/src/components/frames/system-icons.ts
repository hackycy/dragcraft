import type { VNode } from 'vue'
import { h } from 'vue'

export type SystemStatusStyle = 'ios-modern' | 'ios-classic' | 'android'
export type AndroidNavigationIcon = 'back' | 'home' | 'recent'

type StatusIcon = 'cellular' | 'wifi' | 'battery'

function renderStatusSvg(
  icon: StatusIcon,
  style: SystemStatusStyle,
  viewBox: string,
  children: VNode[],
): VNode {
  return h('svg', {
    'class': `dc-system-icon dc-system-icon--${icon} dc-system-icon--${style}`,
    'viewBox': viewBox,
    'fill': 'none',
    'aria-hidden': 'true',
    'focusable': 'false',
    'data-dc-status-icon': icon,
    'data-dc-status-style': style,
  }, children)
}

export function renderSystemCellular(style: SystemStatusStyle): VNode {
  if (style === 'ios-classic') {
    return renderStatusSvg('cellular', style, '0 0 24 8', [
      ...[2, 7, 12, 17].map(cx => h('circle', {
        cx,
        cy: 4,
        r: 1.75,
        fill: 'currentColor',
      })),
      h('circle', {
        'cx': 22,
        'cy': 4,
        'r': 1.75,
        'fill': 'none',
        'stroke': 'currentColor',
        'stroke-width': 1,
      }),
    ])
  }

  const bars = style === 'android'
    ? [
        { x: 1, y: 8.5, width: 2.25, height: 2.5 },
        { x: 4.25, y: 6.5, width: 2.25, height: 4.5 },
        { x: 7.5, y: 4.25, width: 2.25, height: 6.75 },
        { x: 10.75, y: 2, width: 2.25, height: 9 },
      ]
    : [
        { x: 0.75, y: 8.5, width: 3, height: 2.75 },
        { x: 5, y: 6.25, width: 3, height: 5 },
        { x: 9.25, y: 3.75, width: 3, height: 7.5 },
        { x: 13.5, y: 1, width: 3, height: 10.25 },
      ]

  return renderStatusSvg(
    'cellular',
    style,
    style === 'android' ? '0 0 14 12' : '0 0 18 12',
    bars.map((bar, index) => h('rect', {
      ...bar,
      rx: style === 'android' ? 0.5 : 1,
      fill: 'currentColor',
      key: index,
    })),
  )
}

export function renderSystemWifi(style: SystemStatusStyle): VNode {
  const classic = style === 'ios-classic'
  const android = style === 'android'
  const strokeWidth = classic ? 1.15 : android ? 1.45 : 1.55

  return renderStatusSvg('wifi', style, '0 0 18 13', [
    h('path', {
      'd': 'M1.4 4.1a11.3 11.3 0 0 1 15.2 0',
      'stroke': 'currentColor',
      'stroke-width': strokeWidth,
      'stroke-linecap': 'round',
    }),
    h('path', {
      'd': 'M4.2 7a7.1 7.1 0 0 1 9.6 0',
      'stroke': 'currentColor',
      'stroke-width': strokeWidth,
      'stroke-linecap': 'round',
    }),
    h('path', {
      'd': 'M7.1 9.85a2.9 2.9 0 0 1 3.8 0',
      'stroke': 'currentColor',
      'stroke-width': strokeWidth,
      'stroke-linecap': 'round',
    }),
    h('circle', {
      cx: 9,
      cy: 11.7,
      r: classic ? 0.7 : 0.85,
      fill: 'currentColor',
    }),
  ])
}

export function renderSystemBattery(style: SystemStatusStyle): VNode {
  if (style === 'ios-classic') {
    return renderStatusSvg('battery', style, '0 0 23 10', [
      h('rect', {
        'x': 0.5,
        'y': 0.75,
        'width': 19,
        'height': 8.5,
        'rx': 1.25,
        'stroke': 'currentColor',
        'stroke-width': 1,
      }),
      h('rect', { x: 2, y: 2.2, width: 16, height: 5.6, rx: 0.6, fill: 'currentColor' }),
      h('path', { d: 'M20.5 3.25v3.5a1.8 1.8 0 0 0 0-3.5Z', fill: 'currentColor', opacity: 0.65 }),
    ])
  }

  if (style === 'android') {
    return renderStatusSvg('battery', style, '0 0 24 12', [
      h('rect', {
        'x': 0.75,
        'y': 1.75,
        'width': 20,
        'height': 8.5,
        'rx': 1.5,
        'stroke': 'currentColor',
        'stroke-width': 1.25,
      }),
      h('rect', { x: 2.75, y: 3.75, width: 15.5, height: 4.5, rx: 0.6, fill: 'currentColor' }),
      h('path', { d: 'M21.75 4v4h1.5a.75.75 0 0 0 .75-.75v-2.5a.75.75 0 0 0-.75-.75Z', fill: 'currentColor' }),
    ])
  }

  return renderStatusSvg('battery', style, '0 0 28 13', [
    h('rect', {
      'x': 0.75,
      'y': 0.75,
      'width': 24,
      'height': 11.5,
      'rx': 3,
      'stroke': 'currentColor',
      'stroke-width': 1,
      'opacity': 0.4,
    }),
    h('rect', { x: 2.5, y: 2.5, width: 20.5, height: 8, rx: 1.65, fill: 'currentColor' }),
    h('path', { d: 'M26 4.1v4.8a2.55 2.55 0 0 0 0-4.8Z', fill: 'currentColor', opacity: 0.45 }),
  ])
}

export function renderAndroidNavigationIcon(icon: AndroidNavigationIcon): VNode {
  const shapes: Record<AndroidNavigationIcon, VNode> = {
    back: h('path', { d: 'M13.75 4.5 6.25 10l7.5 5.5Z' }),
    home: h('circle', { cx: 10, cy: 10, r: 5.5 }),
    recent: h('rect', { x: 4.5, y: 4.5, width: 11, height: 11, rx: 1.4 }),
  }

  return h('svg', {
    'class': 'dc-device-frame__nav-icon',
    'viewBox': '0 0 20 20',
    'fill': 'none',
    'stroke': 'currentColor',
    'stroke-width': 1.6,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    'focusable': 'false',
    'data-dc-system-navigation': icon,
  }, [shapes[icon]])
}

export function renderHomeIndicator(): VNode {
  return h('svg', {
    'class': 'dc-device-frame__home-indicator',
    'viewBox': '0 0 134 5',
    'aria-hidden': 'true',
    'focusable': 'false',
    'data-dc-system-navigation': 'home-indicator',
  }, [h('rect', { width: 134, height: 5, rx: 2.5, fill: 'currentColor' })])
}

export function renderWaterdropCamera(): VNode {
  return h('svg', {
    'class': 'dc-phone-status__camera',
    'viewBox': '0 0 10 10',
    'aria-hidden': 'true',
    'focusable': 'false',
  }, [
    h('circle', {
      'cx': 5,
      'cy': 5,
      'r': 4.4,
      'fill': '#111820',
      'stroke': '#35414d',
      'stroke-width': 0.8,
    }),
    h('circle', { cx: 5, cy: 5, r: 2.2, fill: '#1d3042' }),
    h('circle', { cx: 3.8, cy: 3.7, r: 0.65, fill: '#60798f', opacity: 0.75 }),
  ])
}
