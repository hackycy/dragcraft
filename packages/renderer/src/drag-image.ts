let transparentDragImageEl: HTMLElement | null = null

function getTransparentDragImageElement(): HTMLElement | null {
  if (typeof document === 'undefined')
    return null

  if (transparentDragImageEl && document.body.contains(transparentDragImageEl))
    return transparentDragImageEl

  const element = document.createElement('div')
  element.setAttribute('data-dc-transparent-drag-image', '')
  element.style.position = 'fixed'
  element.style.left = '-10000px'
  element.style.top = '-10000px'
  element.style.width = '1px'
  element.style.height = '1px'
  element.style.opacity = '0'
  element.style.pointerEvents = 'none'
  document.body.appendChild(element)
  transparentDragImageEl = element
  return element
}

export function hideNativeDragImage(dataTransfer: DataTransfer | null): void {
  if (!dataTransfer?.setDragImage)
    return

  const element = getTransparentDragImageElement()
  if (element)
    dataTransfer.setDragImage(element, 0, 0)
}
