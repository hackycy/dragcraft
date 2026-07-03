let transparentDragImageEl: HTMLElement | null = null

function getTransparentDragImageElement(): HTMLElement | null {
  if (typeof document === 'undefined')
    return null

  if (transparentDragImageEl && document.body.contains(transparentDragImageEl))
    return transparentDragImageEl

  const el = document.createElement('div')
  el.setAttribute('data-dc-transparent-drag-image', '')
  el.style.position = 'fixed'
  el.style.left = '-10000px'
  el.style.top = '-10000px'
  el.style.width = '1px'
  el.style.height = '1px'
  el.style.opacity = '0'
  el.style.pointerEvents = 'none'
  document.body.appendChild(el)
  transparentDragImageEl = el
  return el
}

export function hideNativeDragImage(dataTransfer: DataTransfer | null): void {
  if (!dataTransfer?.setDragImage)
    return

  const el = getTransparentDragImageElement()
  if (el)
    dataTransfer.setDragImage(el, 0, 0)
}
