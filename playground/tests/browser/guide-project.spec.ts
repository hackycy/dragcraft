import { expect, test } from '@playwright/test'

test('mounts the Guide floating action through the root ApplicationSurface', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/')

  const floatingAction = page.locator('[data-dc-component="node"][data-node-id="floating-action-1"]')
  const content = page.locator('.dc-canvas-surface__content')

  await expect(floatingAction).not.toHaveAttribute('data-dc-layout-placement', /.*/)
  await expect(floatingAction.locator('xpath=ancestor::*[contains(@class, "guide-presentation-frame--floating-action")]')).toHaveCount(1)
  await expect(content.locator('[data-node-id="floating-action-1"]')).toHaveCount(0)
  await expect(page.locator('.dc-canvas-surface__viewport-plane [data-node-id="floating-action-1"]')).toHaveCount(1)
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
