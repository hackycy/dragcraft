import { expect, test } from '@playwright/test'

test('mounts the Guide without browser console warnings or errors', async ({ page }) => {
  const consoleIssues: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error')
      consoleIssues.push(`[${message.type()}] ${message.text()}`)
  })
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto('http://127.0.0.1:4174/')
  await page.waitForTimeout(100)

  expect(consoleIssues).toEqual([])
  expect(pageErrors).toEqual([])
})

test('mounts the Guide floating action through the root ApplicationSurface', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/')

  const floatingAction = page.locator('[data-dc-component="node"][data-node-id="floating-action-1"]')
  const content = page.locator('.dc-canvas-surface__content')

  await expect(floatingAction).not.toHaveAttribute('data-dc-layout-placement', /.*/)
  await expect(floatingAction.locator('xpath=ancestor::*[contains(@class, "guide-presentation-frame--floating-action")]')).toHaveCount(1)
  await expect(content.locator('[data-node-id="floating-action-1"]')).toHaveCount(0)
  await expect(page.locator('.dc-canvas-surface__viewport-plane [data-node-id="floating-action-1"]')).toHaveCount(1)
})

test('locks the Guide page header against dragging and duplication', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/')

  const toolbar = page.locator('[data-dc-component="node-toolbar"]')
  await page.locator('[data-dc-component="node"][data-node-id="page-header-1"]').click()

  await expect(toolbar.locator('[data-dc-state~="drag"]')).toHaveAttribute('draggable', 'false')
  await expect(toolbar.getByTitle('复制')).toBeDisabled()
})

test('mounts the Guide page header through the viewport plane with a top reservation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://127.0.0.1:4174/')

  const header = page.locator('[data-dc-component="node"][data-node-id="page-header-1"]')
  const content = page.locator('.dc-canvas-surface__content')
  const viewportPlane = page.locator('.dc-canvas-surface__viewport-plane')
  const headerFrame = page.locator('.guide-presentation-frame--page-header')
  const scrollViewport = page.locator('.dc-canvas-surface__scrollport > [data-dc-part="viewport"]')

  await expect(content.locator('[data-node-id="page-header-1"]')).toHaveCount(0)
  await expect(viewportPlane.locator('[data-node-id="page-header-1"]')).toHaveCount(1)
  await expect(header.locator('xpath=ancestor::*[contains(@class, "guide-presentation-frame--page-header")]')).toHaveCount(1)
  await expect(headerFrame).toHaveCSS('position', 'absolute')

  const [viewportBounds, headerBounds, frameBounds, scale, contentPadding] = await Promise.all([
    viewportPlane.boundingBox(),
    header.boundingBox(),
    headerFrame.boundingBox(),
    page.locator('[data-dc-canvas-stage]').evaluate((element) => {
      const value = element.style.getPropertyValue('--dc-internal-canvas-view-scale')
      return Number(value)
    }),
    content.evaluate(element => Number.parseFloat(getComputedStyle(element).paddingBlockStart)),
  ])

  if (!viewportBounds || !headerBounds || !frameBounds)
    throw new Error('Expected Guide page header and viewport bounds')

  expect(Math.abs(frameBounds.y - viewportBounds.y)).toBeLessThan(0.5)
  expect(Math.abs(headerBounds.y - viewportBounds.y)).toBeLessThan(0.5)
  expect(Math.abs(contentPadding * scale - frameBounds.height)).toBeLessThan(0.5)

  await scrollViewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect.poll(async () => (await header.boundingBox())?.y ?? Number.NaN).toBeCloseTo(viewportBounds.y, 1)

  await page.getByRole('button', { name: '查看运行时' }).click()
  const runtime = page.locator('.guide-runtime-page')
  const runtimeEdge = runtime.locator('.guide-runtime-edge--fixed[data-runtime-edge="block-start"]')
  const runtimeHeader = runtime.locator('[data-runtime-node-id="page-header-1"]')
  const runtimeScrollport = runtime.locator('.guide-runtime-scrollport')
  const [runtimeBounds, runtimeEdgeBounds, runtimeHeaderBounds, runtimeScrollportBounds] = await Promise.all([
    runtime.boundingBox(),
    runtimeEdge.boundingBox(),
    runtimeHeader.boundingBox(),
    runtimeScrollport.boundingBox(),
  ])

  if (!runtimeBounds || !runtimeEdgeBounds || !runtimeHeaderBounds || !runtimeScrollportBounds)
    throw new Error('Expected Guide runtime page header bounds')

  expect(Math.abs(runtimeEdgeBounds.y - runtimeBounds.y)).toBeLessThan(0.5)
  expect(Math.abs(runtimeHeaderBounds.y - runtimeBounds.y)).toBeLessThan(0.5)
  expect(Math.abs(runtimeScrollportBounds.y - runtimeHeaderBounds.y - runtimeHeaderBounds.height)).toBeLessThan(0.5)
  await expect(runtime).toHaveAttribute('style', /--guide-runtime-inset-block-start: 48px/)
})

test('keeps the Guide Device Frame corner backdrop inside the canvas surface', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/')

  await expect(page.locator('[data-dc-component="application-surface"]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('[data-dc-component="canvas-surface"]')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
})

test('positions the Guide floating action at the viewport bottom end', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://127.0.0.1:4174/')

  const viewportPlane = page.locator('.dc-canvas-surface__viewport-plane')
  const action = page.locator('[data-dc-component="node"][data-node-id="floating-action-1"] .guide-floating-action')
  const [planeBounds, actionBounds] = await Promise.all([
    viewportPlane.boundingBox(),
    action.boundingBox(),
  ])

  if (!planeBounds || !actionBounds)
    throw new Error('Expected Guide viewport plane and floating action bounds')

  expect(actionBounds.x + actionBounds.width).toBeGreaterThan(planeBounds.x + planeBounds.width - 32)
  expect(actionBounds.y + actionBounds.height).toBeGreaterThan(planeBounds.y + planeBounds.height - 32)

  await page.getByRole('button', { name: '查看运行时' }).click()
  const runtimePage = page.locator('.guide-runtime-page')
  const runtimeAction = runtimePage.locator('.guide-floating-action')
  const [runtimePageBounds, runtimeActionBounds] = await Promise.all([
    runtimePage.boundingBox(),
    runtimeAction.boundingBox(),
  ])

  if (!runtimePageBounds || !runtimeActionBounds)
    throw new Error('Expected Guide runtime page and floating action bounds')

  expect(runtimeActionBounds.x + runtimeActionBounds.width).toBeGreaterThan(runtimePageBounds.x + runtimePageBounds.width - 32)
  expect(runtimeActionBounds.y + runtimeActionBounds.height).toBeGreaterThan(runtimePageBounds.y + runtimePageBounds.height - 32)
})

test('fits the Guide Device Frame inside a short Canvas viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://127.0.0.1:4174/')

  const canvas = page.locator('[data-dc-component="canvas"]')
  const frame = page.locator('.dc-device-frame')
  const stage = page.locator('[data-dc-canvas-stage]')
  await expect.poll(() => stage.evaluate((element) => {
    const value = element.style.getPropertyValue('--dc-internal-canvas-view-scale')
    return Number(value)
  })).toBeGreaterThan(0)
  await expect.poll(() => stage.evaluate((element) => {
    const value = element.style.getPropertyValue('--dc-internal-canvas-view-scale')
    return Number(value)
  })).toBeLessThan(1)
  const [canvasBounds, frameBounds, scale] = await Promise.all([
    canvas.boundingBox(),
    frame.boundingBox(),
    stage.evaluate((element) => {
      const value = element.style.getPropertyValue('--dc-internal-canvas-view-scale')
      return Number(value)
    }),
  ])

  if (!canvasBounds || !frameBounds)
    throw new Error('Expected Canvas and Device Frame bounds')

  expect(scale).toBeGreaterThan(0)
  expect(scale).toBeLessThan(1)
  expect(frameBounds.y).toBeGreaterThanOrEqual(canvasBounds.y + 4)
  expect(frameBounds.x + frameBounds.width).toBeLessThanOrEqual(canvasBounds.x + canvasBounds.width - 4)
  expect(frameBounds.y + frameBounds.height).toBeLessThanOrEqual(canvasBounds.y + canvasBounds.height - 4)
  expect(frameBounds.x).toBeGreaterThanOrEqual(canvasBounds.x + 4)

  const notice = page.locator('[data-dc-component="node"][data-node-id="notice-1"]')
  await notice.click()
  const selection = page.locator('[data-dc-selection-plane="root"] [data-node-id="notice-1"]')
  const [noticeBounds, selectionBounds] = await Promise.all([
    notice.boundingBox(),
    selection.boundingBox(),
  ])

  if (!noticeBounds || !selectionBounds)
    throw new Error('Expected notice and root selection bounds')

  expect(Math.abs(selectionBounds.y - noticeBounds.y)).toBeLessThan(1)
  expect(Math.abs(selectionBounds.height - noticeBounds.height)).toBeLessThan(1)
})
